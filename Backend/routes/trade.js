const express = require('express');
const router = express.Router();
const tradeService = require('../services/tradeService');
const authMiddleware = require('../middleware/authMiddleware');
const optionalAuth = require('../middleware/optionalAuth');

// Existing routes
router.get('/markets', optionalAuth, tradeService.getMarkets);
router.get('/portfolio', authMiddleware, tradeService.getMyPortfolio);
router.post('/order', authMiddleware, tradeService.placeOrder);

// New trade routes
router.post('/trades', authMiddleware, tradeService.createTrade);
router.get('/trades/my', authMiddleware, tradeService.getMyTrades);
router.get('/trades', optionalAuth, tradeService.getAllTrades);
router.get('/trades/:id', optionalAuth, tradeService.getTradeById);
router.put('/trades/:id', authMiddleware, tradeService.updateTrade);
router.delete('/trades/:id', authMiddleware, tradeService.deleteTrade);
router.post('/trades/:id/view', optionalAuth, tradeService.incrementViews);
router.post('/trades/:id/save', authMiddleware, tradeService.toggleSave);
router.get('/trades/saved', authMiddleware, tradeService.getSavedTrades);

module.exports = router;
