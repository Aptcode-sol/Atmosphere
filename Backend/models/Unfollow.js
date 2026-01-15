const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Unfollow model - tracks when a user unfollows another
 * This allows us to count real unfollows for analytics
 */
const UnfollowSchema = new Schema(
    {
        unfollower: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        unfollowed: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    },
    { timestamps: true }
);

// Compound index for efficient date-range queries per user
UnfollowSchema.index({ unfollowed: 1, createdAt: -1 });

module.exports = mongoose.model('Unfollow', UnfollowSchema);
