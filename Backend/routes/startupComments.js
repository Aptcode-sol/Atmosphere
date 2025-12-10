const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const startupCommentService = require('../services/startupCommentService');

router.post('/:startupId/comments', authMiddleware, startupCommentService.createComment);
router.get('/:startupId/comments', startupCommentService.listComments);
router.get('/comment/:id/replies', startupCommentService.getReplies);
router.put('/comment/:id', authMiddleware, startupCommentService.updateComment);
router.delete('/comment/:id', authMiddleware, startupCommentService.deleteComment);

module.exports = router;
