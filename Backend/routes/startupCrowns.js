const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const startupCrownService = require('../services/startupCrownService');

router.get('/startup/:startupId', startupCrownService.listCrownsForStartup);
router.post('/startup/:startupId', authMiddleware, startupCrownService.crownStartup);
router.delete('/startup/:startupId', authMiddleware, startupCrownService.uncrownStartup);

module.exports = router;
