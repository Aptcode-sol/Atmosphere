const express = require('express');
const router = express.Router();
const reelService = require('../services/reelService');
const authMiddleware = require('../middleware/authMiddleware');

// Optional auth middleware (for feed - provides user context if logged in)
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authMiddleware(req, res, next);
    }
    next();
};

// Public routes (with optional auth for personalization)
router.get('/', optionalAuth, reelService.getReelsFeed);
router.get('/:id', optionalAuth, reelService.getReel);
router.get('/user/:userId', reelService.getUserReels);
router.get('/:id/comments', reelService.getComments);

// Protected routes
router.post('/', authMiddleware, reelService.createReel);
router.delete('/:id', authMiddleware, reelService.deleteReel);
router.post('/:id/like', authMiddleware, reelService.likeReel);
router.delete('/:id/like', authMiddleware, reelService.unlikeReel);
router.post('/:id/comments', authMiddleware, reelService.addComment);
router.delete('/comments/:commentId', authMiddleware, reelService.deleteComment);

module.exports = router;
