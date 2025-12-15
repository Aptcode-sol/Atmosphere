const StartupCrown = require('../models/StartupCrown');
const StartupDetails = require('../models/StartupDetails');
const InvestorDetails = require('../models/InvestorDetails');
const Notification = require('../models/Notification');

exports.listCrownsForStartup = async (req, res, next) => {
    try {
        const crowns = await StartupCrown.find({ startup: req.params.startupId }).populate('user', 'username displayName avatarUrl');
        res.json({ crowns });
    } catch (err) { next(err); }
};

exports.crownStartup = async (req, res, next) => {
    try {
        // only investors can crown — allow if user has 'investor' role or has InvestorDetails
        const isInvestorRole = Array.isArray(req.user && req.user.roles) && req.user.roles.includes('investor');
        const hasInvestor = isInvestorRole || (await InvestorDetails.findOne({ user: req.user._id }));
        if (!hasInvestor) return res.status(403).json({ error: 'Only investors can crown profiles' });

        let startup = await StartupDetails.findById(req.params.startupId);
        if (!startup) {
            startup = await StartupDetails.findOne({ user: req.params.startupId });
        }
        if (!startup) return res.status(404).json({ error: 'Startup not found' });
        const existing = await StartupCrown.findOne({ startup: startup._id, user: req.user._id });
        if (!existing) {
            const mongoose = require('mongoose');
            const session = await mongoose.startSession().catch(() => null);
            if (session && typeof session.withTransaction === 'function') {
                try {
                    let resultCrowns = 0;
                    await session.withTransaction(async () => {
                        try {
                            await StartupCrown.create([{ startup: startup._id, user: req.user._id }], { session });
                        } catch (err) {
                            if (err && err.code === 11000) return; // duplicate
                            throw err;
                        }
                        // increment meta.crowns in doc
                        const updated = await StartupDetails.findOneAndUpdate(
                            { _id: startup._id },
                            [{ $set: { meta: { $let: { vars: { current: { $ifNull: ['$meta', {}] } }, in: { $mergeObjects: ['$$current', { crowns: { $add: [{ $ifNull: ['$$current.crowns', 0] }, 1] } }] } } } } }],
                            { new: true, session, updatePipeline: true }
                        ).lean();
                        resultCrowns = (updated && updated.meta && typeof updated.meta.crowns === 'number') ? updated.meta.crowns : (updated && updated.crowns) || 0;
                    });
                    // Create notification for startup owner (if not self)
                    if (startup.user && startup.user.toString() !== req.user._id.toString()) {
                        try {
                            await Notification.create({
                                user: startup.user,
                                actor: req.user._id,
                                type: 'crown',
                                payload: { startupId: startup._id, startupName: startup.companyName }
                            });
                        } catch (notifErr) {
                            console.warn('Failed to create startup crown notification:', notifErr.message);
                        }
                    }
                    if (typeof resultCrowns === 'number') return res.json({ success: true, crowns: resultCrowns });
                } catch (err) {
                    console.warn('Crown transaction failed, falling back', err && err.message ? err.message : err);
                } finally { try { session.endSession(); } catch { } }
            }

            // fallback: non-transactional
            try {
                await StartupCrown.create({ startup: startup._id, user: req.user._id });
            } catch (err) {
                if (err && err.code === 11000) return res.json({ success: true, crowns: startup.meta.crowns || 0 });
                throw err;
            }
            startup.meta = startup.meta || {};
            startup.meta.crowns = (startup.meta.crowns || 0) + 1;
            await startup.save();
            // Create notification for startup owner (if not self)
            if (startup.user && startup.user.toString() !== req.user._id.toString()) {
                try {
                    await Notification.create({
                        user: startup.user,
                        actor: req.user._id,
                        type: 'crown',
                        payload: { startupId: startup._id, startupName: startup.companyName }
                    });
                } catch (notifErr) {
                    console.warn('Failed to create startup crown notification:', notifErr.message);
                }
            }
            return res.json({ success: true, crowns: startup.meta.crowns || 0 });
        }
        res.json({ success: true, crowns: startup.meta.crowns || 0 });
    } catch (err) { next(err); }
};

exports.uncrownStartup = async (req, res, next) => {
    try {
        let startup = await StartupDetails.findById(req.params.startupId);
        if (!startup) {
            startup = await StartupDetails.findOne({ user: req.params.startupId });
        }
        if (!startup) return res.status(404).json({ error: 'Startup not found' });
        // Check if crown exists first, don't delete yet
        const crown = await StartupCrown.findOne({ startup: startup._id, user: req.user._id });
        if (crown) {
            const mongoose = require('mongoose');
            const session = await mongoose.startSession().catch(() => null);
            if (session && typeof session.withTransaction === 'function') {
                try {
                    let resultCrowns = 0;
                    await session.withTransaction(async () => {
                        await StartupCrown.findOneAndDelete({ startup: startup._id, user: req.user._id }, { session });
                        const updated = await StartupDetails.findOneAndUpdate(
                            { _id: startup._id },
                            [{ $set: { meta: { $let: { vars: { current: { $ifNull: ['$meta', {}] } }, in: { $mergeObjects: ['$$current', { crowns: { $max: [0, { $subtract: [{ $ifNull: ['$$current.crowns', 0] }, 1] }] } }] } } } } }],
                            { new: true, session, updatePipeline: true }
                        ).lean();
                        resultCrowns = (updated && updated.meta && typeof updated.meta.crowns === 'number') ? updated.meta.crowns : (updated && updated.crowns) || 0;
                    });
                    if (typeof resultCrowns === 'number') return res.json({ success: true, crowns: resultCrowns });
                } catch (err) {
                    console.warn('Uncrown transaction failed, falling back', err && err.message ? err.message : err);
                } finally { try { session.endSession(); } catch { } }
            }

            // fallback: delete crown and decrement
            await StartupCrown.findOneAndDelete({ startup: startup._id, user: req.user._id });
            startup.meta = startup.meta || {};
            startup.meta.crowns = Math.max(0, (startup.meta.crowns || 0) - 1);
            await startup.save();
        }
        res.json({ success: true, crowns: startup.meta.crowns || 0 });
    } catch (err) { next(err); }
};
