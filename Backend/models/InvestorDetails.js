const mongoose = require('mongoose');
const { Schema } = mongoose;

const InvestorDetailsSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        about: String,
        location: String,
        investmentFocus: [String],
        interestedRounds: [String],
        stage: { type: String },
        geography: [String],
        checkSize: { min: Number, max: Number },
        metadata: Schema.Types.Mixed,
    },
    { timestamps: true }
);

module.exports = mongoose.model('InvestorDetails', InvestorDetailsSchema);
