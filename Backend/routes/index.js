const express = require('express');
const router = express.Router();
const sharesRouter = require('./shares');
const savedRouter = require('./saved');
const grantsRouter = require('./grants');
const eventsRouter = require('./events');
const opportunitiesRouter = require('./opportunities');

// Phase 1 routes
router.use('/health', require('./health'));
router.use('/auth', require('./auth'));
router.use('/profile', require('./profile'));
router.use('/users', require('./users'));
router.use('/posts', require('./posts'));
router.use('/likes', require('./likes'));
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
router.use('/saved', savedRouter);
router.use('/search', require('./search'));
router.use('/shares', sharesRouter);
router.use('/grants', grantsRouter);
router.use('/events', eventsRouter);
router.use('/opportunities', opportunitiesRouter);
router.use('/grants', grantsRouter);
router.use('/events', eventsRouter);

module.exports = router;
