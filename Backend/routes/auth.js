const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// POST /api/auth/register - Register new user
router.post('/register', async (req, res, next) => {
    try {
        const { email, username, password, displayName, accountType } = req.body;

        // Validate required fields
        if (!email || !username || !password) {
            return res.status(400).json({ error: 'Email, username, and password are required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(409).json({ error: 'User with this email or username already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Determine roles based on account type
        const roles = accountType ? [accountType.toLowerCase()] : ['personal'];

        // Create user
        const user = new User({
            email,
            username,
            passwordHash,
            displayName: displayName || username,
            roles,
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
        });

        res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                displayName: user.displayName,
                roles: user.roles,
                avatarUrl: user.avatarUrl,
            },
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/auth/login - Login user
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || !user.passwordHash) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
        });

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                displayName: user.displayName,
                roles: user.roles,
                avatarUrl: user.avatarUrl,
                verified: user.verified,
            },
        });
    } catch (err) {
        next(err);
    }
});

// GET /api/auth/me - Get current user (requires auth)
router.get('/me', async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await User.findById(decoded.userId).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        next(err);
    }
});

// POST /api/auth/verify-email - Verify an email with a one-time code (dev stub)
// This endpoint supports two modes:
// 1) Authenticated: caller includes Bearer token, middleware attaches req.user and we update that user.
// 2) Unauthenticated (signup flow): caller provides { email, code } and we locate the user by email and update.
const authMiddleware = require('../middleware/authMiddleware');
router.post('/verify-email', async (req, res, next) => {
    try {
        const { code, email } = req.body;
        if (!code) return res.status(400).json({ error: 'Code is required' });

        // Development stub: accept '1234' as the valid code
        if (String(code) === '1234') {
            // If auth header present, try to use middleware to populate req.user
            let updated = false;
            try {
                const authHeader = req.headers.authorization;
                if (authHeader && authHeader.startsWith('Bearer ')) {
                    // try to verify token and find user
                    // reuse authMiddleware logic by calling it manually
                    // (note: middleware expects (req,res,next) so we call and wait)
                    await new Promise((resolve, reject) => {
                        authMiddleware(req, res, (err) => (err ? reject(err) : resolve(undefined)));
                    });
                }
            } catch (e) {
                // ignore middleware failures and fall back to email lookup
            }

            // If req.user is present from middleware, update that user
            if (req.user && req.user._id) {
                await User.findByIdAndUpdate(req.user._id, { otpVerified: true });
                updated = true;
            } else if (email) {
                // fallback: locate user by email for signup flow (dev only)
                try {
                    const user = await User.findOne({ email: String(email).toLowerCase() });
                    if (user) {
                        await User.findByIdAndUpdate(user._id, { otpVerified: true });
                        updated = true;
                    }
                } catch (e) {
                    // ignore
                }
            }

            if (updated) return res.json({ success: true, message: 'Email verified (dev stub)' });
            return res.status(404).json({ success: false, error: 'User not found to verify' });
        }

        return res.status(400).json({ success: false, error: 'Invalid code' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
