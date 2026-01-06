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
    TextInput,
} from 'react-native';
import { fetchReels, likeReel, unlikeReel, checkReelShared, followUser, unfollowUser, getReel, getUserReels, saveReel, unsaveReel } from '../lib/api';
import { Heart, MessageCircle, Send, Bookmark, Video as VideoIcon } from 'lucide-react-native';
import Video from 'react-native-video';
import ReelCommentsOverlay from '../components/ReelCommentsOverlay';
import ShareModal from '../components/ShareModal';
import { getImageSource } from '../lib/image';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 0;
const COMMENT_INPUT_HEIGHT = 56;

// Color scheme
const COLORS = {
    primary: '#3d3d3d',
    success: '#22c55e',
    like: '#ef4444',
    text: '#f5f5f5',
    textMuted: '#666666',
};

// Reel height - use full window height for clean snapping with no bleed-through
const ITEM_HEIGHT = SCREEN_HEIGHT;

interface ReelItem {
    _id: string;
    videoUrl: string;
    thumbnailUrl?: string;
    caption?: string;
    hashtags?: string[];
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
    isFollowing?: boolean;
    isSaved?: boolean;
    savedId?: string;
}

interface ReelsProps {
    userId?: string;
    initialReelId?: string;
    onBack?: () => void;
    onOpenProfile?: (userId: string) => void;
}

