const mongoose = require('mongoose');
const { Schema } = mongoose;

const PreviousInvestmentSchema = new Schema({
    companyName: String,
    companyId: String,
    date: Date,
    amount: Number,
    docs: [String]
});

const InvestorDetailsSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        about: String,
        location: String,
        investmentFocus: [String],
        interestedRounds: [String],
        stage: { type: String },
        geography: [String],
        checkSize: {
            min: Number,
            max: Number,
        },
        previousInvestments: [PreviousInvestmentSchema],
        verified: { type: Boolean, default: false },
        profileImage: String,
        meta: { type: Schema.Types.Mixed },
    },
    { timestamps: true }
);

module.exports = mongoose.model('InvestorDetails', InvestorDetailsSchema);