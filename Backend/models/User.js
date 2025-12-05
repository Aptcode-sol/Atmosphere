const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema(
    {
        supabaseId: { type: String, index: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        username: { type: String, required: true, unique: true, trim: true },
        passwordHash: { type: String },
        fullName: { type: String },
        displayName: { type: String },
        bio: { type: String },
        avatarUrl: { type: String },
        accountType: { type: String, enum: ['investor', 'startup', 'personal'], default: 'personal' },
        roles: { type: [String], default: ['personal'] },
        otpVerified: { type: Boolean, default: false },
        verified: { type: Boolean, default: false },
        profileSetupComplete: { type: Boolean, default: false },
        onboardingStep: { type: Number, default: 0 },
        deletedAt: { type: Date, default: null },
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