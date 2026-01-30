import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { View, TextInput, FlatList, ActivityIndicator, StyleSheet, Text, TouchableOpacity, ScrollView, Image, Dimensions, DeviceEventEmitter, ViewToken } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../contexts/ThemeContext';
import { getImageSource } from '../lib/image';
import { fetchExplorePosts, searchEntities, searchUsers } from '../lib/api';
import ThemedRefreshControl from '../components/ThemedRefreshControl';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ReelsIcon from '../components/icons/ReelsIcon';
import { Image as ImageIcon } from 'lucide-react-native';
import Video from 'react-native-video';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 6) / 3; // 3 columns with gaps
const ITEM_HEIGHT = ITEM_WIDTH * 4 / 3; // Square

type TabType = 'explore' | 'posts' | 'accounts';

type SearchScreenProps = {
    onPostPress?: (postId: string) => void;
    onUserPress?: (userId: string) => void;
    onReelPress?: (reelId: string) => void;
};

const PAGE_SIZE = 15;
const EXPLORE_CACHE_KEY = 'ATMOSPHERE_EXPLORE_FEED_CACHE';

const SearchScreen: React.FC<SearchScreenProps> = ({ onPostPress, onUserPress, onReelPress }) => {
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
    const [activeReelId, setActiveReelId] = useState<string | null>(null);
    const [hasPerformedInitialLoad, setHasPerformedInitialLoad] = useState(false);
    const [playedReelIds, setPlayedReelIds] = useState<Set<string>>(new Set());

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

    // Reset played reels when search query or data changes
    useEffect(() => {
        setPlayedReelIds(new Set());
        setActiveReelId(null);
    }, [query, activeTab]);

    // Auto-play next unplayed reel every 7 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            // Find all reels in current data
            const allReels = currentData
                .filter((item) => item && (item.type === 'reel' || item.meta?.postType === 'reel'));

            // Find all unplayed reels
            const unplayedReels = allReels
                .map((item, index) => ({ item, index }))
                .filter(({ item }) => {
                    const reelId = item?._id || item?.id;
                    return !playedReelIds.has(reelId);
                });

            if (unplayedReels.length > 0) {
                // Play the first unplayed reel
                const { item } = unplayedReels[0];
                const reelId = item._id || item.id;
                setPlayedReelIds(prev => new Set([...prev, reelId]));
                setActiveReelId(reelId);
                console.log('Auto-playing next reel:', reelId, 'Played so far:', playedReelIds.size + 1);
            } else if (allReels.length > 0) {
                // All reels played, reset and start from first reel
                const firstReel = allReels[0];
                const firstReelId = firstReel._id || firstReel.id;
                setPlayedReelIds(new Set([firstReelId]));
                setActiveReelId(firstReelId);
                console.log('All reels played! Looping back to first reel:', firstReelId);
            }
        }, 7000); // Change every 7 seconds

        return () => clearInterval(interval);
    }, [currentData, playedReelIds]);

    // Debounce Search
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Initial Load - Skip cache, load fresh data only on first mount
    useEffect(() => {
        if (!hasPerformedInitialLoad) {
            loadExplore(true);
            setHasPerformedInitialLoad(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasPerformedInitialLoad]);

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
                // Prevent duplicates
                setExplorePosts(prev => {
                    const existingIds = new Set(prev.map(item => item._id || item.id));
                    const newItems = data.filter((item: any) => !existingIds.has(item._id || item.id));
                    return [...prev, ...newItems];
                });
                setExploreSkip(prev => prev + data.length);
            }

            setExploreHasMore(data.length >= PAGE_SIZE);
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

            if (tab === 'posts') {
                const res = await searchEntities(text, 'posts', PAGE_SIZE, skip);
                data = res.posts || [];
            } else if (tab === 'accounts') {
                // Search all users (accounts)
                data = await searchUsers(text, undefined, PAGE_SIZE, skip);
            }

            if (reset) {
                setSearchResults(data);
                setSearchSkip(data.length);
            } else {
                // Prevent duplicates
                setSearchResults(prev => {
                    const existingIds = new Set(prev.map(item => item._id || item.id));
                    const newItems = data.filter((item: any) => !existingIds.has(item._id || item.id));
                    return [...prev, ...newItems];
                });
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
            const targetTab = activeTab === 'explore' ? 'accounts' : activeTab;
            if (activeTab === 'explore') setActiveTab('accounts');
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

    const clearSearch = () => {
        setQuery('');
        setSearchResults([]);
        setActiveTab('explore');
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

    // Handle viewable items change for video preview
    const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        // Find all visible reels in the current view that haven't been played yet
        const unplayedReels = viewableItems.filter(item => {
            const itemData = currentData[item.index];
            const reelId = itemData?._id || itemData?.id;
            return itemData && (itemData.type === 'reel' || itemData.meta?.postType === 'reel') && !playedReelIds.has(reelId);
        });

        if (unplayedReels.length > 0) {
            // Select the first unplayed reel from visible reels (will progress row by row)
            const selectedReel = unplayedReels[0];
            const itemData = currentData[selectedReel.index];
            const reelId = itemData._id || itemData.id;

            // Mark this reel as played
            setPlayedReelIds(prev => new Set([...prev, reelId]));
            setActiveReelId(reelId);
            console.log('Playing reel:', reelId, 'videoUrl:', itemData.videoUrl, 'Played so far:', playedReelIds.size + 1);
        } else {
            // No unplayed reel visible, stop playing
            setActiveReelId(null);
        }
    }, [currentData, playedReelIds]);

    const viewabilityConfig = {
        itemVisiblePercentThreshold: 50,
    };

    // Get user role/type label (empty for personal accounts)
    const getUserTypeLabel = (item: any) => {
        if (item.roles?.includes('investor') || item.role === 'investor' || item.accountType === 'investor') {
            return 'Investor';
        }
        if (item.roles?.includes('startup') || item.role === 'startup' || item.accountType === 'startup' || item.companyName || item.company) {
            return 'Startup';
        }
        // Return empty for personal accounts
        return '';
    };

    // Check if user is verified
    const isUserVerified = (item: any) => {
        return Boolean(item.verified || item.isVerified);
    };

    // Get initials from name
    const getInitials = (name: string) => {
        if (!name) return '?';
        const parts = name.split(' ').filter(Boolean);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.charAt(0).toUpperCase();
    };

    // Get avatar background color based on name
    const getAvatarColor = (name: string) => {
        const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'];
        const index = name ? name.charCodeAt(0) % colors.length : 0;
        return colors[index];
    };

    const renderItem = ({ item, index: _index }: { item: any, index: number }) => {
        // Posts (Grid)
        if (isGrid) {
            const isReel = item.meta?.postType === 'reel' || item.type === 'reel';
            const isActiveReel = isReel && (item._id === activeReelId || item.id === activeReelId);
            const imgUri = isReel
                ? (item.thumbnailUrl || item.thumbUrl || 'https://via.placeholder.com/400x300.png?text=Reel')
                : (item.media?.[0]?.url || item.image || item.thumbUrl || 'https://via.placeholder.com/400x300.png?text=Post');

            const handlePress = () => {
                if (isReel && onReelPress) {
                    onReelPress(item._id || item.id);
                } else if (!isReel && onPostPress) {
                    onPostPress(item._id || item.id);
                }
            };

            return (
                <View style={styles.gridItemWrapper}>
                    <TouchableOpacity
                        style={styles.gridItem}
                        activeOpacity={0.9}
                        onPress={handlePress}
                    >
                        {/* Show Video for active reel, Image otherwise */}
                        {isActiveReel && item.videoUrl ? (
                            <Video
                                source={{ uri: item.videoUrl }}
                                style={styles.gridVideo}
                                resizeMode="cover"
                                repeat={true}
                                paused={false}
                                muted={true}
                                progressUpdateInterval={500}
                                useNativeControls={false}
                                onLoad={() => console.log('Video loaded:', item._id)}
                                onError={(e) => console.warn('Video error for', item._id, ':', e)}
                                onBuffer={() => console.log('Video buffering:', item._id)}
                                rate={1.0}
                            />
                        ) : (
                            <Image
                                source={getImageSource(imgUri)}
                                style={styles.gridImage}
                                resizeMode="cover"
                                onError={(e) => console.warn('Search img err', e.nativeEvent)}
                            />
                        )}
                        {/* Reel icon badge */}
                        {isReel && (
                            <View style={styles.typeBadge}>
                                <ReelsIcon color="#fff" size={16} />
                            </View>
                        )}
                    </TouchableOpacity>
                    {/* Divider line below */}
                    <View style={styles.divider} />
                </View>
            );
        }

        // Accounts (User List)
        const displayName = item.displayName || item.fullName || item.username || 'User';
        const avatarUrl = item.avatarUrl || item.avatar || item.profileImage;
        console.log('Search avatar debug:', { username: item.username, avatarUrl, rawItem: JSON.stringify(item).slice(0, 200) });
        const typeLabel = getUserTypeLabel(item);
        const verified = isUserVerified(item);

        return (
            <TouchableOpacity
                style={styles.userItem}
                activeOpacity={0.7}
                onPress={() => onUserPress && onUserPress(item._id || item.id)}
            >
                {avatarUrl ? (
                    <Image
                        source={getImageSource(avatarUrl)}
                        style={styles.userAvatar}
                    />
                ) : (
                    <View style={[styles.userAvatar, styles.userAvatarPlaceholder, { backgroundColor: getAvatarColor(displayName) }]}>
                        <Text style={styles.userAvatarInitials}>{getInitials(displayName)}</Text>
                    </View>
                )}
                <View style={styles.userInfo}>
                    <View style={styles.userNameRow}>
                        <Text style={[styles.userName, { color: theme.text }]}>{displayName}</Text>
                    </View>
                    {verified && typeLabel ? (
                        <Text style={{ color: '#878787', fontSize: 13, marginTop: 2 }}>Verified {typeLabel.toLowerCase()}</Text>
                    ) : typeLabel ? (
                        <Text style={[styles.userType, { color: theme.placeholder }]}>{typeLabel}</Text>
                    ) : null}
                </View>
            </TouchableOpacity>
        );
    };

    const renderFooter = () => {
        if ((!query.trim() && exploreLoading) || (query.trim() && searchLoading)) {
            return <ActivityIndicator style={styles.loader} color={theme.primary} />;
        }
        return <View style={styles.footerSpacer} />;
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Search Bar */}
            <View style={styles.searchBarContainer}>
                <View style={[styles.searchBar, { backgroundColor: '#1a1a1a', borderColor: '#333' }]}>
                    <MaterialIcons name="search" size={22} color="#888" style={styles.searchIcon} />
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        placeholder="Search accounts, reels, posts..."
                        placeholderTextColor="#666"
                        value={query}
                        onChangeText={handleSearchTextChange}
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                            <MaterialIcons name="close" size={20} color="#888" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Tabs - Only show when searching */}
            {query.trim() !== '' && (
                <View style={[styles.tabsContainer, { borderBottomColor: theme.border }]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {(['accounts', 'posts'] as TabType[]).map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tab, activeTab === tab && styles.tabActive]}
                                onPress={() => handleTabChange(tab)}
                            >
                                <Text style={[styles.tabText, { color: activeTab === tab ? '#fff' : theme.placeholder }]}>
                                    {tab === 'accounts' ? 'Accounts' : 'Posts'}
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
                keyExtractor={(item, idx) => (item._id || item.id || String(idx))}
                renderItem={renderItem}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                contentContainerStyle={isGrid ? styles.gridContent : styles.listContent}
                viewabilityConfig={viewabilityConfig}
                onViewableItemsChanged={onViewableItemsChanged}
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
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 24,
        paddingHorizontal: 12,
        height: 48,
    },
    searchIcon: { marginRight: 8 },
    input: { flex: 1, fontSize: 16, paddingVertical: 0 },
    clearButton: { padding: 4 },
    tabsContainer: { borderBottomWidth: 1, paddingHorizontal: 0 },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
        minWidth: 80,
        alignItems: 'center',
    },
    tabActive: { borderBottomColor: '#fff' },
    tabText: { fontSize: 14, fontWeight: '600' },
    loader: { margin: 20 },
    footerSpacer: { height: 20 },
    gridContent: { paddingHorizontal: 0, paddingBottom: 0, paddingLeft: 0 },
    gridItemWrapper: { width: ITEM_WIDTH, marginHorizontal: 1, marginBlockEnd: 1 },
    gridItem: {
        width: ITEM_WIDTH,
        height: ITEM_HEIGHT,
        borderRadius: 2,
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
        position: 'relative',
    },
    gridImage: { width: '100%', height: '100%', backgroundColor: '#1a1a1a' },
    gridVideo: { width: '100%', height: '100%', backgroundColor: '#000' },
    typeBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 4,
        padding: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: '#333',
        marginTop: 0,
    },
    listContent: { paddingHorizontal: 0, paddingTop: 8 },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    userAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#333',
    },
    userAvatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    userAvatarInitials: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    userInfo: { marginLeft: 12, flex: 1 },
    userNameRow: { flexDirection: 'row', alignItems: 'center' },
    userName: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
    userType: { fontSize: 13, opacity: 0.8 },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
    emptyText: { fontSize: 14 },
});

export default SearchScreen;
