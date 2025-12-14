const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema(
    {
        supabaseId: { type: String, index: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        phone: { type: String, trim: true },
        username: { type: String, required: true, unique: true, trim: true },
        passwordHash: { type: String },
        fullName: { type: String },
        displayName: { type: String },
        bio: { type: String },
        avatarUrl: { type: String },
        roles: { type: [String], default: ['personal'], enum: ['investor', 'startup', 'personal'] },
        otpVerified: { type: Boolean, default: false },
        verified: { type: Boolean, default: false },
        profileSetupComplete: { type: Boolean, default: false },
        onboardingStep: { type: Number, default: 0 },
        deletedAt: { type: Date, default: null },
        kycCompleted: { type: Boolean, default: false },
        kycCompletedAt: { type: Date },
        isKycVerified: { type: Boolean, default: false }, // KYC verification status
        portfolioComplete: { type: Boolean, default: false }, // For investor portfolio step
        links: {
            website: String,
            linkedin: String,
            twitter: String,
        },
        meta: { type: Schema.Types.Mixed },
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);