const express = require('express');
const router = express.Router();
const MyTeam = require('../models/MyTeam');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// Get my team members
router.get('/', authMiddleware, async (req, res) => {
    try {
        const team = await MyTeam.find({ user: req.user._id })
            .populate('member', 'displayName username avatarUrl role accountType roles')
            .sort({ addedAt: -1 });
        
        // Return just the member details
        const members = team.map(t => ({
            ...t.member.toObject(),
            addedAt: t.addedAt,
            connectionId: t._id
        }));
        
        res.json(members);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add member
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { memberId } = req.body;
        if (!memberId) return res.status(400).json({ error: 'Member ID required' });

        if (memberId === req.user._id.toString()) {
            return res.status(400).json({ error: 'Cannot add yourself' });
        }

        // Check if exists
        const exists = await MyTeam.findOne({ user: req.user._id, member: memberId });
        if (exists) return res.status(400).json({ error: 'User already in team' });

        const newItem = new MyTeam({
            user: req.user._id,
            member: memberId
        });
        await newItem.save();

        const populated = await MyTeam.findById(newItem._id).populate('member', 'displayName username avatarUrl role accountType roles');

        res.json({
            ...populated.member.toObject(),
            addedAt: populated.addedAt,
            connectionId: populated._id
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Remove member
router.delete('/:memberId', authMiddleware, async (req, res) => {
    try {
        const { memberId } = req.params;
        await MyTeam.findOneAndDelete({ user: req.user._id, member: memberId });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
