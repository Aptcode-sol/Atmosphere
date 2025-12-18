const { StartupDetails, User } = require('../models');

exports.createStartup = async (req, res, next) => {
    try {
        const { companyName, about, location, companyType, establishedOn, address, teamMembers, financialProfile, previousInvestments } = req.body;
        const existing = await StartupDetails.findOne({ user: req.user._id });
        if (existing) return res.status(409).json({ error: 'Startup details already exist for this user' });

        const startupDetails = new StartupDetails({ user: req.user._id, companyName, about, location, companyType, establishedOn, address, teamMembers: teamMembers || [], financialProfile, previousInvestments: previousInvestments || [] });
        await startupDetails.save();
        res.status(201).json({ startupDetails });
    } catch (err) {
        console.log('Error in createStartup:', err);
        next(err);
    }
};

exports.getStartupByUser = async (req, res, next) => {
    try {
        const mongoose = require('mongoose');
        const userId = req.params.userId;
        const query = mongoose.Types.ObjectId.isValid(userId)
            ? { $or: [{ user: userId }, { user: new mongoose.Types.ObjectId(userId) }] }
            : { user: userId };
        const startupDetails = await StartupDetails.findOne(query).populate('user', 'username displayName avatarUrl');
        if (!startupDetails) return res.status(404).json({ error: 'Startup details not found' });
        // Populate user fields if not already populated
        try { await startupDetails.populate('user', 'username displayName avatarUrl'); } catch (e) { /* ignore */ }
        // Return both shapes for backward compatibility
        return res.json({ startupDetails, user: startupDetails.user, details: startupDetails });
    } catch (err) {
        console.log('Error in getStartupByUser:', err);
        next(err);
    }
};

exports.getStartupById = async (req, res, next) => {
    try {
        const startupId = req.params.startupId;
        const startupDetails = await StartupDetails.findById(startupId).populate('user', 'username displayName avatarUrl');
        if (!startupDetails) return res.status(404).json({ error: 'Startup details not found' });
        return res.json({ startupDetails, user: startupDetails.user, details: startupDetails });
    } catch (err) {
        console.log('Error in getStartupById:', err);
        next(err);
    }
};

