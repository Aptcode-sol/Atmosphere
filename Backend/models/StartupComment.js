const mongoose = require('mongoose');
const { Schema } = mongoose;

const StartupCommentSchema = new Schema(
    {
        startup: { type: Schema.Types.ObjectId, ref: 'StartupDetails', required: true },
        author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        parent: { type: Schema.Types.ObjectId, ref: 'StartupComment', default: null },
        likesCount: { type: Number, default: 0 },
        meta: { type: Schema.Types.Mixed },
    },
    { timestamps: true }
);

module.exports = mongoose.model('StartupComment', StartupCommentSchema);
