const express = require('express');
const router = express.Router();
const { Meeting, Notification } = require('../models');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/meetings - Schedule a meeting
router.post('/', authMiddleware, async (req, res, next) => {
    try {
        const {
            title,
            description,
            scheduledAt,
            duration,
            meetingLink,
            location,
            participants,
            type,
        } = req.body;

        if (!title || !scheduledAt) {
            return res.status(400).json({ error: 'Title and scheduledAt are required' });
        }

        const meeting = new Meeting({
            organizer: req.user._id,
            title,
            description,
            scheduledAt,
            duration: duration || 60,
            meetingLink,
            location,
            participants: participants || [],
            type: type || 'one-on-one',
        });

        await meeting.save();
        await meeting.populate('organizer', 'username displayName avatarUrl verified');
        await meeting.populate('participants.userId', 'username displayName avatarUrl verified');

        // Create notifications for participants
        const participantIds = participants || [];
        for (const participantId of participantIds) {
            const notification = new Notification({
                user: participantId,
                actor: req.user._id,
                type: 'meeting_invite',
                payload: {
                    meetingId: meeting._id,
                    title: meeting.title,
                    scheduledAt: meeting.scheduledAt,
                },
            });
            await notification.save();
        }

        res.status(201).json({ meeting });
    } catch (err) {
        next(err);
    }
});

// GET /api/meetings - Get meetings for current user
router.get('/', authMiddleware, async (req, res, next) => {
    try {
        const { limit = 20, skip = 0, filter = 'upcoming', type } = req.query;

        const query = {
            $or: [
                { organizer: req.user._id },
                { 'participants.userId': req.user._id },
            ],
            status: { $ne: 'cancelled' },
        };

        if (type) query.type = type;

        // Filter by time
        const now = new Date();
        if (filter === 'upcoming') {
            query.scheduledAt = { $gte: now };
        } else if (filter === 'past') {
            query.scheduledAt = { $lt: now };
        } else if (filter === 'my-meetings') {
            query.organizer = req.user._id;
        }

        const meetings = await Meeting.find(query)
            .populate('organizer', 'username displayName avatarUrl verified')
            .populate('participants.userId', 'username displayName avatarUrl verified')
            .sort({ scheduledAt: filter === 'past' ? -1 : 1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        res.json({ meetings });
    } catch (err) {
        next(err);
    }
});

// GET /api/meetings/:id - Get meeting details
router.get('/:id', authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;

        const meeting = await Meeting.findById(id)
            .populate('organizer', 'username displayName avatarUrl verified')
            .populate('participants.userId', 'username displayName avatarUrl verified');

        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        // Check if user has access
        const isOrganizer = meeting.organizer._id.toString() === req.user._id.toString();
        const isParticipant = meeting.participants.some(
            p => p.userId._id.toString() === req.user._id.toString()
        );

        if (!isOrganizer && !isParticipant) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json({ meeting, isOrganizer });
    } catch (err) {
        next(err);
    }
});

// PUT /api/meetings/:id - Update meeting (organizer only)
router.put('/:id', authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const meeting = await Meeting.findById(id);
        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        if (meeting.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Only organizer can update meeting' });
        }

        // Update allowed fields
        const allowedUpdates = [
            'title',
            'description',
            'scheduledAt',
            'duration',
            'meetingLink',
            'location',
            'participants',
            'type',
            'status',
        ];

        allowedUpdates.forEach(field => {
            if (updates[field] !== undefined) {
                meeting[field] = updates[field];
            }
        });

        await meeting.save();
        await meeting.populate('organizer', 'username displayName avatarUrl verified');
        await meeting.populate('participants.userId', 'username displayName avatarUrl verified');

        res.json({ meeting });
    } catch (err) {
        next(err);
    }
});

// DELETE /api/meetings/:id - Cancel meeting (organizer only)
router.delete('/:id', authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;

        const meeting = await Meeting.findById(id);
        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        if (meeting.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Only organizer can cancel meeting' });
        }

        meeting.status = 'cancelled';
        await meeting.save();

        // Notify participants
        for (const participant of meeting.participants) {
            const notification = new Notification({
                user: participant.userId,
                actor: req.user._id,
                type: 'meeting_cancelled',
                payload: {
                    meetingId: meeting._id,
                    title: meeting.title,
                },
            });
            await notification.save();
        }

        res.json({ message: 'Meeting cancelled successfully' });
    } catch (err) {
        next(err);
    }
});

// POST /api/meetings/:id/rsvp - RSVP to meeting
router.post('/:id/rsvp', authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['accepted', 'declined', 'tentative'].includes(status)) {
            return res.status(400).json({ error: 'Invalid RSVP status' });
        }

        const meeting = await Meeting.findById(id);
        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        // Find participant
        const participant = meeting.participants.find(
            p => p.userId.toString() === req.user._id.toString()
        );

        if (!participant) {
            return res.status(403).json({ error: 'You are not invited to this meeting' });
        }

        participant.status = status;
        await meeting.save();

        // Notify organizer
        const notification = new Notification({
            user: meeting.organizer,
            actor: req.user._id,
            type: 'meeting_rsvp',
            payload: {
                meetingId: meeting._id,
                title: meeting.title,
                rsvpStatus: status,
            },
        });
        await notification.save();

        res.json({ message: 'RSVP updated successfully', status });
    } catch (err) {
        next(err);
    }
});

// POST /api/meetings/:id/add-participant - Add participant to meeting (organizer only)
router.post('/:id/add-participant', authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const meeting = await Meeting.findById(id);
        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        if (meeting.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Only organizer can add participants' });
        }

        // Check if already a participant
        const alreadyParticipant = meeting.participants.some(
            p => p.userId.toString() === userId
        );

        if (alreadyParticipant) {
            return res.status(400).json({ error: 'User is already a participant' });
        }

        meeting.participants.push({ userId });
        await meeting.save();

        // Notify new participant
        const notification = new Notification({
            user: userId,
            actor: req.user._id,
            type: 'meeting_invite',
            payload: {
                meetingId: meeting._id,
                title: meeting.title,
                scheduledAt: meeting.scheduledAt,
            },
        });
        await notification.save();

        res.json({ message: 'Participant added successfully' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
