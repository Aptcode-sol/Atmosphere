const mongoose = require('mongoose');
const { Schema } = mongoose;

const MessageSchema = new Schema(
    {
        chat: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
        sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        type: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
        body: { type: String },
        attachments: [{ url: String, type: String }],
    },
    { timestamps: true }
);

module.exports = mongoose.model('Message', MessageSchema);
