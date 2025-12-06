const mongoose = require('mongoose');

const GrantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  organization: { type: String, required: true },
  sector: { type: String },
  location: { type: String, required: true },
  amount: { type: String, required: true },
  deadline: { type: Date, required: true },
  type: { type: String, enum: ['grant', 'incubator', 'accelerator'], required: true },
  description: { type: String, required: true },
  url: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Grant', GrantSchema);