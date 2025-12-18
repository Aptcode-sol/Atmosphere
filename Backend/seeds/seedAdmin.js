/**
 * Admin Seed Script
 * Run this to create an admin user: node seeds/seedAdmin.js
 * 
 * Configure admin credentials below:
 */

// ========== CONFIGURE ADMIN CREDENTIALS HERE ==========
const ADMIN_EMAIL = 'admin@atmosphere.com';
const ADMIN_PASSWORD = 'Admin@123';
const ADMIN_USERNAME = 'admin';
// =======================================================

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/atmosphere';

async function seedAdmin() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Import User model
        const { User } = require('../models');

        // Hash password
        const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

        // Check if user already exists
        let user = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });

        if (user) {
            // Update existing user to be admin
            user.passwordHash = passwordHash;
            if (!user.roles.includes('admin')) {
                user.roles.push('admin');
            }
            user.verified = true;
            await user.save();
            console.log('✅ Existing user updated to admin:');
        } else {
            // Create new admin user
            user = new User({
                email: ADMIN_EMAIL.toLowerCase(),
                username: ADMIN_USERNAME,
                passwordHash,
                roles: ['admin'],
                verified: true,
                displayName: ADMIN_USERNAME,
            });
            await user.save();
            console.log('✅ Admin user created:');
        }

        console.log(`   Email: ${user.email}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Roles: ${user.roles.join(', ')}`);

        await mongoose.disconnect();
        console.log('\nDone! You can now login to the admin dashboard.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding admin:', error.message);
        process.exit(1);
    }
}

seedAdmin();
