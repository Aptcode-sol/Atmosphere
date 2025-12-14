const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const otpService = require('../services/otpService');
const emailService = require('../services/emailService');
const { getOtpEmailTemplate } = require('../services/emailTemplates');

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
            verified: false // Ensure user is not verified initially
        });

        await user.save();

        // Generate and Send OTP
        const otp = otpService.createOtp(user.email);
        const emailSubject = 'Verify your email - Atmosphere';
        const emailBody = getOtpEmailTemplate(otp, user.username);

        // We don't await this to keep response fast, or we can if we want to ensure sending
        emailService.sendEmail(user.email, emailSubject, emailBody).catch(err => console.error("Failed to send OTP email:", err));


        // Generate JWT token
        const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
        });

        res.status(201).json({
            token,
            message: "Registration successful. Please check your email for the verification code.",
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                displayName: user.displayName,
                roles: user.roles,
                avatarUrl: user.avatarUrl,
                verified: user.verified
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

        // Generate JWT token with userId as string
        const token = jwt.sign({ userId: user._id.toString(), email: user.email }, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
        });

        res.json({
            token,
            user: {
                _id: user._id,
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

// POST /api/auth/verify-email - Verify an email with a one-time code
// This endpoint supports two modes:
// 1) Authenticated: caller includes Bearer token, middleware attaches req.user and we update that user.
// 2) Unauthenticated (signup flow): caller provides { email, code } and we locate the user by email and update.
const authMiddleware = require('../middleware/authMiddleware');

router.post('/verify-email', async (req, res, next) => {
    try {
        const { code, email } = req.body;
        if (!code) return res.status(400).json({ error: 'Code is required' });

        let userEmail = email;
        let userId = null;

        // Try to identify user from token if present
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.substring(7);
                const decoded = jwt.verify(token, JWT_SECRET);
                userId = decoded.userId;
                // Fetch user to get email if not provided
                if (!userEmail) {
                    const user = await User.findById(userId);
                    if (user) userEmail = user.email;
                }
            } catch (e) {
                // Invalid token, proceed if email was in body
            }
        }

        if (!userEmail) {
            return res.status(400).json({ error: 'Email is required if not logged in.' });
        }

        // Verify OTP from in-memory store
        const verification = otpService.verifyOtp(userEmail, code); // Updated to use otpStoreService

        if (!verification.valid) {
            return res.status(400).json({ success: false, error: verification.message });
        }

        // OTP is valid, update user
        if (userId) {
            await User.findByIdAndUpdate(userId, { verified: true, otpVerified: true });
        } else {
            // Find by email
            await User.findOneAndUpdate({ email: userEmail }, { verified: true, otpVerified: true });
        }

        return res.json({ success: true, message: 'Email verified successfully.' });

    } catch (err) {
        next(err);
    }
});

// POST /api/auth/resend-otp
router.post('/resend-otp', async (req, res, next) => {
    try {
        const { email } = req.body;
        let userEmail = email;

        // Try to identify from token
        const authHeader = req.headers.authorization;
        if (!userEmail && authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.substring(7);
                const decoded = jwt.verify(token, JWT_SECRET);
                const user = await User.findById(decoded.userId);
                if (user) userEmail = user.email;
            } catch (e) { }
        }

        if (!userEmail) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const otp = otpService.createOtp(userEmail);
        const emailSubject = 'Resend: Verify your email - Atmosphere';
        // Need to fetch username if we want to personalize, but for resend flow user might just be email.
        // Let's try to pass what we have. If we found a user object earlier (lines 212-214) use it.
        // But we didn't save the user object in scope, only extracted email.
        // Let's just pass 'there' implicitly by passing null/undefined if we don't have it easily, 
        // or quickly fetch it if we want perfection.
        // Actually, lines 212-214 do `const user = await User.findById...`. 
        // But that's inside a try/catch block so `user` is scoped there.
        // We can just query basic info or pass empty name.
        const emailBody = getOtpEmailTemplate(otp);

        emailService.sendEmail(userEmail, emailSubject, emailBody).catch(console.error);

        res.json({ message: 'OTP resent successfully' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
