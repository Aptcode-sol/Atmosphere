const mongoose = require('mongoose');
const { Schema } = mongoose;

const ReelSchema = new Schema(
    {
        author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        videoUrl: { type: String, required: true },
        thumbnailUrl: { type: String },
        caption: { type: String, default: '' },
        tags: { type: [String], default: [] },
        likesCount: { type: Number, default: 0 },
        commentsCount: { type: Number, default: 0 },
        viewsCount: { type: Number, default: 0 },
        sharesCount: { type: Number, default: 0 },
        duration: { type: Number }, // in seconds
        visibility: { type: String, enum: ['public', 'private'], default: 'public' },
    },
    { timestamps: true }
);

ReelSchema.index({ author: 1, createdAt: -1 });
ReelSchema.index({ createdAt: -1 }); // For feed

module.exports = mongoose.model('Reel', ReelSchema);
