const { User, Post, Company } = require('../models');

exports.searchAll = async (req, res, next) => {
    try {
        const { q, type = 'all', limit = 10, skip = 0 } = req.query;
        if (!q || q.trim() === '') return res.status(400).json({ error: 'Search query is required' });

        const searchQuery = q.trim();
        const searchRegex = { $regex: searchQuery, $options: 'i' };
        const results = {};

        if (type === 'all' || type === 'accounts') {
            const users = await User.find({ $or: [{ username: searchRegex }, { displayName: searchRegex }, { bio: searchRegex }] })
                .select('username displayName avatarUrl bio verified roles')
                .limit(parseInt(limit))
                .skip(parseInt(skip));
            results.accounts = users;
        }

        if (type === 'all' || type === 'posts') {
            const posts = await Post.find({ $or: [{ content: searchRegex }, { tags: searchRegex }], visibility: 'public' })
                .populate('author', 'username displayName avatarUrl verified')
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .skip(parseInt(skip));
            results.posts = posts;
        }

        if (type === 'all' || type === 'companies') {
            const companies = await Company.find({ $or: [{ name: searchRegex }, { description: searchRegex }, { tags: searchRegex }] })
                .populate('employees', 'username displayName avatarUrl verified')
                .limit(parseInt(limit))
                .skip(parseInt(skip));
            results.companies = companies;
        }

        res.json({ query: searchQuery, results });
    } catch (err) {
        next(err);
    }
};

exports.searchUsers = async (req, res, next) => {
    try {
        const { q, role, verified, limit = 20, skip = 0 } = req.query;
        const filter = {};
        if (q && q.trim() !== '') {
            const searchRegex = { $regex: q.trim(), $options: 'i' };
            filter.$or = [{ username: searchRegex }, { displayName: searchRegex }, { bio: searchRegex }];
        }
        // roles is an array, so use $in operator to check if the role exists in the array
        if (role) filter.roles = { $in: [role] };
        if (verified !== undefined) filter.verified = verified === 'true';

        const users = await User.find(filter).select('username displayName avatarUrl bio verified roles').sort({ verified: -1, createdAt: -1 }).limit(parseInt(limit)).skip(parseInt(skip));
        const total = await User.countDocuments(filter);
        res.json({ users, count: users.length, total });
    } catch (err) {
        next(err);
    }
};

exports.getTrending = async (req, res, next) => {
    try {
        const { limit = 10 } = req.query;
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const trendingPosts = await Post.find({ createdAt: { $gte: weekAgo }, visibility: 'public' })
            .populate('author', 'username displayName avatarUrl verified')
            .sort({ likesCount: -1, commentsCount: -1 })
            .limit(parseInt(limit));

        const tagAggregation = await Post.aggregate([
            { $match: { createdAt: { $gte: weekAgo }, visibility: 'public' } },
            { $unwind: '$tags' },
            { $group: { _id: '$tags', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: parseInt(limit) },
        ]);

        const trendingTags = tagAggregation.map(t => ({ tag: t._id, count: t.count }));
        res.json({ posts: trendingPosts, tags: trendingTags });
    } catch (err) {
        next(err);
    }
};

exports.getSuggestions = async (req, res, next) => {
    try {
        const { q, limit = 5 } = req.query;
        if (!q || q.trim() === '') return res.json({ suggestions: [] });

        const searchRegex = { $regex: `^${q.trim()}`, $options: 'i' };
        const userSuggestions = await User.find({ $or: [{ username: searchRegex }, { displayName: searchRegex }] }).select('username displayName avatarUrl verified').limit(parseInt(limit));
        const companySuggestions = await Company.find({ name: searchRegex }).select('name slug logoUrl').limit(parseInt(limit));

        const suggestions = [
            ...userSuggestions.map(u => ({ type: 'user', id: u._id, text: u.displayName || u.username, username: u.username, avatar: u.avatarUrl, verified: u.verified })),
            ...companySuggestions.map(c => ({ type: 'company', id: c._id, text: c.name, slug: c.slug, avatar: c.logoUrl })),
        ];

        res.json({ suggestions: suggestions.slice(0, parseInt(limit)) });
    } catch (err) {
        next(err);
    }
};
