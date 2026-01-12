#!/usr/bin/env node
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
const { connect } = require('../index');
const { User } = require('../models');
const bcrypt = require('bcrypt');

async function resetPassword(email, newPassword) {
    await connect();
    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            console.error('User not found for email:', email);
            process.exitCode = 2;
            return;
        }

        const hash = await bcrypt.hash(newPassword, 10);
        user.passwordHash = hash;
        await user.save();

        console.log('Password updated successfully for', email);
    } catch (err) {
        console.error('Error updating password:', err);
        process.exitCode = 1;
    } finally {
        // Close mongoose connection
        const mongoose = require('mongoose');
        await mongoose.disconnect();
    }
}

if (require.main === module) {
    const email = process.argv[2] || 'sanket@gmail.com';
    const newPassword = process.argv[3] || 'Sanket@123';
    console.log(`Resetting password for ${email}`);
    resetPassword(email, newPassword).then(() => process.exit());
}
