/*
Migration: move likesCount/commentsCount to meta.likes and meta.commentsCount
Run with: node migrations/migrate_counts_to_meta.js
Make sure your MongoDB is running and the app's NODE_ENV/config points to the right DB.
This script is idempotent: it will not overwrite existing meta likes/comments if present.
*/

const mongoose = require('mongoose');
const StartupDetails = require('../models/StartupDetails');
const Post = require('../models/Post');

async function migrate() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/atmosphere';
    await mongoose.connect(uri);
    console.log('Connected to', uri);

    // StartupDetails
    const startups = await StartupDetails.find().lean();
    console.log('Found', startups.length, 'startup docs');
    let updatedStartups = 0;
    for (const s of startups) {
        const updates = {};
        if (!(s.meta && typeof s.meta.likes === 'number') && typeof s.likesCount === 'number') updates['meta.likes'] = s.likesCount;
        if (!(s.meta && typeof s.meta.commentsCount === 'number') && typeof s.commentsCount === 'number') updates['meta.commentsCount'] = s.commentsCount;
        if (Object.keys(updates).length > 0) {
            console.log('Updating StartupDetails', s._id.toString(), updates);
            await StartupDetails.updateOne({ _id: s._id }, { $set: updates });
            updatedStartups++;
        }
    }
    console.log('Updated', updatedStartups, 'startup docs');

    // Posts
    const posts = await Post.find().lean();
    console.log('Found', posts.length, 'post docs');
    let updatedPosts = 0;
    for (const p of posts) {
        const updates = {};
        if (!(p.meta && typeof p.meta.likes === 'number') && typeof p.likesCount === 'number') updates['meta.likes'] = p.likesCount;
        if (!(p.meta && typeof p.meta.commentsCount === 'number') && typeof p.commentsCount === 'number') updates['meta.commentsCount'] = p.commentsCount;
        if (Object.keys(updates).length > 0) {
            console.log('Updating Post', p._id.toString(), updates);
            await Post.updateOne({ _id: p._id }, { $set: updates });
            updatedPosts++;
        }
    }
    console.log('Updated', updatedPosts, 'post docs');

    console.log('Migration complete');
    await mongoose.disconnect();
}

migrate().catch(err => {
    console.error('Migration failed', err);
    process.exit(1);
});
