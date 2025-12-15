const { Follow, User, Notification } = require('../models');

exports.followUser = async (req, res, next) => {
    try {
        // route sometimes uses :targetId (frontend) or :userId (other routes)
        const targetId = req.params.targetId || req.params.userId;
        if (!targetId) return res.status(400).json({ error: 'Missing target user id' });
        if (targetId === req.user._id.toString()) return res.status(400).json({ error: 'Cannot follow yourself' });

        const targetUser = await User.findById(targetId);
        if (!targetUser) return res.status(404).json({ error: 'User not found' });

        const existing = await Follow.findOne({ follower: req.user._id, following: targetId });
        if (existing) return res.status(409).json({ error: 'Already following this user' });

        const follow = new Follow({ follower: req.user._id, following: targetId });
        await follow.save();
        // Create notification for the followed user
        try {
            await Notification.create({
                user: targetId,
                actor: req.user._id,
                type: 'follow',
                payload: {}
            });
        } catch (notifErr) {
            console.warn('Failed to create follow notification:', notifErr.message);
        }
        // return updated followers count for the target user
        const followersCount = await Follow.countDocuments({ following: targetId });
        res.status(201).json({ message: 'Successfully followed user', follow, followersCount });
    } catch (err) {
        next(err);
    }
};

exports.unfollowUser = async (req, res, next) => {
    try {
        const targetId = req.params.targetId || req.params.userId;
        if (!targetId) return res.status(400).json({ error: 'Missing target user id' });
        const follow = await Follow.findOneAndDelete({ follower: req.user._id, following: targetId });
        if (!follow) return res.status(404).json({ error: 'Not following this user' });
        // return updated followers count for the target user
        const followersCount = await Follow.countDocuments({ following: targetId });
        res.json({ message: 'Successfully unfollowed user', followersCount });
    } catch (err) {
        next(err);
    }
};

exports.getFollowers = async (req, res, next) => {
    try {
        const userId = req.params.userId || req.params.targetId;
        const { limit = 20, skip = 0 } = req.query;
        const follows = await Follow.find({ following: userId }).populate('follower', 'username displayName avatarUrl verified').sort({ createdAt: -1 }).limit(parseInt(limit)).skip(parseInt(skip));
        const followers = follows.map(f => f.follower);
        // compute total count separately (not just page length)
        const total = await Follow.countDocuments({ following: userId });
        console.debug('[followService] getFollowers', { userId, returned: followers.length, total });
        res.json({ followers, count: total });
    } catch (err) {
        next(err);
    }
};

exports.getFollowing = async (req, res, next) => {
    try {
        const userId = req.params.userId || req.params.targetId;
        const { limit = 20, skip = 0 } = req.query;
        const follows = await Follow.find({ follower: userId }).populate('following', 'username displayName avatarUrl verified').sort({ createdAt: -1 }).limit(parseInt(limit)).skip(parseInt(skip));
        const following = follows.map(f => f.following);
        const total = await Follow.countDocuments({ follower: userId });
        console.debug('[followService] getFollowing', { userId, returned: following.length, total });
        res.json({ following, count: total });
    } catch (err) {
        next(err);
    }
};

exports.checkFollowing = async (req, res, next) => {
    try {
        const targetId = req.params.targetId || req.params.userId;
        if (!targetId) return res.json({ isFollowing: false });
        const follow = await Follow.findOne({ follower: req.user._id, following: targetId });
        res.json({ isFollowing: !!follow });
    } catch (err) {
        next(err);
    }
};
