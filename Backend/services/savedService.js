const Saved = require('../models/Saved');
const Post = require('../models/Post');
const StartupDetails = require('../models/StartupDetails');
const Reel = require('../models/Reel');
const { refreshSignedUrl } = require('./s3Service');

async function savePost(userId, postId) {
  // Determine if this is a Post, StartupDetails, or Reel
  let contentType = 'Post';
  const postExists = await Post.exists({ _id: postId });
  if (!postExists) {
    const startupExists = await StartupDetails.exists({ _id: postId });
    if (startupExists) {
      contentType = 'StartupDetails';
    } else {
      const reelExists = await Reel.exists({ _id: postId });
      if (reelExists) {
        contentType = 'Reel';
      }
    }
  }

  // Check if already saved (check both new contentId and legacy post field)
  const existing = await Saved.findOne({
    user: userId,
    $or: [{ contentId: postId }, { post: postId }]
  });
  if (existing) return existing;

  const saved = new Saved({
    user: userId,
    contentId: postId,
    contentType: contentType,
    post: contentType === 'Post' ? postId : undefined
  });
  return await saved.save();
}

async function getSavedPostsByUser(userId) {
  const saved = await Saved.find({ user: userId }).sort({ createdAt: -1 }).lean();

  // Populate each item based on its contentType
  const enriched = await Promise.all(saved.map(async (s) => {
    let postData = null;
    const id = s.contentId || s.post;

    // Handle Reel
    if (s.contentType === 'Reel') {
      postData = await Reel.findById(id)
        .populate('author', 'username displayName avatarUrl')
        .lean();

      if (postData) {
        // Refresh S3 signed URLs for reel
        const thumbnailUrl = postData.thumbnailUrl ? await refreshSignedUrl(postData.thumbnailUrl) : null;
        const videoUrl = postData.videoUrl ? await refreshSignedUrl(postData.videoUrl) : null;

        return {
          _id: s._id,
          contentType: 'Reel',
          postId: {
            _id: postData._id,
            content: postData.caption || 'Reel',
            media: thumbnailUrl ? [{ url: thumbnailUrl, type: 'image' }] :
              videoUrl ? [{ url: videoUrl, type: 'video' }] : [],
            author: postData.author || { username: 'User' }
          },
          createdAt: s.createdAt
        };
      }
    }

    // Handle StartupDetails
    if (s.contentType === 'StartupDetails' || (!s.contentType && !postData)) {
      postData = await StartupDetails.findById(id)
        .populate('user', 'username displayName avatarUrl verified')
        .lean();

      if (postData) {
        // Normalize using shared refreshStartupData helper to ensure consistent fields and signed URLs
        try {
          const { refreshStartupData } = require('./startupService');
          postData = await refreshStartupData(postData);
        } catch (e) {
          // fallback: refresh profileImage only
          postData.profileImage = postData.profileImage ? await refreshSignedUrl(postData.profileImage) : null;
        }

        // Ensure funding values are numbers
        const fundingRaised = Number(postData.fundingRaised || 0);
        const fundingNeeded = Number(postData.fundingNeeded || 0);

        // Fetch user-specific flags (liked, crowned, following)
        const StartupLike = require('../models/StartupLike');
        const StartupCrown = require('../models/StartupCrown');
        const Follow = require('../models/Follow');

        const [liked, crowned, following] = await Promise.all([
          StartupLike.exists({ startup: postData._id, user: userId }),
          StartupCrown.exists({ startup: postData._id, user: userId }),
          Follow.exists({ follower: userId, following: postData.user?._id }),
        ]);

        // Return full startup card data matching listStartupCards structure exactly
        // Calculate funding metrics same way as home page
        const fundingRounds = postData.fundingRounds || [];
        const currentRound = postData.stage || postData.roundType || 'Seed';

        // console.log('[savedService] Startup:', postData.companyName, {
        //   fundingRoundsLength: fundingRounds.length,
        //   currentRound,
        //   storedFundingRaised: postData.fundingRaised,
        //   storedRounds: postData.rounds,
        //   financialProfileAmount: postData.financialProfile?.fundingAmount
        // });

        // Calculate rounds count from unique round values
        const uniqueRounds = Array.isArray(fundingRounds)
          ? [...new Set(fundingRounds.map((inv) => inv.round).filter(Boolean))]
          : [];
        const calculatedRounds = uniqueRounds.length || Number(postData.rounds || 0);

        // Calculate total raised across ALL investments
        const totalRaisedAll = Array.isArray(fundingRounds)
          ? fundingRounds.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0)
          : fundingRaised;

        // Calculate funding raised from investments matching current round
        const matchingInvestments = Array.isArray(fundingRounds)
          ? fundingRounds.filter((inv) => inv.round === currentRound)
          : [];
        const fundingRaisedFromRound = matchingInvestments.reduce((sum, inv) => {
          return sum + (Number(inv.amount) || 0);
        }, 0);

        // Use calculated value or fallback to stored values
        const finalFundingRaised = fundingRaisedFromRound > 0
          ? fundingRaisedFromRound
          : fundingRaised;

        return {
          _id: s._id,
          contentType: 'StartupDetails',
          id: String(postData._id),
          originalId: String(postData._id),
          startupDetailsId: String(postData._id),
          name: postData.companyName || 'Unknown',
          displayName: postData.user?.displayName || '',
          verified: postData.verified || postData.user?.verified || false,
          profileImage: postData.profileImage || 'https://via.placeholder.com/400x240.png?text=Startup',
          description: postData.about || '',
          stage: postData.stage || 'unknown',
          rounds: calculatedRounds,
          age: postData.age || 0,
          fundingRaised: finalFundingRaised,
          fundingNeeded: fundingNeeded,
          fundingRounds: fundingRounds,
          totalRaisedAll: totalRaisedAll,
          userId: postData.user?._id || null,
          stats: {
            likes: Number(postData.meta?.likes || postData.likesCount || 0),
            comments: Number(postData.meta?.commentsCount || 0),
            crowns: Number(postData.meta?.crowns || 0),
            shares: Number(postData.sharesCount || 0),
          },
          likedByCurrentUser: !!liked,
          crownedByCurrentUser: !!crowned,
          isFollowing: !!following,
          isSaved: true,
          savedId: String(s._id),
          postId: {
            _id: postData._id,
            content: postData.about || postData.companyName,
            media: postData.profileImage ? [{ url: postData.profileImage, type: 'image' }] : [],
            author: postData.user || { username: postData.companyName }
          },
          createdAt: s.createdAt
        };
      }
    }

    // Fallback to Post
    postData = await Post.findById(id)
      .populate('author', 'username displayName avatarUrl')
      .lean();

    if (postData) {
      return {
        _id: s._id,
        contentType: 'Post',
        postId: postData,
        createdAt: s.createdAt
      };
    }

    // Return placeholder if content not found
    return {
      _id: s._id,
      contentType: s.contentType || 'unknown',
      postId: null,
      createdAt: s.createdAt
    };
  }));

  // Filter out items where content was not found
  return enriched.filter(item => item.postId !== null);
}

async function deleteSaved(savedId) {
  return await Saved.findByIdAndDelete(savedId);
}

module.exports = {
  savePost,
  getSavedPostsByUser,
  deleteSaved
};
