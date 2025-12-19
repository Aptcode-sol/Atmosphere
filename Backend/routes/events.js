const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const authMiddleware = require('../middleware/authMiddleware');

// Helper to check if user is admin
const isAdmin = (user) => {
  const roles = user?.roles || [];
  return roles.includes('admin');
};

// Create a new event - Only admins can post events
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ error: 'Only admins can create events' });
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
    const { limit = 20, skip = 0 } = req.query;
    const events = await Event.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single event by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update an event - Only admins can edit events
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ error: 'Only admins can edit events' });
    }
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete an event - Only admins can delete events
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ error: 'Only admins can delete events' });
    }
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;