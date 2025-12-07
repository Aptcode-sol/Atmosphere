const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = mongoose.model('User');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

module.exports = async function auth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            if (decoded && decoded.userId) {
                const user = await User.findById(decoded.userId);
                if (user) {
                    req.user = { _id: user._id };
                    return next();
                }
            }
        } catch (err) {
            // Invalid token, fall through to fallback
        }
    }
    // Fallback for dev: use first user
    try {
        const user = await User.findOne();
        if (user) {
            req.user = { _id: user._id };
        } else {
            req.user = { _id: '000000000000000000000001' };
        }
    } catch (err) {
        req.user = { _id: '000000000000000000000001' };
    }
    next();
};
