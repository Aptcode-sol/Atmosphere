const mongoose = require('mongoose');
const { Schema } = mongoose;

const CrownSchema = new Schema({
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Crown', CrownSchema);
