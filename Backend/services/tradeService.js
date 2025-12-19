const { Asset, Portfolio, User, Trade } = require('../models');

exports.getMarkets = async (req, res, next) => {
    try {
        // Return a simple list of assets as markets
        const assets = await Asset.find().limit(50).lean();
        // Map to lightweight market objects
        const markets = assets.map(a => ({ id: a._id, title: a.title, description: a.description, value: a.value, verified: a.verified }));
        res.json({ markets });
    } catch (err) {
        next(err);
    }
};

exports.getMyPortfolio = async (req, res, next) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const portfolio = await Portfolio.findOne({ owner: req.user._id }).populate('items').lean();
        if (!portfolio) return res.json({ portfolio: { items: [] } });
        res.json({ portfolio });
    } catch (err) {
        next(err);
    }
};

exports.placeOrder = async (req, res, next) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const { assetId, side, quantity } = req.body;
        if (!assetId || !['buy', 'sell'].includes(side) || !quantity || quantity <= 0) {
            return res.status(400).json({ error: 'Invalid order payload' });
        }

        const asset = await Asset.findById(assetId);
        if (!asset) return res.status(404).json({ error: 'Asset not found' });

        // Simplified order: update portfolio for buy/sell
        let portfolio = await Portfolio.findOne({ owner: req.user._id });
        if (!portfolio) {
            portfolio = new Portfolio({ owner: req.user._id, items: [] });
        }

        if (side === 'buy') {
            // add asset reference if not present
            if (!portfolio.items.map(String).includes(String(asset._id))) portfolio.items.push(asset._id);
        } else {
            // sell -> remove asset reference (first occurrence)
            portfolio.items = portfolio.items.filter(i => String(i) !== String(asset._id));
        }

        await portfolio.save();

        return res.json({ message: 'order executed', side, asset: { id: asset._id, title: asset.title }, portfolio: { items: portfolio.items } });
    } catch (err) {
        next(err);
    }
};

// Create a new trade
exports.createTrade = async (req, res, next) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        const {
            companyId,
            companyName,
            companyType,
            companyAge,
            revenueStatus,
            description,
            startupUsername,
            sellingRangeMin,
            sellingRangeMax,
            selectedIndustries,
            isManualEntry,
            externalLinkHeading,
            externalLinkUrl,
            videoUrl,
            videoThumbnailUrl,
            imageUrls
        } = req.body;

        // Validation
        if (!companyId || !companyName || !revenueStatus || sellingRangeMin == null || sellingRangeMax == null) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (selectedIndustries && selectedIndustries.length > 3) {
            return res.status(400).json({ error: 'Maximum 3 industries allowed' });
        }

        const trade = new Trade({
            user: req.user._id,
            companyId,
            companyName,
            companyType: companyType || [],
            companyAge,
            revenueStatus,
            description,
            startupUsername,
            sellingRangeMin,
            sellingRangeMax,
            selectedIndustries: selectedIndustries || [],
            isManualEntry: isManualEntry || false,
            externalLinkHeading,
            externalLinkUrl,
            videoUrl: videoUrl || '',
            videoThumbnailUrl: videoThumbnailUrl || '',
            imageUrls: imageUrls || []
        });

        await trade.save();

        res.status(201).json({ trade });
    } catch (err) {
        next(err);
    }
};

// Get all trades for the logged-in user
exports.getMyTrades = async (req, res, next) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        const trades = await Trade.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .lean();

        res.json({ trades });
    } catch (err) {
        next(err);
    }
};

// Get all active trades (for BUY tab)
exports.getAllTrades = async (req, res, next) => {
    try {
        const { limit = 20, skip = 0, q, type, revenueStatus, industries } = req.query;
        const filter = {};

        // Search text
        if (q) {
            filter.$or = [
                { companyName: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { companyType: { $regex: q, $options: 'i' } }
            ];
        }

        // Apply filters
        if (revenueStatus) filter.revenueStatus = revenueStatus;
        if (industries) {
            const industryList = industries.split(',');
            if (industryList.length > 0) {
                filter.selectedIndustries = { $in: industryList };
            }
        }

        const trades = await Trade.find(filter)
            .populate('user', 'username displayName avatarUrl')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .lean();

        res.json({ trades });
    } catch (err) {
        next(err);
    }
};

// Get single trade by ID
exports.getTradeById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const trade = await Trade.findById(id).populate('user', 'username displayName avatarUrl').lean();

        if (!trade) {
            return res.status(404).json({ error: 'Trade not found' });
        }

        res.json({ trade });
    } catch (err) {
        next(err);
    }
};

