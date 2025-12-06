const Share = require('../models/Share');

async function createShare(userId, postId) {
  const existingShare = await Share.findOne({ user: userId, post: postId });
  if (existingShare) {
    return existingShare; // Return the existing share without creating a new one
  }
  const share = new Share({ user: userId, post: postId });
  return await share.save();
}

async function getSharesByPost(postId) {
  return await Share.find({ post: postId }).populate('user', 'name');
}

async function deleteShare(shareId) {
  return await Share.findByIdAndDelete(shareId);
}

async function checkUserShared(userId, postId) {
  const share = await Share.findOne({ user: userId, post: postId });
  return !!share;
}

module.exports = {
  createShare,
  getSharesByPost,
  deleteShare,
  checkUserShared
};