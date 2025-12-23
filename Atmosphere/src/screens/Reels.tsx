import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Dimensions,
    Image,
    ActivityIndicator,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { fetchReels, likeReel, unlikeReel, checkReelShared } from '../lib/api';
import { BOTTOM_NAV_HEIGHT } from '../lib/layout';
import { Heart, MessageCircle, Send, Eye, Video as VideoIcon, ArrowLeft } from 'lucide-react-native';
import Video from 'react-native-video';
import ReelCommentsOverlay from '../components/ReelCommentsOverlay';
import ShareModal from '../components/ShareModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 24;

// Color scheme matching Atmosphere web (dark grey theme)
const COLORS = {
    primary: '#3d3d3d',
    success: '#22c55e',
    like: '#ef4444',      // Red for likes
    text: '#f5f5f5',
    textMuted: '#666666',
};

// Calculate 9:16 reel container dimensions
// Content is now properly constrained by parent container in LandingPage
const REEL_ASPECT_RATIO = 9 / 16;
const AVAILABLE_HEIGHT = SCREEN_HEIGHT - STATUS_BAR_HEIGHT - 80; // Account for navbar
// Use full available height, calculate optimal width for 9:16
const REEL_HEIGHT = AVAILABLE_HEIGHT;
const REEL_WIDTH = Math.min(SCREEN_WIDTH, REEL_HEIGHT * REEL_ASPECT_RATIO);
// Item height for FlatList snapping
const ITEM_HEIGHT = REEL_HEIGHT;

interface ReelItem {
    _id: string;
    videoUrl: string;
    thumbnailUrl?: string;
    caption?: string;
    author: {
        _id?: string;
        username: string;
        displayName?: string;
        avatarUrl?: string;
        verified?: boolean;
    };
    likesCount: number;
    commentsCount: number;
    viewsCount: number;
    sharesCount: number;
    isLiked?: boolean;
    isShared?: boolean;
}

interface ReelsProps {
    userId?: string;
    initialReelId?: string;
    onBack?: () => void;
}



