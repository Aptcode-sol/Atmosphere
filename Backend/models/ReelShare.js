const mongoose = require('mongoose');
const { Schema } = mongoose;

const ReelShareSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        reel: { type: Schema.Types.ObjectId, ref: 'Reel', required: true },
        sharedWith: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    },
    { timestamps: true }
);

// Ensure only one share record per user per reel
ReelShareSchema.index({ user: 1, reel: 1 }, { unique: true });
ReelShareSchema.index({ reel: 1, createdAt: -1 });

module.exports = mongoose.model('ReelShare', ReelShareSchema);
