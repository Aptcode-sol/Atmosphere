const mongoose = require('mongoose');
const { Schema } = mongoose;

const ChatSchema = new Schema(
    {
        participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
        unreadCounts: { type: Schema.Types.Mixed },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Chat', ChatSchema);
