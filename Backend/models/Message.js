const mongoose = require('mongoose');
const { Schema } = mongoose;

const MessageSchema = new Schema(
    {
        chat: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
        sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        type: { type: String, enum: ['text', 'image', 'file', 'video', 'audio'], default: 'text' },
        body: { type: String },
        attachments: [{ url: String, type: String, name: String, size: Number }],
        // Message status tracking
        status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
        deliveredAt: { type: Date },
        readAt: { type: Date },
        // Reply support
        replyTo: { type: Schema.Types.ObjectId, ref: 'Message' },
        // Soft delete
        deletedFor: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        meta: { type: Schema.Types.Mixed },
    },
    { timestamps: true }
);

// Index for efficient queries
MessageSchema.index({ chat: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });

module.exports = mongoose.model('Message', MessageSchema);
