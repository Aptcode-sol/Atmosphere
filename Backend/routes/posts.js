const express = require('express');
const router = express.Router();

const postService = require('../services/postService');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, postService.createPost);
router.get('/', postService.listPosts);
router.get('/mine', authMiddleware, postService.listMyPosts);
router.get('/:id', postService.getPost);
router.put('/:id', authMiddleware, postService.updatePost);
router.delete('/:id', authMiddleware, postService.deletePost);
router.post('/:id/like', authMiddleware, postService.likePost);
router.delete('/:id/like', authMiddleware, postService.unlikePost);

module.exports = router;
