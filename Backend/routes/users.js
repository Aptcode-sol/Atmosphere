const express = require('express');
const router = express.Router();

const userService = require('../services/userService');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/search', userService.searchUsers);
router.get('/check/:username', userService.checkUsername);
router.get('/:identifier', userService.getUserByIdentifier);
router.put('/:id', authMiddleware, userService.updateUser);
router.get('/:id/posts', userService.getUserPosts);

module.exports = router;
