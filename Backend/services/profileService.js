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
    const isStartup = user.accountType === 'startup' || (Array.isArray(user.roles) && user.roles.includes('startup'));
    const isInvestor = user.accountType === 'investor' || (Array.isArray(user.roles) && user.roles.includes('investor'));

    if (isStartup) {
        roleDetails = await StartupDetails.findOne({ user: userId });
    } else if (isInvestor) {
        roleDetails = await InvestorDetails.findOne({ user: userId });
    }

    return {
        user: {
            _id: user._id, // changed from id to _id for frontend compatibility
            email: user.email,
            username: user.username,
            fullName: user.fullName,
            displayName: user.displayName,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
            accountType: user.accountType,
            roles: user.roles,
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
    console.log('updateProfile: user.accountType =', user.accountType);

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
        const allowedUserFields = ['username', 'email', 'fullName', 'displayName', 'bio', 'avatarUrl', 'otpVerified', 'profileSetupComplete', 'onboardingStep', 'links'];
        allowedUserFields.forEach(field => {
            if (userData[field] !== undefined) {
                user[field] = userData[field];
            }
        });
        await user.save();
    }

    // Update role-specific details
    let roleDetails = null;
    const isStartup = user.accountType === 'startup' || (Array.isArray(user.roles) && user.roles.includes('startup'));
    const isInvestor = user.accountType === 'investor' || (Array.isArray(user.roles) && user.roles.includes('investor'));
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
