const StartupLike = require('../models/StartupLike');
const StartupDetails = require('../models/StartupDetails');
const Notification = require('../models/Notification');

exports.listLikesForStartup = async (req, res, next) => {
    try {
        const likes = await StartupLike.find({ startup: req.params.startupId }).populate('user', 'username displayName avatarUrl');
        res.json({ likes });
    } catch (err) { next(err); }
};

exports.likeStartup = async (req, res, next) => {
    try {
        let startup = await StartupDetails.findById(req.params.startupId);
        if (!startup) {
            // Try resolving by user id in case client passed a user id
            startup = await StartupDetails.findOne({ user: req.params.startupId });
        }
        if (!startup) return res.status(404).json({ error: 'Startup not found' });
        const existing = await StartupLike.findOne({ startup: startup._id, user: req.user._id });
        if (!existing) {
            // Try to run in a transaction when possible to ensure the like document and meta increment are atomic
            const mongoose = require('mongoose');
            const session = await mongoose.startSession().catch(() => null);
            if (session && typeof session.withTransaction === 'function') {
                try {
                    let resultLikes = 0;
                    await session.withTransaction(async () => {
                        try {
                            await StartupLike.create([{ startup: startup._id, user: req.user._id }], { session });
                        } catch (err) {
                            // Duplicate like may throw unique index error — ignore in that case
                            if (err && err.code === 11000) return;
                            throw err;
                        }

                        // update meta.likes atomically using aggregation pipeline
                        const updated = await StartupDetails.findOneAndUpdate(
                            { _id: startup._id },
                            [
                                {
                                    $set: {
                                        meta: {
                                            $let: {
                                                vars: { current: { $ifNull: ['$meta', {}] } },
                                                in: {
                                                    $mergeObjects: ['$$current', { likes: { $add: [{ $ifNull: ['$$current.likes', 0] }, 1] } }]
                                                }
                                            }
                                        },
                                        likesCount: { $add: [{ $ifNull: ['$likesCount', 0] }, 1] }
                                    }
                                }
                            ],
                            { new: true, session, updatePipeline: true }
                        ).lean();
                        resultLikes = (updated && updated.meta && typeof updated.meta.likes === 'number') ? updated.meta.likes : (updated && updated.likesCount) || 0;
                    });
                    // Create notification for startup owner (if not self)
                    if (startup.user && startup.user.toString() !== req.user._id.toString()) {
                        try {
                            await Notification.create({
                                user: startup.user,
                                actor: req.user._id,
                                type: 'like',
                                payload: { startupId: startup._id, startupName: startup.companyName }
                            });
                        } catch (notifErr) {
                            console.warn('Failed to create startup like notification:', notifErr.message);
                        }
                    }
                    if (typeof resultLikes === 'number') return res.json({ success: true, likes: resultLikes });
                } catch (err) {
                    // Fall through to non-transactional path
                    console.warn('Like transaction failed, falling back', err && err.message ? err.message : err);
                } finally {
                    try { session.endSession(); } catch { }
                }
            }

            // Non-transactional fallback: create like with duplicate handling and increment meta
            try {
                await StartupLike.create({ startup: startup._id, user: req.user._id });
            } catch (err) {
                if (err && err.code === 11000) {
                    // duplicate like, return current count
                    return res.json({ success: true, likes: (startup.meta && typeof startup.meta.likes === 'number') ? startup.meta.likes : (startup.likesCount || 0) });
                }
                throw err;
            }

            // Create notification for startup owner (if not self)
            if (startup.user && startup.user.toString() !== req.user._id.toString()) {
                try {
                    await Notification.create({
                        user: startup.user,
                        actor: req.user._id,
                        type: 'like',
                        payload: { startupId: startup._id, startupName: startup.companyName }
                    });
                } catch (notifErr) {
                    console.warn('Failed to create startup like notification:', notifErr.message);
                }
            }

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
                                            $mergeObjects: ['$$current', { likes: { $add: [{ $ifNull: ['$$current.likes', 0] }, 1] } }]
                                        }
                                    }
                                },
                                likesCount: { $add: [{ $ifNull: ['$likesCount', 0] }, 1] }
                            }
                        }
                    ],
                    { new: true, updatePipeline: true }
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
        let startup = await StartupDetails.findById(req.params.startupId);
        if (!startup) {
            startup = await StartupDetails.findOne({ user: req.params.startupId });
        }
        if (!startup) return res.status(404).json({ error: 'Startup not found' });
        // Check if like exists first, don't delete yet
        const like = await StartupLike.findOne({ startup: startup._id, user: req.user._id });
        if (like) {
            // Attempt transactional delete + decrement
            const mongoose = require('mongoose');
            const session = await mongoose.startSession().catch(() => null);
            if (session && typeof session.withTransaction === 'function') {
                try {
                    let resultLikes = 0;
                    await session.withTransaction(async () => {
                        await StartupLike.findOneAndDelete({ startup: startup._id, user: req.user._id }, { session });
                        const updated = await StartupDetails.findOneAndUpdate(
                            { _id: startup._id },
                            [
                                {
                                    $set: {
                                        meta: {
                                            $let: {
                                                vars: { current: { $ifNull: ['$meta', {}] } },
                                                in: {
                                                    $mergeObjects: ['$$current', { likes: { $max: [0, { $subtract: [{ $ifNull: ['$$current.likes', 0] }, 1] }] } }]
                                                }
                                            }
                                        },
                                        likesCount: { $max: [0, { $subtract: [{ $ifNull: ['$likesCount', 0] }, 1] }] }
                                    }
                                }
                            ],
                            { new: true, session, updatePipeline: true }
                        ).lean();
                        resultLikes = (updated && updated.meta && typeof updated.meta.likes === 'number') ? updated.meta.likes : (updated && updated.likesCount) || 0;
                    });
                    if (typeof resultLikes === 'number') return res.json({ success: true, likes: resultLikes });
                } catch (err) {
                    console.warn('Unlike transaction failed, falling back', err && err.message ? err.message : err);
                } finally { try { session.endSession(); } catch { } }
            }

            // Fallback: delete like and decrement
            await StartupLike.findOneAndDelete({ startup: startup._id, user: req.user._id });
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
                    { new: true, updatePipeline: true }
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
