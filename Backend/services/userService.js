const { User, Post } = require('../models');

exports.getUserByIdentifier = async (req, res, next) => {
    try {
        const { identifier } = req.params;
        let user = await User.findById(identifier).select('-passwordHash');
        if (!user) user = await User.findOne({ username: identifier }).select('-passwordHash');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user });
    } catch (err) { next(err); }
};

exports.searchUsers = async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q) return res.json({ users: [] });
        const users = await User.find({
            $or: [
                { username: { $regex: q, $options: 'i' } },
                { displayName: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } }
            ]
        }).select('username displayName avatarUrl verified').limit(10);
        res.json({ users });
    } catch (err) { next(err); }
};

exports.updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (req.user._id.toString() !== id) return res.status(403).json({ error: 'Forbidden' });
        const updates = {}; const allowedFields = ['displayName', 'bio', 'avatarUrl', 'links'];
        allowedFields.forEach(field => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });
        const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-passwordHash');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user });
    } catch (err) { next(err); }
};

exports.getUserPosts = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { limit = 20, skip = 0 } = req.query;
        const posts = await Post.find({ author: id }).populate('author', 'username displayName avatarUrl').sort({ createdAt: -1 }).limit(parseInt(limit)).skip(parseInt(skip));
        res.json({ posts });
    } catch (err) { next(err); }
};
exports.checkUsername = async (req, res, next) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
        res.json({ available: !user });
    } catch (err) { next(err); }
};
