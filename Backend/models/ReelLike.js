const mongoose = require('mongoose');
const { Schema } = mongoose;

const ReelLikeSchema = new Schema(
    {
        reel: { type: Schema.Types.ObjectId, ref: 'Reel', required: true },
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

ReelLikeSchema.index({ reel: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('ReelLike', ReelLikeSchema);
