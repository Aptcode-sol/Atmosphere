const mongoose = require('mongoose');
const { Schema } = mongoose;

const MediaSchema = new Schema({ url: String, type: { type: String, enum: ['image', 'video', 'file'] }, thumbUrl: String });

const PostSchema = new Schema(
    {
        author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String },
        media: [MediaSchema],
        visibility: { type: String, enum: ['public', 'private'], default: 'public' },
        likesCount: { type: Number, default: 0 },
        commentsCount: { type: Number, default: 0 },
        tags: [String],
        pinned: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Post', PostSchema);
