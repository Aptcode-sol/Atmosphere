const { Meeting, Notification } = require('../models');
const { generateChannelName } = require('./agoraService');

exports.createMeeting = async (req, res, next) => {
    try {
        const { title, description, scheduledAt, duration, meetingLink, location, participants, type } = req.body;
        if (!title || !scheduledAt) return res.status(400).json({ error: 'Title and scheduledAt are required' });

        // Create meeting first to get the ID
        const meeting = new Meeting({
            organizer: req.user._id,
            title,
            description,
            scheduledAt,
            duration: duration || 60,
            meetingLink: meetingLink || '', // Will be set after save if empty
            location,
            participants: participants || [],
            type: type || 'one-on-one'
        });
        await meeting.save();

        // Generate Agora channel name if meetingLink not provided
        if (!meetingLink) {
            meeting.meetingLink = generateChannelName(meeting._id.toString());
            await meeting.save();
        }

        await meeting.populate('organizer', 'username displayName avatarUrl verified');
        await meeting.populate('participants.userId', 'username displayName avatarUrl verified');

        const participantIds = participants || [];
        for (const participantId of participantIds) {
            const notification = new Notification({ user: participantId, actor: req.user._id, type: 'meeting_invite', payload: { meetingId: meeting._id, title: meeting.title, scheduledAt: meeting.scheduledAt } });
            await notification.save();
        }

        res.status(201).json({ meeting });
    } catch (err) {
        next(err);
    }
};

exports.listMeetings = async (req, res, next) => {
    try {
        const { limit = 20, skip = 0, filter = 'upcoming', type } = req.query;
        const now = new Date();

        // Default: show public meetings (not cancelled). 'upcoming' and 'past' are global filters.
        // Only when filter === 'my-meetings' return meetings where the user is organizer or a participant.
        let query = { status: { $ne: 'cancelled' } };
        if (type) query.type = type;
        if (filter === 'upcoming') query.scheduledAt = { $gte: now };
        else if (filter === 'past') query.scheduledAt = { $lt: now };
        else if (filter === 'my-meetings') {
            query = { $or: [{ organizer: req.user._id }, { 'participants.userId': req.user._id }], status: { $ne: 'cancelled' } };
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
};

exports.getMeeting = async (req, res, next) => {
    try {
        const { id } = req.params;
        const meeting = await Meeting.findById(id).populate('organizer', 'username displayName avatarUrl verified').populate('participants.userId', 'username displayName avatarUrl verified');
        if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

        const isOrganizer = meeting.organizer._id.toString() === req.user._id.toString();
        const isParticipant = meeting.participants.some(p => p.userId._id.toString() === req.user._id.toString());
        if (!isOrganizer && !isParticipant) return res.status(403).json({ error: 'Access denied' });

        res.json({ meeting, isOrganizer });
    } catch (err) {
        next(err);
    }
};

exports.updateMeeting = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const meeting = await Meeting.findById(id);
        if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
        if (meeting.organizer.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Only organizer can update meeting' });

        const allowedUpdates = ['title', 'description', 'scheduledAt', 'duration', 'meetingLink', 'location', 'participants', 'type', 'status'];
        allowedUpdates.forEach(field => { if (updates[field] !== undefined) meeting[field] = updates[field]; });

        await meeting.save();
        await meeting.populate('organizer', 'username displayName avatarUrl verified');
        await meeting.populate('participants.userId', 'username displayName avatarUrl verified');

        res.json({ meeting });
    } catch (err) {
        next(err);
    }
};

exports.cancelMeeting = async (req, res, next) => {
    try {
        const { id } = req.params;
        const meeting = await Meeting.findById(id);
        if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
        if (meeting.organizer.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Only organizer can cancel meeting' });

        meeting.status = 'cancelled';
        await meeting.save();

        for (const participant of meeting.participants) {
            const notification = new Notification({ user: participant.userId, actor: req.user._id, type: 'meeting_cancelled', payload: { meetingId: meeting._id, title: meeting.title } });
            await notification.save();
        }

        res.json({ message: 'Meeting cancelled successfully' });
    } catch (err) {
        next(err);
    }
};

exports.rsvp = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['accepted', 'declined', 'tentative'].includes(status)) return res.status(400).json({ error: 'Invalid RSVP status' });

        const meeting = await Meeting.findById(id);
        if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

        const participant = meeting.participants.find(p => p.userId.toString() === req.user._id.toString());
        if (!participant) return res.status(403).json({ error: 'You are not invited to this meeting' });

        participant.status = status;
        await meeting.save();

        const notification = new Notification({ user: meeting.organizer, actor: req.user._id, type: 'meeting_rsvp', payload: { meetingId: meeting._id, title: meeting.title, rsvpStatus: status } });
        await notification.save();

        res.json({ message: 'RSVP updated successfully', status });
    } catch (err) {
        next(err);
    }
};

exports.addParticipant = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'userId is required' });

        const meeting = await Meeting.findById(id);
        if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
        // Allow organizer to add participants, or allow a user to add themselves (self-join)
        const isOrganizer = meeting.organizer.toString() === req.user._id.toString();
        const isSelf = userId.toString() === req.user._id.toString();
        if (!isOrganizer && !isSelf) return res.status(403).json({ error: 'Only organizer can add participants' });

        const alreadyParticipant = meeting.participants.some(p => p.userId.toString() === userId);
        if (alreadyParticipant) return res.status(400).json({ error: 'User is already a participant' });

        // If self-joining, mark as accepted and set joinedAt
        const participantObj = { userId };
        if (isSelf) {
            participantObj.status = 'accepted';
            participantObj.joinedAt = new Date();
        }

        meeting.participants.push(participantObj);
        meeting.participantsCount = (meeting.participantsCount || 0) + 1;
        await meeting.save();

        // Notify: if organizer added someone, notify that user; if user self-joined, notify organizer
        const notifyUser = isSelf ? meeting.organizer : userId;
        const notification = new Notification({ user: notifyUser, actor: req.user._id, type: isSelf ? 'meeting_joined' : 'meeting_invite', payload: { meetingId: meeting._id, title: meeting.title, scheduledAt: meeting.scheduledAt } });
        await notification.save();


        res.json({ message: 'Participant added successfully' });
    } catch (err) {
        next(err);
    }
};

exports.getAgoraToken = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { uid } = req.query;
        const meeting = await Meeting.findById(id);
        if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

        const isOrganizer = meeting.organizer.toString() === req.user._id.toString();
        const isParticipant = meeting.participants.some(p => p.userId.toString() === req.user._id.toString());
        if (!isOrganizer && !isParticipant) return res.status(403).json({ error: 'Access denied' });

        const { generateAgoraToken } = require('./agoraService');
        const channelName = meeting.meetingLink;

        if (!channelName) {
            return res.status(400).json({ error: 'Meeting does not have a valid channel' });
        }

        const agoraUid = uid ? parseInt(uid) : 0;
        const token = generateAgoraToken(channelName, agoraUid, 'publisher', 3600);

        res.json({
            token,
            channelName,
            appId: process.env.AGORA_APP_ID,
            uid: agoraUid
        });
    } catch (err) {
        next(err);
    }
};
