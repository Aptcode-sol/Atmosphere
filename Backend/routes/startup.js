
console.log('startup.js route loaded');
const express = require('express');
const router = express.Router();
const { createOrUpdateStartup, getStartupByUser } = require('../services/startupService');
const requireAuth = require('../middleware/auth');


// Create or update startup profile
router.post('/profile', requireAuth, (req, res, next) => {
    console.log('POST /api/startup/profile route hit');
    createOrUpdateStartup(req, res, next);
});

// Get startup profile by user
router.get('/profile/:userId', requireAuth, getStartupByUser);

module.exports = router;