exports.updateStartup = async (req, res, next) => {
    try {
        const startupDetails = await StartupDetails.findById(req.params.id);
        if (!startupDetails) return res.status(404).json({ error: 'Startup details not found' });
        if (startupDetails.user.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Forbidden' });

        const allowedFields = ['companyName', 'about', 'location', 'companyType', 'establishedOn', 'address', 'teamMembers', 'financialProfile', 'previousInvestments', 'verified', 'profileImage', 'stage', 'rounds', 'age', 'fundingRaised', 'fundingNeeded'];
        allowedFields.forEach(field => { if (req.body[field] !== undefined) startupDetails[field] = req.body[field]; });
        await startupDetails.save();
        res.json({ startupDetails });
    } catch (err) {
        console.log('Error in updateStartup:', err);
        next(err);
    }
};

exports.listStartupCards = async (req, res, next) => {
    try {
        const { limit = 20, skip = 0 } = req.query;

        // Get blocked user IDs
        const blockedUsers = await User.find({ blocked: true }).select('_id').lean();
        const blockedIds = blockedUsers.map(u => u._id);

        // Build filter to exclude blocked users
        const filter = blockedIds.length > 0 ? { user: { $nin: blockedIds } } : {};

        const startups = await StartupDetails.find(filter)
            .populate('user', 'username displayName avatarUrl email verified')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));
        // Prepare base card objects
        const startupCardsBase = startups.map(startup => ({
            id: startup._id,
            userId: startup.user ? startup.user._id : null,
            name: startup.companyName,
            displayName: startup.user ? startup.user.displayName : '',
            verified: startup.verified,
            profileImage: startup.profileImage,
            description: startup.about,
            stage: startup.stage,
            rounds: startup.rounds,
            age: startup.age,
            fundingRaised: startup.fundingRaised,
            fundingNeeded: startup.fundingNeeded,
            stats: {
                likes: Number((startup.meta && typeof startup.meta.likes === 'number') ? startup.meta.likes : (startup.likesCount || 0)),
                comments: Number((startup.meta && startup.meta.commentsCount) || 0),
                crowns: Number((startup.meta && startup.meta.crowns) || 0),
                shares: Number(startup.sharesCount || 0),
            },
            // defaults for user-specific flags
            likedByCurrentUser: false,
            crownedByCurrentUser: false,
            isFollowing: false,
        }));

        // If there's an authenticated user, fetch batch flags in one go
        if (req.user) {
            const userId = req.user._id;
            const startupIds = startups.map(s => s._id);
            const StartupLike = require('../models/StartupLike');
            const StartupCrown = require('../models/StartupCrown');
            const Follow = require('../models/Follow');

            // Build list of userIds for the startups (the 'following' targets)
            const userIds = startups.map(s => (s.user ? s.user._id : null)).filter(Boolean);
            const [likes, crowns, follows] = await Promise.all([
                StartupLike.find({ startup: { $in: startupIds }, user: userId }).select('startup').lean(),
                StartupCrown.find({ startup: { $in: startupIds }, user: userId }).select('startup').lean(),
                // Follow documents have shape { follower, following }
                Follow.find({ follower: userId, following: { $in: userIds } }).select('following').lean(),
            ]);

            const likedSet = new Set(likes.map(l => String(l.startup)));
            const crownSet = new Set(crowns.map(c => String(c.startup)));
            const followSet = new Set(follows.map(f => String(f.following)));

            const enriched = startupCardsBase.map(card => ({
                ...card,
                likedByCurrentUser: likedSet.has(String(card.id)),
                crownedByCurrentUser: crownSet.has(String(card.id)),
                isFollowing: followSet.has(String(card.userId)),
            }));

            return res.json({ startups: enriched, count: enriched.length });
        }

        res.json({ startups: startupCardsBase, count: startupCardsBase.length });
    } catch (err) {
        console.log('Error in listStartupCards:', err);
        next(err);
    }
};

