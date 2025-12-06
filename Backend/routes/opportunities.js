const express = require('express');
const router = express.Router();
const Grant = require('../models/Grant');
const Job = require('../models/Job');
const Event = require('../models/Event');
const authMiddleware = require('../middleware/authMiddleware');

// Get all opportunities (grants, jobs, events)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const grants = await Grant.find();
    const jobs = await Job.find();
    const events = await Event.find();

    res.json({
      grants,
      jobs,
      events,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;