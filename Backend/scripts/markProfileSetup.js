#!/usr/bin/env node
// Usage: node scripts/markProfileSetup.js [accountType]
// Example: node scripts/markProfileSetup.js startup

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { User } = require('../models');

const MONGO = process.env.MONGO_URL || process.env.MONGO || 'mongodb://localhost:27017/atmosphere';

(async () => {
    try {
        await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
        const accountType = process.argv[2];
        const filter = {};
        if (accountType) filter.accountType = accountType;
        const res = await User.updateMany(filter, { $set: { profileSetupComplete: true, onboardingStep: 4 } });
        // console.log('Updated users:', res.modifiedCount || res.nModified || 0);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
