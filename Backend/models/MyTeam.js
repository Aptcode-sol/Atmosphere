const mongoose = require('mongoose');

const myTeamSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    addedAt: { type: Date, default: Date.now }
});

// Prevent duplicat entries for the same user-member pair
myTeamSchema.index({ user: 1, member: 1 }, { unique: true });

module.exports = mongoose.model('MyTeam', myTeamSchema);
