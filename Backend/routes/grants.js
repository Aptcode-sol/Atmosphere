const express = require('express');
const router = express.Router();
const Grant = require('../models/Grant');
const authMiddleware = require('../middleware/authMiddleware');

// Helper to check if user is admin
const isAdmin = (user) => {
  const roles = user?.roles || [];
  return roles.includes('admin');
};

// Create a new grant - Only admins can post grants
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ error: 'Only admins can create grants' });
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

// Get a single grant by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const grant = await Grant.findById(req.params.id);
    if (!grant) {
      return res.status(404).json({ error: 'Grant not found' });
    }
    res.json(grant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a grant - Only admins can edit grants
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ error: 'Only admins can edit grants' });
    }
    const grant = await Grant.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );
    if (!grant) {
      return res.status(404).json({ error: 'Grant not found' });
    }
    res.json(grant);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a grant - Only admins can delete grants
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ error: 'Only admins can delete grants' });
    }
    const grant = await Grant.findByIdAndDelete(req.params.id);
    if (!grant) {
      return res.status(404).json({ error: 'Grant not found' });
    }
    res.json({ message: 'Grant deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;