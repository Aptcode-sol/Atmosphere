const express = require('express');
const router = express.Router();
const adminService = require('../services/adminService');
const authMiddleware = require('../middleware/authMiddleware');

const adminOnly = (req, res, next) => {
    if (!req.user || !req.user.roles || !req.user.roles.includes('admin')) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Admin Login (moved to service)
router.post('/login', adminService.login);

// Verification routes
router.get('/verification/pending', authMiddleware, adminOnly, adminService.getPendingVerifications);
router.get('/verification/documents/:userId', authMiddleware, adminOnly, adminService.getUserDocuments);
router.put('/verification/:id/approve', authMiddleware, adminOnly, adminService.approveVerification);
router.put('/verification/:id/reject', authMiddleware, adminOnly, adminService.rejectVerification);
router.get('/audit-logs', authMiddleware, adminOnly, adminService.getAuditLogs);
router.get('/users', authMiddleware, adminOnly, adminService.getUsers);

// Dashboard stats
router.get('/stats', authMiddleware, adminOnly, adminService.getStats);

// Pending startups with documents
router.get('/pending-startups', authMiddleware, adminOnly, adminService.getPendingStartups);
router.post('/verify-startup/:id', authMiddleware, adminOnly, adminService.verifyStartup);
router.post('/reject-startup/:id', authMiddleware, adminOnly, adminService.rejectStartup);

// Investor holdings approval
router.get('/pending-holdings', authMiddleware, adminOnly, adminService.getPendingHoldings);
router.post('/approve-holding/:investorId/:investmentIndex', authMiddleware, adminOnly, adminService.approveHolding);
router.post('/reject-holding/:investorId/:investmentIndex', authMiddleware, adminOnly, adminService.rejectHolding);

// Block/Unblock users
router.post('/block-user/:id', authMiddleware, adminOnly, adminService.blockUser);
router.post('/unblock-user/:id', authMiddleware, adminOnly, adminService.unblockUser);

// Debug: inspect follow documents for a user (admin only)
router.get('/follows/:userId', authMiddleware, adminOnly, async (req, res, next) => {
    try {
        const { Follow } = require('../models');
        const userId = req.params.userId;
        const followers = await Follow.find({ following: userId }).limit(200).lean();
        const following = await Follow.find({ follower: userId }).limit(200).lean();
        res.json({
            followersCount: followers.length,
            followingCount: following.length,
            followers: followers.map(f => ({ _id: f._id, follower: f.follower, following: f.following, createdAt: f.createdAt })),
            following: following.map(f => ({ _id: f._id, follower: f.follower, following: f.following, createdAt: f.createdAt }))
        });
    } catch (err) { next(err); }
});

// Mark profile setup complete for matching users (admin only)
router.post('/users/mark-setup', authMiddleware, adminOnly, async (req, res, next) => {
    try {
        const { role } = req.body || {};
        const filter = {};
        if (role) filter.roles = role;
        const { User } = require('../models');
        const result = await User.updateMany(filter, { $set: { profileSetupComplete: true, onboardingStep: 4 } });
        res.json({ modifiedCount: result.modifiedCount || result.nModified || 0 });
    } catch (err) { next(err); }
});

module.exports = router;
