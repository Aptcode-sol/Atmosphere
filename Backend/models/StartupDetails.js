const mongoose = require("mongoose");
const { Schema } = mongoose;

const TeamMemberSchema = new Schema({
    name: String,
    username: String,
    role: String,
    userId: String, // Optional string - allows empty values when user is not selected from search
});

const FundingRoundSchema = new Schema({
    round: {
        type: String,
        enum: [
            "MVP",
            "Idea",
            "Prototype",
            "Market ready",
            "Semi running",
            "Fully running",
        ],
        default: "Idea",
    },
    amount: Number,
    investorName: String,
    doc: String,
});

const PreviousInvestmentSchema = new Schema({
    companyName: String,
    companyId: String,
    date: Date,
    amount: Number,
    docs: [String],
});

const StartupDetailsSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        companyName: String,
        about: String,
        location: String,
        companyType: String,
        establishedOn: Date,
        address: String,
        website: String,
        video: String,
        teamMembers: [TeamMemberSchema],
        fundingRounds: [FundingRoundSchema],
        financialProfile: {
            revenueType: {
                type: String,
                enum: ["Pre-revenue", "Revenue generating"],
            },
            fundingMethod: { type: String, enum: ["Bootstrapped", "Capital Raised"] },
            fundingAmount: Number,
            investorName: String,
            investorDoc: String,
            stages: [String],
        },
        previousInvestments: [PreviousInvestmentSchema],
        verified: { type: Boolean, default: false },
        profileImage: String,
        stage: {
            type: String,
            enum: [
                "MVP",
                "Idea",
                "Prototype",
                "Market ready",
                "Semi running",
                "Fully running",
            ],
            default: "Idea",
        },
        rounds: { type: Number, default: 0 },
        age: { type: Number, default: 1 },
        fundingRaised: { type: Number, default: 0 },
        fundingNeeded: { type: Number, default: 0 },
        likesCount: { type: Number, default: 0 },
        documents: String, // URL to verification documents
        meta: { type: Schema.Types.Mixed },
    },
    { timestamps: true },
);

module.exports = mongoose.model("StartupDetails", StartupDetailsSchema);
