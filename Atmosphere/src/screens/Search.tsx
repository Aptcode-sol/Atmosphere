import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { View, TextInput, FlatList, ActivityIndicator, StyleSheet, Text, TouchableOpacity, ScrollView, Image, Dimensions, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../contexts/ThemeContext';
import { getImageSource } from '../lib/image';
import { fetchExplorePosts, searchEntities, searchUsers } from '../lib/api';
import ThemedRefreshControl from '../components/ThemedRefreshControl';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 4) / 3; // 3 columns with 2px gaps

type TabType = 'explore' | 'posts' | 'startups' | 'investors' | 'personal';

type SearchScreenProps = {
    onPostPress?: (postId: string) => void;
};

const PAGE_SIZE = 15;
const EXPLORE_CACHE_KEY = 'ATMOSPHERE_EXPLORE_FEED_CACHE';

const SearchScreen: React.FC<SearchScreenProps> = ({ onPostPress }) => {
    const { theme } = useContext(ThemeContext);
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('explore');

    // Explore Feed State
    const [explorePosts, setExplorePosts] = useState<any[]>([]);
    const [exploreSkip, setExploreSkip] = useState(0);
    const [exploreLoading, setExploreLoading] = useState(false);
    const [exploreHasMore, setExploreHasMore] = useState(true);

    // Search Results State
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchSkip, setSearchSkip] = useState(0);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchHasMore, setSearchHasMore] = useState(true);

    const [initialLoadDone, setInitialLoadDone] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const flatListRef = useRef<FlatList>(null);



    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        if (query.trim()) {
            await performSearch(query, activeTab, true);
        } else {
            await loadExplore(true);
        }
        setRefreshing(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, activeTab]);

    useEffect(() => {
        const sub = DeviceEventEmitter.addListener('scrollToTop_Search', () => {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
            onRefresh();
        });
        return () => sub.remove();
    }, [onRefresh]);

    // Debounce Search
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Initial Load & Cache
    useEffect(() => {
        const loadCache = async () => {
            try {
                const cached = await AsyncStorage.getItem(EXPLORE_CACHE_KEY);
                if (cached) {
                    const data = JSON.parse(cached);
                    setExplorePosts(data);
                    setExploreSkip(data.length);
                    setInitialLoadDone(true);
                }
            } catch (e) {
                console.warn('Failed to load explore cache', e);
            }
        };
        loadCache();
        loadExplore(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadExplore = async (reset = false) => {
        if (exploreLoading) return;
        if (!reset && !exploreHasMore) return;

        setExploreLoading(true);
        try {
            const skip = reset ? 0 : exploreSkip;
            const data = await fetchExplorePosts(PAGE_SIZE, skip);

            if (reset) {
                setExplorePosts(data);
                setExploreSkip(data.length);
                if (data.length > 0) {
                    AsyncStorage.setItem(EXPLORE_CACHE_KEY, JSON.stringify(data)).catch(() => { });
                }
            } else {
                setExplorePosts(prev => [...prev, ...data]);
                setExploreSkip(prev => prev + data.length);
            }

            setExploreHasMore(data.length >= PAGE_SIZE); // Simple check
            setInitialLoadDone(true);
        } catch (err) {
            console.warn('Explore load error', err);
        } finally {
            setExploreLoading(false);
        }
    };

    const performSearch = async (text: string, tab: TabType, reset = false) => {
        if (!text.trim()) return;
        if (searchLoading && !reset) return;
        if (!reset && !searchHasMore) return;

        setSearchLoading(true);
        try {
            const skip = reset ? 0 : searchSkip;
            let data: any[] = [];

            // Map tabs to API calls
            if (tab === 'posts') {
                const res = await searchEntities(text, 'posts', PAGE_SIZE, skip);
                data = res.posts || [];
            } else if (tab === 'startups') {
                // Combine companies and startup users?
                // For simplified pagination, just fetch companies for now. 
                // Or fetch both parallel if skip=0? No, messes up pagination cursor.
                // Let's rely on Backend 'companies' type which usually means Startup Profiles.
                const res = await searchEntities(text, 'companies', PAGE_SIZE, skip);
                data = res.companies || [];
            } else if (tab === 'investors') {
                data = await searchUsers(text, 'investor', PAGE_SIZE, skip);
            } else if (tab === 'personal') {
                // Backend doesn't support 'not role' easily, so we search users and maybe client filter?
                // Or just search all users.
                data = await searchUsers(text, undefined, PAGE_SIZE, skip);
            }

            if (reset) {
                setSearchResults(data);
                setSearchSkip(data.length);
            } else {
                setSearchResults(prev => [...prev, ...data]);
                setSearchSkip(prev => prev + data.length);
            }
            setSearchHasMore(data.length >= PAGE_SIZE);

        } catch (err) {
            console.warn('Search error', err);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleSearchTextChange = (text: string) => {
        setQuery(text);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        if (!text.trim()) {
            setSearchResults([]);
            setActiveTab('explore');
            return;
        }

        // Debounce
        searchTimeout.current = setTimeout(() => {
            // When query changes, switch to 'posts' if currently 'explore', else keep current tab
            const targetTab = activeTab === 'explore' ? 'posts' : activeTab;
            if (activeTab === 'explore') setActiveTab('posts');
            setSearchResults([]);
            setSearchSkip(0);
            setSearchHasMore(true);
            performSearch(text, targetTab, true);
        }, 500);
    };

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        if (query.trim()) {
            setSearchResults([]);
            setSearchSkip(0);
            setSearchHasMore(true);
            performSearch(query, tab, true);
        }
    };

    const loadMore = () => {
        if (!query.trim()) {
            loadExplore(false);
        } else {
            performSearch(query, activeTab, false);
        }
    };

    const currentData = query.trim() ? searchResults : explorePosts;
    const isGrid = !query.trim() || activeTab === 'posts';

    const renderItem = ({ item, index: _index }: { item: any, index: number }) => {
        // Posts (Grid)
        if (isGrid) {
            const imgUri = item.media?.[0]?.url || item.image || item.thumbUrl || 'https://via.placeholder.com/400x400.png?text=Post';
            return (
                <TouchableOpacity
                    style={styles.gridItem}
                    activeOpacity={0.9}
                    onPress={() => onPostPress && (onPostPress(item._id || item.id))}
                >
                    <Image
                        source={getImageSource(imgUri)}
                        style={styles.gridImage}
                        resizeMode="cover"
                        onError={(e) => console.warn('Search img err', e.nativeEvent)}
                    />
                    {item.meta?.postType === 'reel' && (
                        <View style={styles.reelBadge}>
                            <Text style={styles.reelIcon}>▶</Text>
                        </View>
                    )}
                </TouchableOpacity>
            );
        }

        // Startups (List)
        if (activeTab === 'startups') {
            const displayName = item.name || item.displayName || item.username || item.companyName || 'Startup';
            return (
                <View style={[styles.feedItem, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.feedTitle, { color: theme.text }]}>🏢 {displayName}</Text>
                    {item.description && (
                        <Text style={[styles.feedText, { color: theme.placeholder }]} numberOfLines={2}>{item.description}</Text>
                    )}
                </View>
            );
        }

        // Users (List)
        return (
            <View style={[styles.feedItem, { borderBottomColor: theme.border }]}>
                <Text style={[styles.feedTitle, { color: theme.text }]}>👤 {item.displayName || item.username}</Text>
                <Text style={[styles.feedText, { color: theme.placeholder }]}>@{item.username}</Text>
                {item.bio && <Text style={[styles.feedText, { color: theme.placeholder }]} numberOfLines={2}>{item.bio}</Text>}
                {item.verified && <Text style={[styles.feedStats, { color: theme.primary }]}>✓ Verified</Text>}
            </View>
        );
    };

    const renderFooter = () => {
        if ((!query.trim() && exploreLoading) || (query.trim() && searchLoading)) {
            return <ActivityIndicator style={styles.loader} color={theme.primary} />;
        }
        return <View style={{ height: 20 }} />;
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.searchBarContainer}>
                <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                    placeholder="Search posts, startups, people..."
                    placeholderTextColor={theme.placeholder}
                    value={query}
                    onChangeText={handleSearchTextChange}
                />
            </View>

            {query.trim() !== '' && (
                <View style={[styles.tabsContainer, { borderBottomColor: theme.border }]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {(['posts', 'startups', 'investors', 'personal'] as TabType[]).map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tab, activeTab === tab && { borderBottomColor: theme.primary }]}
                                onPress={() => handleTabChange(tab)}
                            >
                                <Text style={[styles.tabText, { color: activeTab === tab ? theme.primary : theme.placeholder }]}>
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            <FlatList
                ref={flatListRef}
                key={isGrid ? 'grid' : 'list'}
                data={currentData}
                numColumns={isGrid ? 3 : 1}
                keyExtractor={(item, _idx) => (item._id || item.id || String(_idx))}
                renderItem={renderItem}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                contentContainerStyle={isGrid ? styles.gridContent : styles.listContent}
                ListEmptyComponent={
                    !searchLoading && !exploreLoading && initialLoadDone ? (
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: theme.placeholder }]}>
                                {query.trim() ? `No ${activeTab} found` : 'No posts found'}
                            </Text>
                        </View>
                    ) : null
                }
                refreshControl={
                    <ThemedRefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        progressViewOffset={0}
                    />
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    searchBarContainer: { padding: 12, paddingTop: 8 },
    input: { borderWidth: 1, borderRadius: 24, padding: 12, fontSize: 16, paddingHorizontal: 16 },
    tabsContainer: { borderBottomWidth: 1, paddingHorizontal: 0 },
    tab: { paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent', minWidth: 80, alignItems: 'center' },
    tabText: { fontSize: 13, fontWeight: '500' },
    loader: { margin: 20 },
    gridContent: { paddingHorizontal: 1 },
    gridItem: { width: ITEM_SIZE, height: ITEM_SIZE, margin: 1, borderRadius: 4, overflow: 'hidden', backgroundColor: '#e0e0e0', position: 'relative' },
    gridImage: { width: '100%', height: '100%', backgroundColor: '#f0f0f0' },
    reelBadge: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
    reelIcon: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    listContent: { paddingHorizontal: 8, paddingTop: 8 },
    feedItem: { padding: 12, borderBottomWidth: 1, marginBottom: 4, marginHorizontal: 4, borderRadius: 8 },
    feedTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    feedText: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
    feedStats: { fontSize: 12, fontWeight: '500' },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
    emptyText: { fontSize: 14 },
});

export default SearchScreen;
