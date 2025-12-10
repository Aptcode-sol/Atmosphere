import React, { useState, useEffect, useContext } from 'react';
import { View, TextInput, FlatList, ActivityIndicator, StyleSheet, Text, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import axios from 'axios';
import { ThemeContext } from '../contexts/ThemeContext';
import { getImageSource } from '../lib/image';

import envConfig from '../../env.json';
const API_BASE = `${envConfig.BACKEND_URL}/api`;

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 4) / 3; // 3 columns with 2px gaps

type TabType = 'explore' | 'posts' | 'startups' | 'investors' | 'personal';

type SearchScreenProps = {
    onPostPress?: (postId: string) => void;
};

const SearchScreen: React.FC<SearchScreenProps> = ({ onPostPress }) => {
    const { theme } = useContext(ThemeContext);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('explore');
    const [explorePosts, setExplorePosts] = useState<any[]>([]);
    const [searchResults, setSearchResults] = useState<{
        posts: any[];
        startups: any[];
        investors: any[];
        personal: any[];
    }>({ posts: [], startups: [], investors: [], personal: [] });
    const [initialLoadDone, setInitialLoadDone] = useState(false);

    useEffect(() => {
        // Load random posts for explore feed on initial load
        const fetchExploreFeed = async () => {
            try {
                const res = await axios.get(`${API_BASE}/posts?limit=100`);
                const allPostsData = res.data.posts || res.data || [];
                const shuffled = allPostsData.sort(() => 0.5 - Math.random());
                setExplorePosts(shuffled);
                setInitialLoadDone(true);
            } catch {
                setInitialLoadDone(true);
            }
        };
        fetchExploreFeed();
    }, []);

    const handleSearch = async (text: string) => {
        setQuery(text);
        if (!text.trim()) {
            setSearchResults({ posts: [], startups: [], investors: [], personal: [] });
            setActiveTab('explore');
            return;
        }
        setLoading(true);
        try {
            // Search for users, companies, and posts
            const res = await axios.get(`${API_BASE}/search`, {
                params: {
                    q: text,
                    type: 'all',
                    limit: 50
                }
            });

            const users = res.data.results?.accounts || [];
            const companies = res.data.results?.companies || [];
            const posts = res.data.results?.posts || [];

            // Classify users by their primary role at index 0 (roles[0])
            const startupsUsers = users.filter((u: any) => {
                const role = (u.roles && u.roles[0]) ? String(u.roles[0]).toLowerCase() : '';
                return role === 'startup' || role === 'founder' || role === 'company';
            });
            const investorsUsers = users.filter((u: any) => {
                const role = (u.roles && u.roles[0]) ? String(u.roles[0]).toLowerCase() : '';
                return role === 'investor' || role === 'vc' || role === 'angel';
            });
            const personalUsers = users.filter((u: any) => {
                const role = (u.roles && u.roles[0]) ? String(u.roles[0]).toLowerCase() : '';
                return role !== 'investor' && role !== 'vc' && role !== 'angel' && role !== 'startup' && role !== 'founder' && role !== 'company';
            });

            // Separate results by tab
            setSearchResults({
                posts: posts.sort(() => 0.5 - Math.random()),
                startups: companies.filter((c: any) => c.type === 'startup').concat(startupsUsers),
                investors: investorsUsers,
                personal: personalUsers
            });

            setActiveTab('posts');
        } catch {
            // handle error
        }
        setLoading(false);
    };

    // Get current display data based on active tab
    const getCurrentData = () => {
        if (query.trim()) {
            // In search mode
            switch (activeTab) {
                case 'posts':
                    return searchResults?.posts || [];
                case 'startups':
                    return searchResults?.startups || [];
                case 'investors':
                    return searchResults?.investors || [];
                case 'personal':
                    return searchResults?.personal || [];
                default:
                    return [];
            }
        } else {
            // In explore mode - show random posts
            return explorePosts;
        }
    };

    const currentData = getCurrentData();

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Search Bar */}
            <View style={styles.searchBarContainer}>
                <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                    placeholder="Search posts, startups, people..."
                    placeholderTextColor={theme.placeholder}
                    value={query}
                    onChangeText={handleSearch}
                />
            </View>

            {/* Tabs */}
            {query.trim() && (
                <View style={[styles.tabsContainer, { borderBottomColor: theme.border }]}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        scrollEventThrottle={16}
                    >
                        {(['posts', 'startups', 'investors', 'personal'] as TabType[]).map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={[
                                    styles.tab,
                                    activeTab === tab && { borderBottomColor: theme.primary }
                                ]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text
                                    style={[
                                        styles.tabText,
                                        { color: activeTab === tab ? theme.primary : theme.placeholder }
                                    ]}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Loading Indicator */}
            {loading && <ActivityIndicator style={styles.loader} color={theme.primary} />}

            {/* Results Feed */}
            {/* compute whether we should render a grid */}
            {
                // grid when exploring or when viewing posts tab
            }
            <FlatList
                key={(!query.trim() || activeTab === 'posts') ? 'grid' : 'list'}
                data={currentData}
                numColumns={(!query.trim() || activeTab === 'posts') ? 3 : 1}
                keyExtractor={(item: any, index) => {
                    if (activeTab === 'posts') return item._id || item.id || `post-${index}`;
                    if (activeTab === 'startups') return item._id || item.id || `startup-${index}`;
                    if (activeTab === 'investors' || activeTab === 'personal') return item._id || item.id || `user-${index}`;
                    return `explore-${item._id || item.id || index}`;
                }}
                renderItem={({ item }) => {
                    // Grid view for explore OR when searching posts tab (show like Explore)
                    if (!query.trim() || (query.trim() && activeTab === 'posts')) {
                        const imgUri = item.media?.[0]?.url || item.image || item.thumbUrl || 'https://via.placeholder.com/400x400.png?text=Post';
                        return (
                            <TouchableOpacity
                                style={styles.gridItem}
                                activeOpacity={0.9}
                                onPress={() => onPostPress && (onPostPress(item._id || item.id))}
                            >
                                <Image
                                    source={getImageSource(imgUri)}
                                    onError={(e) => { console.warn('Search image error', e.nativeEvent, imgUri); }}
                                    style={styles.gridImage}
                                    resizeMode="cover"
                                />
                                {item.meta?.postType === 'reel' && (
                                    <View style={styles.reelBadge}>
                                        <Text style={styles.reelIcon}>▶</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    }


                    // Startups tab
                    if (activeTab === 'startups') {
                        const displayName = item.name || item.displayName || item.username || item.companyName || 'Startup';
                        return (
                            <View style={[styles.feedItem, { borderBottomColor: theme.border }]}>
                                <Text style={[styles.feedTitle, { color: theme.text }]}>
                                    🏢 {displayName}
                                </Text>
                                {item.description && (
                                    <Text style={[styles.feedText, { color: theme.placeholder }]}>
                                        {item.description}
                                    </Text>
                                )}
                                {item.tags && item.tags.length > 0 && (
                                    <Text style={[styles.feedStats, { color: theme.primary }]}>
                                        {item.tags.join(', ')}
                                    </Text>
                                )}
                            </View>
                        );
                    }

                    // Investors & Personal tabs (Users)
                    return (
                        <View style={[styles.feedItem, { borderBottomColor: theme.border }]}>
                            <Text style={[styles.feedTitle, { color: theme.text }]}>
                                👤 {item.displayName || item.username}
                            </Text>
                            <Text style={[styles.feedText, { color: theme.placeholder }]}>
                                @{item.username}
                            </Text>
                            {item.bio && (
                                <Text style={[styles.feedText, { color: theme.placeholder }]}>
                                    {item.bio}
                                </Text>
                            )}
                            {item.verified && (
                                <Text style={[styles.feedStats, { color: theme.primary }]}>
                                    ✓ Verified
                                </Text>
                            )}
                        </View>
                    );
                }}
                ListEmptyComponent={
                    initialLoadDone && !loading ? (
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: theme.placeholder }]}>
                                {query.trim() ? `No ${activeTab} found` : 'No posts to explore'}
                            </Text>
                        </View>
                    ) : null
                }
                contentContainerStyle={(query.trim() && activeTab !== 'posts') ? styles.listContent : styles.gridContent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    searchBarContainer: { padding: 12, paddingTop: 8 },
    input: { borderWidth: 1, borderRadius: 24, padding: 12, fontSize: 16, paddingHorizontal: 16 },
    tabsContainer: { borderBottomWidth: 1, paddingHorizontal: 0 },
    tab: {
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
        minWidth: 80,
        alignItems: 'center',
        justifyContent: 'center'
    },
    tabActive: { borderBottomWidth: 2 },
    tabText: { fontSize: 13, fontWeight: '500', textAlign: 'center' },
    loader: { margin: 20 },
    // Grid styles for explore
    gridContent: { paddingHorizontal: 1 },
    gridItem: {
        width: ITEM_SIZE,
        height: ITEM_SIZE,
        margin: 1,
        borderRadius: 4,
        overflow: 'hidden',
        backgroundColor: '#e0e0e0',
        position: 'relative'
    },
    gridImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f0f0f0'
    },
    reelBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2
    },
    reelIcon: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    // List styles for search
    listContent: { paddingHorizontal: 8, paddingTop: 8 },
    feedItem: { padding: 12, borderBottomWidth: 1, marginBottom: 4, marginHorizontal: 4, borderRadius: 8 },
    feedTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    feedText: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
    feedStats: { fontSize: 12, fontWeight: '500' },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
    emptyText: { fontSize: 14 },
});

export default SearchScreen;
