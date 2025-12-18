const { VerificationDocument, VerificationStatus, AuditLog, User, StartupDetails, InvestorDetails } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Admin Login Handler
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || !user.passwordHash) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check for admin role
        if (!user.roles || !user.roles.includes('admin')) {
            return res.status(403).json({ error: 'Admin access required. This account is not an admin.' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id.toString(), email: user.email, roles: user.roles },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                _id: user._id,
                email: user.email,
                username: user.username,
                fullName: user.fullName,
                roles: user.roles,
            },
        });
    } catch (err) {
        next(err);
    }
};
exports.getPendingVerifications = async (req, res, next) => {
    try {
        const { limit = 20, skip = 0, type } = req.query;

        const filter = { status: { $in: ['requested', 'in_review'] } };
        if (type) filter.role = type;

        const verifications = await VerificationStatus.find(filter)
            .populate('user', 'username displayName email avatarUrl')
            .sort({ requestedAt: 1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        res.json({ verifications, count: verifications.length });
    } catch (err) {
        next(err);
    }
};

exports.getUserDocuments = async (req, res, next) => {
    try {
        const { userId } = req.params;

        const documents = await VerificationDocument.find({ user: userId })
            .populate('user', 'username displayName email')
            .populate('reviewedBy', 'username displayName')
            .sort({ createdAt: -1 });

        res.json({ documents });
    } catch (err) {
        next(err);
    }
};

exports.approveVerification = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;

        const verification = await VerificationStatus.findById(id);
        if (!verification) {
            return res.status(404).json({ error: 'Verification not found' });
        }

        verification.status = 'approved';
        verification.approvedAt = new Date();
        verification.adminId = req.user._id;
        if (notes) verification.meta = { ...verification.meta, notes };

        await verification.save();

        await User.findByIdAndUpdate(verification.user, { verified: true });

        await VerificationDocument.updateMany(
            { user: verification.user },
            { status: 'approved', reviewedBy: req.user._id, reviewedAt: new Date() }
        );

        const auditLog = new AuditLog({
            actor: req.user._id,
            targetType: 'VerificationStatus',
            targetId: verification._id,
            action: 'approve',
            data: { role: verification.role, notes },
        });
        await auditLog.save();

        res.json({ verification, message: 'Verification approved successfully' });
    } catch (err) {
        next(err);
    }
};

exports.rejectVerification = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ error: 'Rejection reason is required' });
        }

        const verification = await VerificationStatus.findById(id);
        if (!verification) {
            return res.status(404).json({ error: 'Verification not found' });
        }

        verification.status = 'rejected';
        verification.adminId = req.user._id;
        verification.meta = { ...verification.meta, rejectionReason: reason };

        await verification.save();

        await VerificationDocument.updateMany(
            { user: verification.user },
            { status: 'rejected', reviewedBy: req.user._id, reviewedAt: new Date(), notes: reason }
        );

        const auditLog = new AuditLog({
            actor: req.user._id,
            targetType: 'VerificationStatus',
            targetId: verification._id,
            action: 'reject',
            data: { role: verification.role, reason },
        });
        await auditLog.save();

        res.json({ verification, message: 'Verification rejected' });
    } catch (err) {
        next(err);
    }
};

exports.getAuditLogs = async (req, res, next) => {
    try {
        const { limit = 50, skip = 0, action, targetType } = req.query;

        const filter = {};
        if (action) filter.action = action;
        if (targetType) filter.targetType = targetType;

        const logs = await AuditLog.find(filter)
            .populate('actor', 'username displayName email')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        res.json({ logs, count: logs.length });
    } catch (err) {
        next(err);
    }
};

exports.getUsers = async (req, res, next) => {
    try {
        const { limit = 50, skip = 0, role, verified, search } = req.query;

        const filter = {};
        if (role) filter.roles = role;
        if (verified !== undefined) filter.verified = verified === 'true';
        if (search) {
            filter.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { displayName: { $regex: search, $options: 'i' } },
            ];
        }

        const users = await User.find(filter)
            .select('-passwordHash')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await User.countDocuments(filter);

        res.json({ users, count: users.length, total });
    } catch (err) {
        next(err);
    }
};

