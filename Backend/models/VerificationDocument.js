const mongoose = require('mongoose');
const { Schema } = mongoose;

const VerificationDocumentSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        type: { type: String },
        storageKey: String,
        url: String,
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        notes: String,
        reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        reviewedAt: Date,
    },
    { timestamps: true }
);

module.exports = mongoose.model('VerificationDocument', VerificationDocumentSchema);
