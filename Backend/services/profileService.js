const { User, StartupDetails, InvestorDetails, Follow } = require('../models');

/**
 * Get user profile based on roles
 * @param {String} userId - User ID
 * @returns {Object} Profile data with user and role-specific details
 */
async function getProfile(userId) {
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) throw new Error('User not found');

    let roleDetails = null;
    const roles = Array.isArray(user.roles) ? user.roles : ['personal'];
    const isStartup = roles.includes('startup');
    const isInvestor = roles.includes('investor');

    if (isStartup) {
        roleDetails = await StartupDetails.findOne({ user: userId });
    } else if (isInvestor) {
        roleDetails = await InvestorDetails.findOne({ user: userId });
    }

    // compute follower/following totals
    let followersCount = 0;
    let followingCount = 0;
    try {
        // Primary attempt: count with ObjectId
        followersCount = await Follow.countDocuments({ following: user._id });
        followingCount = await Follow.countDocuments({ follower: user._id });
        // If counts are zero, some legacy records may store IDs as strings — retry with string form
        if ((followersCount === 0 || followersCount == null) || (followingCount === 0 || followingCount == null)) {
            const userIdStr = String(user._id);
            try {
                const fAlt = await Follow.countDocuments({ following: { $in: [user._id, userIdStr] } });
                const foAlt = await Follow.countDocuments({ follower: { $in: [user._id, userIdStr] } });
                // prefer non-zero alt counts
                if (fAlt && fAlt > followersCount) followersCount = fAlt;
                if (foAlt && foAlt > followingCount) followingCount = foAlt;
            } catch (e) {
                console.warn('profileService: fallback follow count failed', e && e.message);
            }
        }
    } catch (e) {
        console.warn('profileService: could not compute follow counts', e && e.message);
    }

    try {
        console.log(`profileService: user=${user._id} followersCount=${followersCount} followingCount=${followingCount}`);
    } catch (e) { /* ignore */ }

    // If the Follow collection shows zero followers but the role-specific details
    // contain a persisted followers count (e.g., StartupDetails.stats.followers),
    // prefer that value. This helps when counts are stored on StartupDetails
    // and the Follow collection may be out-of-sync or missing due to legacy writes.
    try {
        if ((followersCount === 0 || followersCount == null) && roleDetails && roleDetails.stats && typeof roleDetails.stats.followers === 'number') {
            followersCount = Number(roleDetails.stats.followers || 0);
            console.log(`profileService: using roleDetails.stats.followers fallback=${followersCount} for user=${user._id}`);
        }
    } catch (e) { /* ignore */ }

    const profileResponse = {
        user: {
            _id: user._id, // changed from id to _id for frontend compatibility
            email: user.email,
            username: user.username,
            fullName: user.fullName,
            displayName: user.displayName,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
            roles: user.roles,
            isKycVerified: user.isKycVerified,
            portfolioComplete: user.portfolioComplete,
            otpVerified: user.otpVerified,
            verified: user.verified,
            profileSetupComplete: user.profileSetupComplete,
            onboardingStep: user.onboardingStep,
            links: user.links,
            createdAt: user.createdAt,
            followersCount,
            followingCount,
        },
        details: roleDetails,
    };
    try { console.log('profileService: response body length for user=%s = %d', user._id, JSON.stringify(profileResponse).length); } catch (e) { }
    return profileResponse;
}

/**
 * Update user profile based on roles
 * @param {String} userId - User ID
 * @param {Object} data - Profile data to update
 * @returns {Object} Updated profile
 */
async function updateProfile(userId, data) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    console.log('updateProfile: user.roles =', user.roles);

    // Update user fields
    const { userData, detailsData } = data;
    console.log('profileService.updateProfile called for user', userId);
    if (detailsData) {
        try {
            console.log('Incoming detailsData:', JSON.stringify(detailsData));
        } catch (e) {
            console.log('Incoming detailsData (non-serializable)');
        }
    }

    if (userData) {
        const allowedUserFields = ['username', 'email', 'fullName', 'displayName', 'bio', 'avatarUrl', 'otpVerified', 'verified', 'profileSetupComplete', 'onboardingStep', 'links', 'isKycVerified', 'portfolioComplete'];
        allowedUserFields.forEach(field => {
            if (userData[field] !== undefined) {
                user[field] = userData[field];
            }
        });
        await user.save();
    }

    let roleDetails = null;
    const roles = Array.isArray(user.roles) ? user.roles : ['personal'];
    const isStartup = roles.includes('startup');
    const isInvestor = roles.includes('investor');
    if (detailsData) {
        if (isStartup) {
            try {
                roleDetails = await StartupDetails.findOneAndUpdate(
                    { user: userId },
                    { $set: detailsData, $setOnInsert: { user: userId } },
                    { new: true, upsert: true }
                );
                try { console.log('Updated StartupDetails doc:', JSON.stringify(roleDetails)); } catch { console.log('Updated StartupDetails doc (non-serializable)'); }
            } catch (dbErr) {
                console.error('Error updating StartupDetails', dbErr && dbErr.message);
                throw dbErr;
            }
        } else if (isInvestor) {
            try {
                roleDetails = await InvestorDetails.findOneAndUpdate(
                    { user: userId },
                    { $set: detailsData, $setOnInsert: { user: userId } },
                    { new: true, upsert: true }
                );
                try { console.log('Updated InvestorDetails doc:', JSON.stringify(roleDetails)); } catch { console.log('Updated InvestorDetails doc (non-serializable)'); }
            } catch (dbErr) {
                console.error('Error updating InvestorDetails', dbErr && dbErr.message);
                throw dbErr;
            }
        }
    }

    const profile = await getProfile(userId);
    try { console.log('getProfile result details:', JSON.stringify(profile.details)); } catch { console.log('getProfile result details (non-serializable)'); }
    return profile;
}

module.exports = {
    getProfile,
    updateProfile,
};
