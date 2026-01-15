const ProfileVisit = require('../models/ProfileVisit');
const Follow = require('../models/Follow');
const Unfollow = require('../models/Unfollow');
const StartupView = require('../models/StartupView');

/**
 * Get analytics insights for a user
 */
async function getInsights(userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Count profile visits in the period
    const profileVisits = await ProfileVisit.countDocuments({
        profile: userId,
        createdAt: { $gte: startDate }
    });

    // Count startup views (when someone views your startup detail page)
    // Find startup by user first, then count views
    const StartupDetails = require('../models/StartupDetails');
    let views = 0;
    try {
        const startup = await StartupDetails.findOne({ user: userId }).select('_id').lean();
        if (startup) {
            views = await StartupView.countDocuments({
                startup: startup._id,
                createdAt: { $gte: startDate }
            });
        }
    } catch (err) {
        console.warn('Error counting startup views:', err.message);
    }

    return {
        views,
        profileVisits
    };
}

/**
 * Get follower growth analytics
 */
async function getFollowerGrowth(userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);

    // Current period follows
    const currentFollows = await Follow.countDocuments({
        following: userId,
        createdAt: { $gte: startDate }
    });

    // Previous period follows (for comparison)
    const previousFollows = await Follow.countDocuments({
        following: userId,
        createdAt: { $gte: previousStartDate, $lt: startDate }
    });

    // Total current followers
    const totalFollowers = await Follow.countDocuments({ following: userId });

    // Real unfollows from Unfollow model (people who unfollowed this user in the period)
    const unfollows = await Unfollow.countDocuments({
        unfollowed: userId,
        createdAt: { $gte: startDate }
    });

    // Overall net change
    const overall = currentFollows - unfollows;

    // Calculate percentage change
    let percentChange = 0;
    if (previousFollows > 0) {
        percentChange = ((currentFollows - previousFollows) / previousFollows) * 100;
    }

    return {
        totalFollowers,
        percentChange: Math.round(percentChange * 10) / 10,
        comparisonDate: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        growth: {
            overall,
            follows: currentFollows,
            unfollows
        }
    };
}

/**
 * Record a profile visit
 */
async function recordProfileVisit(profileId, visitorId = null) {
    try {
        await ProfileVisit.create({
            profile: profileId,
            visitor: visitorId
        });
    } catch (err) {
        console.warn('Failed to record profile visit:', err.message);
    }
}

/**
 * Record a startup view (when someone opens startup detail page)
 */
async function recordStartupView(startupId, viewerId = null) {
    try {
        await StartupView.create({
            startup: startupId,
            viewer: viewerId
        });
    } catch (err) {
        console.warn('Failed to record startup view:', err.message);
    }
}

module.exports = {
    getInsights,
    getFollowerGrowth,
    recordProfileVisit,
    recordStartupView
};
