const express = require('express');
const router = express.Router();
const likeService = require('../services/likeService');
const authMiddleware = require('../middleware/authMiddleware');

// Get all likes for a post
router.get('/post/:postId', likeService.listLikesForPost);
// Get all likes by a user
router.get('/user/:userId', likeService.listLikesByUser);
// Like a post
router.post('/post/:postId', authMiddleware, likeService.likePost);
// Unlike a post
router.delete('/post/:postId', authMiddleware, likeService.unlikePost);

module.exports = router;
