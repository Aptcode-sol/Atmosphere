const express = require('express');
const router = express.Router();

const startupService = require('../services/startupService');
const authMiddleware = require('../middleware/authMiddleware');
const optionalAuth = require('../middleware/optionalAuth');

router.post('/', authMiddleware, startupService.createStartup);
router.get('/', optionalAuth, startupService.listStartupCards);
router.get('/:userId', startupService.getStartupByUser);
router.put('/:id', authMiddleware, startupService.updateStartup);

module.exports = router;
