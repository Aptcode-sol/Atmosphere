const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { User } = require('../models');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * GET /api/settings - Get current user's settings
 * Returns user account info (name, username, email, phone)
 */
router.get('/', authMiddleware, async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            settings: {
                displayName: user.displayName || '',
                username: user.username || '',
                email: user.email || '',
                phone: user.phone || '',
                avatarUrl: user.avatarUrl || '',
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * PUT /api/settings - Update user settings
 * Body: { displayName?, username?, phone? }
 * Note: email changes would require verification, so we don't allow it here
 */
router.put('/', authMiddleware, async (req, res, next) => {
    try {
        const { displayName, username, phone } = req.body;
        const updates = {};

        if (displayName !== undefined) updates.displayName = displayName;
        if (phone !== undefined) updates.phone = phone;

        // Username change requires checking uniqueness
        if (username !== undefined && username !== req.user.username) {
            const existing = await User.findOne({ username, _id: { $ne: req.user._id } });
            if (existing) {
                return res.status(409).json({ error: 'Username already taken' });
            }
            updates.username = username;
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true }
        ).select('-passwordHash');

        res.json({
            success: true,
            settings: {
                displayName: user.displayName || '',
                username: user.username || '',
                email: user.email || '',
                phone: user.phone || '',
                avatarUrl: user.avatarUrl || '',
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * PUT /api/settings/password - Change password
 * Body: { currentPassword, newPassword }
 */
router.put('/password', authMiddleware, async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        // Get user with password hash
        const user = await User.findById(req.user._id);
        if (!user || !user.passwordHash) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password and update
        const newHash = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(req.user._id, { passwordHash: newHash });

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
