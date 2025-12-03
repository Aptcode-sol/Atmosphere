const express = require('express');
const router = express.Router();
const { VerificationDocument, VerificationStatus, AuditLog, User } = require('../models');
const authMiddleware = require('../middleware/authMiddleware');

// Middleware to check if user is admin
const adminOnly = async (req, res, next) => {
    if (!req.user.roles.includes('admin')) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// GET /api/admin/verification/pending - Get pending verifications (admin only)
router.get('/verification/pending', authMiddleware, adminOnly, async (req, res, next) => {
    try {
        const { limit = 20, skip = 0, type } = req.query;

        const filter = { status: { $in: ['requested', 'in_review'] } };
        if (type) filter.role = type;

        const verifications = await VerificationStatus.find(filter)
            .populate('user', 'username displayName email avatarUrl')
            .sort({ requestedAt: 1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        res.json({ verifications, count: verifications.length });
    } catch (err) {
        next(err);
    }
});

// GET /api/admin/verification/documents/:userId - Get user's verification documents (admin only)
router.get('/verification/documents/:userId', authMiddleware, adminOnly, async (req, res, next) => {
    try {
        const { userId } = req.params;

        const documents = await VerificationDocument.find({ user: userId })
            .populate('user', 'username displayName email')
            .populate('reviewedBy', 'username displayName')
            .sort({ createdAt: -1 });

        res.json({ documents });
    } catch (err) {
        next(err);
    }
});

// PUT /api/admin/verification/:id/approve - Approve verification (admin only)
router.put('/verification/:id/approve', authMiddleware, adminOnly, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;

        const verification = await VerificationStatus.findById(id);
        if (!verification) {
            return res.status(404).json({ error: 'Verification not found' });
        }

        verification.status = 'approved';
        verification.approvedAt = new Date();
        verification.adminId = req.user._id;
        if (notes) verification.meta = { ...verification.meta, notes };

        await verification.save();

        // Update user's verified status
        await User.findByIdAndUpdate(verification.user, { verified: true });

        // Update related documents
        await VerificationDocument.updateMany(
            { user: verification.user },
            { status: 'approved', reviewedBy: req.user._id, reviewedAt: new Date() }
        );

        // Create audit log
        const auditLog = new AuditLog({
            actor: req.user._id,
            targetType: 'VerificationStatus',
            targetId: verification._id,
            action: 'approve',
            data: { role: verification.role, notes },
        });
        await auditLog.save();

        res.json({ verification, message: 'Verification approved successfully' });
    } catch (err) {
        next(err);
    }
});

// PUT /api/admin/verification/:id/reject - Reject verification (admin only)
router.put('/verification/:id/reject', authMiddleware, adminOnly, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ error: 'Rejection reason is required' });
        }

        const verification = await VerificationStatus.findById(id);
        if (!verification) {
            return res.status(404).json({ error: 'Verification not found' });
        }

        verification.status = 'rejected';
        verification.adminId = req.user._id;
        verification.meta = { ...verification.meta, rejectionReason: reason };

        await verification.save();

        // Update related documents
        await VerificationDocument.updateMany(
            { user: verification.user },
            { status: 'rejected', reviewedBy: req.user._id, reviewedAt: new Date(), notes: reason }
        );

        // Create audit log
        const auditLog = new AuditLog({
            actor: req.user._id,
            targetType: 'VerificationStatus',
            targetId: verification._id,
            action: 'reject',
            data: { role: verification.role, reason },
        });
        await auditLog.save();

        res.json({ verification, message: 'Verification rejected' });
    } catch (err) {
        next(err);
    }
});

// GET /api/admin/audit-logs - Get audit logs (admin only)
router.get('/audit-logs', authMiddleware, adminOnly, async (req, res, next) => {
    try {
        const { limit = 50, skip = 0, action, targetType } = req.query;

        const filter = {};
        if (action) filter.action = action;
        if (targetType) filter.targetType = targetType;

        const logs = await AuditLog.find(filter)
            .populate('actor', 'username displayName email')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        res.json({ logs, count: logs.length });
    } catch (err) {
        next(err);
    }
});

// GET /api/admin/users - Get all users (admin only)
router.get('/users', authMiddleware, adminOnly, async (req, res, next) => {
    try {
        const { limit = 50, skip = 0, role, verified, search } = req.query;

        const filter = {};
        if (role) filter.roles = role;
        if (verified !== undefined) filter.verified = verified === 'true';
        if (search) {
            filter.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { displayName: { $regex: search, $options: 'i' } },
            ];
        }

        const users = await User.find(filter)
            .select('-passwordHash')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await User.countDocuments(filter);

        res.json({ users, count: users.length, total });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
