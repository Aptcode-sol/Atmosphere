const mongoose = require('mongoose');
const { Schema } = mongoose;

const MeetingSchema = new Schema(
    {
        host: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        title: String,
        description: String,
        startTime: Date,
        endTime: Date,
        participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        location: String,
        link: String,
        reminderSent: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Meeting', MeetingSchema);
