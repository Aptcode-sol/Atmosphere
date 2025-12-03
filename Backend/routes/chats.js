const express = require('express');
const router = express.Router();
const { Chat, Message } = require('../models');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/chats - Get user's chat list
router.get('/', authMiddleware, async (req, res, next) => {
    try {
        const { limit = 20, skip = 0 } = req.query;

        const chats = await Chat.find({ participants: req.user._id })
            .populate('participants', 'username displayName avatarUrl verified')
            .populate('lastMessage')
            .sort({ updatedAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        res.json({ chats });
    } catch (err) {
        next(err);
    }
});

// POST /api/chats - Create or find existing chat
router.post('/', authMiddleware, async (req, res, next) => {
    try {
        const { participantId } = req.body;

        if (!participantId) {
            return res.status(400).json({ error: 'participantId is required' });
        }

        if (participantId === req.user._id.toString()) {
            return res.status(400).json({ error: 'Cannot create chat with yourself' });
        }

        // Check if chat already exists
        const existingChat = await Chat.findOne({
            participants: { $all: [req.user._id, participantId] },
        })
            .populate('participants', 'username displayName avatarUrl verified')
            .populate('lastMessage');

        if (existingChat) {
            return res.json({ chat: existingChat, isNew: false });
        }

        // Create new chat
        const chat = new Chat({
            participants: [req.user._id, participantId],
        });

        await chat.save();
        await chat.populate('participants', 'username displayName avatarUrl verified');

        res.status(201).json({ chat, isNew: true });
    } catch (err) {
        next(err);
    }
});

// GET /api/chats/:id - Get chat details and messages
router.get('/:id', authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;

        const chat = await Chat.findById(id)
            .populate('participants', 'username displayName avatarUrl verified')
            .populate('lastMessage');

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        // Check if user is participant
        if (!chat.participants.some(p => p._id.toString() === req.user._id.toString())) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json({ chat });
    } catch (err) {
        next(err);
    }
});

// GET /api/chats/:id/messages - Get chat messages (paginated)
router.get('/:id/messages', authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { limit = 50, before } = req.query;

        // Verify user is participant
        const chat = await Chat.findById(id);
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        if (!chat.participants.some(p => p.toString() === req.user._id.toString())) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const filter = { chat: id };
        if (before) {
            filter.createdAt = { $lt: new Date(before) };
        }

        const messages = await Message.find(filter)
            .populate('sender', 'username displayName avatarUrl')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        // Mark messages as read
        await Message.updateMany(
            { chat: id, sender: { $ne: req.user._id }, isRead: false },
            { isRead: true, readAt: new Date() }
        );

        // Update unread count
        const unreadCount = chat.unreadCount.get(req.user._id.toString()) || 0;
        if (unreadCount > 0) {
            chat.unreadCount.set(req.user._id.toString(), 0);
            await chat.save();
        }

        res.json({ messages: messages.reverse() });
    } catch (err) {
        next(err);
    }
});

// POST /api/chats/:id/messages - Send a message
router.post('/:id/messages', authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { content, media } = req.body;

        if (!content && (!media || media.length === 0)) {
            return res.status(400).json({ error: 'Message content or media is required' });
        }

        // Verify chat exists and user is participant
        const chat = await Chat.findById(id);
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        if (!chat.participants.some(p => p.toString() === req.user._id.toString())) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Create message
        const message = new Message({
            chat: id,
            sender: req.user._id,
            content: content || '',
            media: media || [],
        });

        await message.save();
        await message.populate('sender', 'username displayName avatarUrl');

        // Update chat's lastMessage and increment unread for other participants
        chat.lastMessage = message._id;
        chat.participants.forEach(participantId => {
            if (participantId.toString() !== req.user._id.toString()) {
                const currentUnread = chat.unreadCount.get(participantId.toString()) || 0;
                chat.unreadCount.set(participantId.toString(), currentUnread + 1);
            }
        });

        await chat.save();

        res.status(201).json({ message });

        // TODO: Emit socket event for real-time delivery
        // io.to(id).emit('new-message', message);
    } catch (err) {
        next(err);
    }
});

// DELETE /api/chats/:id - Delete chat (for current user)
router.delete('/:id', authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;

        const chat = await Chat.findById(id);
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        if (!chat.participants.some(p => p.toString() === req.user._id.toString())) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Remove user from participants
        chat.participants = chat.participants.filter(p => p.toString() !== req.user._id.toString());

        if (chat.participants.length === 0) {
            // If no participants left, delete chat and messages
            await Message.deleteMany({ chat: id });
            await chat.deleteOne();
        } else {
            await chat.save();
        }

        res.json({ message: 'Chat deleted successfully' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
