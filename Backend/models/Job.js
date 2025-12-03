const mongoose = require('mongoose');
const { Schema } = mongoose;

const JobSchema = new Schema(
    {
        poster: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        startup: { type: Schema.Types.ObjectId, ref: 'StartupDetails' },
        title: String,
        sector: String,
        locationType: String,
        employmentType: String,
        compensation: String,
        requirements: [String],
        customQuestions: [String],
        applicants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    },
    { timestamps: true }
);

module.exports = mongoose.model('Job', JobSchema);
