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

const { width } = Dimensions.get('window');
const GRID_SIZE = (width - 4) / 3; // 3 columns with 2px gaps

interface SavedItem {
    _id: string;
    postId: string | {
        _id: string;
        content?: string;
        media?: { url: string; type: string }[];
        author?: {
            username: string;
            displayName?: string;
            avatarUrl?: string;
        };
    };
    createdAt: string;
}

interface SavedPostsProps {
    onClose?: () => void;
    onPostPress?: (postId: string) => void;
}

const SavedPosts = ({ onClose, onPostPress }: SavedPostsProps) => {
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
        const postId = typeof item.postId === 'string' ? item.postId : item.postId._id;
        onPostPress?.(postId);
    };

    const getPostImageUrl = (item: SavedItem): string | null => {
        if (typeof item.postId === 'object' && item.postId.media && item.postId.media.length > 0) {
            return item.postId.media[0].url;
        }
        return null;
    };

    const getPostContent = (item: SavedItem): string => {
        if (typeof item.postId === 'object' && item.postId.content) {
            return item.postId.content;
        }
        return 'Saved post';
    };

    const renderItem = ({ item }: { item: SavedItem }) => {
        const imageUrl = getPostImageUrl(item);

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
                <TouchableOpacity
                    style={styles.unsaveBtn}
                    onPress={() => handleUnsave(item._id)}
                >
                    <Icon name="bookmark" size={16} color="#fff" />
                </TouchableOpacity>
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
        height: GRID_SIZE,
        margin: 1,
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
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.5)',
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
});

export default SavedPosts;
