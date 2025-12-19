const express = require('express');
const router = express.Router();
const { createShare, getSharesByPost, deleteShare, checkUserShared } = require('../services/shareService');
const authMiddleware = require('../middleware/authMiddleware');
const Share = require('../models/Share');

// Create a share
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { postId } = req.body;
    const userId = req.user.id;

    // Check if the user already shared this post
    const existingShare = await Share.findOne({ user: userId, post: postId });
    if (existingShare) {
      return res.status(200).json({ message: 'Post already shared', sharesCount: await Share.countDocuments({ post: postId }) });
    }

    const share = await createShare(userId, postId);
    const sharesCount = await Share.countDocuments({ post: postId });
    res.status(201).json({ share, sharesCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get shares by post
router.get('/:postId', authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    const shares = await getSharesByPost(postId);
    res.status(200).json(shares);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a share
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await deleteShare(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if user has shared a post
router.get('/check/:postId', authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    const shared = await checkUserShared(userId, postId);
    res.status(200).json({ shared });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send content to chats (Unified Share)
router.post('/send', authMiddleware, async (req, res) => {
    try {
        const { userIds, contentId, contentType, contentTitle, contentImage, contentOwner } = req.body; // Expecting generic content details
        
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ error: 'No recipients selected' });
        }

        const { Chat, Message, User, Post, Reel, Trade, StartupDetails } = require('../models');

        // Logic to increment share count based on type
        // This is done once per share action, regardless of number of recipients
        if (contentType === 'post') {
            await Post.findByIdAndUpdate(contentId, { $inc: { sharesCount: 1 } });
        } else if (contentType === 'reel') {
            await Reel.findByIdAndUpdate(contentId, { $inc: { sharesCount: 1 } });
        } else if (contentType === 'trade') {
            await Trade.findByIdAndUpdate(contentId, { $inc: { sharesCount: 1 } });
        }
        // Startup share count logic if exists? For now skipping if no field

        const results = [];

        // Send message to each user
        for (const recipientId of userIds) {
            try {
                // 1. Find or create chat
                let chat = await Chat.findOne({
                    participants: { $all: [req.user._id, recipientId], $size: 2 },
                    isGroup: false
                });

                if (!chat) {
                    chat = new Chat({ participants: [req.user._id, recipientId], isGroup: false });
                    await chat.save();
                }

                // 2. Create Message
                const message = new Message({
                    chat: chat._id,
                    sender: req.user._id,
                    type: 'share',
                    body: `Shared a ${contentType}`, 
                    meta: {
                        sharedContent: {
                            id: contentId,
                            type: contentType,
                            title: contentTitle || '',
                            image: contentImage || '',
                            owner: contentOwner || '' 
                        }
                    }
                });
                await message.save();

                // 3. Update Chat
                chat.lastMessage = message._id;
                 if (!chat.unreadCount) chat.unreadCount = new Map();
                const currentUnread = chat.unreadCount.get(recipientId.toString()) || 0;
                chat.unreadCount.set(recipientId.toString(), currentUnread + 1);
                await chat.save();

                results.push({ recipientId, status: 'sent', messageId: message._id });

            } catch (err) {
                console.error(`Failed to send share to ${recipientId}:`, err);
                results.push({ recipientId, status: 'failed', error: err.message });
            }
        }

        res.status(200).json({ message: 'Share processed', results });

    } catch (error) {
        console.error('Unified share error:', error);
        res.status(500).json({ error: 'Failed to process share' });
    }
});

module.exports = router;