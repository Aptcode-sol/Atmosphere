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
        .populate('user', 'username displayName avatarUrl')
        .lean();

      if (postData) {
        return {
          _id: s._id,
          contentType: 'StartupDetails',
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
