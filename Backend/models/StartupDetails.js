const mongoose = require('mongoose');
const { Schema } = mongoose;

const TeamMemberSchema = new Schema({ name: String, role: String });
const PreviousInvestmentSchema = new Schema({ companyName: String, companyId: String, date: Date, amount: Number, docs: [String] });

const StartupDetailsSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        companyName: String,
        about: String,
        location: String,
        companyType: String,
        establishedOn: Date,
        address: String,
        teamMembers: [TeamMemberSchema],
        financialProfile: { revenueType: String, fundingAmount: Number, stages: [String] },
        previousInvestments: [PreviousInvestmentSchema],
        metadata: Schema.Types.Mixed,
    },
    { timestamps: true }
);

module.exports = mongoose.model('StartupDetails', StartupDetailsSchema);
