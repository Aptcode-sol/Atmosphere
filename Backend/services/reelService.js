const Reel = require('../models/Reel');
const ReelLike = require('../models/ReelLike');
const ReelComment = require('../models/ReelComment');
const ReelShare = require('../models/ReelShare');

// Create a new reel
exports.createReel = async (req, res) => {
    try {
        const { videoUrl, thumbnailUrl, caption, tags, duration } = req.body;
        
        if (!videoUrl) {
            return res.status(400).json({ error: 'Video URL is required' });
        }

        const reel = await Reel.create({
            author: req.user.id,
            videoUrl,
            thumbnailUrl,
            caption,
            tags: tags || [],
            duration,
        });

        const populated = await Reel.findById(reel._id).populate('author', 'username displayName avatarUrl');
        res.status(201).json({ reel: populated });
    } catch (error) {
        console.error('Create reel error:', error);
        res.status(500).json({ error: 'Failed to create reel' });
    }
};

// Get feed of reels (for the reels viewer)
exports.getReelsFeed = async (req, res) => {
    try {
        const { limit = 20, skip = 0 } = req.query;
        
        const reels = await Reel.find({ visibility: 'public' })
            .sort({ createdAt: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .populate('author', 'username displayName avatarUrl')
            .lean();
        
        // Add user interaction status if authenticated
        if (req.user) {
            const reelIds = reels.map(r => r._id);
            const likes = await ReelLike.find({ 
                reel: { $in: reelIds }, 
                user: req.user.id 
            }).lean();
            const likedMap = new Set(likes.map(l => l.reel.toString()));
            
            reels.forEach(reel => {
                reel.isLiked = likedMap.has(reel._id.toString());
            });
        }

        res.json({ reels });
    } catch (error) {
        console.error('Get reels error:', error);
        res.status(500).json({ error: 'Failed to fetch reels' });
    }
};

// Get user's reels
exports.getUserReels = async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 20, skip = 0 } = req.query;

        const reels = await Reel.find({ author: userId })
            .sort({ createdAt: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .populate('author', 'username displayName avatarUrl')
            .lean();

        res.json({ reels });
    } catch (error) {
        console.error('Get user reels error:', error);
        res.status(500).json({ error: 'Failed to fetch user reels' });
    }
};

// Get single reel
exports.getReel = async (req, res) => {
    try {
        const { id } = req.params;
        
        const reel = await Reel.findById(id)
            .populate('author', 'username displayName avatarUrl')
            .lean();

        if (!reel) {
            return res.status(404).json({ error: 'Reel not found' });
        }

        // Increment view count
        await Reel.findByIdAndUpdate(id, { $inc: { viewsCount: 1 } });

        // Check if user liked
        if (req.user) {
            const like = await ReelLike.findOne({ reel: id, user: req.user.id });
            reel.isLiked = !!like;
        }

        res.json({ reel });
    } catch (error) {
        console.error('Get reel error:', error);
        res.status(500).json({ error: 'Failed to fetch reel' });
    }
};

// Delete reel
exports.deleteReel = async (req, res) => {
    try {
        const { id } = req.params;
        const reel = await Reel.findById(id);

        if (!reel) {
            return res.status(404).json({ error: 'Reel not found' });
        }

        if (reel.author.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await Reel.findByIdAndDelete(id);
        await ReelLike.deleteMany({ reel: id });
        await ReelComment.deleteMany({ reel: id });

        res.json({ message: 'Reel deleted' });
    } catch (error) {
        console.error('Delete reel error:', error);
        res.status(500).json({ error: 'Failed to delete reel' });
    }
};

// Like a reel
exports.likeReel = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await ReelLike.findOne({ reel: id, user: req.user.id });
        if (existing) {
            return res.status(400).json({ error: 'Already liked' });
        }

        await ReelLike.create({ reel: id, user: req.user.id });
        await Reel.findByIdAndUpdate(id, { $inc: { likesCount: 1 } });

        const updated = await Reel.findById(id);
        res.json({ likesCount: updated.likesCount });
    } catch (error) {
        console.error('Like reel error:', error);
        res.status(500).json({ error: 'Failed to like reel' });
    }
};

