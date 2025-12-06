const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const authMiddleware = require('../middleware/authMiddleware');

// Create a new event - Both startups and investors can post events
router.post('/', authMiddleware, async (req, res) => {
  try {
    const roles = req.user.roles || [];
    if (!roles.includes('startup') && !roles.includes('investor')) {
      return res.status(403).json({ error: 'Only startups and investors can post events' });
    }
    const event = new Event({ ...req.body, createdBy: req.user._id });
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all events
router.get('/', authMiddleware, async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;