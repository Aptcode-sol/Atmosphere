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

router.get('/verification/pending', authMiddleware, adminOnly, adminService.getPendingVerifications);
router.get('/verification/documents/:userId', authMiddleware, adminOnly, adminService.getUserDocuments);
router.put('/verification/:id/approve', authMiddleware, adminOnly, adminService.approveVerification);
router.put('/verification/:id/reject', authMiddleware, adminOnly, adminService.rejectVerification);
router.get('/audit-logs', authMiddleware, adminOnly, adminService.getAuditLogs);
router.get('/users', authMiddleware, adminOnly, adminService.getUsers);
// Mark profile setup complete for matching users (admin only)
router.post('/users/mark-setup', authMiddleware, adminOnly, async (req, res, next) => {
    try {
        // optional filter: { accountType: 'startup' } or { emailDomain: 'example.com' }
        const { accountType } = req.body || {};
        const filter = {};
        if (accountType) filter.accountType = accountType;
        // update users matching filter
        const { User } = require('../models');
        const result = await User.updateMany(filter, { $set: { profileSetupComplete: true, onboardingStep: 4 } });
        res.json({ modifiedCount: result.modifiedCount || result.nModified || 0 });
    } catch (err) { next(err); }
});

module.exports = router;
