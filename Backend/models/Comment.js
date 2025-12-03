const mongoose = require('mongoose');
const { Schema } = mongoose;

const CommentSchema = new Schema(
    {
        post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
        author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        parent: { type: Schema.Types.ObjectId, ref: 'Comment' },
        likesCount: { type: Number, default: 0 },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Comment', CommentSchema);
