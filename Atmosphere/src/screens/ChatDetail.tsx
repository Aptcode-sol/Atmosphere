/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { getImageSource } from '../lib/image';
import { getBaseUrl } from '../lib/config';
import { getChatDetails } from '../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GroupInfoModal from '../components/GroupInfoModal';

interface User {
    _id: string;
    displayName: string;
    email: string;
    avatarUrl?: string;
    username: string;
}

interface Message {
    _id: string;
    body: string;
    sender: User;
    createdAt?: string;
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

    // Scroll to bottom when messages change
    useEffect(() => {
        if (chatMessages.length > 0 && flatListRef.current) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [chatMessages]);

    const handleSendMessage = async () => {
        if (!messageText.trim()) return;
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
        } catch (err) {
            setError('Failed to send message');
            console.error('Error sending message:', err);
        }
    };

    const isMyMessage = (message: Message): boolean => {
        if (!currentUserId || !message.sender._id) return false;
        const senderId = typeof message.sender._id === 'string' ? message.sender._id : message.sender._id.toString();
        const userId = typeof currentUserId === 'string' ? currentUserId : currentUserId.toString();
        return senderId === userId;
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isMe = isMyMessage(item);
        const timestamp = item.createdAt
            ? new Date(item.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : '';

        return (
            <View style={[
                styles.messageRow,
                isMe ? styles.messageRowMe : styles.messageRowThem
            ]}>
                {!isMe && (
                    <Image
                        source={getImageSource(item.sender.avatarUrl || 'https://via.placeholder.com/32')}
                        style={styles.senderAvatar}
                    />
                )}
                <View style={[
                    styles.messageBubble,
                    isMe ? styles.myMessage : styles.theirMessage
                ]}>
                    {!isMe && chatDetails?.isGroup && (
                        <Text style={[styles.senderName, { color: theme.text }]}>
                            {item.sender.displayName || item.sender.username}
                        </Text>
                    )}
                    <View style={styles.messageContent}>
                        <Text style={styles.messageText}>{item.body}</Text>
                        <Text style={styles.timestamp}>{timestamp}</Text>
                    </View>
                </View>
                {isMe && (
                    <Image
                        source={getImageSource(item.sender.avatarUrl || 'https://via.placeholder.com/32')}
                        style={styles.senderAvatar}
                    />
                )}
            </View>
        );
    };

    // Header Content Logic
    let headerTitle = 'Chat';
    let headerImage = null;
    let isGroup = false;

    if (chatDetails) {
        if (chatDetails.isGroup) {
            headerTitle = chatDetails.groupName;
            headerImage = chatDetails.groupImage || chatDetails.groupName;
            isGroup = true;
        } else {
            const other = chatDetails.participants?.find((p: any) => p._id !== currentUserId) || chatDetails.participants?.[0] || {};
            headerTitle = other.displayName || other.username || 'User';
            headerImage = other.avatarUrl;
        }
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.background }]}>
                <TouchableOpacity onPress={onBackPress} style={{ padding: 8 }}>
                    <Text style={[styles.backButton, { color: theme.text }]}>←</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.headerInfo}
                    onPress={() => isGroup && setShowGroupInfo(true)}
                    activeOpacity={isGroup ? 0.7 : 1}
                >
                    <Image
                        source={getImageSource(headerImage || 'https://via.placeholder.com/40')}
                        style={styles.headerAvatar}
                    />
                    <Text style={[styles.headerTitle, { color: theme.text }]}>{headerTitle}</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={theme.text} />
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

            {/* Input */}
            <View style={[styles.inputContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                    value={messageText}
                    onChangeText={setMessageText}
                    placeholder="Type a message..."
                    placeholderTextColor={theme.placeholder}
                    multiline
                />
                <TouchableOpacity
                    onPress={handleSendMessage}
                    style={[styles.sendButton, { backgroundColor: theme.primary }]}
                    disabled={!messageText.trim()}
                >
                    <Text style={styles.sendButtonText}>Send</Text>
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
    backButton: { fontSize: 24, fontWeight: '600' },
    headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
    headerAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10, backgroundColor: '#ccc' },
    headerTitle: { fontSize: 18, fontWeight: '700' },

    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    messageList: { padding: 12, flexGrow: 1, justifyContent: 'flex-end' },

    messageRow: { flexDirection: 'row', marginVertical: 8, alignItems: 'flex-end', gap: 8 },
    messageRowMe: { justifyContent: 'flex-end' },
    messageRowThem: { justifyContent: 'flex-start' },

    senderAvatar: { width: 32, height: 32, borderRadius: 16 },

    messageBubble: { maxWidth: '75%', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
    myMessage: { backgroundColor: '#1FADFF' },
    theirMessage: { backgroundColor: '#3B3B3B' },

    senderName: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
    messageContent: { flexDirection: 'column', gap: 4 },
    messageText: { color: '#fff', fontSize: 14, lineHeight: 20 },
    timestamp: { fontSize: 10, color: 'rgba(255,255,255,0.7)', alignSelf: 'flex-end' },

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
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        maxHeight: 100,
        fontSize: 14
    },
    sendButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    sendButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});

export default ChatDetail;
