// Simple auth stub - replace with JWT or supabase validation
const mongoose = require('mongoose');
const User = mongoose.model('User');
module.exports = async function auth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return next();
    // For testing, fetch the first user from the database
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
