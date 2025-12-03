const mongoose = require('mongoose');
const { Schema } = mongoose;

const CompanySchema = new Schema(
    {
        name: { type: String, required: true },
        slug: { type: String, index: true },
        website: String,
        logoUrl: String,
        description: String,
        team: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        tags: [String],
        metadata: { type: Schema.Types.Mixed },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Company', CompanySchema);
