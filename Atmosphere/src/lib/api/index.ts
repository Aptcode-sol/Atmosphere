/**
 * API Module - Barrel Export
 * All API functions are re-exported from domain-specific modules
 */

// Core
export { request } from './core';
export * from './endpoints';


// Auth
export {
    login, register, forgotPassword, verifyOtpCheck, resetPassword,
    verifyEmail, resendOtp, fetchAndStoreUserRole
} from './auth';

// Users & Profiles
export {
    getProfile, updateProfile, checkUsernameAvailability, getUserByIdentifier,
    getAnyUserProfile, getStartupProfile, uploadProfilePicture,
    followUser, unfollowUser, checkFollowing, getFollowStatus,
    getFollowersList, getFollowingList, getFollowersCount, getFollowingCount, searchUsers
} from './users';

// Posts
export {
    fetchMyPosts, createPost, getPostById, getPostsByUser, fetchExplorePosts,
    likePost, unlikePost, getPostLikes,
    addComment, getComments, deleteComment, getCommentReplies,
    crownPost, uncrownPost, getPostCrowns,
    sharePost, checkPostShared,
    savePost, fetchSavedPosts, unsavePost, getSavedPosts
} from './posts';

// Reels
export {
    fetchReels, createReel, getReel, getUserReels, deleteReel,
    likeReel, unlikeReel,
    getReelComments, addReelComment, deleteReelComment, getReelCommentReplies,
    shareReel, updateReelShare, checkReelShared,
    saveReel, unsaveReel, checkReelSaved,
    uploadVideo
} from './reels';

// Startups
export {
    fetchStartupPosts, fetchHottestStartups, saveStartupProfile,
    likeStartup, unlikeStartup, getStartupLikes, isStartupLiked,
    crownStartup, uncrownStartup, getStartupCrowns,
    addStartupComment, getStartupComments, getStartupCommentReplies, deleteStartupComment
} from './startups';

// Trades
export {
    fetchMarkets, fetchMyPortfolio, placeOrder,
    createTrade, getMyTrades, getTradesByUserId, getAllTrades, getTrade, updateTrade, deleteTrade,
    incrementTradeViews, toggleTradeSave, getSavedTrades,
    fetchInvestors, getInvestorDetails
} from './trades';

// Chats
export {
    fetchChats, createGroup, getChatDetails, createOrFindChat, sendMessage
} from './chats';

// Misc
export {
    fetchNotifications, markNotificationRead, markAllNotificationsRead,
    getSettings, updateSettings, changePassword,
    getKycStatus, markKycComplete,
    fetchJobs, getJob, createJob, updateJob, deleteJob, applyToJob,
    getMyAppliedJobs, getMyPostedJobs, getJobApplicants, exportJobApplicants,
    fetchGrants, fetchEvents,
    searchEntities,
    fetchMyTeam, addToMyTeam, removeFromMyTeam,
    uploadImage, uploadDocument, uploadVideoFile,
    shareContent
} from './misc';
