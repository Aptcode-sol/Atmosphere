const mongoose = require('mongoose');
const { Schema } = mongoose;

const AssetSchema = new Schema(
    {
        owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        title: String,
        description: String,
        value: Number,
        metadata: Schema.Types.Mixed,
        verified: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Asset', AssetSchema);