const Reels = ({ userId, initialReelId, onBack }: ReelsProps) => {
    // theme not required here
    const [reels, setReels] = useState<ReelItem[]>([]);

    const flatListRef = useRef<FlatList>(null);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Modal states
    const [commentsReelId, setCommentsReelId] = useState<string | null>(null);
    const [shareReelId, setShareReelId] = useState<string | null>(null);
    const [shareAlreadyShared, setShareAlreadyShared] = useState(false);

    // Like loading states per reel
    const [likeLoading, setLikeLoading] = useState<Set<string>>(new Set());
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            const data = await fetchReels(30, 0);
            const reelsWithDefaults = data.map((reel: any) => ({
                ...reel,
                sharesCount: reel.sharesCount || 0,
                isLiked: reel.isLiked || false,
                isShared: false,
            }));
            setReels(reelsWithDefaults);
        } catch (err) {
            console.warn('Failed to refresh reels:', err);
        } finally {
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        console.log('Reels mounted/updated with userId:', userId, 'initialReelId:', initialReelId);
        loadReels();
    }, [userId, initialReelId]);

    // Scroll to initial reel if present
    useEffect(() => {
        if (initialReelId && reels.length > 0 && flatListRef.current) {
            const index = reels.findIndex(r => r._id === initialReelId);
            console.log('Scrolling to initial reel index:', index, 'id:', initialReelId);
            if (index >= 0) {
                // Wait a tick for layout
                setTimeout(() => {
                    flatListRef.current?.scrollToIndex({ index, animated: false });
                    setCurrentIndex(index);
                }, 100);
            }
        }
    }, [initialReelId, reels]);

    const loadReels = async () => {
        try {
            console.log('Loading reels...');
            let data: any[] = [];
            const api = await import('../lib/api');

            if (userId) {
                // Fetch user specific reels
                data = await api.getUserReels(userId, 30, 0);
            } else {
                data = await api.fetchReels(30, 0);
            }

            // Check if we need to fetch the initial reel specifically
            if (initialReelId) {
                console.log('Checking for initial reel:', initialReelId);
                const alreadyExists = data.find((r: any) => r._id === initialReelId);
                if (!alreadyExists) {
                    try {
                        console.log('Fetching missing initial reel...');
                        const targetReel = await api.getReel(initialReelId);
                        if (targetReel) {
                            console.log('Found target reel, prepending...');
                            // Prepend the target reel
                            data = [targetReel, ...data];
                        } else {
                            console.warn('Target reel not found on server');
                        }
                    } catch (e) {
                        console.warn('Failed to load initial reel:', e);
                    }
                } else {
                    console.log('Initial reel already in batch');
                }
            }

            // Initialize with default values
            const reelsWithDefaults = data.map((reel: any) => ({
                ...reel,
                sharesCount: reel.sharesCount || 0,
                isLiked: reel.isLiked || false,
                isShared: false,
            }));
            setReels(reelsWithDefaults);
        } catch (err) {
            console.warn('Failed to load reels:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = useCallback(async (reelId: string) => {
        if (likeLoading.has(reelId)) return;

        // Find current reel
        const reel = reels.find(r => r._id === reelId);
        if (!reel) return;

        const wasLiked = reel.isLiked;

        // Optimistic update
        setReels(prev => prev.map(r =>
            r._id === reelId
                ? { ...r, isLiked: !wasLiked, likesCount: wasLiked ? Math.max(0, r.likesCount - 1) : r.likesCount + 1 }
                : r
        ));

        setLikeLoading(prev => new Set(prev).add(reelId));

        try {
            if (wasLiked) {
                await unlikeReel(reelId);
            } else {
                await likeReel(reelId);
            }
        } catch (err) {
            // Revert on error
            setReels(prev => prev.map(r =>
                r._id === reelId
                    ? { ...r, isLiked: wasLiked, likesCount: wasLiked ? r.likesCount + 1 : Math.max(0, r.likesCount - 1) }
                    : r
            ));
            console.warn('Like/unlike failed:', err);
        } finally {
            setLikeLoading(prev => {
                const next = new Set(prev);
                next.delete(reelId);
                return next;
            });
        }
    }, [reels, likeLoading]);

    const handleOpenComments = useCallback((reelId: string) => {
        setCommentsReelId(reelId);
    }, []);

    const handleOpenShare = useCallback(async (reelId: string) => {
        // Check if already shared
        try {
            const result = await checkReelShared(reelId);
            setShareAlreadyShared(result.shared || false);
        } catch {
            setShareAlreadyShared(false);
        }
        setShareReelId(reelId);
    }, []);

    const handleCommentAdded = useCallback((newCount?: number) => {
        if (commentsReelId) {
            setReels(prev => prev.map(r =>
                r._id === commentsReelId
                    ? { ...r, commentsCount: typeof newCount === 'number' ? newCount : r.commentsCount + 1 }
                    : r
            ));
        }
    }, [commentsReelId]);

    const handleCommentDeleted = useCallback(() => {
        if (commentsReelId) {
            setReels(prev => prev.map(r =>
                r._id === commentsReelId
                    ? { ...r, commentsCount: Math.max(0, r.commentsCount - 1) }
                    : r
            ));
        }
    }, [commentsReelId]);

    const handleShareComplete = useCallback((sharesCount: number) => {
        if (shareReelId) {
            setReels(prev => prev.map(r =>
                r._id === shareReelId
                    ? { ...r, sharesCount, isShared: true }
                    : r
            ));
        }
    }, [shareReelId]);

    const renderReel = ({ item, index }: { item: ReelItem; index: number }) => {
        const isActive = index === currentIndex;
        // author display name resolved inline where needed

        return (
            <View style={styles.reelWrapper}>
                <View style={styles.reelContainer}>
                    {/* Video or Thumbnail - using contain to preserve original aspect ratio */}
                    {isActive && item.videoUrl ? (
                        <Video
                            source={{ uri: item.videoUrl }}
                            style={styles.video}
                            resizeMode="contain"
                            repeat
                            paused={false}
                            volume={1.0}
                        />
                    ) : (
                        <Image
                            source={{ uri: item.thumbnailUrl || item.videoUrl }}
                            style={styles.video}
                            resizeMode="contain"
                        />
                    )}

                    {/* Overlay Content */}
                    <View style={styles.overlay}>
                        <View style={styles.info}>
                            <Text style={styles.username}>@{item.author.username}</Text>
                            {item.caption && (
                                <Text style={styles.caption} numberOfLines={2}>
                                    {item.caption}
                                </Text>
                            )}
                        </View>

                        {/* Actions */}
                        <View style={styles.actions}>
                            {/* Like */}
                            <TouchableOpacity
                                style={styles.actionBtn}
                                onPress={() => handleLike(item._id)}
                                disabled={likeLoading.has(item._id)}
                            >
                                <Heart
                                    size={32}
                                    color={item.isLiked ? COLORS.like : "#fff"}
                                    fill={item.isLiked ? COLORS.like : "transparent"}
                                />
                                <Text style={styles.actionText}>{item.likesCount}</Text>
                            </TouchableOpacity>

                            {/* Comment */}
                            <TouchableOpacity
                                style={styles.actionBtn}
                                onPress={() => handleOpenComments(item._id)}
                            >
                                <MessageCircle size={28} color="#fff" />
                                <Text style={styles.actionText}>{item.commentsCount}</Text>
                            </TouchableOpacity>

                            {/* Share */}
                            <TouchableOpacity
                                style={styles.actionBtn}
                                onPress={() => handleOpenShare(item._id)}
                            >
                                <Send
                                    size={28}
                                    color={item.isShared ? COLORS.success : "#fff"}
                                    fill={item.isShared ? COLORS.success : "transparent"}
                                />
                                <Text style={styles.actionText}>{item.sharesCount || 0}</Text>
                            </TouchableOpacity>

                            {/* Views */}
                            <View style={styles.actionBtn}>
                                <Eye size={28} color="#fff" />
                                <Text style={styles.actionText}>{item.viewsCount}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index || 0);
        }
    }).current;

    const renderBackButton = () => {
        if (!onBack) return null;
        return (
            <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.7}
            >
                <ArrowLeft size={28} color="#fff" />
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                {renderBackButton()}
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (reels.length === 0) {
        return (
            <View style={[styles.container, styles.center]}>
                {renderBackButton()}
                <VideoIcon size={64} color="#666" />
                <Text style={styles.emptyText}>No reels yet</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {renderBackButton()}
            <FlatList
                ref={flatListRef}
                data={reels} // Use local reels state
                renderItem={renderReel}
                keyExtractor={(item) => item._id}
                pagingEnabled
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                getItemLayout={(_, index) => ({
                    length: ITEM_HEIGHT,
                    offset: ITEM_HEIGHT * index,
                    index,
                })}
                extraData={[likeLoading]}
                onScrollToIndexFailed={(info) => {
                    setTimeout(() => {
                        flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
                    }, 500);
                }}
            />

            {/* Comments Modal */}
            {commentsReelId && (
                <ReelCommentsOverlay
                    reelId={commentsReelId}
                    visible={!!commentsReelId}
                    onClose={() => setCommentsReelId(null)}
                    onCommentAdded={handleCommentAdded}
                    onCommentDeleted={handleCommentDeleted}
                />
            )}

            {/* Share Modal */}
            {shareReelId && (
                <ShareModal
                    contentId={shareReelId}
                    type="reel"
                    visible={!!shareReelId}
                    onClose={() => setShareReelId(null)}
                    onShareComplete={handleShareComplete}
                    alreadyShared={shareAlreadyShared}
                    contentTitle={reels.find(r => r._id === shareReelId)?.caption || 'Reel'}
                    contentImage={reels.find(r => r._id === shareReelId)?.thumbnailUrl || reels.find(r => r._id === shareReelId)?.videoUrl}
                    contentOwner={reels.find(r => r._id === shareReelId)?.author.displayName || reels.find(r => r._id === shareReelId)?.author.username}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    reelWrapper: {
        width: SCREEN_WIDTH,
        height: ITEM_HEIGHT,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    reelContainer: {
        width: REEL_WIDTH,
        height: REEL_HEIGHT,
        backgroundColor: '#000',
        borderRadius: 12,
        overflow: 'hidden',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        // Removed solid background - use transparent to show full video
    },
    info: {
        flex: 1,
        marginRight: 16,
    },
    username: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    caption: {
        color: '#fff',
        fontSize: 14,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    actions: {
        alignItems: 'center',
    },
    actionBtn: {
        alignItems: 'center',
        marginBottom: 16,
    },
    actionText: {
        color: '#fff',
        fontSize: 12,
        marginTop: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
        marginTop: 16,
    },
    backButton: {
        position: 'absolute',
        top: STATUS_BAR_HEIGHT + 10,
        left: 16,
        zIndex: 50,
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
});

export default Reels;
