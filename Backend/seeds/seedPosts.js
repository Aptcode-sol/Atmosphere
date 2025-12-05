const mongoose = require('mongoose');
require('dotenv').config();
const { User, Post } = require('../models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/atmosphere_dev';

// Sample post data with images
const postContents = [
    {
        content: "Just launched our new AI-powered analytics dashboard! 🚀 The early feedback has been incredible. Our beta users are reporting 40% improvement in workflow efficiency.",
        tags: ['ai', 'startup', 'analytics', 'launch'],
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop'
    },
    {
        content: "Excited to announce our Series A funding round! We've raised $5M to accelerate our product development and expand our team. Thank you to all our supporters! 🙌",
        tags: ['funding', 'series-a', 'milestone', 'growth'],
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop'
    },
    {
        content: "Working on something special for our next release. The team has been putting in incredible effort to bring this to life. Can't wait to share more details soon!",
        tags: ['product', 'development', 'updates', 'coming-soon'],
        image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop'
    },
    {
        content: "Just spoke at the TechCrunch Disrupt conference about the future of sustainable technology. Great conversations with founders from around the world!",
        tags: ['conference', 'speaking', 'networking', 'tech'],
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop'
    },
    {
        content: "We're hiring! Looking for talented Full-Stack developers and Product Designers to join our growing team. If you're interested in building the future, send us a message! 💼",
        tags: ['hiring', 'jobs', 'careers', 'team'],
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop'
    },
    {
        content: "Deep dive into our customer success story: How ABC Corp increased their productivity by 3x using our platform. Read the full case study on our blog.",
        tags: ['customers', 'case-study', 'success', 'testimonial'],
        image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop'
    },
    {
        content: "The market for sustainable solutions is growing 3x faster than traditional tech. We're positioned at the intersection of innovation and environmental impact. 🌱",
        tags: ['market', 'sustainability', 'trends', 'opportunity'],
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop'
    },
    {
        content: "Just hit 50k users on our platform! Thank you to every single person who's been part of this journey. Your feedback drives everything we build.",
        tags: ['milestone', 'community', 'growth', 'thanks'],
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop'
    },
    {
        content: "New blog post: 5 strategies for bootstrapping your startup with limited resources. Drop by our blog for some practical insights!",
        tags: ['startup', 'resources', 'blog', 'tips'],
        image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop'
    },
    {
        content: "Thrilled to announce our partnership with leading industry players. Together, we're going to revolutionize how businesses approach digital transformation.",
        tags: ['partnership', 'collaboration', 'announcement', 'growth'],
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop'
    },
    {
        content: "The importance of company culture in scaling startups. After 3 years, I've learned that your team makes or breaks your mission. Invest in your people! ❤️",
        tags: ['culture', 'leadership', 'team', 'advice'],
        image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop'
    },
    {
        content: "Our new mobile app is now available on iOS and Android! Download it today and get exclusive early-bird features. Link in bio! 📱",
        tags: ['mobile', 'app', 'launch', 'ios', 'android'],
        image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop'
    },
    {
        content: "Attending the Global Founders Summit next month. Excited to connect with fellow entrepreneurs and share our story with the world!",
        tags: ['event', 'networking', 'founders', 'global'],
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop'
    },
    {
        content: "We just became a certified B Corp! This certification reflects our commitment to social and environmental responsibility alongside business profitability.",
        tags: ['bcorp', 'social-responsibility', 'sustainability', 'certification'],
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop'
    },
    {
        content: "Live demo tomorrow at 2 PM PST of our latest features. Join us on Instagram Live to see what we've been working on! 👀",
        tags: ['demo', 'features', 'livestream', 'community'],
        image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop'
    },
    {
        content: "Grateful for our angel investors who believed in our vision from day one. Your guidance and support have been invaluable in shaping our journey.",
        tags: ['investors', 'gratitude', 'journey', 'support'],
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop'
    },
    {
        content: "New whitepaper: The Future of AI in Business Operations. Dive deep into trends, challenges, and opportunities in the AI landscape.",
        tags: ['whitepaper', 'ai', 'research', 'insights'],
        image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop'
    },
    {
        content: "Just celebrated 3 years since we started this crazy journey in a garage! 🎉 From 0 to 100k users - thank you all for believing in us!",
        tags: ['anniversary', 'milestone', 'celebration', 'gratitude'],
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop'
    },
    {
        content: "The power of customer feedback: We've completely redesigned our UX based on your input. Can't wait for you to experience the new interface!",
        tags: ['feedback', 'ux', 'design', 'customer-focused'],
        image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop'
    },
    {
        content: "Breaking: Our latest research shows that companies using our solution see 2.5x ROI within the first year. Full report available on our website! 📊",
        tags: ['research', 'roi', 'data', 'impact'],
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop'
    }
];

async function seedPosts() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Get all users
        const users = await User.find();
        
        if (users.length === 0) {
            console.log('❌ No users found. Please run seedUsersAndPost.js first!');
            process.exit(1);
        }

        console.log(`\n📝 Found ${users.length} users. Creating posts...`);

        let postsCreated = 0;

        // Create multiple posts for each user
        for (const user of users) {
            console.log(`\n📤 Creating posts for user: ${user.displayName || user.username}`);
            
            for (let i = 0; i < 4; i++) {
                const randomPost = postContents[Math.floor(Math.random() * postContents.length)];
                
                const post = new Post({
                    author: user._id,
                    content: randomPost.content,
                    tags: randomPost.tags,
                    visibility: 'public',
                    likesCount: Math.floor(Math.random() * 500) + 10,
                    commentsCount: Math.floor(Math.random() * 50) + 2,
                    media: [
                        {
                            url: randomPost.image,
                            type: 'image',
                            thumbUrl: randomPost.image
                        }
                    ],
                    meta: {
                        postType: Math.random() > 0.7 ? 'reel' : 'post'
                    }
                });

                await post.save();
                postsCreated++;
                console.log(`   ✓ Post ${postsCreated} created`);
            }
        }

        console.log(`\n✅ Successfully created ${postsCreated} posts!`);
        console.log(`\n📊 Seeding Summary:`);
        console.log(`   - Total Users: ${users.length}`);
        console.log(`   - Total Posts Created: ${postsCreated}`);
        console.log(`   - Posts per User: ${postsCreated / users.length}`);
        
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding posts:', error.message);
        process.exit(1);
    }
}

seedPosts();
