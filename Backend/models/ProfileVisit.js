const mongoose = require('mongoose');

const ProfileVisitSchema = new mongoose.Schema({
    profile: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    visitor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now, index: true }
});

// Index for efficient queries
ProfileVisitSchema.index({ profile: 1, createdAt: -1 });

module.exports = mongoose.model('ProfileVisit', ProfileVisitSchema);
