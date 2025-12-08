const mongoose = require('mongoose');
const { Schema } = mongoose;

const MeetingSchema = new Schema(
    {
        // primary organizer (matches service expectations)
        organizer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        // legacy host field kept for compatibility
        host: { type: Schema.Types.ObjectId, ref: 'User' },
        title: { type: String },
        description: { type: String },
        // scheduledAt is the main start time used by services
        scheduledAt: { type: Date },
        // optional explicit start/end for compatibility
        startTime: { type: Date },
        endTime: { type: Date },
        // duration in minutes
        duration: { type: Number, default: 60 },
        // participants as subdocuments to hold status and joinedAt
        participants: [
            {
                userId: { type: Schema.Types.ObjectId, ref: 'User' },
                status: { type: String, enum: ['invited', 'accepted', 'declined', 'tentative'], default: 'invited' },
                joinedAt: { type: Date },
            },
        ],
        // convenience count field (optional)
        participantsCount: { type: Number, default: 0 },
        location: String,
        // meetingLink used by service
        meetingLink: String,
        // legacy link kept
        link: String,
        type: { type: String },
        status: { type: String, default: 'scheduled' },
        reminderSent: { type: Boolean, default: false },
        meta: { type: Schema.Types.Mixed },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Meeting', MeetingSchema);