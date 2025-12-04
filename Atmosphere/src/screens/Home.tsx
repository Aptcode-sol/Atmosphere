import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import StartupPost from '../components/StartupPost';
import { fetchStartupPosts } from '../lib/api';

const Home = () => {
    const { theme } = useContext(ThemeContext);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadPosts = async () => {
            try {
                const data = await fetchStartupPosts();
                setPosts(data);
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
                    <Text style={[styles.errorText, { color: '#e74c3c' }]}>Error: {error}</Text>
                </View>
            );
        }

        return (
            <FlatList
                data={posts}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => <StartupPost post={item} />}
            />
        );
    };

    const handleBottomNavRoute = (routeName: string) => {
        // Map web/mobile BottomNav route names to this screen's RouteKey values
        const map: { [k: string]: RouteKey } = {
            Home: 'home',
            Search: 'search',
            Reels: 'reels',
            Profile: 'profile',
            Launch: 'home',
            Trade: 'home',
            Opportunities: 'home',
            Meetings: 'home',
            Notifications: 'notifications',
            Messages: 'chats',
        };

        const mapped = map[routeName] || 'home';
        setRoute(mapped as RouteKey);
    };

    // Map current route state back to BottomNav route names
    const getCurrentBottomNavRoute = (): string => {
        const reverseMap: { [k: string]: string } = {
            'home': 'Home',
            'search': 'Search',
            'reels': 'Reels',
            'profile': 'Profile',
            'notifications': 'Notifications',
            'chats': 'Messages',
        };
        return reverseMap[route] || 'Home';
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Atmosphere</Text>
            </View>

            {renderContent()}

            <BottomNav onRouteChange={handleBottomNavRoute} activeRoute={getCurrentBottomNavRoute()} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { height: 64, paddingHorizontal: 16, paddingTop: 12, justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#00000010' },
    headerTitle: { fontSize: 20, fontWeight: '700' },
    listContent: { padding: 0 },
    centerLoader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: { marginTop: 12, fontSize: 14 },
    errorText: { fontSize: 14 },
});

export default Home;
