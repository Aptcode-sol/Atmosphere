import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    Image,
    ActivityIndicator,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Animated,
    Dimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchReels, likeReel, unlikeReel, checkReelShared, followUser, unfollowUser, getReel, getUserReels, saveReel, unsaveReel } from '../../lib/api';
import { Video as VideoIcon, Heart } from 'lucide-react-native';
import Video from 'react-native-video';
import ReelCommentsOverlay from '../../components/ReelCommentsOverlay';
import ShareModal from '../../components/ShareModal';
import { getImageSource } from '../../lib/image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReelSkeleton from '../../components/skeletons/ReelSkeleton';

import { ReelItem, ReelsProps } from './types';
import { styles, COLORS, SCREEN_WIDTH } from './styles';
import ReelActions from './ReelActions';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const BOTTOM_NAV_HEIGHT = 50; // Matches BottomNav NAV_HEIGHT

const Reels = ({ userId, initialReelId, onBack, onOpenProfile }: ReelsProps) => {
    // Use safe area insets for dynamic height calculation
    const insets = useSafeAreaInsets();
    const itemHeight = SCREEN_HEIGHT - insets.top - insets.bottom - BOTTOM_NAV_HEIGHT;

    const [reels, setReels] = useState<ReelItem[]>([]);
    const flatListRef = useRef<FlatList>(null);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [hasPerformedInitialLoad, setHasPerformedInitialLoad] = useState(false);

    // Modal states
    const [commentsReelId, setCommentsReelId] = useState<string | null>(null);
    const [shareReelId, setShareReelId] = useState<string | null>(null);
    const [shareAlreadyShared, setShareAlreadyShared] = useState(false);

    // Loading states
    const [likeLoading, setLikeLoading] = useState<Set<string>>(new Set());
    const [followLoading, setFollowLoading] = useState<Set<string>>(new Set());
    const [saveLoading, setSaveLoading] = useState<Set<string>>(new Set());

    // Expanded caption states
    const [expandedCaptions, setExpandedCaptions] = useState<Set<string>>(new Set());

    // Comment input removed - users tap comment button to open modal

    // Double-tap to like animation refs (per-reel)
    const doubleTapLastTap = useRef<Record<string, number>>({});
    const heartAnimations = useRef<Record<string, { scale: Animated.Value; opacity: Animated.Value }>>({});

    // Video controls state
    const [isPaused, setIsPaused] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const videoRef = useRef<any>(null);
    const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Auto-hide controls after 1.5 seconds
    const showControlsTemporarily = () => {
        setShowControls(true);
        if (controlsTimer.current) clearTimeout(controlsTimer.current);
        controlsTimer.current = setTimeout(() => {
            setShowControls(false);
        }, 1500);
    };

    const getHeartAnimation = (reelId: string) => {
        if (!heartAnimations.current[reelId]) {
            heartAnimations.current[reelId] = {
                scale: new Animated.Value(0),
                opacity: new Animated.Value(0),
            };
        }
        return heartAnimations.current[reelId];
    };

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
        // Only load if this is the first time for this userId (or userId changes)
        if (!hasPerformedInitialLoad || !userId) {
            loadReels();
            if (!userId) {
                setHasPerformedInitialLoad(true);
            }
        }
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

            const reelsWithDefaults = data.map((reel: any) => ({
                ...reel,
                sharesCount: reel.sharesCount || 0,
                isLiked: reel.isLiked || false,
                isShared: false,
                isFollowing: reel.author?.isFollowing || reel.isFollowing || false,
                isSaved: reel.isSaved || false,
                savedId: reel.savedId || null,
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
            if (wasLiked) await unlikeReel(reelId);
            else await likeReel(reelId);
        } catch {
            setReels(prev => prev.map(r =>
                r._id === reelId
                    ? { ...r, isLiked: wasLiked, likesCount: wasLiked ? r.likesCount + 1 : Math.max(0, r.likesCount - 1) }
                    : r
            ));
        } finally {
            setLikeLoading(prev => { const next = new Set(prev); next.delete(reelId); return next; });
        }
    }, [reels, likeLoading]);

    // Instagram-style double-tap to like with big heart animation
    const handleDoubleTap = useCallback((reelId: string) => {
        const now = Date.now();
        const lastTap = doubleTapLastTap.current[reelId] || 0;
        const DOUBLE_TAP_DELAY = 300;

        if (now - lastTap < DOUBLE_TAP_DELAY) {
            // Double tap detected - like if not already liked
            const reel = reels.find(r => r._id === reelId);
            if (reel && !reel.isLiked) {
                handleLike(reelId);
            }
            // Show Instagram-style heart animation (big bounce)
            const anim = getHeartAnimation(reelId);
            // Reset values first
            anim.scale.setValue(0);
            anim.opacity.setValue(0);

            Animated.sequence([
                // Quick pop in
                Animated.parallel([
                    Animated.spring(anim.scale, {
                        toValue: 1.2,
                        useNativeDriver: true,
                        tension: 100,
                        friction: 6,
                    }),
                    Animated.timing(anim.opacity, { toValue: 1, duration: 50, useNativeDriver: true }),
                ]),
                // Brief hold
                Animated.delay(0),
                // Quick fade out
                Animated.parallel([
                    Animated.timing(anim.scale, { toValue: 0.9, duration: 50, useNativeDriver: true }),
                    Animated.timing(anim.opacity, { toValue: 0, duration: 50, useNativeDriver: true }),
                ]),
            ]).start();
        }
        doubleTapLastTap.current[reelId] = now;
    }, [reels, handleLike]);

    const handleFollow = useCallback(async (authorId: string, reelId: string) => {
        if (!authorId || followLoading.has(authorId)) return;
        const reel = reels.find(r => r._id === reelId);
        if (!reel) return;

        const wasFollowing = reel.isFollowing;
        setReels(prev => prev.map(r => r.author?._id === authorId ? { ...r, isFollowing: !wasFollowing } : r));
        setFollowLoading(prev => new Set(prev).add(authorId));

        try {
            if (wasFollowing) await unfollowUser(authorId);
            else await followUser(authorId);
        } catch {
            setReels(prev => prev.map(r => r.author?._id === authorId ? { ...r, isFollowing: wasFollowing } : r));
        } finally {
            setFollowLoading(prev => { const next = new Set(prev); next.delete(authorId); return next; });
        }
    }, [reels, followLoading]);

    const handleOpenComments = useCallback((reelId: string) => setCommentsReelId(reelId), []);

    const handleOpenShare = useCallback(async (reelId: string) => {
        try {
            const result = await checkReelShared(reelId);
            setShareAlreadyShared(result.shared || false);
        } catch { setShareAlreadyShared(false); }
        setShareReelId(reelId);
    }, []);

    const handleCommentAdded = useCallback((newCount?: number) => {
        if (commentsReelId) {
            setReels(prev => prev.map(r =>
                r._id === commentsReelId ? { ...r, commentsCount: typeof newCount === 'number' ? newCount : r.commentsCount + 1 } : r
            ));
        }
    }, [commentsReelId]);

    const handleCommentDeleted = useCallback(() => {
        if (commentsReelId) {
            setReels(prev => prev.map(r => r._id === commentsReelId ? { ...r, commentsCount: Math.max(0, r.commentsCount - 1) } : r));
        }
    }, [commentsReelId]);

    const handleShareComplete = useCallback((sharesCount: number) => {
        if (shareReelId) {
            setReels(prev => prev.map(r => r._id === shareReelId ? { ...r, sharesCount, isShared: true } : r));
        }
    }, [shareReelId]);

    const handleCommentInputPress = () => {
        const currentReel = reels[currentIndex];
        if (currentReel) setCommentsReelId(currentReel._id);
    };

    const toggleCaptionExpand = (reelId: string) => {
        setExpandedCaptions(prev => {
            const next = new Set(prev);
            next.has(reelId) ? next.delete(reelId) : next.add(reelId);
            return next;
        });
    };

    const handleSave = useCallback(async (reelId: string) => {
        if (saveLoading.has(reelId)) return;
        const reel = reels.find(r => r._id === reelId);
        if (!reel) return;

        const wasSaved = reel.isSaved;
        setReels(prev => prev.map(r => r._id === reelId ? { ...r, isSaved: !wasSaved } : r));
        setSaveLoading(prev => new Set(prev).add(reelId));

        try {
            if (wasSaved && reel.savedId) {
                await unsaveReel(reel.savedId);
            } else {
                const result = await saveReel(reelId);
                if (result?.savedId || result?._id) {
                    setReels(prev => prev.map(r => r._id === reelId ? { ...r, savedId: result.savedId || result._id } : r));
                }
            }
        } catch {
            setReels(prev => prev.map(r => r._id === reelId ? { ...r, isSaved: wasSaved } : r));
        } finally {
            setSaveLoading(prev => { const next = new Set(prev); next.delete(reelId); return next; });
        }
    }, [reels, saveLoading]);

    const handleProfilePress = useCallback((authorId: string) => {
        if (authorId && onOpenProfile) onOpenProfile(authorId);
    }, [onOpenProfile]);

    const renderReel = ({ item, index }: { item: ReelItem; index: number }) => {
        const isActive = index === currentIndex;
        const authorName = item.author.displayName || item.author.username || 'User';
        const authorAvatar = item.author.avatarUrl;
        const isExpanded = expandedCaptions.has(item._id);

        const captionText = item.caption || '';
        const hashtagRegex = /#\w+/g;
        const extractedHashtags = captionText.match(hashtagRegex) || [];
        const hashtags = item.hashtags || extractedHashtags;
        const captionWithoutHashtags = captionText.replace(hashtagRegex, '').trim();

        return (
            <View style={[styles.reelWrapper, { height: itemHeight }]}>
                <View style={[styles.reelContainer, { height: itemHeight }]}>
                    {/* Video/Image layer */}
                    {isActive && item.videoUrl ? (
                        <Video
                            ref={videoRef}
                            source={{ uri: item.videoUrl }}
                            style={styles.video}
                            resizeMode="cover"
                            repeat
                            paused={isPaused}
                            muted={isMuted}
                            bufferConfig={{ minBufferMs: 2000, maxBufferMs: 5000, bufferForPlaybackMs: 1000, bufferForPlaybackAfterRebufferMs: 2000 }}
                            onLoad={(data: any) => setDuration(data.duration)}
                            onProgress={(data: any) => setCurrentTime(data.currentTime)}
                            onError={(e) => console.log('Video error:', e)}
                        />
                    ) : (
                        <Image source={{ uri: item.thumbnailUrl || item.videoUrl }} style={styles.video} resizeMode="cover" />
                    )}

                    {/* Touch overlay - single tap: pause/play, double tap: like */}
                    <TouchableWithoutFeedback
                        onPress={() => {
                            // Check for double tap first
                            const now = Date.now();
                            const lastTap = doubleTapLastTap.current[item._id] || 0;
                            if (now - lastTap < 300) {
                                // Double tap - like
                                handleDoubleTap(item._id);
                            } else {
                                // Single tap - toggle pause and show controls
                                setIsPaused(!isPaused);
                                showControlsTemporarily();
                            }
                            doubleTapLastTap.current[item._id] = now;
                        }}
                    >
                        <View style={styles.touchOverlay} />
                    </TouchableWithoutFeedback>

                    {/* Play/Pause overlay with mute button below (only when controls visible) */}
                    {showControls && isActive && (
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', pointerEvents: 'box-none' }}>
                            {isPaused && (
                                <MaterialCommunityIcons name="play-circle" size={70} color="rgba(255,255,255,0.8)" />
                            )}
                            {/* Mute button - below play icon */}
                            <TouchableOpacity
                                style={{ marginTop: isPaused ? 20 : 0, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8 }}
                                onPress={() => setIsMuted(!isMuted)}
                            >
                                <MaterialCommunityIcons name={isMuted ? "volume-off" : "volume-high"} size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Progress Bar - Bottom (always visible when active) */}
                    {isActive && (
                        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 20, justifyContent: 'center', zIndex: 20 }}>
                            <Slider
                                style={{ width: '100%', height: 40 }}
                                minimumValue={0}
                                maximumValue={duration || 1}
                                value={currentTime}
                                minimumTrackTintColor="#fff"
                                maximumTrackTintColor="rgba(255,255,255,0.3)"
                                thumbTintColor="transparent"
                                onSlidingComplete={(val: number) => {
                                    videoRef.current?.seek(val);
                                    setCurrentTime(val);
                                }}
                            />
                        </View>
                    )}

                    {/* Double-tap heart animation - white heart like Instagram */}
                    <Animated.View style={[styles.doubleTapHeart, { opacity: getHeartAnimation(item._id).opacity, transform: [{ scale: getHeartAnimation(item._id).scale }] }]} pointerEvents="none">
                        <Heart size={70} color="#fff" fill="#fff" strokeWidth={0} />
                    </Animated.View>

                    <View style={styles.overlay}>
                        <View style={styles.leftContent}>
                            <View style={styles.userRow}>
                                <TouchableOpacity style={styles.avatarContainer} onPress={() => item.author._id && handleProfilePress(item.author._id)}>
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
                                {!item.isFollowing && item.author._id && item.author._id !== currentUserId && (
                                    <TouchableOpacity style={styles.followBtn} onPress={() => handleFollow(item.author._id!, item._id)} disabled={followLoading.has(item.author._id!)}>
                                        <Text style={styles.followBtnText}>Follow</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {captionText && (
                                <TouchableOpacity onPress={() => toggleCaptionExpand(item._id)} activeOpacity={0.8}>
                                    {isExpanded ? (
                                        <View>
                                            <Text style={styles.caption}>{captionWithoutHashtags}</Text>
                                            {hashtags.length > 0 && <Text style={styles.hashtags}>{hashtags.join(' ')}</Text>}
                                        </View>
                                    ) : (
                                        <Text style={styles.caption} numberOfLines={1}>
                                            {captionWithoutHashtags.length > 40 ? `${captionWithoutHashtags.substring(0, 40)}...` : captionWithoutHashtags}
                                            {captionWithoutHashtags.length > 40 && <Text style={styles.moreText}> more</Text>}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>

                        <ReelActions
                            reel={item}
                            likeLoading={likeLoading.has(item._id)}
                            saveLoading={saveLoading.has(item._id)}
                            onLike={() => handleLike(item._id)}
                            onComment={() => handleOpenComments(item._id)}
                            onShare={() => handleOpenShare(item._id)}
                            onSave={() => handleSave(item._id)}
                        />
                    </View>
                </View>
            </View >
        );
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) setCurrentIndex(viewableItems[0].index || 0);
    }).current;

    if (loading) {
        return <ReelSkeleton />;
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
                snapToInterval={itemHeight}
                snapToAlignment="start"
                decelerationRate="fast"
                disableIntervalMomentum={true}
                bounces={false}
                extraData={currentIndex}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                getItemLayout={(_, index) => ({ length: itemHeight, offset: itemHeight * index, index })}
                contentContainerStyle={{ flexGrow: 1 }}
                removeClippedSubviews={true}
                initialNumToRender={3}
                maxToRenderPerBatch={4}
                scrollEventThrottle={16}
                onScrollToIndexFailed={(info) => {
                    setTimeout(() => flatListRef.current?.scrollToIndex({ index: info.index, animated: false }), 500);
                }}
            />

            {commentsReelId && (
                <ReelCommentsOverlay
                    reelId={commentsReelId}
                    visible={!!commentsReelId}
                    onClose={() => setCommentsReelId(null)}
                    onCommentAdded={handleCommentAdded}
                    onCommentDeleted={handleCommentDeleted}
                />
            )}

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

export default Reels;
