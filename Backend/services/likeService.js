const Like = require('../models/Like');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

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
    console.log('[likeService.likePost] called postId=', req.params.postId, 'user=', req.user && req.user._id);
    const post = await Post.findById(req.params.postId);
    console.log('[likeService.likePost] post found=', !!post);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const existing = await Like.findOne({ post: post._id, user: req.user._id });
    if (!existing) {
      await Like.create({ post: post._id, user: req.user._id });
      // Create notification for post author (if not self)
      if (post.author && post.author.toString() !== req.user._id.toString()) {
        try {
          await Notification.create({
            user: post.author,
            actor: req.user._id,
            type: 'like',
            payload: { postId: post._id, postContent: post.content?.substring(0, 50) }
          });
        } catch (notifErr) {
          console.warn('Failed to create like notification:', notifErr.message);
        }
      }
      try {
        const updated = await Post.findOneAndUpdate(
          { _id: post._id },
          [
            {
              $set: {
                meta: {
                  $let: {
                    vars: { current: { $ifNull: ['$meta', {}] } },
                    in: { $mergeObjects: ['$$current', { likes: { $add: [{ $ifNull: ['$$current.likes', 0] }, 1] } }] }
                  }
                },
                likesCount: { $add: [{ $ifNull: ['$likesCount', 0] }, 1] }
              }
            }
          ],
          { new: true }
        ).lean();
        const likesVal = (updated && updated.meta && typeof updated.meta.likes === 'number') ? updated.meta.likes : (updated && updated.likesCount) || 0;
        return res.json({ success: true, likes: likesVal });
      } catch (e) {
        post.meta = post.meta || {};
        post.meta.likes = (post.meta.likes || 0) + 1;
        if (typeof post.likesCount === 'number') post.likesCount = (post.likesCount || 0) + 1;
        await post.save();
      }
    }
    return res.json({ success: true, likes: (post.meta && typeof post.meta.likes === 'number') ? post.meta.likes : (post.likesCount || 0) });
  } catch (err) { next(err); }
};

exports.unlikePost = async (req, res, next) => {
  try {
    console.log('[likeService.unlikePost] called postId=', req.params.postId, 'user=', req.user && req.user._id);
    const post = await Post.findById(req.params.postId);
    console.log('[likeService.unlikePost] post found=', !!post);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const like = await Like.findOneAndDelete({ post: post._id, user: req.user._id });
    if (like) {
      try {
        const updated = await Post.findOneAndUpdate(
          { _id: post._id },
          [
            {
              $set: {
                meta: {
                  $let: {
                    vars: { current: { $ifNull: ['$meta', {}] } },
                    in: { $mergeObjects: ['$$current', { likes: { $max: [0, { $subtract: [{ $ifNull: ['$$current.likes', 0] }, 1] }] } }] }
                  }
                },
                likesCount: { $max: [0, { $subtract: [{ $ifNull: ['$likesCount', 0] }, 1] }] }
              }
            }
          ],
          { new: true }
        ).lean();
        const likesVal = (updated && updated.meta && typeof updated.meta.likes === 'number') ? updated.meta.likes : (updated && updated.likesCount) || 0;
        return res.json({ success: true, likes: likesVal });
      } catch (e) {
        post.likesCount = Math.max(0, post.likesCount - 1);
        post.meta = post.meta || {};
        post.meta.likes = Math.max(0, (post.meta.likes || 0) - 1);
        await post.save();
      }
    }
    return res.json({ success: true, likes: (post.meta && typeof post.meta.likes === 'number') ? post.meta.likes : (post.likesCount || 0) });
  } catch (err) { next(err); }
};
