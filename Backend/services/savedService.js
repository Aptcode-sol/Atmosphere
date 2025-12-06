const Saved = require('../models/Saved');

async function savePost(userId, postId) {
  const saved = new Saved({ user: userId, post: postId });
  return await saved.save();
}

async function getSavedPostsByUser(userId) {
  return await Saved.find({ user: userId }).populate('post');
}

async function deleteSaved(savedId) {
  return await Saved.findByIdAndDelete(savedId);
}

module.exports = {
  savePost,
  getSavedPostsByUser,
  deleteSaved
};
