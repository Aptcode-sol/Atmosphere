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
const { refreshSignedUrl } = require('./s3Service');

// Helper to refresh URLs
const refreshPostUrls = async (post) => {
    const p = post.toObject ? post.toObject() : post;
    if (p.media && p.media.length > 0) {
        p.media = await Promise.all(p.media.map(async (m) => {
            if (m.url) m.url = await refreshSignedUrl(m.url);
            if (m.thumbUrl) m.thumbUrl = await refreshSignedUrl(m.thumbUrl);
            return m;
        }));
    }
    if (p.author && p.author.avatarUrl) {
        p.author.avatarUrl = await refreshSignedUrl(p.author.avatarUrl);
    }
    return p;
};

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
        const Reel = require('../models/Reel');
        const { refreshSignedUrl } = require('./s3Service');

        // Get blocked user IDs
        const blockedUsers = await User.find({ blocked: true }).select('_id').lean();
        const blockedIds = blockedUsers.map(u => u._id);

        const filter = { visibility: 'public' };
        if (userId) filter.author = userId;
        if (tag) filter.tags = tag;
        if (blockedIds.length > 0) filter.author = { ...filter.author, $nin: blockedIds };

        // Fetch posts and reels without pagination first
        const [posts, reels] = await Promise.all([
            Post.find(filter).populate('author', 'username displayName avatarUrl verified').lean(),
            Reel.find(filter).populate('author', 'username displayName avatarUrl verified').lean()
        ]);

        // Refresh URLs and add type field
        const refreshedPosts = await Promise.all(posts.map(async (post) => {
            const refreshed = await refreshPostUrls(post);
            return { ...refreshed, type: 'post' };
        }));

        const refreshedReels = await Promise.all(reels.map(async (reel) => {
            const r = reel;
            if (r.videoUrl) r.videoUrl = await refreshSignedUrl(r.videoUrl);
            if (r.thumbnailUrl) r.thumbnailUrl = await refreshSignedUrl(r.thumbnailUrl);
            if (r.author && r.author.avatarUrl) r.author.avatarUrl = await refreshSignedUrl(r.author.avatarUrl);
            return { ...r, type: 'reel' };
        }));

        // Combine and sort by createdAt
        const combined = [...refreshedPosts, ...refreshedReels].sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        // Apply pagination on combined result
        const paginatedItems = combined.slice(parseInt(skip), parseInt(skip) + parseInt(limit));

        // Enrich with save status and interaction status for current user
        let enrichedItems = paginatedItems;
        if (req.user) {
            const Saved = require('../models/Saved');
            const ReelLike = require('../models/ReelLike');
            const Like = require('../models/Like');

            const postIds = paginatedItems.filter(item => item.type === 'post').map(p => p._id);
            const reelIds = paginatedItems.filter(item => item.type === 'reel').map(r => r._id);

            const [savedDocs, postLikes, reelLikes] = await Promise.all([
                Saved.find({
                    user: req.user._id,
                    $or: [{ post: { $in: postIds } }, { contentId: { $in: reelIds } }]
                }).lean(),
                Like.find({ post: { $in: postIds }, user: req.user._id }).lean(),
                ReelLike.find({ reel: { $in: reelIds }, user: req.user._id }).lean()
            ]);

            const savedMap = {};
            savedDocs.forEach(s => {
                const key = String(s.post || s.contentId);
                savedMap[key] = s._id.toString();
            });

            const postLikeMap = new Set(postLikes.map(l => l.post.toString()));
            const reelLikeMap = new Set(reelLikes.map(l => l.reel.toString()));

            enrichedItems = paginatedItems.map(item => {
                if (item.type === 'post') {
                    return {
                        ...item,
                        isSaved: !!savedMap[item._id.toString()],
                        savedId: savedMap[item._id.toString()] || null,
                        likedByUser: postLikeMap.has(item._id.toString())
                    };
                } else {
                    return {
                        ...item,
                        isSaved: !!savedMap[item._id.toString()],
                        savedId: savedMap[item._id.toString()] || null,
                        isLiked: reelLikeMap.has(item._id.toString())
                    };
                }
            });
        }

        res.json({ posts: enrichedItems, count: enrichedItems.length });
    } catch (err) { next(err); }
};

exports.listMyPosts = async (req, res, next) => {
    try {
        const { limit = 50, skip = 0 } = req.query;
        const posts = await Post.find({ author: req.user._id }).populate('author', 'username displayName avatarUrl verified').sort({ createdAt: -1 }).limit(parseInt(limit)).skip(parseInt(skip));
        const refreshedPosts = await Promise.all(posts.map(post => refreshPostUrls(post)));
        res.json({ posts: refreshedPosts, count: refreshedPosts.length });
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

        const refreshedPost = await refreshPostUrls(post);
        res.json({ post: { ...refreshedPost, likedByUser } });
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