// Unlike a reel
exports.unlikeReel = async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await ReelLike.findOneAndDelete({ reel: id, user: req.user.id });
        if (!deleted) {
            return res.status(400).json({ error: 'Not liked' });
        }

        await Reel.findByIdAndUpdate(id, { $inc: { likesCount: -1 } });

        const updated = await Reel.findById(id);
        res.json({ likesCount: updated.likesCount });
    } catch (error) {
        console.error('Unlike reel error:', error);
        res.status(500).json({ error: 'Failed to unlike reel' });
    }
};

// Add comment to reel
exports.addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { text, parent } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ error: 'Comment text is required' });
        }

        const comment = await ReelComment.create({
            reel: id,
            author: req.user.id,
            text: text.trim(),
            parent: parent || null,
        });

        await Reel.findByIdAndUpdate(id, { $inc: { commentsCount: 1 } });

        const populated = await ReelComment.findById(comment._id)
            .populate('author', 'username displayName avatarUrl');

        res.status(201).json({ comment: populated });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
};

// Get comments for a reel
exports.getComments = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 50, skip = 0 } = req.query;

        const comments = await ReelComment.find({ reel: id })
            .sort({ createdAt: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .populate('author', 'username displayName avatarUrl')
            .lean();

        res.json({ comments });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
};

// Delete comment
exports.deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        
        const comment = await ReelComment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (comment.author.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await ReelComment.findByIdAndDelete(commentId);
        await Reel.findByIdAndUpdate(comment.reel, { $inc: { commentsCount: -1 } });

        res.json({ message: 'Comment deleted' });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
};

// Share a reel with followers (one share per user)
exports.shareReel = async (req, res) => {
    try {
        const { id } = req.params;
        const { followerIds } = req.body;

        // Check if already shared
        const existing = await ReelShare.findOne({ reel: id, user: req.user.id });
        if (existing) {
            // Update existing share with new recipients
            existing.sharedWith = [...new Set([...existing.sharedWith.map(id => id.toString()), ...(followerIds || [])])];
            await existing.save();
            const reel = await Reel.findById(id);
            return res.json({ 
                message: 'Share updated',
                shareId: existing._id,
                sharesCount: reel?.sharesCount || 0,
                alreadyShared: true
            });
        }

        // Create new share
        const share = await ReelShare.create({
            reel: id,
            user: req.user.id,
            sharedWith: followerIds || []
        });

        // Increment share count only for new shares
        await Reel.findByIdAndUpdate(id, { $inc: { sharesCount: 1 } });
        const reel = await Reel.findById(id);

        res.status(201).json({ 
            share,
            sharesCount: reel?.sharesCount || 1
        });
    } catch (error) {
        console.error('Share reel error:', error);
        res.status(500).json({ error: 'Failed to share reel' });
    }
};

// Update share recipients
exports.updateReelShare = async (req, res) => {
    try {
        const { id } = req.params;
        const { followerIds } = req.body;

        const share = await ReelShare.findOne({ reel: id, user: req.user.id });
        if (!share) {
            return res.status(404).json({ error: 'Share not found' });
        }

        share.sharedWith = followerIds || [];
        await share.save();

        res.json({ share, message: 'Share updated' });
    } catch (error) {
        console.error('Update share error:', error);
        res.status(500).json({ error: 'Failed to update share' });
    }
};

// Check if user has shared a reel
exports.checkReelShared = async (req, res) => {
    try {
        const { id } = req.params;
        const share = await ReelShare.findOne({ reel: id, user: req.user.id });
        res.json({ 
            shared: !!share,
            shareId: share?._id || null,
            sharedWith: share?.sharedWith || []
        });
    } catch (error) {
        console.error('Check shared error:', error);
        res.status(500).json({ error: 'Failed to check share status' });
    }
};
