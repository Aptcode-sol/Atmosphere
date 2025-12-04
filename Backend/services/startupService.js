const { StartupDetails } = require('../models');

exports.createStartup = async (req, res, next) => {
    try {
        const { companyName, about, location, companyType, establishedOn, address, teamMembers, financialProfile, previousInvestments } = req.body;
        const existing = await StartupDetails.findOne({ user: req.user._id });
        if (existing) return res.status(409).json({ error: 'Startup details already exist for this user' });

        const startupDetails = new StartupDetails({ user: req.user._id, companyName, about, location, companyType, establishedOn, address, teamMembers: teamMembers || [], financialProfile, previousInvestments: previousInvestments || [] });
        await startupDetails.save();
        res.status(201).json({ startupDetails });
    } catch (err) { next(err); }
};

exports.getStartupByUser = async (req, res, next) => {
    try {
        const startupDetails = await StartupDetails.findOne({ user: req.params.userId }).populate('user', 'username displayName avatarUrl');
        if (!startupDetails) return res.status(404).json({ error: 'Startup details not found' });
        res.json({ startupDetails });
    } catch (err) { next(err); }
};

exports.updateStartup = async (req, res, next) => {
    try {
        const startupDetails = await StartupDetails.findById(req.params.id);
        if (!startupDetails) return res.status(404).json({ error: 'Startup details not found' });
        if (startupDetails.user.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Forbidden' });

        const allowedFields = ['companyName', 'about', 'location', 'companyType', 'establishedOn', 'address', 'teamMembers', 'financialProfile', 'previousInvestments', 'verified', 'profileImage', 'stage', 'rounds', 'age', 'fundingRaised', 'fundingNeeded'];
        allowedFields.forEach(field => { if (req.body[field] !== undefined) startupDetails[field] = req.body[field]; });
        await startupDetails.save();
        res.json({ startupDetails });
    } catch (err) { next(err); }
};

exports.listStartupCards = async (req, res, next) => {
    try {
        const { limit = 20, skip = 0 } = req.query;
        const startups = await StartupDetails.find()
            .populate('user', 'username displayName avatarUrl email')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));
        const startupCards = startups.map(startup => ({
            id: startup._id,
            userId: startup.user._id,
            name: startup.companyName,
            displayName: startup.user.displayName,
            verified: startup.verified,
            profileImage: startup.profileImage,
            description: startup.about,
            stage: startup.stage,
            rounds: startup.rounds,
            age: startup.age,
            fundingRaised: startup.fundingRaised,
            fundingNeeded: startup.fundingNeeded,
            stats: { likes: 0, comments: 0, crowns: 0, shares: 0 },
        }));
        res.json({ startups: startupCards, count: startupCards.length });
    } catch (err) { next(err); }
};
