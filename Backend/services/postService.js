const { Post } = require('../models');

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
        const filter = { visibility: 'public' };
        if (userId) filter.author = userId;
        if (tag) filter.tags = tag;
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
        res.json({ post });
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
        post.likesCount += 1; await post.save(); res.json({ likesCount: post.likesCount });
    } catch (err) { next(err); }
};

exports.unlikePost = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        post.likesCount = Math.max(0, post.likesCount - 1); await post.save(); res.json({ likesCount: post.likesCount });
    } catch (err) { next(err); }
};
