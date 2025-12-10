const StartupCrown = require('../models/StartupCrown');
const StartupDetails = require('../models/StartupDetails');
const InvestorDetails = require('../models/InvestorDetails');

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

        const startup = await StartupDetails.findById(req.params.startupId);
        if (!startup) return res.status(404).json({ error: 'Startup not found' });
        const existing = await StartupCrown.findOne({ startup: startup._id, user: req.user._id });
        if (!existing) {
            await StartupCrown.create({ startup: startup._id, user: req.user._id });
            startup.meta = startup.meta || {};
            startup.meta.crowns = (startup.meta.crowns || 0) + 1;
            await startup.save();
        }
        res.json({ success: true, crowns: startup.meta.crowns || 0 });
    } catch (err) { next(err); }
};

exports.uncrownStartup = async (req, res, next) => {
    try {
        const startup = await StartupDetails.findById(req.params.startupId);
        if (!startup) return res.status(404).json({ error: 'Startup not found' });
        const crown = await StartupCrown.findOneAndDelete({ startup: startup._id, user: req.user._id });
        if (crown) {
            startup.meta = startup.meta || {};
            startup.meta.crowns = Math.max(0, (startup.meta.crowns || 1) - 1);
            await startup.save();
        }
        res.json({ success: true, crowns: startup.meta.crowns || 0 });
    } catch (err) { next(err); }
};
