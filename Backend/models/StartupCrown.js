const mongoose = require('mongoose');

const StartupCrownSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startup: { type: mongoose.Schema.Types.ObjectId, ref: 'StartupDetails', required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StartupCrown', StartupCrownSchema);
