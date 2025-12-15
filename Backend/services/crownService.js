const Crown = require('../models/Crown');
const Post = require('../models/Post');
const InvestorDetails = require('../models/InvestorDetails');
const Notification = require('../models/Notification');

exports.listCrownsForPost = async (req, res, next) => {
    try {
        const crowns = await Crown.find({ post: req.params.postId }).populate('user', 'username displayName avatarUrl');
        res.json({ crowns });
    } catch (err) { next(err); }
};

exports.crownPost = async (req, res, next) => {
    try {
        // only investors can crown
        const hasInvestor = await InvestorDetails.findOne({ user: req.user._id });
        if (!hasInvestor) return res.status(403).json({ error: 'Only investors can crown profiles' });

        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        const existing = await Crown.findOne({ post: post._id, user: req.user._id });
        if (!existing) {
            await Crown.create({ post: post._id, user: req.user._id });
            // increment crowns if Post schema supports it; fall back to meta
            if (typeof post.crownsCount === 'number') {
                post.crownsCount += 1;
            } else {
                post.meta = post.meta || {};
                post.meta.crowns = (post.meta.crowns || 0) + 1;
            }
            await post.save();
            // Create notification for post author (if not self)
            if (post.author && post.author.toString() !== req.user._id.toString()) {
                try {
                    await Notification.create({
                        user: post.author,
                        actor: req.user._id,
                        type: 'crown',
                        payload: { postId: post._id, postContent: post.content?.substring(0, 50) }
                    });
                } catch (notifErr) {
                    console.warn('Failed to create crown notification:', notifErr.message);
                }
            }
        }
        res.json({ success: true });
    } catch (err) { next(err); }
};

exports.uncrownPost = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        const crown = await Crown.findOneAndDelete({ post: post._id, user: req.user._id });
        if (crown) {
            if (typeof post.crownsCount === 'number') {
                post.crownsCount = Math.max(0, post.crownsCount - 1);
            } else {
                post.meta = post.meta || {};
                post.meta.crowns = Math.max(0, (post.meta.crowns || 1) - 1);
            }
            await post.save();
        }
        res.json({ success: true });
    } catch (err) { next(err); }
};
