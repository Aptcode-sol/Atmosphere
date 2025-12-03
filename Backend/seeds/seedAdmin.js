const mongoose = require('mongoose');
require('dotenv').config();
const { User } = require('../models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/atmosphere_dev';

async function run() {
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB for seeding');

    const exists = await User.findOne({ email: 'admin@atmosphere.local' });
    if (exists) {
        console.log('Admin exists');
        process.exit(0);
    }

    const admin = new User({
        email: 'admin@atmosphere.local',
        username: 'admin',
        displayName: 'Admin',
        roles: ['admin'],
        verified: true,
    });

    await admin.save();
    console.log('Admin user created');
    process.exit(0);
}

run().catch((err) => { console.error(err); process.exit(1); });