// Update a trade
exports.updateTrade = async (req, res, next) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        const { id } = req.params;
        const trade = await Trade.findById(id);

        if (!trade) {
            return res.status(404).json({ error: 'Trade not found' });
        }

        // Check ownership
        if (String(trade.user) !== String(req.user._id)) {
            return res.status(403).json({ error: 'Not authorized to update this trade' });
        }

        const {
            companyType,
            companyAge,
            revenueStatus,
            description,
            startupUsername,
            sellingRangeMin,
            sellingRangeMax,
            selectedIndustries,
            externalLinkHeading,
            externalLinkUrl,
            videoUrl,
            videoThumbnailUrl,
            imageUrls
        } = req.body;

        // Update fields
        if (companyType !== undefined) trade.companyType = companyType;
        if (companyAge !== undefined) trade.companyAge = companyAge;
        if (revenueStatus !== undefined) trade.revenueStatus = revenueStatus;
        if (description !== undefined) trade.description = description;
        if (startupUsername !== undefined) trade.startupUsername = startupUsername;
        if (sellingRangeMin !== undefined) trade.sellingRangeMin = sellingRangeMin;
        if (sellingRangeMax !== undefined) trade.sellingRangeMax = sellingRangeMax;
        if (selectedIndustries !== undefined) {
            if (selectedIndustries.length > 3) {
                return res.status(400).json({ error: 'Maximum 3 industries allowed' });
            }
            trade.selectedIndustries = selectedIndustries;
        }
        if (externalLinkHeading !== undefined) trade.externalLinkHeading = externalLinkHeading;
        if (externalLinkUrl !== undefined) trade.externalLinkUrl = externalLinkUrl;
        if (videoUrl !== undefined) trade.videoUrl = videoUrl;
        if (videoThumbnailUrl !== undefined) trade.videoThumbnailUrl = videoThumbnailUrl;
        if (imageUrls !== undefined) trade.imageUrls = imageUrls;

        trade.isEdited = true;

        await trade.save();

        res.json({ trade });
    } catch (err) {
        next(err);
    }
};

// Delete a trade
exports.deleteTrade = async (req, res, next) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        const { id } = req.params;
        const trade = await Trade.findById(id);

        if (!trade) {
            return res.status(404).json({ error: 'Trade not found' });
        }

        // Check ownership
        if (String(trade.user) !== String(req.user._id)) {
            return res.status(403).json({ error: 'Not authorized to delete this trade' });
        }

        await Trade.findByIdAndDelete(id);

        res.json({ message: 'Trade deleted successfully' });
    } catch (err) {
        next(err);
    }
};

// Increment view count
exports.incrementViews = async (req, res, next) => {
    try {
        const { id } = req.params;

        const trade = await Trade.findByIdAndUpdate(
            id,
            { $inc: { views: 1 } },
            { new: true }
        );

        if (!trade) {
            return res.status(404).json({ error: 'Trade not found' });
        }

        res.json({ views: trade.views });
    } catch (err) {
        next(err);
    }
};

// Toggle save (track users in savedByUsers array)
exports.toggleSave = async (req, res, next) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        const { id } = req.params;
        const { saved } = req.body; // true to save, false to unsave
        const userId = req.user._id;

        let updateOperation;
        if (saved) {
            // Add user to savedByUsers and increment saves count
            updateOperation = {
                $addToSet: { savedByUsers: userId },
                $inc: { saves: 1 }
            };
        } else {
            // Remove user from savedByUsers and decrement saves count
            updateOperation = {
                $pull: { savedByUsers: userId },
                $inc: { saves: -1 }
            };
        }

        const trade = await Trade.findByIdAndUpdate(id, updateOperation, { new: true });

        if (!trade) {
            return res.status(404).json({ error: 'Trade not found' });
        }

        res.json({ saves: trade.saves, saved: trade.savedByUsers.includes(userId) });
    } catch (err) {
        next(err);
    }
};

// Get all trades saved by the current user
exports.getSavedTrades = async (req, res, next) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        const userId = req.user._id;
        const trades = await Trade.find({ savedByUsers: userId })
            .populate('user', 'displayName username avatarUrl')
            .sort({ createdAt: -1 });

        // Return just the trade IDs for efficiency
        const savedTradeIds = trades.map(t => t._id.toString());
        res.json({ savedTradeIds, trades });
    } catch (err) {
        next(err);
    }
};
