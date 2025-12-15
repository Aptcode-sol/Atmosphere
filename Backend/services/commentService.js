const { Comment, Post, Notification } = require('../models');

exports.createComment = async (req, res, next) => {
    try {
        const { postId } = req.params;
        const { text, parent } = req.body;

        if (!text) return res.status(400).json({ error: 'Comment text is required' });

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: 'Post not found' });


        const comment = new Comment({ post: postId, author: req.user._id, text, parent: parent || null });
        await comment.save();
        await comment.populate('author', 'username displayName avatarUrl');

        // Atomic increment commentsCount and meta.commentsCount on Post
        try {
            await Post.findOneAndUpdate(
                { _id: postId },
                [
                    {
                        $set: {
                            commentsCount: { $add: [{ $ifNull: ['$commentsCount', 0] }, 1] },
                            meta: {
                                $let: {
                                    vars: { current: { $ifNull: ['$meta', {}] } },
                                    in: { $mergeObjects: ['$$current', { commentsCount: { $add: [{ $ifNull: ['$$current.commentsCount', 0] }, 1] } }] }
                                }
                            }
                        }
                    }
                ]
            );
        } catch (e) {
            post.commentsCount += 1;
            post.meta = post.meta || {};
            post.meta.commentsCount = (post.meta.commentsCount || 0) + 1;
            await post.save();
        }

        // Create notification for post author (if not self)
        if (post.author && post.author.toString() !== req.user._id.toString()) {
            try {
                await Notification.create({
                    user: post.author,
                    actor: req.user._id,
                    type: 'comment',
                    payload: { postId: post._id, commentText: text?.substring(0, 50) }
                });
            } catch (notifErr) {
                console.warn('Failed to create comment notification:', notifErr.message);
            }
        }

        res.status(201).json({ comment });
    } catch (err) { next(err); }
};

exports.listComments = async (req, res, next) => {
    try {
        const { postId } = req.params;
        const { limit = 50, skip = 0 } = req.query;

        const comments = await Comment.find({ post: postId, parent: null })
            .populate('author', 'username displayName avatarUrl')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        res.json({ comments });
    } catch (err) { next(err); }
};

exports.getReplies = async (req, res, next) => {
    try {
        const { id } = req.params;
        const replies = await Comment.find({ parent: id }).populate('author', 'username displayName avatarUrl').sort({ createdAt: 1 });
        res.json({ replies });
    } catch (err) { next(err); }
};

exports.updateComment = async (req, res, next) => {
    try {
        const comment = await Comment.findById(req.params.id);
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
        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ error: 'Comment not found' });
        if (comment.author.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Forbidden' });

        const postId = comment.post;
        await comment.deleteOne();
        try {
            await Post.findOneAndUpdate(
                { _id: postId },
                [
                    {
                        $set: {
                            commentsCount: { $max: [0, { $subtract: [{ $ifNull: ['$commentsCount', 0] }, 1] }] }
                        }
                    }
                ],
                { new: true }
            );
        } catch (e) {
            // Fallback
            await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: -1 } });
            const p = await Post.findById(postId);
            if (p && (p.commentsCount || 0) < 0) {
                p.commentsCount = 0;
                await p.save();
            }
        }

        res.json({ message: 'Comment deleted successfully' });
    } catch (err) { next(err); }
};
