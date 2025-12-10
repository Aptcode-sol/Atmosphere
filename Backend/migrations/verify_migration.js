const mongoose = require('mongoose');
const StartupDetails = require('../models/StartupDetails');
const Post = require('../models/Post');

async function verify() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/atmosphere';
    await mongoose.connect(uri);
    console.log('Connected to', uri);

    const sampleStartups = await StartupDetails.find().limit(5).select('name likesCount commentsCount meta').lean();
    console.log('Sample startups:');
    sampleStartups.forEach(s => {
        console.log(JSON.stringify({ _id: s._id, name: s.name, likesCount: s.likesCount, commentsCount: s.commentsCount, meta: s.meta }, null, 2));
    });

    const samplePosts = await Post.find().limit(5).select('title likesCount commentsCount meta').lean();
    console.log('Sample posts:');
    samplePosts.forEach(p => {
        console.log(JSON.stringify({ _id: p._id, title: p.title, likesCount: p.likesCount, commentsCount: p.commentsCount, meta: p.meta }, null, 2));
    });

    await mongoose.disconnect();
}

verify().catch(err => {
    console.error('Verify failed', err);
    process.exit(1);
});
