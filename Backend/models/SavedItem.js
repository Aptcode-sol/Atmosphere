const mongoose = require('mongoose');
const { Schema } = mongoose;

const SavedItemSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        itemType: { type: String },
        itemRef: { type: Schema.Types.ObjectId },
    },
    { timestamps: true }
);

module.exports = mongoose.model('SavedItem', SavedItemSchema);
