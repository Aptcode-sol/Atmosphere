const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { savePost, getSavedPostsByUser, deleteSaved } = require('../services/savedService');

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { postId } = req.body;
    const userId = req.user.id;
    const saved = await savePost(userId, postId);
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const savedPosts = await getSavedPostsByUser(userId);
    res.status(200).json(savedPosts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await deleteSaved(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if a specific post is saved by the current user
router.get('/check/post/:postId', authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    const Saved = require('../models/Saved');

    // Check both contentId and legacy post field
    const saved = await Saved.findOne({
      user: userId,
      $or: [{ contentId: postId }, { post: postId }]
    });

    res.status(200).json({
      saved: !!saved,
      savedId: saved ? saved._id : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
