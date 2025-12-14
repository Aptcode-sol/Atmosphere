const mongoose = require('mongoose');
const { connect } = require('../index');
const { User, Chat, Message, Follow } = require('../models');
const bcrypt = require('bcrypt');

const DEMO_USERS = [
    {
        email: 'bablu2505@gmail.com',
        password: 'investor123',
        username: 'bablu_investor',
        displayName: 'Bablu Investor',
        roles: ['investor'],
        isVerified: true
    },
    {
        email: 'greencharge@example.com',
        password: 'startup123',
        username: 'greencharge',
        displayName: 'Green Charge',
        roles: ['startup'],
        isVerified: true
    },
    {
        email: 'airbound@example.com',
        password: 'airbound@example.com', // password same as email per prompt? or prompt said "pass:airbound@example.com"
        username: 'airbound',
        displayName: 'Airbound Logistics',
        roles: ['startup'],
        isVerified: false
    }
];

async function seedDemoData() {
    await connect();
    console.log('Connected to MongoDB');

    const usersMap = {};

    // 1. Create/Update Users
    for (const u of DEMO_USERS) {
        let user = await User.findOne({ email: u.email });
        if (!user) {
            const hashedPassword = await bcrypt.hash(u.password, 10);
            user = new User({
                email: u.email,
                username: u.username,
                password: hashedPassword,
                displayName: u.displayName,
                roles: u.roles,
                verified: u.isVerified,
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName)}&background=random`
            });
            await user.save();
            console.log(`Created user: ${u.email}`);
        } else {
            console.log(`User exists: ${u.email}`);
            // Optional: update password if needed to match prompt
            // const hashedPassword = await bcrypt.hash(u.password, 10);
            // user.password = hashedPassword;
            // await user.save();
        }
        usersMap[u.username] = user;
    }

    const bablu = usersMap['bablu_investor'];
    const green = usersMap['greencharge'];
    const airbound = usersMap['airbound'];

    // 2. Clear existing follows/chats between these specific users to avoid duplicates (optional, or just check exist)
    // For safety, let's just ensure they exist.

    // 3. Seed Follows (Everyone follows everyone for max connectivity)
    const pairs = [
        [bablu, green], [green, bablu],
        [bablu, airbound], [airbound, bablu],
        [green, airbound], [airbound, green]
    ];

    for (const [follower, following] of pairs) {
        const exists = await Follow.findOne({ follower: follower._id, following: following._id });
        if (!exists) {
            await new Follow({ follower: follower._id, following: following._id }).save();
            console.log(`${follower.username} followed ${following.username}`);
        }
    }

    // 4. Seed Normal Chats (1-on-1)
    // Bablu <-> Green
    await ensureDirectChat(bablu, green, "Hey, interested in your startup!");
    // Bablu <-> Airbound
    await ensureDirectChat(bablu, airbound, "Can we schedule a meeting?");
    // Green <-> Airbound
    await ensureDirectChat(green, airbound, "Let's collaborate on logistics.");


    // 5. Seed Group Chat (All 3)
    const groupName = "Portfolio Updates";
    let group = await Chat.findOne({ groupName, isGroup: true, groupAdmin: bablu._id });
    if (!group) {
        group = new Chat({
            isGroup: true,
            groupName,
            groupDescription: "Updates for Bablu's portfolio companies",
            groupType: 'Private',
            groupAdmin: bablu._id,
            participants: [bablu._id, green._id, airbound._id],
            messages: []
        });
        await group.save();

        const msg = new Message({
            chat: group._id,
            sender: bablu._id,
            content: "Welcome everyone to the portfolio group!"
        });
        await msg.save();
        group.lastMessage = msg._id;
        await group.save();
        console.log(`Created group chat: ${groupName}`);
    } else {
        console.log(`Group chat exists: ${groupName}`);
    }

    console.log('Demo data seeding complete!');
    process.exit(0);
}

async function ensureDirectChat(u1, u2, initialMsg) {
    let chat = await Chat.findOne({
        isGroup: false,
        participants: { $all: [u1._id, u2._id], $size: 2 }
    });

    if (!chat) {
        chat = new Chat({
            isGroup: false,
            participants: [u1._id, u2._id]
        });
        await chat.save();

        const msg = new Message({
            chat: chat._id,
            sender: u1._id,
            content: initialMsg
        });
        await msg.save();
        chat.lastMessage = msg._id;
        await chat.save();
        console.log(`Created chat between ${u1.username} and ${u2.username}`);
    } else {
        console.log(`Chat exists between ${u1.username} and ${u2.username}`);
    }
}

seedDemoData().catch(console.error);
