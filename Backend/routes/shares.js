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

module.exports = router;