const Reels = ({ userId, initialReelId, onBack, onOpenProfile }: ReelsProps) => {
    const [reels, setReels] = useState<ReelItem[]>([]);
    const flatListRef = useRef<FlatList>(null);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Modal states
    const [commentsReelId, setCommentsReelId] = useState<string | null>(null);
    const [shareReelId, setShareReelId] = useState<string | null>(null);
    const [shareAlreadyShared, setShareAlreadyShared] = useState(false);

    // Like, follow, save loading states
    const [likeLoading, setLikeLoading] = useState<Set<string>>(new Set());
    const [followLoading, setFollowLoading] = useState<Set<string>>(new Set());
    const [saveLoading, setSaveLoading] = useState<Set<string>>(new Set());

    // Expanded caption states - track which reels have expanded captions
    const [expandedCaptions, setExpandedCaptions] = useState<Set<string>>(new Set());

    // Comment input
    const [commentText, setCommentText] = useState('');

    // Get current user ID
    useEffect(() => {
        (async () => {
            try {
                const stored = await AsyncStorage.getItem('user');
                if (stored) {
                    const u = JSON.parse(stored);
                    setCurrentUserId(u?._id || u?.id || null);
                }
            } catch { }
        })();
    }, []);

    useEffect(() => {
        loadReels();
    }, [userId, initialReelId]);

    // Scroll to initial reel if present
    useEffect(() => {
        if (initialReelId && reels.length > 0 && flatListRef.current) {
            const index = reels.findIndex(r => r._id === initialReelId);
            if (index >= 0) {
                setTimeout(() => {
                    flatListRef.current?.scrollToIndex({ index, animated: false });
                    setCurrentIndex(index);
                }, 100);
            }
        }
    }, [initialReelId, reels]);

    const loadReels = async () => {
        try {
            let data: any[] = [];

            if (userId) {
                data = await getUserReels(userId, 30, 0);
            } else {
                data = await fetchReels(30, 0);
            }

            if (initialReelId) {
                const alreadyExists = data.find((r: any) => r._id === initialReelId);
                if (!alreadyExists) {
                    try {
                        const targetReel = await getReel(initialReelId);
                        if (targetReel) {
                            data = [targetReel, ...data];
                        }
                    } catch (e) {
                        console.warn('Failed to load initial reel:', e);
                    }
                }
            }

            // Set defaults directly - don't make individual API calls for follow status
            // The backend should include isFollowing in the reel data
            const reelsWithDefaults = data.map((reel: any) => ({
                ...reel,
                sharesCount: reel.sharesCount || 0,
                isLiked: reel.isLiked || false,
                isShared: false,
                isFollowing: reel.author?.isFollowing || reel.isFollowing || false,
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

        const reel = reels.find(r => r._id === reelId);
        if (!reel) return;

        const wasLiked = reel.isLiked;

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
            setReels(prev => prev.map(r =>
                r._id === reelId
                    ? { ...r, isLiked: wasLiked, likesCount: wasLiked ? r.likesCount + 1 : Math.max(0, r.likesCount - 1) }
                    : r
            ));
        } finally {
            setLikeLoading(prev => {
                const next = new Set(prev);
                next.delete(reelId);
                return next;
            });
        }
    }, [reels, likeLoading]);

    const handleFollow = useCallback(async (authorId: string, reelId: string) => {
        if (!authorId || followLoading.has(authorId)) return;

        const reel = reels.find(r => r._id === reelId);
        if (!reel) return;

        const wasFollowing = reel.isFollowing;

        setReels(prev => prev.map(r =>
            r.author?._id === authorId
                ? { ...r, isFollowing: !wasFollowing }
                : r
        ));

        setFollowLoading(prev => new Set(prev).add(authorId));

        try {
            if (wasFollowing) {
                await unfollowUser(authorId);
            } else {
                await followUser(authorId);
            }
        } catch (err) {
            setReels(prev => prev.map(r =>
                r.author?._id === authorId
                    ? { ...r, isFollowing: wasFollowing }
                    : r
            ));
        } finally {
            setFollowLoading(prev => {
                const next = new Set(prev);
                next.delete(authorId);
                return next;
            });
        }
    }, [reels, followLoading]);

    const handleOpenComments = useCallback((reelId: string) => {
        setCommentsReelId(reelId);
    }, []);

    const handleOpenShare = useCallback(async (reelId: string) => {
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

    const handleCommentInputPress = () => {
        const currentReel = reels[currentIndex];
        if (currentReel) {
            setCommentsReelId(currentReel._id);
        }
    };

    const toggleCaptionExpand = (reelId: string) => {
        setExpandedCaptions(prev => {
            const next = new Set(prev);
            if (next.has(reelId)) {
                next.delete(reelId);
            } else {
                next.add(reelId);
            }
            return next;
        });
    };

    const handleSave = useCallback(async (reelId: string) => {
        if (saveLoading.has(reelId)) return;

        const reel = reels.find(r => r._id === reelId);
        if (!reel) return;

        const wasSaved = reel.isSaved;

        setReels(prev => prev.map(r =>
            r._id === reelId
                ? { ...r, isSaved: !wasSaved }
                : r
        ));

        setSaveLoading(prev => new Set(prev).add(reelId));

        try {
            if (wasSaved && reel.savedId) {
                await unsaveReel(reel.savedId);
            } else {
                const result = await saveReel(reelId);
                if (result?.savedId || result?._id) {
                    setReels(prev => prev.map(r =>
                        r._id === reelId
                            ? { ...r, savedId: result.savedId || result._id }
                            : r
                    ));
                }
            }
        } catch (err) {
            setReels(prev => prev.map(r =>
                r._id === reelId
                    ? { ...r, isSaved: wasSaved }
                    : r
            ));
        } finally {
            setSaveLoading(prev => {
                const next = new Set(prev);
                next.delete(reelId);
                return next;
            });
        }
    }, [reels, saveLoading]);

    const handleProfilePress = useCallback((authorId: string) => {
        if (authorId && onOpenProfile) {
            onOpenProfile(authorId);
        }
    }, [onOpenProfile]);

    const renderReel = ({ item, index }: { item: ReelItem; index: number }) => {
        const isActive = index === currentIndex;
        const authorName = item.author.displayName || item.author.username || 'User';
        const authorAvatar = item.author.avatarUrl;
        const isExpanded = expandedCaptions.has(item._id);

        // Extract hashtags from caption or use provided hashtags
        const captionText = item.caption || '';
        const hashtagRegex = /#\w+/g;
        const extractedHashtags = captionText.match(hashtagRegex) || [];
        const hashtags = item.hashtags || extractedHashtags;
        const captionWithoutHashtags = captionText.replace(hashtagRegex, '').trim();

        return (
            <View style={styles.reelWrapper}>
                <View style={styles.reelContainer}>
                    {/* Video or Thumbnail */}
                    {isActive && item.videoUrl ? (
                        <Video
                            source={{ uri: item.videoUrl }}
                            style={styles.video}
                            resizeMode="cover"
                            repeat
                            paused={false}
                            muted={false}
                            bufferConfig={{
                                minBufferMs: 2000,
                                maxBufferMs: 5000,
                                bufferForPlaybackMs: 1000,
                                bufferForPlaybackAfterRebufferMs: 2000,
                            }}
                            onError={(e) => console.log('Video error:', e)}
                        />
                    ) : (
                        <Image
                            source={{ uri: item.thumbnailUrl || item.videoUrl }}
                            style={styles.video}
                            resizeMode="cover"
                        />
                    )}

                    {/* Overlay Content */}
                    <View style={styles.overlay}>
                        {/* Left side - User info and caption */}
                        <View style={styles.leftContent}>
                            {/* User row */}
                            <View style={styles.userRow}>
                                <TouchableOpacity
                                    style={styles.avatarContainer}
                                    onPress={() => item.author._id && handleProfilePress(item.author._id)}
                                >
                                    {authorAvatar ? (
                                        <Image source={getImageSource(authorAvatar)} style={styles.avatar} />
                                    ) : (
                                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                            <Text style={styles.avatarText}>{authorName.charAt(0).toUpperCase()}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => item.author._id && handleProfilePress(item.author._id)}>
                                    <Text style={styles.username}>{item.author.username}</Text>
                                </TouchableOpacity>
                                {/* Only show follow button if NOT the current user's reel and not already following */}
                                {!item.isFollowing && item.author._id && item.author._id !== currentUserId && (
                                    <TouchableOpacity
                                        style={styles.followBtn}
                                        onPress={() => handleFollow(item.author._id!, item._id)}
                                        disabled={followLoading.has(item.author._id!)}
                                    >
                                        <Text style={styles.followBtnText}>Follow</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Caption - expandable */}
                            {captionText && (
                                <TouchableOpacity
                                    onPress={() => toggleCaptionExpand(item._id)}
                                    activeOpacity={0.8}
                                >
                                    {isExpanded ? (
                                        <View>
                                            <Text style={styles.caption}>{captionWithoutHashtags}</Text>
                                            {hashtags.length > 0 && (
                                                <Text style={styles.hashtags}>{hashtags.join(' ')}</Text>
                                            )}
                                        </View>
                                    ) : (
                                        <Text style={styles.caption} numberOfLines={1}>
                                            {captionWithoutHashtags.length > 40
                                                ? `${captionWithoutHashtags.substring(0, 40)}...`
                                                : captionWithoutHashtags}
                                            {captionWithoutHashtags.length > 40 && (
                                                <Text style={styles.moreText}> more</Text>
                                            )}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Right side - Actions */}
                        <View style={styles.actions}>
                            {/* Like */}
                            <TouchableOpacity
                                style={styles.actionBtn}
                                onPress={() => handleLike(item._id)}
                                disabled={likeLoading.has(item._id)}
                            >
                                <Heart
                                    size={28}
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
                                <MessageCircle size={26} color="#fff" />
                                <Text style={styles.actionText}>{item.commentsCount}</Text>
                            </TouchableOpacity>

                            {/* Share */}
                            <TouchableOpacity
                                style={styles.actionBtn}
                                onPress={() => handleOpenShare(item._id)}
                            >
                                <Send
                                    size={26}
                                    color={item.isShared ? COLORS.success : "#fff"}
                                />
                                <Text style={styles.actionText}>{item.sharesCount || 0}</Text>
                            </TouchableOpacity>

                            {/* Save */}
                            <TouchableOpacity
                                style={styles.actionBtn}
                                onPress={() => handleSave(item._id)}
                                disabled={saveLoading.has(item._id)}
                            >
                                <Bookmark
                                    size={26}
                                    color={item.isSaved ? COLORS.success : "#fff"}
                                    fill={item.isSaved ? COLORS.success : "transparent"}
                                />
                            </TouchableOpacity>
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

    const renderCommentInput = () => (
        <View style={styles.commentInputContainer}>
            <TextInput
                style={styles.commentInput}
                placeholder="Add comment..."
                placeholderTextColor="#888"
                value={commentText}
                onChangeText={setCommentText}
                onFocus={handleCommentInputPress}
            />
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (reels.length === 0) {
        return (
            <View style={[styles.container, styles.center]}>
                <VideoIcon size={64} color="#666" />
                <Text style={styles.emptyText}>No reels yet</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={reels}
                renderItem={renderReel}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                snapToAlignment="start"
                decelerationRate="fast"
                disableIntervalMomentum={true}
                bounces={false}
                extraData={currentIndex}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                getItemLayout={(_, index) => ({
                    length: ITEM_HEIGHT,
                    offset: ITEM_HEIGHT * index,
                    index,
                })}
                contentContainerStyle={{ flexGrow: 1 }}
                removeClippedSubviews={true}
                initialNumToRender={3}
                maxToRenderPerBatch={4}
                scrollEventThrottle={16}
                onScrollToIndexFailed={(info) => {
                    setTimeout(() => {
                        flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
                    }, 500);
                }}
            />
            {renderCommentInput()}

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
    },
    reelContainer: {
        width: SCREEN_WIDTH,
        height: ITEM_HEIGHT,
        backgroundColor: '#000',
        overflow: 'hidden',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        position: 'absolute',
        bottom: 16,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    leftContent: {
        flex: 1,
        marginRight: 16,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarContainer: {
        marginRight: 10,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: '#fff',
    },
    avatarPlaceholder: {
        backgroundColor: '#555',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    username: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
        marginRight: 12,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    followBtn: {
        borderWidth: 1,
        borderColor: '#fff',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    followBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    caption: {
        color: '#fff',
        fontSize: 14,
        lineHeight: 20,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    moreText: {
        color: '#aaa',
        fontWeight: '500',
    },
    hashtags: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 6,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    actions: {
        alignItems: 'center',
    },
    actionBtn: {
        alignItems: 'center',
        marginBottom: 20,
    },
    actionText: {
        color: '#fff',
        fontSize: 12,
        marginTop: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    commentInputContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#000',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#222',
    },
    commentInput: {
        backgroundColor: '#1a1a1a',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        color: '#fff',
        fontSize: 15,
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
        marginTop: 16,
    },
});

export default Reels;
