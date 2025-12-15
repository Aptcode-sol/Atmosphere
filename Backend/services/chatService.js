const { Chat, Message } = require('../models');

exports.listChats = async (req, res, next) => {
    try {
        const { limit = 20, skip = 0, type } = req.query;
        
        console.log('listChats called - User ID:', req.user._id);

        const filter = { participants: req.user._id };
        if (type === 'group') {
            filter.isGroup = true;
        } else if (type === 'private') {
            filter.isGroup = false;
        }

        const chats = await Chat.find(filter)
            .populate('participants', 'username displayName avatarUrl verified')
            .populate('lastMessage')
            .sort({ updatedAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        console.log('Chats found:', chats.length);
        res.json({ chats });
    } catch (err) {
        console.error('Error in listChats:', err);
        next(err);
    }
};

exports.createGroup = async (req, res, next) => {
    try {
        const { name, participants, description, type, image } = req.body;

        if (!name) return res.status(400).json({ error: 'Group name is required' });

        const allParticipants = [...new Set([req.user._id, ...(participants || [])])];

        const chat = new Chat({
            participants: allParticipants,
            isGroup: true,
            groupName: name,
            groupDescription: description,
            groupType: type || 'Public',
            groupImage: image,
            groupAdmin: req.user._id
        });

        await chat.save();
        await chat.populate('participants', 'username displayName avatarUrl verified');

        res.status(201).json({ chat });
    } catch (err) {
        next(err);
    }
};

exports.createOrFindChat = async (req, res, next) => {
    try {
        const { participantId } = req.body;

        if (!participantId) {
            return res.status(400).json({ error: 'participantId is required' });
        }

        if (participantId === req.user._id.toString()) {
            return res.status(400).json({ error: 'Cannot create chat with yourself' });
        }

        const existingChat = await Chat.findOne({
            participants: { $all: [req.user._id, participantId], $size: 2 },
            isGroup: false
        })
            .populate('participants', 'username displayName avatarUrl verified')
            .populate('lastMessage');

        if (existingChat) return res.json({ chat: existingChat, isNew: false });

        const chat = new Chat({ participants: [req.user._id, participantId], isGroup: false });
        await chat.save();
        await chat.populate('participants', 'username displayName avatarUrl verified');

        res.status(201).json({ chat, isNew: true });
    } catch (err) {
        next(err);
    }
};

exports.getChatDetails = async (req, res, next) => {
    try {
        const { id } = req.params;

        const chat = await Chat.findById(id)
            .populate('participants', 'username displayName avatarUrl verified')
            .populate('lastMessage');

        if (!chat) return res.status(404).json({ error: 'Chat not found' });

        if (!chat.participants.some(p => p._id.toString() === req.user._id.toString())) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json({ chat });
    } catch (err) {
        next(err);
    }
};

exports.getMessages = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { limit = 50, before } = req.query;

        const chat = await Chat.findById(id);
        if (!chat) return res.status(404).json({ error: 'Chat not found' });

        if (!chat.participants.some(p => p.toString() === req.user._id.toString())) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const filter = { chat: id };
        if (before) filter.createdAt = { $lt: new Date(before) };

        const messages = await Message.find(filter)
            .populate('sender', 'username displayName avatarUrl')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        await Message.updateMany(
            { chat: id, sender: { $ne: req.user._id }, isRead: false },
            { isRead: true, readAt: new Date() }
        );

        await Chat.findByIdAndUpdate(id, {
            $set: { [`unreadCounts.${req.user._id}`]: 0 }
        }, { timestamps: false });

        res.json({ messages: messages.reverse() });
    } catch (err) {
        next(err);
    }
};

exports.sendMessage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { content, media } = req.body;

        if (!content && (!media || media.length === 0)) {
            return res.status(400).json({ error: 'Message content or media is required' });
        }

        const chat = await Chat.findById(id);
        if (!chat) return res.status(404).json({ error: 'Chat not found' });

        if (!chat.participants.some(p => p.toString() === req.user._id.toString())) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const message = new Message({ chat: id, sender: req.user._id, content: content || '', media: media || [] });
        await message.save();
        await message.populate('sender', 'username displayName avatarUrl');

        chat.lastMessage = message._id;
        chat.participants.forEach(participantId => {
            if (participantId.toString() !== req.user._id.toString()) {
                const currentUnread = chat.unreadCount.get(participantId.toString()) || 0;
                chat.unreadCount.set(participantId.toString(), currentUnread + 1);
            }
        });
        await chat.save();

        res.status(201).json({ message });
    } catch (err) {
        next(err);
    }
};

exports.deleteChatForUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        const chat = await Chat.findById(id);
        if (!chat) return res.status(404).json({ error: 'Chat not found' });

        if (!chat.participants.some(p => p.toString() === req.user._id.toString())) {
            return res.status(403).json({ error: 'Access denied' });
        }

        chat.participants = chat.participants.filter(p => p.toString() !== req.user._id.toString());

        if (chat.participants.length === 0) {
            await Message.deleteMany({ chat: id });
            await chat.deleteOne();
        } else {
            await chat.save();
        }

        res.json({ message: 'Chat deleted successfully' });
    } catch (err) {
        next(err);
    }
};
