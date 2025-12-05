const { User, StartupDetails, InvestorDetails } = require('../models');

/**
 * Get user profile based on accountType
 * @param {String} userId - User ID
 * @returns {Object} Profile data with user and role-specific details
 */
async function getProfile(userId) {
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) throw new Error('User not found');

    let roleDetails = null;

    if (user.accountType === 'startup') {
        roleDetails = await StartupDetails.findOne({ user: userId });
    } else if (user.accountType === 'investor') {
        roleDetails = await InvestorDetails.findOne({ user: userId });
    }

    return {
        user: {
            id: user._id,
            email: user.email,
            username: user.username,
            fullName: user.fullName,
            displayName: user.displayName,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
            accountType: user.accountType,
            otpVerified: user.otpVerified,
            verified: user.verified,
            profileSetupComplete: user.profileSetupComplete,
            onboardingStep: user.onboardingStep,
            links: user.links,
            createdAt: user.createdAt,
        },
        details: roleDetails,
    };
}

/**
 * Update user profile based on accountType
 * @param {String} userId - User ID
 * @param {Object} data - Profile data to update
 * @returns {Object} Updated profile
 */
async function updateProfile(userId, data) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Update user fields
    const { userData, detailsData } = data;

    if (userData) {
        const allowedUserFields = ['fullName', 'displayName', 'bio', 'avatarUrl', 'otpVerified', 'profileSetupComplete', 'onboardingStep', 'links'];
        allowedUserFields.forEach(field => {
            if (userData[field] !== undefined) {
                user[field] = userData[field];
            }
        });
        await user.save();
    }

    // Update role-specific details
    let roleDetails = null;
    if (detailsData) {
        if (user.accountType === 'startup') {
            roleDetails = await StartupDetails.findOneAndUpdate(
                { user: userId },
                detailsData,
                { new: true, upsert: true }
            );
        } else if (user.accountType === 'investor') {
            roleDetails = await InvestorDetails.findOneAndUpdate(
                { user: userId },
                detailsData,
                { new: true, upsert: true }
            );
        }
    }

    return getProfile(userId);
}

module.exports = {
    getProfile,
    updateProfile,
};
