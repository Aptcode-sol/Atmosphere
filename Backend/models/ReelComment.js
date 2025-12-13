const mongoose = require('mongoose');
const { Schema } = mongoose;

const ReelCommentSchema = new Schema(
    {
        reel: { type: Schema.Types.ObjectId, ref: 'Reel', required: true },
        author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        parent: { type: Schema.Types.ObjectId, ref: 'ReelComment', default: null },
        likesCount: { type: Number, default: 0 },
    },
    { timestamps: true }
);

ReelCommentSchema.index({ reel: 1, createdAt: -1 });

module.exports = mongoose.model('ReelComment', ReelCommentSchema);
