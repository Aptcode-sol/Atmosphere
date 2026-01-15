const mongoose = require('mongoose');

const SavedSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Support Post, StartupDetails, and Reel
  contentType: { type: String, enum: ['Post', 'StartupDetails', 'Reel'], default: 'Post' },
  contentId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'contentType' },
  // Keep legacy field for backwards compatibility but not required
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Saved', SavedSchema);