require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../models/Event');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/atmosphere_dev';

// Connect to the database
mongoose.connect(MONGODB_URI);

const seedEvents = async () => {
  try {

    const adminUser = await User.findOne({ roles: { $in: ['startup'] } });
    if (!adminUser) {
      console.error('Admin user not found. Please create an admin user first.');
      return;
    }

    const events = [
      {
        name: 'Tech Conference 2025',
        organizer: 'TechWorld',
        location: 'San Francisco, USA',
        date: new Date('2025-12-15'),
        time: '10:00 AM',
        description: 'A conference for tech enthusiasts.',
        url: 'https://techworld.com/events/tech-conference-2025',
        createdBy: adminUser._id,
      },
      {
        name: 'Startup Pitch Night',
        organizer: 'InnovatorsHub',
        location: 'London, UK',
        date: new Date('2026-01-20'),
        time: '6:00 PM',
        description: 'Pitch your startup ideas to investors.',
        url: 'https://innovatorshub.com/events/startup-pitch-night',
        createdBy: adminUser._id,
      },
    ];

    await Event.insertMany(events);
    console.log('Events seeded successfully.');
  } catch (error) {
    console.error('Error seeding events:', error);
  } finally {
    await mongoose.connection.close();
  }
};

// Execute the seed function
seedEvents();