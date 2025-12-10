const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const startupLikeService = require('../services/startupLikeService');

router.get('/startup/:startupId', startupLikeService.listLikesForStartup);
router.get('/startup/:startupId/check', startupLikeService.checkLiked);
router.post('/startup/:startupId', authMiddleware, startupLikeService.likeStartup);
router.delete('/startup/:startupId', authMiddleware, startupLikeService.unlikeStartup);

module.exports = router;
