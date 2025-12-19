const express = require('express');
const router = express.Router();

// Phase 1 routes
router.use('/health', require('./health'));
router.use('/auth', require('./auth'));
router.use('/profile', require('./profile'));
router.use('/users', require('./users'));
router.use('/posts', require('./posts'));
router.use('/likes', require('./likes'));
router.use('/startup-likes', require('./startupLikes'));
router.use('/startup-crowns', require('./startupCrowns'));
router.use('/startup-comments', require('./startupComments'));
router.use('/comments', require('./comments'));
router.use('/crowns', require('./crowns'));
router.use('/follows', require('./follows'));
router.use('/companies', require('./companies'));
router.use('/startup-details', require('./startupDetails'));
router.use('/investor-details', require('./investorDetails'));
router.use('/notifications', require('./notifications'));

// Phase 2 routes
router.use('/verification', require('./verification'));
router.use('/admin', require('./admin'));
router.use('/chats', require('./chats'));
router.use('/messages', require('./messages'));
router.use('/jobs', require('./jobs'));
router.use('/meetings', require('./meetings'));
router.use('/saved', require('./saved'));
router.use('/search', require('./search'));
router.use('/shares', require('./shares'));
router.use('/grants', require('./grants'));
router.use('/events', require('./events'));
router.use('/opportunities', require('./opportunities'));
router.use('/startup', require('./startup'));
router.use('/trade', require('./trade'));
router.use('/reels', require('./reels'));
router.use('/upload', require('./upload'));
router.use('/settings', require('./settings'));
router.use('/my-team', require('./myTeam'));

module.exports = router;
