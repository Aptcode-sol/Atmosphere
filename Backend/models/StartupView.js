const mongoose = require('mongoose');

/**
 * StartupView model - tracks when a startup profile/card is viewed in detail
 * Used for "Views" analytics in Professional Dashboard
 */
const StartupViewSchema = new mongoose.Schema({
    startup: { type: mongoose.Schema.Types.ObjectId, ref: 'StartupDetails', required: true, index: true },
    viewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now, index: true }
});

// Compound index for efficient date-range queries
StartupViewSchema.index({ startup: 1, createdAt: -1 });

module.exports = mongoose.model('StartupView', StartupViewSchema);