// ================== NEW ADMIN ENDPOINTS ==================

// Get dashboard stats
exports.getStats = async (req, res, next) => {
    try {
        const [totalUsers, startups, investors, pendingStartups, pendingHoldings] = await Promise.all([
            User.countDocuments({ deletedAt: null }),
            User.countDocuments({ roles: 'startup', deletedAt: null }),
            User.countDocuments({ roles: 'investor', deletedAt: null }),
            StartupDetails.countDocuments({ verified: false }),
            InvestorDetails.countDocuments({ 'previousInvestments.0': { $exists: true } })
                .then(async () => {
                    // Count investments with pending status (we'll add a status field)
                    const investors = await InvestorDetails.find({ 'previousInvestments.0': { $exists: true } });
                    let pendingCount = 0;
                    investors.forEach(inv => {
                        inv.previousInvestments.forEach(pi => {
                            if (!pi.verified) pendingCount++;
                        });
                    });
                    return pendingCount;
                }),
        ]);

        // Recent signups (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentSignups = await User.find({ createdAt: { $gte: sevenDaysAgo }, deletedAt: null })
            .select('username email roles createdAt')
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            stats: {
                totalUsers,
                startups,
                investors,
                pendingVerifications: pendingStartups,
                pendingHoldings,
            },
            recentSignups,
        });
    } catch (err) {
        next(err);
    }
};

// Get pending startups with documents
exports.getPendingStartups = async (req, res, next) => {
    try {
        const pendingStartups = await StartupDetails.find({ verified: false })
            .populate('user', 'username email fullName createdAt')
            .sort({ createdAt: -1 });

        // Also fetch verification documents for each startup
        const startupsWithDocs = await Promise.all(
            pendingStartups.map(async (startup) => {
                const documents = await VerificationDocument.find({ user: startup.user?._id || startup.user })
                    .select('type url status createdAt');
                return {
                    ...startup.toObject(),
                    verificationDocuments: documents,
                };
            })
        );

        res.json({ startups: startupsWithDocs, count: startupsWithDocs.length });
    } catch (err) {
        next(err);
    }
};

// Verify (approve) a startup
exports.verifyStartup = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;

        const startup = await StartupDetails.findById(id);
        if (!startup) {
            return res.status(404).json({ error: 'Startup not found' });
        }

        startup.verified = true;
        await startup.save();

        // Also set user verified
        await User.findByIdAndUpdate(startup.user, { verified: true });

        // Approve all verification documents
        await VerificationDocument.updateMany(
            { user: startup.user },
            { status: 'approved', reviewedBy: req.user._id, reviewedAt: new Date() }
        );

        // Create audit log
        const auditLog = new AuditLog({
            actor: req.user._id,
            targetType: 'StartupDetails',
            targetId: startup._id,
            action: 'verify_startup',
            data: { companyName: startup.companyName, notes },
        });
        await auditLog.save();

        res.json({ startup, message: 'Startup verified successfully' });
    } catch (err) {
        next(err);
    }
};

// Reject a startup
exports.rejectStartup = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ error: 'Rejection reason is required' });
        }

        const startup = await StartupDetails.findById(id);
        if (!startup) {
            return res.status(404).json({ error: 'Startup not found' });
        }

        // Mark documents as rejected
        await VerificationDocument.updateMany(
            { user: startup.user },
            { status: 'rejected', reviewedBy: req.user._id, reviewedAt: new Date(), notes: reason }
        );

        // Create audit log
        const auditLog = new AuditLog({
            actor: req.user._id,
            targetType: 'StartupDetails',
            targetId: startup._id,
            action: 'reject_startup',
            data: { companyName: startup.companyName, reason },
        });
        await auditLog.save();

        res.json({ message: 'Startup rejected', reason });
    } catch (err) {
        next(err);
    }
};

