const mongoose = require('mongoose');
const { User, Meeting } = require('../models');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/atmosphere_dev';

const seedMeetings = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for meetings seeding');

    // Find our test users
    const user1 = await User.findOne({ email: 'babblu2505@gmail.com' });
    const user2 = await User.findOne({ email: 'greencharge@example.com' });

    if (!user1 || !user2) {
      console.log('Test users not found. Run seedTestUsers first.');
      return;
    }

    // Remove old seeded meetings created by this script
    await Meeting.deleteMany({ 'meta.seededBy': 'seedMeetings' });

    const now = new Date();

    const meetings = [
      new Meeting({
        organizer: user2._id,
        title: 'Drone tech startups pitch meeting',
        description: 'Pitch session featuring innovative drone startups in EV and CleanTech.',
        scheduledAt: new Date(now.getTime() + 3600 * 1000), // 1 hour from now
        duration: 45,
        participants: [{ userId: user1._id, status: 'invited' }],
        participantsCount: 1,
        meetingLink: 'https://meet.example.com/drone-pitch',
        type: 'pitch',
        meta: { seededBy: 'seedMeetings' },
      }),
      new Meeting({
        organizer: user1._id,
        title: 'HealthTech Innovation Summit',
        description: 'Connect with healthcare innovators and explore digital health.',
        scheduledAt: new Date(now.getTime() + 2 * 3600 * 1000), // 2 hours from now
        duration: 45,
        participants: [{ userId: user2._id, status: 'invited' }],
        participantsCount: 1,
        meetingLink: 'https://meet.example.com/healthtech',
        type: 'networking',
        meta: { seededBy: 'seedMeetings' },
      }),
    ];

    for (const m of meetings) await m.save();
    console.log('Meetings seeded:', meetings.length);
  } catch (err) {
    console.error('Error seeding meetings:', err);
  } finally {
    mongoose.connection.close();
  }
};

seedMeetings();
