const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const crownService = require('../services/crownService');

router.get('/post/:postId', crownService.listCrownsForPost);
router.post('/post/:postId', authMiddleware, crownService.crownPost);
router.delete('/post/:postId', authMiddleware, crownService.uncrownPost);

module.exports = router;
