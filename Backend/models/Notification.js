const mongoose = require('mongoose');
const { Schema } = mongoose;

const NotificationSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        actor: { type: Schema.Types.ObjectId, ref: 'User' },
        type: { type: String },
        payload: Schema.Types.Mixed,
        isRead: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Notification', NotificationSchema);
