const StartupLike = require('../models/StartupLike');
const StartupDetails = require('../models/StartupDetails');

exports.listLikesForStartup = async (req, res, next) => {
    try {
        const likes = await StartupLike.find({ startup: req.params.startupId }).populate('user', 'username displayName avatarUrl');
        res.json({ likes });
    } catch (err) { next(err); }
};

exports.likeStartup = async (req, res, next) => {
    try {
        const startup = await StartupDetails.findById(req.params.startupId);
        if (!startup) return res.status(404).json({ error: 'Startup not found' });
        const existing = await StartupLike.findOne({ startup: startup._id, user: req.user._id });
        if (!existing) {
            await StartupLike.create({ startup: startup._id, user: req.user._id });
            startup.likesCount = (startup.likesCount || 0) + 1;
            await startup.save();
        }
        res.json({ success: true });
    } catch (err) { next(err); }
};

exports.unlikeStartup = async (req, res, next) => {
    try {
        const startup = await StartupDetails.findById(req.params.startupId);
        if (!startup) return res.status(404).json({ error: 'Startup not found' });
        const like = await StartupLike.findOneAndDelete({ startup: startup._id, user: req.user._id });
        if (like) {
            startup.likesCount = Math.max(0, (startup.likesCount || 0) - 1);
            await startup.save();
        }
        res.json({ success: true });
    } catch (err) { next(err); }
};

exports.checkLiked = async (req, res, next) => {
    try {
        if (!req.user) return res.json({ liked: false });
        const startupId = req.params.startupId;
        const existing = await StartupLike.findOne({ startup: startupId, user: req.user._id });
        res.json({ liked: !!existing });
    } catch (err) { next(err); }
};
