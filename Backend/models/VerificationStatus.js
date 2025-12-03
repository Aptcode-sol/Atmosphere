const mongoose = require('mongoose');
const { Schema } = mongoose;

const VerificationStatusSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String },
        status: { type: String, enum: ['requested', 'pending', 'approved', 'rejected'], default: 'requested' },
        requestedAt: Date,
        approvedAt: Date,
        admin: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('VerificationStatus', VerificationStatusSchema);
