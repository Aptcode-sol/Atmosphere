require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../models/Job');
const User = require('../models/User');

console.log('Starting the seedJobs script...');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/atmosphere_dev';

// Connect to the database
mongoose.connect(MONGODB_URI);

mongoose.connection.on('connected', () => {
  console.log('Database connection established successfully.');
});

mongoose.connection.on('error', (err) => {
  console.error('Database connection error:', err);
});

const seedJobs = async () => {

  try {
    console.log('Connecting to the database...');
    const startupUser = await User.findOne({ roles: { $in: ['startup'] } });
    if (!startupUser) {
      console.error('Startup user not found. Please create a startup user first.');
      return;
    }
    console.log('Startup user found:', startupUser);

    const jobs = [
      {
        poster: startupUser._id,
        title: 'Software Engineer',
        sector: 'Technology',
        locationType: 'Remote',
        employmentType: 'full-time',
        compensation: '$80,000 - $100,000',
        requirements: 'JavaScript, React, Node.js',
      },
      {
        poster: startupUser._id,
        title: 'Data Analyst',
        sector: 'Data & Analytics',
        locationType: 'New York, USA',
        employmentType: 'contract',
        compensation: '$60/hour',
        requirements: 'SQL, Python, Tableau',
      },
    ];

    console.log('Attempting to insert jobs into the database...');
    await Job.insertMany(jobs);
    console.log('Jobs inserted successfully.');
  } catch (error) {
    console.error('Error seeding jobs:', error);
  } finally {
    await mongoose.connection.close();
  }
};

// Execute the seed function
seedJobs();

module.exports = seedJobs;