// Get investor holdings pending approval
exports.getPendingHoldings = async (req, res, next) => {
    try {
        const investors = await InvestorDetails.find({ 'previousInvestments.0': { $exists: true } })
            .populate('user', 'username email fullName')
            .sort({ updatedAt: -1 });

        // Filter to only show investments that are not yet verified
        const pendingHoldings = [];
        investors.forEach(investor => {
            investor.previousInvestments.forEach((investment, index) => {
                if (!investment.verified) {
                    pendingHoldings.push({
                        investorId: investor._id,
                        investorName: investor.user?.fullName || investor.user?.username,
                        investorEmail: investor.user?.email,
                        investmentIndex: index,
                        companyName: investment.companyName,
                        amount: investment.amount,
                        date: investment.date,
                        docs: investment.docs || [],
                        createdAt: investment._id?.getTimestamp?.() || investor.createdAt,
                    });
                }
            });
        });

        res.json({ holdings: pendingHoldings, count: pendingHoldings.length });
    } catch (err) {
        next(err);
    }
};

// Approve a holding/investment
exports.approveHolding = async (req, res, next) => {
    try {
        const { investorId, investmentIndex } = req.params;

        const investor = await InvestorDetails.findById(investorId);
        if (!investor) {
            return res.status(404).json({ error: 'Investor not found' });
        }

        if (!investor.previousInvestments[investmentIndex]) {
            return res.status(404).json({ error: 'Investment not found' });
        }

        investor.previousInvestments[investmentIndex].verified = true;
        await investor.save();

        // Create audit log
        const auditLog = new AuditLog({
            actor: req.user._id,
            targetType: 'InvestorDetails',
            targetId: investor._id,
            action: 'approve_holding',
            data: {
                companyName: investor.previousInvestments[investmentIndex].companyName,
                amount: investor.previousInvestments[investmentIndex].amount,
            },
        });
        await auditLog.save();

        res.json({ message: 'Holding approved successfully' });
    } catch (err) {
        next(err);
    }
};

// Reject a holding/investment
exports.rejectHolding = async (req, res, next) => {
    try {
        const { investorId, investmentIndex } = req.params;
        const { reason } = req.body;

        const investor = await InvestorDetails.findById(investorId);
        if (!investor) {
            return res.status(404).json({ error: 'Investor not found' });
        }

        if (!investor.previousInvestments[investmentIndex]) {
            return res.status(404).json({ error: 'Investment not found' });
        }

        // Remove the investment or mark as rejected
        const investment = investor.previousInvestments[investmentIndex];
        investor.previousInvestments.splice(investmentIndex, 1);
        await investor.save();

        // Create audit log
        const auditLog = new AuditLog({
            actor: req.user._id,
            targetType: 'InvestorDetails',
            targetId: investor._id,
            action: 'reject_holding',
            data: {
                companyName: investment.companyName,
                reason,
            },
        });
        await auditLog.save();

        res.json({ message: 'Holding rejected and removed' });
    } catch (err) {
        next(err);
    }
};

// Block a user
exports.blockUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.blocked = true;
        user.blockedAt = new Date();
        user.blockedReason = reason || 'Blocked by admin';
        await user.save();

        // Create audit log
        const auditLog = new AuditLog({
            actor: req.user._id,
            targetType: 'User',
            targetId: user._id,
            action: 'block_user',
            data: { username: user.username, reason },
        });
        await auditLog.save();

        res.json({ message: 'User blocked successfully', user: { _id: user._id, blocked: true } });
    } catch (err) {
        next(err);
    }
};

// Unblock a user
exports.unblockUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.blocked = false;
        user.blockedAt = null;
        user.blockedReason = null;
        await user.save();

        // Create audit log
        const auditLog = new AuditLog({
            actor: req.user._id,
            targetType: 'User',
            targetId: user._id,
            action: 'unblock_user',
            data: { username: user.username },
        });
        await auditLog.save();

        res.json({ message: 'User unblocked successfully', user: { _id: user._id, blocked: false } });
    } catch (err) {
        next(err);
    }
};
