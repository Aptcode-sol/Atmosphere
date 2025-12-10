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
            // atomic increment meta.likes and return updated value via aggregation pipeline update
            try {
                const updated = await StartupDetails.findOneAndUpdate(
                    { _id: startup._id },
                    [
                        {
                            $set: {
                                meta: {
                                    $let: {
                                        vars: { current: { $ifNull: ['$meta', {}] } },
                                        in: {
                                            $mergeObjects: [
                                                '$$current',
                                                { likes: { $add: [{ $ifNull: ['$$current.likes', 0] }, 1] } }
                                            ]
                                        }
                                    }
                                },
                                likesCount: {
                                    $add: [{ $ifNull: ['$likesCount', 0] }, 1]
                                }
                            }
                        }
                    ],
                    { new: true }
                ).lean();
                const likesVal = (updated && updated.meta && typeof updated.meta.likes === 'number') ? updated.meta.likes : (updated && updated.likesCount) || 0;
                return res.json({ success: true, likes: likesVal });
            } catch (e) {
                // Fallback non-pipeline update
                startup.meta = startup.meta || {};
                startup.meta.likes = (startup.meta.likes || 0) + 1;
                if (typeof startup.likesCount === 'number') startup.likesCount = (startup.likesCount || 0) + 1;
                await startup.save();
                return res.json({ success: true, likes: (startup.meta && typeof startup.meta.likes === 'number') ? startup.meta.likes : (startup.likesCount || 0) });
            }
        }
        // if existing like exists, just return current likes
        return res.json({ success: true, likes: (startup.meta && typeof startup.meta.likes === 'number') ? startup.meta.likes : (startup.likesCount || 0) });
    } catch (err) { next(err); }
};

exports.unlikeStartup = async (req, res, next) => {
    try {
        const startup = await StartupDetails.findById(req.params.startupId);
        if (!startup) return res.status(404).json({ error: 'Startup not found' });
        const like = await StartupLike.findOneAndDelete({ startup: startup._id, user: req.user._id });
        if (like) {
            try {
                const updated = await StartupDetails.findOneAndUpdate(
                    { _id: startup._id },
                    [
                        {
                            $set: {
                                meta: {
                                    $let: {
                                        vars: { current: { $ifNull: ['$meta', {}] } },
                                        in: {
                                            $mergeObjects: [
                                                '$$current',
                                                { likes: { $max: [0, { $subtract: [{ $ifNull: ['$$current.likes', 0] }, 1] }] } }
                                            ]
                                        }
                                    }
                                },
                                likesCount: { $max: [0, { $subtract: [{ $ifNull: ['$likesCount', 0] }, 1] }] }
                            }
                        }
                    ],
                    { new: true }
                ).lean();
                const likesVal = (updated && updated.meta && typeof updated.meta.likes === 'number') ? updated.meta.likes : (updated && updated.likesCount) || 0;
                return res.json({ success: true, likes: likesVal });
            } catch (e) {
                // fallback
                startup.meta = startup.meta || {};
                startup.meta.likes = Math.max(0, (startup.meta.likes || 0) - 1);
                if (typeof startup.likesCount === 'number') startup.likesCount = Math.max(0, (startup.likesCount || 0) - 1);
                await startup.save();
                return res.json({ success: true, likes: (startup.meta && typeof startup.meta.likes === 'number') ? startup.meta.likes : (startup.likesCount || 0) });
            }
        }
        return res.json({ success: true, likes: (startup.meta && typeof startup.meta.likes === 'number') ? startup.meta.likes : (startup.likesCount || 0) });
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
