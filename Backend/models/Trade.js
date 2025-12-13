const mongoose = require('mongoose');
const { Schema } = mongoose;

const TradeSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        companyId: { type: String, required: true },
        companyName: { type: String, required: true },
        companyType: [String],
        companyAge: String,
        revenueStatus: {
            type: String,
            enum: ['revenue-generating', 'pre-revenue'],
            required: true
        },
        description: String,
        startupUsername: String,
        sellingRangeMin: { type: Number, required: true },
        sellingRangeMax: { type: Number, required: true },
        selectedIndustries: {
            type: [String],
            validate: {
                validator: function (v) {
                    return v.length <= 3;
                },
                message: 'Maximum 3 industries allowed'
            }
        },
        isManualEntry: { type: Boolean, default: false },
        externalLinkHeading: String,
        externalLinkUrl: String,
        views: { type: Number, default: 0 },
        saves: { type: Number, default: 0 },
        isEdited: { type: Boolean, default: false },
        // Placeholders for future media implementation
        videoUrl: String,
        imageUrls: [String],
    },
    { timestamps: true }
);

// Index for efficient queries
TradeSchema.index({ user: 1, createdAt: -1 });
TradeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Trade', TradeSchema);
