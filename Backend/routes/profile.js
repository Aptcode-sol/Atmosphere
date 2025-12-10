const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../services/profileService');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * GET /api/profile - Get current user's profile
 * Returns user data + role-specific details (startup/investor/personal)
 */
router.get('/', authMiddleware, async (req, res, next) => {
    try {
        const userId = req.user._id;
        const profile = await getProfile(userId);
        // Prevent intermediaries or clients from returning cached 304 responses
        res.set('Cache-Control', 'no-store');
        res.json(profile);
    } catch (err) {
        next(err);
    }
});

/**
 * PUT /api/profile - Update current user's profile
 * Body: { userData: {...}, detailsData: {...} }
 */
router.put('/', authMiddleware, async (req, res, next) => {
    try {
        const userId = req.user._id;
        const profile = await updateProfile(userId, req.body);
        res.json(profile);
    } catch (err) {
        console.error('Error updating profile for user', req.user && req.user._id, err && err.message);
        next(err);
    }
});

module.exports = router;
