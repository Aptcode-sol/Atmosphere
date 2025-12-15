const { StartupComment, StartupDetails, Notification } = require('../models');

exports.createComment = async (req, res, next) => {
    try {
        const { text, parent } = req.body;
        const startupId = req.params.startupId;
        if (!text) return res.status(400).json({ error: 'Comment text is required' });
        let startup = await StartupDetails.findById(startupId);
        if (!startup) {
            startup = await StartupDetails.findOne({ user: startupId });
        }
        if (!startup) return res.status(404).json({ error: 'Startup not found' });
        // Try to run creation + meta increment in a transaction
        const mongoose = require('mongoose');
        const session = await mongoose.startSession().catch(() => null);
        let commentObj = null;
        let updatedStartup = null;
        if (session && typeof session.withTransaction === 'function') {
            try {
                await session.withTransaction(async () => {
                    const created = await require('../models/StartupComment').create([{ startup: startupId, author: req.user._id, text, parent: parent || null }], { session });
                    commentObj = created && created[0] ? created[0] : null;
                    if (commentObj) await commentObj.populate('author', 'username displayName avatarUrl');

                    updatedStartup = await StartupDetails.findOneAndUpdate(
                        { _id: startupId },
                        [
                            {
                                $set: {
                                    meta: {
                                        $let: {
                                            vars: { current: { $ifNull: ['$meta', {}] } },
                                            in: {
                                                $mergeObjects: ['$$current', { commentsCount: { $add: [{ $ifNull: ['$$current.commentsCount', 0] }, 1] } }]
                                            }
                                        }
                                    }
                                }
                            }
                        ],
                        { new: true, session, updatePipeline: true }
                    ).lean();
                });
            } catch (err) {
                console.warn('Create comment transaction failed, falling back', err && err.message ? err.message : err);
            } finally { try { session.endSession(); } catch { } }
        }

        // If not created in transaction, fallback to non-transactional create and update
        if (!commentObj) {
            const commentModel = require('../models/StartupComment');
            const created = new commentModel({ startup: startupId, author: req.user._id, text, parent: parent || null });
            await created.save();
            commentObj = created;
            await commentObj.populate('author', 'username displayName avatarUrl');

            try {
                updatedStartup = await StartupDetails.findOneAndUpdate(
                    { _id: startupId },
                    [
                        {
                            $set: {
                                meta: {
                                    $let: {
                                        vars: { current: { $ifNull: ['$meta', {}] } },
                                        in: {
                                            $mergeObjects: ['$$current', { commentsCount: { $add: [{ $ifNull: ['$$current.commentsCount', 0] }, 1] } }]
                                        }
                                    }
                                }
                            }
                        }
                    ],
                    { new: true, updatePipeline: true }
                ).lean();
            } catch (e) {
                startup.meta = startup.meta || {};
                startup.meta.commentsCount = (startup.meta.commentsCount || 0) + 1;
                await startup.save();
                updatedStartup = await StartupDetails.findById(startupId).lean();
            }
        }

        const commentsCount = (updatedStartup && updatedStartup.meta && typeof updatedStartup.meta.commentsCount === 'number') ? updatedStartup.meta.commentsCount : (updatedStartup && typeof updatedStartup.commentsCount === 'number' ? updatedStartup.commentsCount : (startup.meta && startup.meta.commentsCount) || 0);

        // Create notification for startup owner (if not self)
        if (startup.user && startup.user.toString() !== req.user._id.toString()) {
            try {
                await Notification.create({
                    user: startup.user,
                    actor: req.user._id,
                    type: 'comment',
                    payload: { startupId: startup._id, startupName: startup.companyName, commentText: text?.substring(0, 50) }
                });
            } catch (notifErr) {
                console.warn('Failed to create startup comment notification:', notifErr.message);
            }
        }

        res.status(201).json({ comment: commentObj, commentsCount });
    } catch (err) { next(err); }
};

exports.listComments = async (req, res, next) => {
    try {
        const startupId = req.params.startupId;
        const comments = await require('../models/StartupComment').find({ startup: startupId, parent: null }).populate('author', 'username displayName avatarUrl').sort({ createdAt: -1 });
        res.json({ comments });
    } catch (err) { next(err); }
};

exports.getReplies = async (req, res, next) => {
    try {
        const id = req.params.id;
        const replies = await require('../models/StartupComment').find({ parent: id }).populate('author', 'username displayName avatarUrl').sort({ createdAt: 1 });
        res.json({ replies });
    } catch (err) { next(err); }
};

exports.updateComment = async (req, res, next) => {
    try {
        const comment = await require('../models/StartupComment').findById(req.params.id);
        if (!comment) return res.status(404).json({ error: 'Comment not found' });
        if (comment.author.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Forbidden' });
        if (req.body.text) comment.text = req.body.text;
        await comment.save();
        await comment.populate('author', 'username displayName avatarUrl');
        res.json({ comment });
    } catch (err) { next(err); }
};

exports.deleteComment = async (req, res, next) => {
    try {
        const comment = await require('../models/StartupComment').findById(req.params.id);
        if (!comment) return res.status(404).json({ error: 'Comment not found' });
        if (comment.author.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Forbidden' });
        const startupId = comment.startup;
        // Try to perform delete + decrement in a transaction
        const mongoose = require('mongoose');
        const session = await mongoose.startSession().catch(() => null);
        if (session && typeof session.withTransaction === 'function') {
            try {
                let ccount = undefined;
                await session.withTransaction(async () => {
                    await require('../models/StartupComment').findOneAndDelete({ _id: comment._id }, { session });
                    const updated = await StartupDetails.findOneAndUpdate(
                        { _id: startupId },
                        [
                            {
                                $set: {
                                    meta: {
                                        $let: {
                                            vars: { current: { $ifNull: ['$meta', {}] } },
                                            in: {
                                                $mergeObjects: [
                                                    '$$current',
                                                    {
                                                        commentsCount: {
                                                            $max: [0, { $subtract: [{ $ifNull: ['$$current.commentsCount', 0] }, 1] }]
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        ],
                        { new: true, session, updatePipeline: true }
                    ).lean();
                    ccount = (updated && updated.meta && typeof updated.meta.commentsCount === 'number') ? updated.meta.commentsCount : (updated && typeof updated.commentsCount === 'number' ? updated.commentsCount : undefined);
                });
                if (typeof ccount === 'number') return res.json({ message: 'Comment deleted successfully', commentsCount: ccount });
            } catch (err) {
                console.warn('Delete comment transaction failed, falling back', err && err.message ? err.message : err);
            } finally { try { session.endSession(); } catch { } }
        }

        // fallback: non-transactional delete (comment already removed above) then decrement via pipeline or fallback
        await StartupDetails.findByIdAndUpdate(startupId, { $inc: { 'meta.commentsCount': -1 } });
        const sd = await StartupDetails.findById(startupId);
        let ccount = undefined;
        if (sd) {
            sd.meta = sd.meta || {};
            if ((sd.meta.commentsCount || 0) < 0) {
                sd.meta.commentsCount = 0;
                await sd.save();
            }
            ccount = sd.meta.commentsCount;
        }
        return res.json({ message: 'Comment deleted successfully', commentsCount: typeof ccount === 'number' ? ccount : undefined });
    } catch (err) { next(err); }
};
