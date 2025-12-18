// Share a post (increment sharesCount)
exports.sharePost = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        post.sharesCount = (post.sharesCount || 0) + 1;
        await post.save();
        res.json({ sharesCount: post.sharesCount });
    } catch (err) { next(err); }
};
const { Post } = require('../models');
const Like = require('../models/Like');
const { User } = require('../models');

exports.createPost = async (req, res, next) => {
    try {
        const { content, media, tags, visibility } = req.body;
        const post = new Post({ author: req.user._id, content, media: media || [], tags: tags || [], visibility: visibility || 'public' });
        await post.save();
        await post.populate('author', 'username displayName avatarUrl');
        res.status(201).json({ post });
    } catch (err) { next(err); }
};

exports.listPosts = async (req, res, next) => {
    try {
        const { limit = 20, skip = 0, userId, tag } = req.query;

        // Get blocked user IDs
        const blockedUsers = await User.find({ blocked: true }).select('_id').lean();
        const blockedIds = blockedUsers.map(u => u._id);

        const filter = { visibility: 'public' };
        if (userId) filter.author = userId;
        if (tag) filter.tags = tag;
        if (blockedIds.length > 0) filter.author = { ...filter.author, $nin: blockedIds };

        const posts = await Post.find(filter).populate('author', 'username displayName avatarUrl verified').sort({ createdAt: -1 }).limit(parseInt(limit)).skip(parseInt(skip));
        res.json({ posts, count: posts.length });
    } catch (err) { next(err); }
};

exports.listMyPosts = async (req, res, next) => {
    try {
        const { limit = 50, skip = 0 } = req.query;
        const posts = await Post.find({ author: req.user._id }).populate('author', 'username displayName avatarUrl verified').sort({ createdAt: -1 }).limit(parseInt(limit)).skip(parseInt(skip));
        res.json({ posts, count: posts.length });
    } catch (err) { next(err); }
};

exports.getPost = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id).populate('author', 'username displayName avatarUrl verified');
        if (!post) return res.status(404).json({ error: 'Post not found' });
        let likedByUser = false;
        if (req.user) {
            likedByUser = !!(await Like.findOne({ post: post._id, user: req.user._id }));
        }
        res.json({ post: { ...post.toObject(), likedByUser } });
    } catch (err) { next(err); }
};

exports.updatePost = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        if (post.author.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Forbidden' });
        ['content', 'media', 'tags', 'visibility'].forEach(field => { if (req.body[field] !== undefined) post[field] = req.body[field]; });
        await post.save(); await post.populate('author', 'username displayName avatarUrl'); res.json({ post });
    } catch (err) { next(err); }
};

exports.deletePost = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        if (post.author.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Forbidden' });
        await post.deleteOne(); res.json({ message: 'Post deleted successfully' });
    } catch (err) { next(err); }
};

exports.likePost = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        // Prevent duplicate likes
        const existing = await Like.findOne({ post: post._id, user: req.user._id });
        if (!existing) {
            await Like.create({ post: post._id, user: req.user._id });
            post.likesCount += 1;
            await post.save();
        }
        res.json({ likesCount: post.likesCount });
    } catch (err) { next(err); }
};

exports.unlikePost = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        const like = await Like.findOneAndDelete({ post: post._id, user: req.user._id });
        if (like) {
            post.likesCount = Math.max(0, post.likesCount - 1);
            await post.save();
        }
        res.json({ likesCount: post.likesCount });
    } catch (err) { next(err); }
};
