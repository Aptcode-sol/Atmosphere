const mongoose = require('mongoose');
const { Schema } = mongoose;

const PortfolioSchema = new Schema(
    {
        owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        items: [{ type: Schema.Types.ObjectId, ref: 'Asset' }],
        summary: String,
    },
    { timestamps: true }
);

module.exports = mongoose.model('Portfolio', PortfolioSchema);
