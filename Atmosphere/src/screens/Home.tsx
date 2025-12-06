import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { BOTTOM_NAV_HEIGHT } from '../lib/layout';
import { ThemeContext } from '../contexts/ThemeContext';
import StartupPost from '../components/StartupPost';
import Search from './Search';
import Reels from './Reels';
import Profile from './Profile';
import { fetchStartupPosts } from '../lib/api';

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

const Home = () => {
    const { theme } = useContext(ThemeContext);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeRoute, setActiveRoute] = useState('Home');

    useEffect(() => {
        const loadPosts = async () => {
            try {
                const data = await fetchStartupPosts();
                // Normalize posts to expected shape
                const normalized = (data || []).map((p: any) => ({
                    id: String(p.id || p._id || Math.random()),
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
        // Render different screens based on active route
        switch (activeRoute) {
            case 'Search':
                return <Search />;
            case 'Reels':
                return <Reels />;
            case 'Profile':
                return <Profile />;
            case 'Home':
            default:
                return renderHomeFeed();
        }
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
            <>
                <View style={[styles.header]}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Atmosphere</Text>
                </View>
                <FlatList
                    data={posts}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={[styles.listContent, { paddingBottom: BOTTOM_NAV_HEIGHT + 50 }]}
                    renderItem={({ item }) => <StartupPost post={item} />}
                />
            </>
        );
    };
    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {renderContent()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { height: 45, paddingHorizontal: 40, justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#00000010' },
    headerTitle: { fontSize: 25, fontWeight: '700' },
    listContent: { padding: 0 },
    centerLoader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: { marginTop: 12, fontSize: 14 },
    errorText: { fontSize: 14 },
    errorColor: { color: '#e74c3c' },
});

export default Home;
