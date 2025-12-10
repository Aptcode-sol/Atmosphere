/* eslint-disable react-native/no-inline-styles */
import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { getBaseUrl } from '../lib/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ChatsProps {
    onChatSelect?: (chatId: string) => void;
}

const Chats = ({ onChatSelect }: ChatsProps) => {
    const { theme } = useContext(ThemeContext);
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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

    useEffect(() => {
        const fetchChats = async () => {
            try {
                const baseUrl = await getBaseUrl();
                const token = await AsyncStorage.getItem('token');
                const headers: any = { 'Content-Type': 'application/json' };
                if (token) {
                    headers.Authorization = `Bearer ${token}`;
                    console.log('Token found:', token.substring(0, 20) + '...');
                } else {
                    console.log('No token found!');
                }
                console.log('Fetching chats from:', `${baseUrl}/api/chats`);
                const response = await fetch(`${baseUrl}/api/chats`, {
                    credentials: 'include',
                    headers,
                });
                console.log('Response status:', response.status);
                const data = await response.json();
                console.log('Response data:', data);
                setChats(data.chats || []);
            } catch (err) {
                setError('Failed to load chats');
                console.error('Error fetching chats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchChats();
    }, []);

    const handleChatPress = (chatId: string) => {
        onChatSelect?.(chatId);
    };

    const renderChatItem = ({ item }: { item: any }) => {
        // Find the OTHER participant (not the current user)
        const other = item.participants?.find((p: any) => p._id !== currentUserId) || item.participants?.[0] || {};
        const unreadCount = item.unreadCounts?.[currentUserId!] || 0;
        const hasUnread = unreadCount > 0;

        return (
            <TouchableOpacity
                style={[
                    styles.chatItem,
                    {
                        backgroundColor: hasUnread ? theme.primary + '15' : theme.cardBackground,
                        borderColor: hasUnread ? theme.primary : theme.border
                    }
                ]}
                onPress={() => handleChatPress(item._id)}
            >
                <View style={styles.avatarContainer}>
                    <Image
                        source={getImageSource(other.avatarUrl || 'https://via.placeholder.com/50')}
                        onError={(e) => { console.warn('Chats avatar error', e.nativeEvent, other.avatarUrl); }}
                        style={styles.avatar}
                    />
                    {hasUnread && (
                        <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
                            <Text style={styles.unreadBadgeText}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Text>
                        </View>
                    )}
                </View>
                <View style={styles.chatInfo}>
                    <Text style={[
                        styles.chatName,
                        {
                            color: theme.text,
                            fontWeight: hasUnread ? '700' : '600'
                        }
                    ]} numberOfLines={1}>
                        {other.displayName || other.username || 'User'}
                    </Text>
                    <Text style={[styles.lastMessage, { color: theme.placeholder }]} numberOfLines={1}>
                        {item.lastMessage?.body || 'No messages yet.'}
                    </Text>
                </View>
                {/* Optional: Add timestamp */}
                <Text style={[styles.timestamp, { color: theme.placeholder }]}>
                    {item.updatedAt ? new Date(item.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                </Text>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.text} />
                <Text style={[styles.title, { color: theme.text }]}>Loading chats...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <Text style={[styles.title, { color: theme.text }]}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Text style={[styles.title, { color: theme.text }]}>Chats</Text>
            <FlatList
                data={chats}
                renderItem={renderChatItem}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={[styles.empty, { color: theme.placeholder }]}>No chats found.</Text>}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 0 },
    title: { fontSize: 24, fontWeight: '700', marginBottom: 16, textAlign: 'left', paddingHorizontal: 16, paddingTop: 12 },
    list: { paddingBottom: 20 },
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginHorizontal: 8,
        marginBottom: 1,
        borderRadius: 0,
        borderBottomWidth: 1
    },
    avatarContainer: { position: 'relative', marginRight: 12 },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#e5e5e5'
    },
    unreadBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        minWidth: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff'
    },
    unreadBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        paddingHorizontal: 6
    },
    chatInfo: { flex: 1, justifyContent: 'center' },
    chatName: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4
    },
    lastMessage: {
        fontSize: 13,
        marginTop: 0,
        opacity: 0.7
    },
    timestamp: {
        fontSize: 12,
        marginLeft: 8
    },
    empty: { textAlign: 'center', marginTop: 40, fontSize: 16 },
});

export default Chats;
