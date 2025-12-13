import React, { useState, useContext, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Dimensions,
    TouchableOpacity,
    Image,
    ActivityIndicator,
} from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchReels } from '../lib/api';
import Icon from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';

const { width, height } = Dimensions.get('window');
const ITEM_HEIGHT = height - 80;

interface ReelItem {
    _id: string;
    videoUrl: string;
    thumbnailUrl?: string;
    caption?: string;
    author: {
        username: string;
        displayName?: string;
        avatarUrl?: string;
    };
    likesCount: number;
    commentsCount: number;
    viewsCount: number;
}

const Reels = () => {
    const { theme } = useContext(ThemeContext) as any;
    const [reels, setReels] = useState<ReelItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        loadReels();
    }, []);

    const loadReels = async () => {
        try {
            const data = await fetchReels(30, 0);
            setReels(data);
        } catch (err) {
            console.warn('Failed to load reels:', err);
        } finally {
            setLoading(false);
        }
    };

    const renderReel = ({ item, index }: { item: ReelItem; index: number }) => {
        const isActive = index === currentIndex;
        const displayName = item.author?.displayName || item.author?.username || 'User';

        console.log('=== REEL RENDER ===');
        console.log('Index:', index, 'Current:', currentIndex, 'Active:', isActive);
        console.log('Video URL:', item.videoUrl);
        console.log('Thumbnail URL:', item.thumbnailUrl);

        return (
            <View style={styles.reelContainer}>
                {/* Video or Thumbnail */}
                {isActive && item.videoUrl ? (
                    <Video
                        source={{ uri: item.videoUrl }}
                        style={styles.video}
                        resizeMode="cover"
                        repeat
                        paused={false}
                        volume={1.0}
                        onLoadStart={() => console.log('📹 Video loading started:', item.videoUrl)}
                        onLoad={(data) => console.log('✅ Video loaded:', data)}
                        onError={(e) => console.error('❌ Video ERROR:', e, 'URL:', item.videoUrl)}
                        onReadyForDisplay={() => console.log('🎬 Video ready to play')}
                    />
                ) : (
                    <Image
                        source={{ uri: item.thumbnailUrl || item.videoUrl }}
                        style={styles.video}
                        resizeMode="cover"
                        onLoad={() => console.log('🖼️ Thumbnail loaded')}
                        onError={(e) => console.error('❌ Thumbnail error:', e.nativeEvent)}
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
                        <View style={styles.actionBtn}>
                            <Icon name="heart-outline" size={32} color="#fff" />
                            <Text style={styles.actionText}>{item.likesCount}</Text>
                        </View>
                        <View style={styles.actionBtn}>
                            <Icon name="chatbubble-outline" size={28} color="#fff" />
                            <Text style={styles.actionText}>{item.commentsCount}</Text>
                        </View>
                        <View style={styles.actionBtn}>
                            <Icon name="eye-outline" size={28} color="#fff" />
                            <Text style={styles.actionText}>{item.viewsCount}</Text>
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

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#ec4899" />
            </View>
        );
    }

    if (reels.length === 0) {
        return (
            <View style={[styles.container, styles.center]}>
                <Icon name="videocam-outline" size={64} color="#666" />
                <Text style={styles.emptyText}>No reels yet</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={reels}
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
            />
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
    reelContainer: {
        width,
        height: ITEM_HEIGHT,
        backgroundColor: '#000',
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
        backgroundColor: 'rgba(0,0,0,0.5)',
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
    },
    caption: {
        color: '#fff',
        fontSize: 14,
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
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
        marginTop: 16,
    },
});

export default Reels;