exports.hottestStartups = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit || '10', 10) || 10;
        // fetch a reasonable batch to consider (avoid scanning entire collection)
        const maxFetch = Math.max(limit, 200);
        const startups = await StartupDetails.find()
            .populate('user', 'username displayName avatarUrl email')
            .sort({ createdAt: -1 })
            .limit(maxFetch)
            .lean();

        const startupIds = startups.map(s => s._id);

        // compute time window (last 7 days)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // Aggregate counts in parallel for crowns, likes, comments (by startup) within last 7 days
        const StartupCrown = require('../models/StartupCrown');
        const StartupLike = require('../models/StartupLike');
        const StartupComment = require('../models/StartupComment');

        const crownsAggP = StartupCrown.aggregate([
            { $match: { startup: { $in: startupIds }, createdAt: { $gte: weekAgo } } },
            { $group: { _id: '$startup', count: { $sum: 1 } } }
        ]).allowDiskUse(true).exec();

        const likesAggP = StartupLike.aggregate([
            { $match: { startup: { $in: startupIds }, createdAt: { $gte: weekAgo } } },
            { $group: { _id: '$startup', count: { $sum: 1 } } }
        ]).allowDiskUse(true).exec();

        const commentsAggP = StartupComment.aggregate([
            { $match: { startup: { $in: startupIds }, createdAt: { $gte: weekAgo } } },
            { $group: { _id: '$startup', count: { $sum: 1 } } }
        ]).allowDiskUse(true).exec();

        // shares: there isn't a standard StartupShare model in the repo; try to require it, fallback to zero counts
        let sharesAggP = Promise.resolve([]);
        try {
            const StartupShare = require('../models/StartupShare');
            sharesAggP = StartupShare.aggregate([
                { $match: { startup: { $in: startupIds }, createdAt: { $gte: weekAgo } } },
                { $group: { _id: '$startup', count: { $sum: 1 } } }
            ]).allowDiskUse(true).exec();
        } catch (e) {
            // no StartupShare model — leave shares counts empty
        }

        const [crownsAgg, likesAgg, commentsAgg, sharesAgg] = await Promise.all([crownsAggP, likesAggP, commentsAggP, sharesAggP]);

        const crownsMap = new Map(crownsAgg.map(r => [String(r._id), r.count]));
        const likesMap = new Map(likesAgg.map(r => [String(r._id), r.count]));
        const commentsMap = new Map(commentsAgg.map(r => [String(r._id), r.count]));
        const sharesMap = new Map((sharesAgg || []).map(r => [String(r._id), r.count]));

        // Points weights
        const WEIGHTS = { crowns: 10, likes: 8, comments: 6, shares: 4 };

        const scored = startups.map(s => {
            const id = String(s._id);
            const crowns = crownsMap.get(id) || 0;
            const likes = likesMap.get(id) || 0;
            const comments = commentsMap.get(id) || 0;
            const shares = sharesMap.get(id) || 0;
            const score = (crowns * WEIGHTS.crowns) + (likes * WEIGHTS.likes) + (comments * WEIGHTS.comments) + (shares * WEIGHTS.shares);
            // Prefer establishedOn as the canonical created/launch date, fall back to launchDate or createdAt
            const launchDateRaw = s.establishedOn || s.launchDate || s.createdAt || s._createdAt || null;
            const launchDateTs = launchDateRaw ? new Date(launchDateRaw).getTime() : 0;
            const launchDate = launchDateRaw;
            return { ...(s || {}), weekCounts: { crowns, likes, comments, shares }, score, launchDate, launchDateTs };
        });

        // Sort by score desc, then launchDateTs (newer first)
        scored.sort((a, b) => {
            if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
            return (b.launchDateTs || 0) - (a.launchDateTs || 0);
        });

        const top = scored.slice(0, limit);

        // enrich with user-specific flags in batch if authenticated (non-week flags)
        if (req.user) {
            const userId = req.user._id;
            const topIds = top.map(s => s._id);
            const userIds = top.map(s => (s.user ? s.user._id : null)).filter(Boolean);
            const Follow = require('../models/Follow');

            const [likesDocs, crownsDocs, follows] = await Promise.all([
                StartupLike.find({ startup: { $in: topIds }, user: userId }).select('startup').lean(),
                StartupCrown.find({ startup: { $in: topIds }, user: userId }).select('startup').lean(),
                Follow.find({ follower: userId, following: { $in: userIds } }).select('following').lean(),
            ]);

            const likedSet = new Set(likesDocs.map(l => String(l.startup)));
            const crownSet = new Set(crownsDocs.map(c => String(c.startup)));
            const followSet = new Set(follows.map(f => String(f.following)));

            const enriched = top.map(card => ({
                ...card,
                likedByCurrentUser: likedSet.has(String(card._id)),
                crownedByCurrentUser: crownSet.has(String(card._id)),
                isFollowing: followSet.has(String(card.user?._id || card.user)),
            }));

            return res.json({ startups: enriched, count: enriched.length });
        }

        return res.json({ startups: top, count: top.length });
    } catch (err) {
        console.log('Error in hottestStartups:', err);
        next(err);
    }
};

exports.createOrUpdateStartup = async (req, res, next) => {
    try {
        console.log('createOrUpdateStartup called with req.user._id:', req.user && req.user._id, 'req.body:', req.body);
        const data = req.body;
        // Map frontend field names to backend schema fields
        if (data.roundType) data.stage = data.roundType;
        if (data.requiredCapital) data.fundingNeeded = Number(data.requiredCapital) || 0;
        if (data.financialProfile) {
            if (data.financialProfile.fundingAmount) data.fundingRaised = Number(data.financialProfile.fundingAmount) || 0;
        }
        let startupDetails = await StartupDetails.findOne({ user: req.user._id });
        if (startupDetails) {
            Object.assign(startupDetails, data);
            await startupDetails.save();
        } else {
            startupDetails = new StartupDetails({ ...data, user: req.user._id });
            await startupDetails.save();
        }
        res.status(200).json({ startupDetails });
    } catch (err) {
        console.log('Error in createOrUpdateStartup:', err);
        next(err);
    }
};
