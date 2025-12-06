require('dotenv').config();
const mongoose = require('mongoose');
const Grant = require('../models/Grant');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/atmosphere_dev';

// Connect to the database
mongoose.connect(MONGODB_URI);

const seedGrants = async () => {
  try {
    const adminUser = await User.findOne({ roles: { $in: ['startup'] } });
    if (!adminUser) {
      console.error('Admin user not found. Please create an admin user first.');
      return;
    }

    const grants = [
      {
        name: 'Tech Innovation Grant',
        organization: 'TechOrg',
        sector: 'Technology',
        location: 'Global',
        amount: '$50,000',
        deadline: new Date('2025-12-31'),
        type: 'grant',
        description: 'Funding for innovative tech startups.',
        url: 'https://techorg.com/grants',
        createdBy: adminUser._id,
      },
      {
        name: 'Green Energy Accelerator',
        organization: 'GreenFuture',
        sector: 'Energy',
        location: 'USA',
        amount: '$100,000',
        deadline: new Date('2026-03-15'),
        type: 'accelerator',
        description: 'Support for green energy projects.',
        url: 'https://greenfuture.com/accelerator',
        createdBy: adminUser._id,
      },
    ];

    await Grant.insertMany(grants);
    console.log('Grants seeded successfully.');
  } catch (error) {
    console.error('Error seeding grants:', error);
  } finally {
    await mongoose.connection.close();
  }
};

// Execute the seed function
seedGrants();