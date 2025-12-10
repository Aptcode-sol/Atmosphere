#!/usr/bin/env node
const { connect, close, models } = require('../index');
const mongoose = require('mongoose');

async function run(userId) {
    try {
        await connect();
        const Follow = models.Follow;
        console.log('Checking follows for user:', userId);
        const followers = await Follow.find({ following: userId }).limit(50).lean();
        const following = await Follow.find({ follower: userId }).limit(50).lean();
        console.log('followersCount:', followers.length);
        console.log('followingCount:', following.length);
        console.log('sample followers:', followers.slice(0, 5));
        console.log('sample following:', following.slice(0, 5));
    } catch (e) {
        console.error(e);
    } finally {
        await close();
    }
}

const uid = process.argv[2];
if (!uid) {
    console.error('Usage: node scripts/checkFollows.js <userId>');
    process.exit(1);
}
run(uid).catch(console.error);
