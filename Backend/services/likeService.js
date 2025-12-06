const Like = require('../models/Like');
const Post = require('../models/Post');

exports.listLikesForPost = async (req, res, next) => {
  try {
    const likes = await Like.find({ post: req.params.postId }).populate('user', 'username displayName avatarUrl');
    res.json({ likes });
  } catch (err) { next(err); }
};

exports.listLikesByUser = async (req, res, next) => {
  try {
    const likes = await Like.find({ user: req.params.userId }).populate('post');
    res.json({ likes });
  } catch (err) { next(err); }
};

exports.likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const existing = await Like.findOne({ post: post._id, user: req.user._id });
    if (!existing) {
      await Like.create({ post: post._id, user: req.user._id });
      post.likesCount += 1;
      await post.save();
    }
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.unlikePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const like = await Like.findOneAndDelete({ post: post._id, user: req.user._id });
    if (like) {
      post.likesCount = Math.max(0, post.likesCount - 1);
      await post.save();
    }
    res.json({ success: true });
  } catch (err) { next(err); }
};
