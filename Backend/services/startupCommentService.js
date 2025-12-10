const { StartupComment, StartupDetails } = require('../models');

exports.createComment = async (req, res, next) => {
    try {
        const { text, parent } = req.body;
        const startupId = req.params.startupId;
        if (!text) return res.status(400).json({ error: 'Comment text is required' });
        const startup = await StartupDetails.findById(startupId);
        if (!startup) return res.status(404).json({ error: 'Startup not found' });
        const comment = new (require('../models/StartupComment'))({ startup: startupId, author: req.user._id, text, parent: parent || null });
        await comment.save();
        await comment.populate('author', 'username displayName avatarUrl');
        // Atomic increment meta.commentsCount using aggregation pipeline if supported
        try {
            await StartupDetails.findOneAndUpdate(
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
                ]
            );
        } catch (e) {
            startup.meta = startup.meta || {};
            startup.meta.commentsCount = (startup.meta.commentsCount || 0) + 1;
            await startup.save();
        }
        res.status(201).json({ comment });
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
        await comment.deleteOne();
        // Atomic decrement with clamp to zero using aggregation pipeline (MongoDB 4.2+)
        try {
            await StartupDetails.findOneAndUpdate(
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
                { new: true }
            );
        } catch (e) {
            // Fallback: decrement then clamp
            await StartupDetails.findByIdAndUpdate(startupId, { $inc: { 'meta.commentsCount': -1 } });
            const sd = await StartupDetails.findById(startupId);
            if (sd) {
                sd.meta = sd.meta || {};
                if ((sd.meta.commentsCount || 0) < 0) {
                    sd.meta.commentsCount = 0;
                    await sd.save();
                }
            }
        }
        res.json({ message: 'Comment deleted successfully' });
    } catch (err) { next(err); }
};
