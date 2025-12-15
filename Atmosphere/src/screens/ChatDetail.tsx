/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Image, Animated } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { ThemeContext } from '../contexts/ThemeContext';
import { getImageSource } from '../lib/image';
import { getChatDetails } from '../lib/api';
import { getBaseUrl } from '../lib/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GroupInfoModal from '../components/GroupInfoModal';
import MessageBubble from '../components/MessageBubble';
import useSocket from '../hooks/useSocket';

interface User {
    _id: string;
    displayName: string;
    email?: string;
    avatarUrl?: string;
    username: string;
}

interface Message {
    _id: string;
    body: string;
    sender: User;
    createdAt?: string;
    status?: 'sent' | 'delivered' | 'read';
    replyTo?: {
        _id: string;
        body: string;
        sender?: { displayName: string };
    };
}

interface ChatDetailProps {
    chatId: string;
    onBackPress?: () => void;
    onProfileOpen?: (userId: string) => void;
}

const ChatDetail = ({ chatId, onBackPress, onProfileOpen }: ChatDetailProps) => {
    const { theme } = useContext(ThemeContext);
    const flatListRef = useRef<FlatList>(null);
    const [messageText, setMessageText] = useState('');
    const [chatMessages, setChatMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [_error, setError] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [chatDetails, setChatDetails] = useState<any>(null);
    const [showGroupInfo, setShowGroupInfo] = useState(false);
    const [typingText, setTypingText] = useState('');
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Socket connection
    const {
        isConnected,
        joinChat,
        leaveChat,
        sendMessage: socketSendMessage,
        startTyping,
        stopTyping,
        markAsRead,
        onNewMessage,
        onMessageStatus,
        onTypingUpdate
    } = useSocket();

    // Animation for typing indicator
    const typingOpacity = useRef(new Animated.Value(0)).current;

    // Fetch current user ID
    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const userJson = await AsyncStorage.getItem('user');
                if (userJson) {
                    const user = JSON.parse(userJson);
                    setCurrentUserId(user._id || user.id);
                }
            } catch (err) {
                console.error('Error fetching current user:', err);
            }
        };
        fetchCurrentUser();
    }, []);

    // Fetch messages & details
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const baseUrl = await getBaseUrl();
                const token = await AsyncStorage.getItem('token');
                const headers: any = { 'Content-Type': 'application/json' };
                if (token) headers.Authorization = `Bearer ${token}`;

                const response = await fetch(`${baseUrl}/api/messages/${chatId}`, {
                    headers,
                    credentials: 'include',
                });
                const data = await response.json();
                setChatMessages(data.messages || []);
            } catch (err) {
                setError('Failed to load messages');
                console.error('Error fetching messages:', err);
            } finally {
                setLoading(false);
            }
        };

        const fetchDetails = async () => {
            try {
                const details = await getChatDetails(chatId);
                setChatDetails(details.chat || details);
            } catch (e) { console.warn('Failed to fetch chat details', e); }
        };

        if (chatId) {
            fetchMessages();
            fetchDetails();
        }
    }, [chatId]);

    // Join chat room when socket is connected
    useEffect(() => {
        if (isConnected && chatId) {
            joinChat(chatId);
        }
        return () => {
            if (chatId) {
                leaveChat(chatId);
            }
        };
    }, [isConnected, chatId, joinChat, leaveChat]);

    // Subscribe to new messages
    useEffect(() => {
        const unsubscribe = onNewMessage((data) => {
            if (data.chatId === chatId) {
                setChatMessages(prev => {
                    // Avoid duplicates
                    if (prev.some(m => m._id === data.message._id)) {
                        return prev;
                    }
                    return [...prev, data.message];
                });

                // Mark as read if message is from someone else
                if (data.message.sender._id !== currentUserId) {
                    markAsRead(chatId, [data.message._id]);
                }
            }
        });
        return unsubscribe;
    }, [onNewMessage, chatId, currentUserId, markAsRead]);

    // Subscribe to message status updates
    useEffect(() => {
        const unsubscribe = onMessageStatus((status) => {
            setChatMessages(prev => prev.map(msg =>
                msg._id === status.messageId
                    ? { ...msg, status: status.status }
                    : msg
            ));
        });
        return unsubscribe;
    }, [onMessageStatus]);

    // Subscribe to typing updates
    useEffect(() => {
        const unsubscribe = onTypingUpdate(chatId, (users) => {
            if (users.length > 0) {
                const names = users.map(u => u.displayName || u.username).join(', ');
                setTypingText(`${names} ${users.length === 1 ? 'is' : 'are'} typing...`);
                Animated.timing(typingOpacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true
                }).start();
            } else {
                Animated.timing(typingOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true
                }).start(() => setTypingText(''));
            }
        });
        return unsubscribe;
    }, [onTypingUpdate, chatId, typingOpacity]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (chatMessages.length > 0 && flatListRef.current) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [chatMessages]);

    // Handle typing indicator emission
    const handleTextChange = useCallback((text: string) => {
        setMessageText(text);

        if (text.length > 0) {
            startTyping(chatId);

            // Clear previous timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Stop typing after 2 seconds of inactivity
            typingTimeoutRef.current = setTimeout(() => {
                stopTyping(chatId);
            }, 2000);
        } else {
            stopTyping(chatId);
        }
    }, [chatId, startTyping, stopTyping]);

    const handleSendMessage = async () => {
        if (!messageText.trim()) return;

        // Clear typing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        stopTyping(chatId);

        // Send via socket for real-time delivery
        if (isConnected) {
            socketSendMessage(
                chatId,
                messageText,
                'text',
                [],
                replyingTo?._id
            );
            setMessageText('');
            setReplyingTo(null);
            return;
        }

        // Fallback to REST API if socket is not connected
        try {
            const baseUrl = await getBaseUrl();
            const token = await AsyncStorage.getItem('token');
            const headers: any = { 'Content-Type': 'application/json' };
            if (token) headers.Authorization = `Bearer ${token}`;

            const response = await fetch(`${baseUrl}/api/messages/${chatId}`, {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({ content: messageText }),
            });
            const data = await response.json();
            if (data.message) {
                setChatMessages((prev) => [...prev, data.message as Message]);
            }
            setMessageText('');
            setReplyingTo(null);
        } catch (err) {
            setError('Failed to send message');
            console.error('Error sending message:', err);
        }
    };

    const isMyMessage = (message: Message): boolean => {
        if (!currentUserId || !message.sender._id) return false;
        const senderId = String(message.sender._id);
        const userId = String(currentUserId);
        return senderId === userId;
    };

    const handleLongPress = (message: Message) => {
        // TODO: Show context menu (copy, reply, delete)
        setReplyingTo(message);
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isMe = isMyMessage(item);
        return (
            <MessageBubble
                message={item}
                isMe={isMe}
                showSenderName={chatDetails?.isGroup && !isMe}
                onLongPress={handleLongPress}
            />
        );
    };

    // Header Content Logic
    let headerTitle = 'Chat';
    let headerImage = null;
    let isGroup = false;
    let otherUserId: string | null = null;

    if (chatDetails) {
        if (chatDetails.isGroup) {
            headerTitle = chatDetails.groupName;
            headerImage = chatDetails.groupImage || chatDetails.groupName;
            isGroup = true;
        } else {
            const other = chatDetails.participants?.find((p: any) => p._id !== currentUserId) || chatDetails.participants?.[0] || {};
            headerTitle = other.displayName || other.username || 'User';
            headerImage = other.avatarUrl;
            otherUserId = other._id;
        }
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.background }]}>
                <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.headerInfo}
                    onPress={() => {
                        if (isGroup) {
                            setShowGroupInfo(true);
                        } else if (otherUserId && onProfileOpen) {
                            onProfileOpen(otherUserId);
                        }
                    }}
                    activeOpacity={0.7}
                >
                    <View style={styles.headerAvatarContainer}>
                        <Image
                            source={getImageSource(headerImage || 'https://via.placeholder.com/40')}
                            style={styles.headerAvatar}
                        />
                        {isConnected && (
                            <View style={[styles.onlineIndicator, { backgroundColor: '#4CAF50' }]} />
                        )}
                    </View>
                    <View>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>{headerTitle}</Text>
                        {typingText ? (
                            <Animated.Text
                                style={[styles.typingIndicator, { color: theme.primary, opacity: typingOpacity }]}
                            >
                                {typingText}
                            </Animated.Text>
                        ) : isConnected ? (
                            <Text style={[styles.statusText, { color: theme.placeholder }]}>Online</Text>
                        ) : null}
                    </View>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={chatMessages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.messageList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                />
            )}

            {/* Reply Preview */}
            {replyingTo && (
                <View style={[styles.replyBar, { backgroundColor: theme.cardBackground, borderTopColor: theme.border }]}>
                    <View style={[styles.replyContent, { borderLeftColor: theme.primary }]}>
                        <Text style={[styles.replyToName, { color: theme.primary }]}>
                            Replying to {replyingTo.sender.displayName || replyingTo.sender.username}
                        </Text>
                        <Text style={[styles.replyToText, { color: theme.placeholder }]} numberOfLines={1}>
                            {replyingTo.body}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={() => setReplyingTo(null)} style={styles.cancelReply}>
                        <MaterialIcons name="close" size={20} color={theme.placeholder} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Input */}
            <View style={[styles.inputContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                    value={messageText}
                    onChangeText={handleTextChange}
                    placeholder="Type a message..."
                    placeholderTextColor={theme.placeholder}
                    multiline
                />
                <TouchableOpacity
                    onPress={handleSendMessage}
                    style={[
                        styles.sendButton,
                        { backgroundColor: messageText.trim() ? theme.primary : theme.border }
                    ]}
                    disabled={!messageText.trim()}
                >
                    <MaterialIcons name="send" size={22} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {/* Group Info Modal */}
            <GroupInfoModal
                visible={showGroupInfo}
                onClose={() => setShowGroupInfo(false)}
                chat={chatDetails}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 12,
        borderBottomWidth: 1,
        elevation: 2,
    },
    backButton: {
        padding: 8,
        borderRadius: 20
    },
    headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
    headerAvatarContainer: { position: 'relative' },
    headerAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: '#ccc' },
    onlineIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 8,
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#fff'
    },
    headerTitle: { fontSize: 17, fontWeight: '700' },
    typingIndicator: { fontSize: 12, fontStyle: 'italic' },
    statusText: { fontSize: 12 },

    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    messageList: { padding: 12, flexGrow: 1, justifyContent: 'flex-end' },

    replyBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderTopWidth: 1
    },
    replyContent: {
        flex: 1,
        borderLeftWidth: 3,
        paddingLeft: 8
    },
    replyToName: { fontSize: 12, fontWeight: '600' },
    replyToText: { fontSize: 13 },
    cancelReply: { padding: 8 },

    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        borderTopWidth: 1,
        alignItems: 'flex-end',
        gap: 8
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingVertical: 10,
        maxHeight: 100,
        fontSize: 15
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center'
    },
    sendButtonText: { color: '#fff', fontWeight: '600', fontSize: 18 },
});

export default ChatDetail;
