const express = require('express');
const router = express.Router();
const Grant = require('../models/Grant');
const authMiddleware = require('../middleware/authMiddleware');

// Create a new grant - Only investors can post grants
router.post('/', authMiddleware, async (req, res) => {
  try {
    const roles = req.user.roles || [];
    if (!roles.includes('investor')) {
      return res.status(403).json({ error: 'Only investors can post grants' });
    }
    const grant = new Grant({ ...req.body, createdBy: req.user._id });
    await grant.save();
    res.status(201).json(grant);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all grants
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { limit = 20, skip = 0 } = req.query;
    const grants = await Grant.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    res.json(grants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;