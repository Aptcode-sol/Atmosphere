const mongoose = require('mongoose');
const { Schema } = mongoose;

const AuditLogSchema = new Schema({
    actor: { type: Schema.Types.ObjectId, ref: 'User' },
    action: String,
    targetType: String,
    targetId: Schema.Types.ObjectId,
    data: Schema.Types.Mixed,
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
