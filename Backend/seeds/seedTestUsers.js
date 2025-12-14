const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { User, Chat, Message } = require('../models');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/atmosphere_dev';

const seedTestUsers = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Hash passwords for test users
        const password1Hash = await bcrypt.hash('investor123', 10);
        const password2Hash = await bcrypt.hash('startup123', 10);

        // Create or find test users
        const user1 = await User.findOneAndUpdate(
            { email: 'babblu2505@gmail.com' },
            {
                email: 'babblu2505@gmail.com',
                username: 'babblu2505',
                displayName: 'Bablu Kumar',
                fullName: 'Bablu Kumar',
                roles: ['investor'],
                otpVerified: true,
                verified: true,
                profileSetupComplete: true,
                passwordHash: password1Hash,
                avatarUrl: 'https://via.placeholder.com/100?text=BK',
            },
            { upsert: true, new: true }
        );

        const user2 = await User.findOneAndUpdate(
            { email: 'greencharge@example.com' },
            {
                email: 'greencharge@example.com',
                username: 'greencharge',
                displayName: 'Green Charge',
                fullName: 'Green Charge Team',
                roles: ['startup'],
                otpVerified: true,
                verified: true,
                profileSetupComplete: true,
                passwordHash: password2Hash,
                avatarUrl: 'https://via.placeholder.com/100?text=GC',
            },
            { upsert: true, new: true }
        );

        console.log('Users created/updated:', user1._id, user2._id);

        // Create or find chat between them
        let chat = await Chat.findOne({
            participants: { $all: [user1._id, user2._id] },
        });

        if (!chat) {
            chat = new Chat({
                participants: [user1._id, user2._id],
            });
            await chat.save();
            console.log('Chat created:', chat._id);
        } else {
            console.log('Chat already exists:', chat._id);
        }

        // Delete existing messages for this chat
        await Message.deleteMany({ chat: chat._id });

        // Seed messages
        const messages = [
            {
                chat: chat._id,
                sender: user1._id,
                body: 'Hi there! I am interested in your green energy project.',
                createdAt: new Date(Date.now() - 5 * 60000), // 5 mins ago
            },
            {
                chat: chat._id,
                sender: user2._id,
                body: 'Hello! Thanks for reaching out. We are working on sustainable energy solutions.',
                createdAt: new Date(Date.now() - 4 * 60000), // 4 mins ago
            },
            {
                chat: chat._id,
                sender: user1._id,
                body: 'That sounds promising! Can we schedule a call to discuss the details?',
                createdAt: new Date(Date.now() - 3 * 60000), // 3 mins ago
            },
            {
                chat: chat._id,
                sender: user2._id,
                body: 'Absolutely! How about tomorrow at 2 PM?',
                createdAt: new Date(Date.now() - 2 * 60000), // 2 mins ago
            },
            {
                chat: chat._id,
                sender: user1._id,
                body: 'Perfect! Looking forward to it. Send me the meeting link.',
                createdAt: new Date(Date.now() - 1 * 60000), // 1 min ago
            },
        ];

        const savedMessages = await Message.insertMany(messages);
        console.log('Messages seeded:', savedMessages.length);

        // Update lastMessage in chat
        const lastMessage = savedMessages[savedMessages.length - 1];
        await Chat.findByIdAndUpdate(chat._id, {
            lastMessage: lastMessage._id,
            unreadCounts: {
                [user1._id.toString()]: 0,
                [user2._id.toString()]: 0,
            },
        });

        console.log('Chat updated with lastMessage');
        console.log('\n✅ Seeding complete!');
        console.log('User 1 (Investor):', user1.email, user1._id);
        console.log('User 2 (Startup):', user2.email, user2._id);
        console.log('Chat ID:', chat._id);
        console.log('Messages count:', savedMessages.length);

    } catch (error) {
        console.error('Error seeding test users:', error);
    } finally {
        mongoose.connection.close();
    }
};

seedTestUsers();
