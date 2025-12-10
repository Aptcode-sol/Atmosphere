import React, { useEffect, useState, useContext, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import TopNavbar from '../components/TopNavbar';
import { BOTTOM_NAV_HEIGHT } from '../lib/layout';
import { ThemeContext } from '../contexts/ThemeContext';
import StartupPost from '../components/StartupPost';
import { fetchStartupPosts } from '../lib/api';
import { getBaseUrl } from '../lib/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Post {
    id: string;
    name: string;
    displayName: string;
    verified: boolean;
    profileImage: string;
    description: string;
    stage: string;
    rounds: number;
    age: number;
    fundingRaised: number;
    fundingNeeded: number;
    stats: { likes: number; comments: number; crowns: number; shares: number };
}

interface HomeProps {
    onNavigate?: (route: 'notifications' | 'chats') => void;
    onChatSelect?: (chatId: string) => void;
    onOpenProfile?: (userId: string) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate, onChatSelect: _onChatSelect, onOpenProfile }) => {
    const { theme } = useContext(ThemeContext);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Fetch current user
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

    // Fetch unread count - only when currentUserId changes
    const fetchUnreadCount = useCallback(async () => {
        try {
            if (!currentUserId) {
                console.log('No currentUserId available');
                return;
            }

            const baseUrl = await getBaseUrl();
            const token = await AsyncStorage.getItem('token');

            if (!token) {
                console.log('No token available');
                return;
            }

            const headers: any = { 'Content-Type': 'application/json' };
            headers.Authorization = `Bearer ${token}`;

            const url = `${baseUrl}/api/chats`;
            console.log('Fetching unread count from:', url);

            const response = await fetch(url, {
                credentials: 'include',
                headers,
            });

            // console.log('Unread count response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                const chats = data.chats || [];

                // Calculate total unread count
                const totalUnread = chats.reduce((sum: number, chat: any) => {
                    const unreadForUser = chat.unreadCounts?.[currentUserId] || 0;
                    return sum + unreadForUser;
                }, 0);

                console.log('Total unread count:', totalUnread);
                setUnreadCount(totalUnread);
            } else {
                console.error('Failed to fetch chats. Status:', response.status);
            }
        } catch (err) {
            console.error('Error fetching unread count:', err);
        }
    }, [currentUserId]);

    // Fetch unread count once when component mounts or currentUserId changes
    useEffect(() => {
        if (currentUserId) {
            fetchUnreadCount();
        }
    }, [currentUserId, fetchUnreadCount]);

    useEffect(() => {
        const loadPosts = async () => {
            try {
                const data = await fetchStartupPosts();
                console.debug('[Home] fetched startup posts sample:', Array.isArray(data) ? data[0] : data);
                // Normalize posts to expected shape
                const normalized = (data || []).map((p: any) => ({
                    id: String(p.id || p._id || Math.random()),
                    userId: String(
                        p.userId ||
                        (p.user && (typeof p.user === 'string' ? p.user : (p.user._id || p.user.id))) ||
                        ''
                    ),
                    startupDetailsId: String(p._id || p.startupDetailsId || ''),
                    name: String(p.name || p.companyName || 'Unknown'),
                    displayName: String(p.displayName || ''),
                    verified: Boolean(p.verified || false),
                    profileImage: p.profileImage || 'https://via.placeholder.com/400x240.png?text=Startup',
                    description: String(p.description || p.about || ''),
                    stage: String(p.stage || 'unknown'),
                    rounds: Number(p.rounds || 0),
                    age: Number(p.age || 0),
                    fundingRaised: Number(p.fundingRaised || 0),
                    fundingNeeded: Number(p.fundingNeeded || 0),
                    stats: p.stats || { likes: 0, comments: 0, crowns: 0, shares: 0 },
                    // user-specific flags provided by enriched feed
                    likedByCurrentUser: Boolean(p.likedByCurrentUser),
                    crownedByCurrentUser: Boolean(p.crownedByCurrentUser),
                    isFollowing: Boolean(p.isFollowing),
                }));
                setPosts(normalized);
            } catch (err) {
                console.error('Failed to fetch posts:', err);
                setError('Failed to load posts');
            } finally {
                setLoading(false);
            }
        };

        loadPosts();
    }, []);

    const renderContent = () => {
        // Only render home feed here
        return renderHomeFeed();
    };

    const renderHomeFeed = () => {
        if (loading) {
            return (
                <View style={styles.centerLoader}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.text }]}>Loading posts...</Text>
                </View>
            );
        }

        if (error) {
            return (
                <View style={styles.centerLoader}>
                    <Text style={[styles.errorText, styles.errorColor]}>Error: {error}</Text>
                </View>
            );
        }

        return (
            <FlatList
                data={posts}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[styles.listContent, { paddingBottom: BOTTOM_NAV_HEIGHT + 50 }]}
                renderItem={({ item }) => <StartupPost post={item} currentUserId={currentUserId} onOpenProfile={onOpenProfile} />}
            />
        );
    };
    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <TopNavbar
                title="Atmosphere"
                messagesCount={unreadCount}
                onNotificationsPress={() => onNavigate?.('notifications')}
                onChatsPress={() => onNavigate?.('chats')}
            />
            {renderContent()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    listContent: { padding: 0, paddingTop: 56 },
    centerLoader: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 56 },
    loadingText: { marginTop: 12, fontSize: 14 },
    errorText: { fontSize: 14 },
    errorColor: { color: '#e74c3c' },
});

export default Home;
