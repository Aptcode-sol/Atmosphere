import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBaseUrl } from '../lib/config';

interface TypingUser {
    userId: string;
    displayName: string;
    username: string;
}

interface MessageStatus {
    messageId: string;
    status: 'sent' | 'delivered' | 'read';
    readAt?: Date;
}

interface UseSocketOptions {
    autoConnect?: boolean;
}

export const useSocket = (options: UseSocketOptions = { autoConnect: true }) => {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser>>(new Map());
    const typingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

    const connect = useCallback(async () => {
        if (socketRef.current?.connected) return;

        try {
            const baseUrl = await getBaseUrl();
            const token = await AsyncStorage.getItem('token');

            if (!token) {
                console.warn('No auth token found, cannot connect to socket');
                return;
            }

            const socket = io(baseUrl, {
                auth: { token },
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
            });

            socket.on('connect', () => {
                console.log('Socket connected');
                setIsConnected(true);
            });

            socket.on('disconnect', (reason) => {
                console.log('Socket disconnected:', reason);
                setIsConnected(false);
            });

            socket.on('connect_error', (error) => {
                console.error('Socket connection error:', error.message);
                setIsConnected(false);
            });

            socket.on('error', (error) => {
                console.error('Socket error:', error);
            });

            socketRef.current = socket;
        } catch (err) {
            console.error('Error connecting socket:', err);
        }
    }, []);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
            setIsConnected(false);
        }
    }, []);

    // Auto-connect on mount
    useEffect(() => {
        if (options.autoConnect) {
            connect();
        }

        return () => {
            // Clean up typing timeouts
            typingTimeouts.current.forEach(timeout => clearTimeout(timeout));
            typingTimeouts.current.clear();
            disconnect();
        };
    }, [options.autoConnect, connect, disconnect]);

    // Join a chat room
    const joinChat = useCallback((chatId: string) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('join:chat', chatId);
        }
    }, []);

    // Leave a chat room
    const leaveChat = useCallback((chatId: string) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('leave:chat', chatId);
        }
    }, []);

    // Send a message via socket
    const sendMessage = useCallback((chatId: string, content: string, type: string = 'text', attachments: any[] = [], replyTo?: string) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('message:send', {
                chatId,
                content,
                type,
                attachments,
                replyTo
            });
        }
    }, []);

    // Emit typing started
    const startTyping = useCallback((chatId: string) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('typing:start', chatId);
        }
    }, []);

    // Emit typing stopped
    const stopTyping = useCallback((chatId: string) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('typing:stop', chatId);
        }
    }, []);

    // Mark messages as read
    const markAsRead = useCallback((chatId: string, messageIds: string[]) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('message:read', { chatId, messageIds });
        }
    }, []);

    // Subscribe to new messages
    const onNewMessage = useCallback((callback: (data: { message: any; chatId: string }) => void) => {
        if (socketRef.current) {
            socketRef.current.on('message:new', callback);
            return () => {
                socketRef.current?.off('message:new', callback);
            };
        }
        return () => { };
    }, []);

    // Subscribe to message status updates
    const onMessageStatus = useCallback((callback: (status: MessageStatus) => void) => {
        if (socketRef.current) {
            socketRef.current.on('message:status', callback);
            return () => {
                socketRef.current?.off('message:status', callback);
            };
        }
        return () => { };
    }, []);

    // Subscribe to typing updates
    const onTypingUpdate = useCallback((chatId: string, callback: (typingUsers: TypingUser[]) => void) => {
        if (socketRef.current) {
            const handler = (data: { chatId: string; userId: string; user: any; isTyping: boolean }) => {
                if (data.chatId === chatId) {
                    setTypingUsers(prev => {
                        const next = new Map(prev);
                        if (data.isTyping) {
                            next.set(data.userId, {
                                userId: data.userId,
                                displayName: data.user.displayName,
                                username: data.user.username
                            });

                            // Clear existing timeout
                            const existingTimeout = typingTimeouts.current.get(data.userId);
                            if (existingTimeout) clearTimeout(existingTimeout);

                            // Auto-remove after 3 seconds
                            const timeout = setTimeout(() => {
                                setTypingUsers(p => {
                                    const updated = new Map(p);
                                    updated.delete(data.userId);
                                    callback(Array.from(updated.values()));
                                    return updated;
                                });
                            }, 3000);
                            typingTimeouts.current.set(data.userId, timeout);
                        } else {
                            next.delete(data.userId);
                            const existingTimeout = typingTimeouts.current.get(data.userId);
                            if (existingTimeout) {
                                clearTimeout(existingTimeout);
                                typingTimeouts.current.delete(data.userId);
                            }
                        }
                        callback(Array.from(next.values()));
                        return next;
                    });
                }
            };

            socketRef.current.on('typing:update', handler);
            return () => {
                socketRef.current?.off('typing:update', handler);
            };
        }
        return () => { };
    }, []);

    return {
        socket: socketRef.current,
        isConnected,
        connect,
        disconnect,
        joinChat,
        leaveChat,
        sendMessage,
        startTyping,
        stopTyping,
        markAsRead,
        onNewMessage,
        onMessageStatus,
        onTypingUpdate,
        typingUsers: Array.from(typingUsers.values())
    };
};

export default useSocket;
