const mongoose = require('mongoose');
const seedGrants = require('./seedGrants');
const seedJobs = require('./seedJobs');
const seedEvents = require('./seedEvents');
const { connect } = require('../index');

const seedAll = async () => {
  try {
    await connect();
    console.log('Database connected.');

    console.log('Seeding grants...');
    await seedGrants();

    console.log('Seeding jobs...');
    await seedJobs();

    console.log('Seeding events...');
    await seedEvents();

    console.log('All data seeded successfully.');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedAll();