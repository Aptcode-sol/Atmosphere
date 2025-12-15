const jwt = require('jsonwebtoken');
const { User, Message, Chat } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

let io = null;
const userSockets = new Map(); // userId -> Set of socket IDs

/**
 * Initialize Socket.IO server with authentication
 * @param {import('socket.io').Server} socketServer 
 */
function initializeSocket(socketServer) {
    io = socketServer;

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
            
            if (!token) {
                return next(new Error('Authentication required'));
            }

            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await User.findById(decoded.userId).select('-passwordHash');
            
            if (!user) {
                return next(new Error('User not found'));
            }

            socket.userId = user._id.toString();
            socket.user = user;
            next();
        } catch (err) {
            console.error('Socket auth error:', err.message);
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.userId}`);
        
        // Track user's socket
        if (!userSockets.has(socket.userId)) {
            userSockets.set(socket.userId, new Set());
        }
        userSockets.get(socket.userId).add(socket.id);

        // Join user's personal room for direct notifications
        socket.join(`user:${socket.userId}`);

        // Auto-join all chat rooms the user participates in
        joinUserChats(socket);

        // Handle joining a specific chat room
        socket.on('join:chat', async (chatId) => {
            try {
                const chat = await Chat.findById(chatId);
                if (chat && chat.participants.some(p => p.toString() === socket.userId)) {
                    socket.join(`chat:${chatId}`);
                    console.log(`User ${socket.userId} joined chat:${chatId}`);
                    
                    // Mark messages as delivered when user joins
                    await markMessagesDelivered(chatId, socket.userId);
                }
            } catch (err) {
                console.error('Error joining chat:', err);
            }
        });

        // Handle leaving a chat room
        socket.on('leave:chat', (chatId) => {
            socket.leave(`chat:${chatId}`);
        });

        // Handle new message
        socket.on('message:send', async (data) => {
            try {
                const { chatId, content, type = 'text', attachments = [], replyTo } = data;
                
                const chat = await Chat.findById(chatId);
                if (!chat || !chat.participants.some(p => p.toString() === socket.userId)) {
                    socket.emit('error', { message: 'Not authorized to send to this chat' });
                    return;
                }

                // Create message
                const message = new Message({
                    chat: chatId,
                    sender: socket.userId,
                    body: content,
                    type,
                    attachments,
                    replyTo,
                    status: 'sent'
                });
                await message.save();
                await message.populate('sender', 'username displayName avatarUrl');
                if (replyTo) {
                    await message.populate('replyTo', 'body sender');
                }

                // Update chat's lastMessage
                chat.lastMessage = message._id;
                
                // Update unread counts for other participants
                const unreadCounts = { ...chat.unreadCounts };
                chat.participants.forEach(participantId => {
                    const pid = participantId.toString();
                    if (pid !== socket.userId) {
                        unreadCounts[pid] = (unreadCounts[pid] || 0) + 1;
                    }
                });
                chat.unreadCounts = unreadCounts;
                await chat.save();

                // Emit to chat room
                io.to(`chat:${chatId}`).emit('message:new', {
                    message: message.toObject(),
                    chatId
                });

                // Check if recipients are online and mark as delivered
                chat.participants.forEach(participantId => {
                    const pid = participantId.toString();
                    if (pid !== socket.userId && userSockets.has(pid)) {
                        // User is online, mark as delivered
                        Message.findByIdAndUpdate(message._id, {
                            status: 'delivered',
                            deliveredAt: new Date()
                        }).exec();
                        
                        socket.emit('message:status', {
                            messageId: message._id,
                            status: 'delivered'
                        });
                    }
                });

            } catch (err) {
                console.error('Error sending message:', err);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Handle typing indicator
        socket.on('typing:start', (chatId) => {
            socket.to(`chat:${chatId}`).emit('typing:update', {
                chatId,
                userId: socket.userId,
                user: { displayName: socket.user.displayName, username: socket.user.username },
                isTyping: true
            });
        });

        socket.on('typing:stop', (chatId) => {
            socket.to(`chat:${chatId}`).emit('typing:update', {
                chatId,
                userId: socket.userId,
                user: { displayName: socket.user.displayName, username: socket.user.username },
                isTyping: false
            });
        });

        // Handle message read
        socket.on('message:read', async ({ chatId, messageIds }) => {
            try {
                await Message.updateMany(
                    { _id: { $in: messageIds }, sender: { $ne: socket.userId } },
                    { status: 'read', readAt: new Date() }
                );

                // Reset unread count for this user
                await Chat.findByIdAndUpdate(chatId, {
                    $set: { [`unreadCounts.${socket.userId}`]: 0 }
                }, { timestamps: false });

                // Notify senders their messages were read
                const messages = await Message.find({ _id: { $in: messageIds } });
                messages.forEach(msg => {
                    const senderId = msg.sender.toString();
                    if (userSockets.has(senderId)) {
                        io.to(`user:${senderId}`).emit('message:status', {
                            messageId: msg._id,
                            status: 'read',
                            readAt: new Date()
                        });
                    }
                });

            } catch (err) {
                console.error('Error marking messages read:', err);
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.userId}`);
            const sockets = userSockets.get(socket.userId);
            if (sockets) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    userSockets.delete(socket.userId);
                }
            }
        });
    });

    console.log('Socket.IO server initialized');
}

/**
 * Join user to all their chat rooms
 */
async function joinUserChats(socket) {
    try {
        const chats = await Chat.find({ participants: socket.userId }).select('_id');
        chats.forEach(chat => {
            socket.join(`chat:${chat._id}`);
        });
    } catch (err) {
        console.error('Error joining user chats:', err);
    }
}

/**
 * Mark unread messages as delivered when user connects
 */
async function markMessagesDelivered(chatId, userId) {
    try {
        const result = await Message.updateMany(
            { chat: chatId, sender: { $ne: userId }, status: 'sent' },
            { status: 'delivered', deliveredAt: new Date() }
        );
        
        if (result.modifiedCount > 0) {
            // Notify senders
            const messages = await Message.find({ 
                chat: chatId, 
                sender: { $ne: userId }, 
                status: 'delivered' 
            }).select('sender');
            
            const senderIds = [...new Set(messages.map(m => m.sender.toString()))];
            senderIds.forEach(senderId => {
                if (userSockets.has(senderId)) {
                    io.to(`user:${senderId}`).emit('messages:delivered', { chatId });
                }
            });
        }
    } catch (err) {
        console.error('Error marking messages delivered:', err);
    }
}

/**
 * Get the Socket.IO instance
 */
function getIO() {
    if (!io) {
        throw new Error('Socket.IO not initialized');
    }
    return io;
}

/**
 * Check if a user is online
 */
function isUserOnline(userId) {
    return userSockets.has(userId) && userSockets.get(userId).size > 0;
}

/**
 * Emit to a specific user
 */
function emitToUser(userId, event, data) {
    if (io) {
        io.to(`user:${userId}`).emit(event, data);
    }
}

module.exports = {
    initializeSocket,
    getIO,
    isUserOnline,
    emitToUser
};
