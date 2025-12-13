/* eslint-disable react-native/no-inline-styles */
import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Animated, FlatList, ActivityIndicator, Image, TouchableWithoutFeedback } from 'react-native';
import { PLACEHOLDER } from '../../lib/localImages';
import { getImageSource } from '../../lib/image';
import styles from './Profile.styles';
import Icon from 'react-native-vector-icons/Ionicons';

type Props = {
    posts: any[];
    reels?: any[];
    postsLoading: boolean;
    reelsLoading?: boolean;
    theme: any;
    onPostPress?: (postId: string) => void;
    onReelPress?: (reelId: string) => void;
};

export default function ProfilePager({ posts, reels = [], postsLoading, reelsLoading = false, theme, onPostPress, onReelPress }: Props) {
    const pagerRef = useRef<any>(null);
    const scrollX = useRef(new Animated.Value(0)).current;
    const screenW = Dimensions.get('window').width;
    const [activeTab, setActiveTab] = useState<'posts' | 'expand' | 'trades'>('posts');

    // Combine posts and reels, sorted by date (newest first)
    const combinedContent = React.useMemo(() => {
        const postsWithType = posts.map(p => ({ ...p, _type: 'post' as const }));
        const reelsWithType = reels.map(r => ({ ...r, _type: 'reel' as const }));
        const all = [...postsWithType, ...reelsWithType];
        // Sort by createdAt descending
        all.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
        });
        return all;
    }, [posts, reels]);

    const renderGridItem = ({ item }: { item: any }) => {
        const isReel = item._type === 'reel';
        const itemWidth = (screenW - 6) / 3;
        const itemId = item._id || item.id;

        // Get image/thumbnail
        let imageUrl: string | null = null;
        if (isReel) {
            imageUrl = item.thumbnailUrl || item.videoUrl;
        } else {
            const mediaFirst = Array.isArray(item.media) && item.media.length > 0 ? item.media[0] : null;
            imageUrl = mediaFirst?.url || mediaFirst?.src || item.image || item.imageUrl || item.profileImage || item.photo || mediaFirst || null;
        }

        const source = getImageSource(imageUrl || (PLACEHOLDER || 'https://via.placeholder.com/300x300.png?text=Post'));

        return (
            <TouchableWithoutFeedback
                onPress={() => {
                    if (isReel) {
                        onReelPress?.(String(itemId));
                    } else {
                        onPostPress?.(String(itemId));
                    }
                }}
            >
                <View style={{ width: itemWidth, height: itemWidth, backgroundColor: '#222' }}>
                    <Image
                        source={source}
                        style={{ width: '100%', height: '100%' }}
                        onError={(e) => { console.warn('Profile grid image error', e.nativeEvent, imageUrl); }}
                    />
                    {/* Reel indicator overlay */}
                    {isReel && (
                        <View style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            borderRadius: 4,
                            padding: 2,
                        }}>
                            <Icon name="play" size={16} color="#fff" />
                        </View>
                    )}
                    {/* Video type indicator */}
                    {!isReel && Array.isArray(item.media) && item.media.length > 0 && item.media[0]?.type === 'video' && (
                        <View style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            borderRadius: 4,
                            padding: 2,
                        }}>
                            <Icon name="videocam" size={16} color="#fff" />
                        </View>
                    )}
                    {/* Multiple media indicator */}
                    {!isReel && Array.isArray(item.media) && item.media.length > 1 && (
                        <View style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            borderRadius: 4,
                            padding: 2,
                        }}>
                            <Icon name="copy" size={14} color="#fff" />
                        </View>
                    )}
                </View>
            </TouchableWithoutFeedback>
        );
    };

    const isLoading = postsLoading || reelsLoading;

    return (
        <>
            <View style={styles.tabsRow}>
                <TouchableOpacity style={styles.tabItem} onPress={() => { setActiveTab('posts'); pagerRef.current?.scrollTo({ x: 0, animated: true }); }}>
                    <Text style={[activeTab === 'posts' ? styles.tabTextActive : styles.tabText, { color: theme.text }]}>Posts</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabItem} onPress={() => { setActiveTab('expand'); pagerRef.current?.scrollTo({ x: screenW, animated: true }); }}>
                    <Text style={[activeTab === 'expand' ? styles.tabTextActive : styles.tabText, { color: theme.placeholder }]}>Expand</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabItem} onPress={() => { setActiveTab('trades'); pagerRef.current?.scrollTo({ x: screenW * 2, animated: true }); }}>
                    <Text style={[activeTab === 'trades' ? styles.tabTextActive : styles.tabText, { color: theme.placeholder }]}>Trades</Text>
                </TouchableOpacity>

                <Animated.View
                    style={[
                        styles.tabIndicator,
                        {
                            width: screenW / 3,
                            transform: [{ translateX: scrollX.interpolate({ inputRange: [0, screenW, screenW * 2], outputRange: [0, screenW / 3, (screenW / 3) * 2] }) }]
                        }
                    ]}
                />
            </View>

            <View style={styles.pagerWrap}>
                <Animated.ScrollView
                    horizontal
                    pagingEnabled
                    ref={pagerRef as any}
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={(e) => {
                        const idx = Math.round(e.nativeEvent.contentOffset.x / screenW);
                        setActiveTab(idx === 0 ? 'posts' : idx === 1 ? 'expand' : 'trades');
                    }}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                        { useNativeDriver: true }
                    )}
                    scrollEventThrottle={16}
                    style={{ flex: 1 }}
                >
                    <View style={[styles.pagerPage, { width: screenW, alignItems: 'flex-start', justifyContent: 'flex-start' }]}>
                        <View style={{ height: 12 }} />
                        {isLoading ? (
                            <View style={styles.pagerEmpty}>
                                <ActivityIndicator size="small" color={theme.primary} />
                                <Text style={[styles.emptyText, { color: theme.placeholder }]}>Loading...</Text>
                            </View>
                        ) : combinedContent.length === 0 ? (
                            <View style={styles.pagerEmpty}>
                                <Text style={[styles.emptyTitle, { color: theme.text }]}>No posts yet</Text>
                                <Text style={[styles.emptyText, { color: theme.placeholder }]}>
                                    You haven't posted anything yet. Tap the + button to create your first post or reel.
                                </Text>
                            </View>
                        ) : (
                            <FlatList
                                data={combinedContent}
                                keyExtractor={(it) => `${it._type}-${String(it._id || it.id || Math.random())}`}
                                numColumns={3}
                                scrollEnabled={false}
                                contentContainerStyle={{ paddingHorizontal: 1 }}
                                columnWrapperStyle={{ gap: 2, marginBottom: 2 }}
                                renderItem={renderGridItem}
                            />
                        )}
                    </View>

                    <View style={[styles.pagerPage, { width: screenW }]}>
                        <View style={styles.pagerEmpty}>
                            <Text style={[styles.emptyTitle, { color: theme.text }]}>Expand</Text>
                            <Text style={[styles.emptyText, { color: theme.placeholder }]}>Content for Expand goes here.</Text>
                        </View>
                    </View>

                    <View style={[styles.pagerPage, { width: screenW }]}>
                        <View style={styles.pagerEmpty}>
                            <Text style={[styles.emptyTitle, { color: theme.text }]}>Trades</Text>
                            <Text style={[styles.emptyText, { color: theme.placeholder }]}>Content for Trades goes here.</Text>
                        </View>
                    </View>
                </Animated.ScrollView>
            </View>
        </>
    );
}
