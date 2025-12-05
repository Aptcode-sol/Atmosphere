const express = require('express');
const router = express.Router();

// Phase 1 routes
router.use('/health', require('./health'));
router.use('/auth', require('./auth'));
router.use('/profile', require('./profile'));
router.use('/users', require('./users'));
router.use('/posts', require('./posts'));
router.use('/comments', require('./comments'));
router.use('/follows', require('./follows'));
router.use('/companies', require('./companies'));
router.use('/startup-details', require('./startupDetails'));
router.use('/investor-details', require('./investorDetails'));
router.use('/notifications', require('./notifications'));

// Phase 2 routes
router.use('/verification', require('./verification'));
router.use('/admin', require('./admin'));
router.use('/chats', require('./chats'));
router.use('/jobs', require('./jobs'));
router.use('/meetings', require('./meetings'));
router.use('/saved', require('./saved'));
router.use('/search', require('./search'));

module.exports = router;
