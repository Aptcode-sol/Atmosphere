import React, { useState, useContext, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchSavedPosts, unsavePost } from '../lib/api';
import Icon from 'react-native-vector-icons/Ionicons';
import ThemedRefreshControl from '../components/ThemedRefreshControl';
import ReelsIcon from '../components/icons/ReelsIcon';

const { width } = Dimensions.get('window');
const GRID_SIZE = (width - 6) / 3; // 3 columns with gaps matching Search

interface SavedItem {
    _id: string;
    postId?: any;
    post?: any;
    user?: any;
    savedAt?: string;
    contentType?: 'Post' | 'StartupDetails' | 'Reel';
}

interface SavedPostsProps {
    onClose?: () => void;
    onPostPress?: (postId: string) => void;
    onStartupPress?: (startupId: string) => void;
    onReelPress?: (reelId: string) => void;
}

const SavedPosts = ({ onClose, onPostPress, onStartupPress, onReelPress }: SavedPostsProps) => {
    const { theme } = useContext(ThemeContext) as any;
    const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);


    const loadSavedPosts = useCallback(async (isRefreshing = false) => {
        if (!isRefreshing) setLoading(true);
        try {
            const data = await fetchSavedPosts();
            setSavedItems(Array.isArray(data) ? data : []);
        } catch (err) {
            console.warn('Failed to load saved posts:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadSavedPosts();
    }, [loadSavedPosts]);

    const onRefresh = () => {
        setRefreshing(true);
        loadSavedPosts(true);
    };

    const handleUnsave = async (savedId: string) => {
        try {
            await unsavePost(savedId);
            setSavedItems(prev => prev.filter(item => item._id !== savedId));
        } catch (err) {
            console.warn('Failed to unsave post:', err);
        }
    };

    const handlePostPress = (item: SavedItem) => {
        const contentType = item.contentType || 'Post';
        const contentId = item.postId?._id || item.postId || item.post?._id || item.post;

        // Handle different content types
        if (contentType === 'Reel') {
            if (onReelPress && contentId) {
                onReelPress(String(contentId));
            }
        } else if (contentType === 'StartupDetails') {
            if (onStartupPress && contentId) {
                onStartupPress(String(contentId));
            }
        } else {
            // Default to Post
            if (onPostPress && contentId) {
                onPostPress(String(contentId));
            }
        }
    };

    const getPostImageUrl = (item: SavedItem): string | null => {
        if (!item.postId) return null;
        if (typeof item.postId === 'object' && item.postId.media && item.postId.media.length > 0) {
            return item.postId.media[0].url;
        }
        // For reels, use thumbnailUrl
        if (typeof item.postId === 'object' && item.postId.thumbnailUrl) {
            return item.postId.thumbnailUrl;
        }
        return null;
    };

    const getPostContent = (item: SavedItem): string => {
        if (!item.postId) return 'Saved post';
        if (typeof item.postId === 'object' && item.postId.content) {
            return item.postId.content;
        }
        // For reels, show caption
        if (typeof item.postId === 'object' && item.postId.caption) {
            return item.postId.caption;
        }
        return 'Saved post';
    };

    const renderItem = ({ item }: { item: SavedItem }) => {
        const imageUrl = getPostImageUrl(item);
        const isReel = item.contentType === 'Reel';
        // Debug: log saved item (especially StartupDetails) to compare with feed
        if (console && console.log) {
            console.log('SavedPosts item:', item);
            if (item.contentType === 'StartupDetails') console.log('Saved startup postId:', item.postId);
        }

        return (
            <TouchableOpacity
                style={styles.gridItem}
                onPress={() => handlePostPress(item)}
                onLongPress={() => handleUnsave(item._id)}
                activeOpacity={0.8}
            >
                {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.gridImage} />
                ) : (
                    <View style={[styles.gridPlaceholder, { backgroundColor: theme.cardBackground }]}>
                        <Text style={[styles.placeholderText, { color: theme.placeholder }]} numberOfLines={3}>
                            {getPostContent(item)}
                        </Text>
                    </View>
                )}
                {/* Video/Reel icon overlay */}
                {isReel && (
                    <View style={styles.reelIconOverlay}>
                        <ReelsIcon color="#fff" size={16} />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const renderHeader = () => (
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
            {onClose && (
                <TouchableOpacity onPress={onClose} style={styles.backBtn}>
                    <Icon name="chevron-back" size={24} color={theme.text} />
                </TouchableOpacity>
            )}
            <Text style={[styles.headerTitle, { color: theme.text }]}>Saved</Text>
            <View style={styles.headerRight} />
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Icon name="bookmark-outline" size={64} color={theme.placeholder} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Nothing saved yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.placeholder }]}>
                Save posts by tapping the bookmark icon
            </Text>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                {renderHeader()}
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {renderHeader()}
            <FlatList
                data={savedItems}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                numColumns={3}
                contentContainerStyle={savedItems.length === 0 ? styles.emptyList : styles.gridContainer}
                ListEmptyComponent={renderEmptyState}
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
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    backBtn: {
        width: 32,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    headerRight: {
        width: 32,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridContainer: {
        padding: 1,
    },
    gridItem: {
        width: GRID_SIZE,
        height: GRID_SIZE * 4 / 3,
        marginHorizontal: 1,
        marginBottom: 1,
        position: 'relative',
    },
    gridImage: {
        width: '100%',
        height: '100%',
    },
    gridPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
    },
    placeholderText: {
        fontSize: 11,
        textAlign: 'center',
    },
    unsaveBtn: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 12,
        padding: 4,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyList: {
        flex: 1,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
    },
    reelIconOverlay: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 4,
        padding: 4,
        zIndex: 10,
    },
});

export default SavedPosts;
