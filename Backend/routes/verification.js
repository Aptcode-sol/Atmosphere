const express = require('express');
const router = express.Router();
const { VerificationDocument, VerificationStatus } = require('../models');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/verification/documents - Upload verification document (requires auth)
router.post('/documents', authMiddleware, async (req, res, next) => {
    try {
        const { type, storageKey, url } = req.body;

        if (!type || !url) {
            return res.status(400).json({ error: 'Type and URL are required' });
        }

        const document = new VerificationDocument({
            user: req.user._id,
            type,
            storageKey,
            url,
            status: 'pending',
        });

        await document.save();
        res.status(201).json({ document });
    } catch (err) {
        next(err);
    }
});

// GET /api/verification/documents - Get user's verification documents (requires auth)
router.get('/documents', authMiddleware, async (req, res, next) => {
    try {
        const documents = await VerificationDocument.find({ user: req.user._id })
            .populate('reviewedBy', 'username displayName')
            .sort({ createdAt: -1 });

        res.json({ documents });
    } catch (err) {
        next(err);
    }
});

// GET /api/verification/status - Get user's verification status (requires auth)
router.get('/status', authMiddleware, async (req, res, next) => {
    try {
        const statuses = await VerificationStatus.find({ user: req.user._id })
            .populate('adminId', 'username displayName')
            .sort({ createdAt: -1 });

        res.json({ statuses });
    } catch (err) {
        next(err);
    }
});

// POST /api/verification/submit - Submit verification request (requires auth)
router.post('/submit', authMiddleware, async (req, res, next) => {
    try {
        const { role } = req.body;

        if (!role) {
            return res.status(400).json({ error: 'Role is required' });
        }

        // Check if already submitted
        const existing = await VerificationStatus.findOne({
            user: req.user._id,
            role,
            status: { $in: ['requested', 'in_review'] },
        });

        if (existing) {
            return res.status(409).json({ error: 'Verification already in progress for this role' });
        }

        const verification = new VerificationStatus({
            user: req.user._id,
            role,
            status: 'requested',
        });

        await verification.save();
        res.status(201).json({ verification });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
