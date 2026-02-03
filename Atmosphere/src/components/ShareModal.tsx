import React, { useEffect, useState, useContext, useRef } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Animated,
    Easing,
    Dimensions,
    Image,
    Share,
    PanResponder,
} from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { getFollowersList, getProfile, shareContent } from '../lib/api';
import { getImageSource } from '../lib/image';
import Icon from 'react-native-vector-icons/Feather';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const FULL_HEIGHT = SCREEN_HEIGHT * 0.9;
const DEFAULT_HEIGHT = SCREEN_HEIGHT * 0.55;

type Follower = {
    _id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
};

type ShareModalProps = {
    contentId: string;
    type?: 'reel' | 'post' | 'startup'; // Extended type
    contentTitle?: string; // New: Title of shared content (e.g. Startup Name, Post snippet)
    contentImage?: string; // New: Preview image
    contentOwner?: string; // New: Owner name/id
    visible: boolean;
    onClose: () => void;
    onShareComplete?: (sharesCount: number) => void;
    alreadyShared?: boolean;
};

const ShareModal: React.FC<ShareModalProps> = ({
    contentId,
    type = 'reel',
    contentTitle,
    contentImage,
    contentOwner,
    visible,
    onClose,
    onShareComplete,
    alreadyShared = false,
}) => {
    const { theme } = useContext(ThemeContext) as any;
    const [followers, setFollowers] = useState<Follower[]>([]);
    const [filteredFollowers, setFilteredFollowers] = useState<Follower[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');

    // Animation state
    const translateY = useRef(new Animated.Value(FULL_HEIGHT)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;

    // Track the offset when drag starts
    const dragStartY = useRef(FULL_HEIGHT - DEFAULT_HEIGHT);

    // Track if FlatList is at top (for pull-to-close from content area)
    const isAtScrollTop = useRef(true);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        let mounted = true;
        const fetch = async () => {
            if (!visible) return;
            setLoading(true);
            try {
                const profile = await getProfile();
                const id = profile?.user?._id || profile?.user?.id || profile?.id || null;
                if (mounted && id) {
                    const result = await getFollowersList(String(id));
                    // Handle both array and object responses
                    const list = Array.isArray(result) ? result : (result?.followers || result?.users || []);
                    if (mounted) {
                        setFollowers(list);
                        setFilteredFollowers(list);
                    }
                }
            } catch {
                console.warn('ShareModal: failed to load followers');
                if (mounted) setFollowers([]);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetch();
        return () => { mounted = false; };
    }, [visible, contentId]);

    // Filter followers based on search query
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredFollowers(Array.isArray(followers) ? followers : []);
        } else {
            const q = searchQuery.toLowerCase();
            const list = Array.isArray(followers) ? followers : [];
            setFilteredFollowers(
                list.filter(
                    (f) =>
                        f.username?.toLowerCase().includes(q) ||
                        f.displayName?.toLowerCase().includes(q)
                )
            );
        }
    }, [searchQuery, followers]);

    // Animate in/out
    useEffect(() => {
        if (visible) {
            dragStartY.current = FULL_HEIGHT - DEFAULT_HEIGHT;
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: FULL_HEIGHT - DEFAULT_HEIGHT,
                    useNativeDriver: true,
                    damping: 20,
                    mass: 0.8,
                    stiffness: 100
                }),
                Animated.timing(backdropOpacity, {
                    toValue: 0.6,
                    duration: 300,
                    useNativeDriver: true
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: FULL_HEIGHT,
                    duration: 250,
                    useNativeDriver: true
                }),
                Animated.timing(backdropOpacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true
                })
            ]).start();
        }
    }, [visible, translateY, backdropOpacity]);

    const closeModal = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: FULL_HEIGHT,
                duration: 200,
                useNativeDriver: true,
                easing: Easing.out(Easing.ease)
            }),
            Animated.timing(backdropOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
            })
        ]).start(() => onClose && onClose());
    };

    const expandModal = () => {
        dragStartY.current = 0;
        Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            mass: 0.8,
            stiffness: 100
        }).start();
    };

    const collapseToDefault = () => {
        dragStartY.current = FULL_HEIGHT - DEFAULT_HEIGHT;
        Animated.spring(translateY, {
            toValue: FULL_HEIGHT - DEFAULT_HEIGHT,
            useNativeDriver: true,
            damping: 20,
            mass: 0.8,
            stiffness: 100
        }).start();
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
            onPanResponderGrant: () => {
                translateY.stopAnimation((value) => {
                    dragStartY.current = value;
                });
            },
            onPanResponderMove: (_, gestureState) => {
                let newY = dragStartY.current + gestureState.dy;
                newY = Math.max(0, Math.min(FULL_HEIGHT, newY));
                translateY.setValue(newY);
                const progress = 1 - (newY / FULL_HEIGHT);
                backdropOpacity.setValue(progress * 0.6);
            },
            onPanResponderRelease: (_, gestureState) => {
                // Directly animate based on direction - no stopAnimation delay
                if (gestureState.dy < 0) {
                    expandModal();
                } else {
                    closeModal();
                }
            }
        })
    ).current;

    const contentPanResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return isAtScrollTop.current && gestureState.dy > 10;
            },
            onPanResponderGrant: () => {
                translateY.stopAnimation((value) => {
                    dragStartY.current = value;
                });
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    let newY = dragStartY.current + gestureState.dy;
                    newY = Math.max(0, Math.min(FULL_HEIGHT, newY));
                    translateY.setValue(newY);
                    const progress = 1 - (newY / FULL_HEIGHT);
                    backdropOpacity.setValue(progress * 0.6);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    closeModal();
                } else {
                    expandModal();
                }
            }
        })
    ).current;

    const handleScroll = (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        isAtScrollTop.current = offsetY <= 0;
    };

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleShare = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            await shareContent({
                userIds: Array.from(selectedIds),
                contentId,
                contentType: type,
                contentTitle,
                contentImage,
                contentOwner
            });

            if (onShareComplete) {
                onShareComplete(1); // Indicate success
            }

            // Close modal after share
            closeModal();
        } catch (err) {
            console.warn('ShareModal: share failed', err);
            // @ts-ignore
            const { Alert } = require('react-native');
            Alert.alert('Share Failed', 'Could not send share. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal visible={visible} transparent onRequestClose={closeModal}>
            <TouchableWithoutFeedback onPress={closeModal}>
                <Animated.View
                    style={[
                        styles.backdrop,
                        { opacity: backdropOpacity },
                    ]}
                />
            </TouchableWithoutFeedback>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.container}
            >
                <Animated.View
                    style={[
                        styles.sheet,
                        {
                            backgroundColor: theme?.background || '#121212',
                            width: SCREEN_WIDTH,
                            height: FULL_HEIGHT,
                            transform: [{ translateY: translateY }]
                        },
                    ]}
                >
                    {/* Handle and close */}
                    <View style={styles.handleRow} {...panResponder.panHandlers}>
                        <View style={styles.handle} />
                    </View>
                    {/* Title and Close Button Removed */}

                    {/* Search */}
                    <View style={[styles.searchRow, { borderColor: theme?.border || '#333' }]}>
                        <Icon name="search" size={16} color={theme?.placeholder || '#888'} />
                        <TextInput
                            style={[styles.searchInput, { color: theme?.text }]}
                            placeholder="Search"
                            placeholderTextColor={theme?.placeholder || '#888'}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    {/* Followers list */}
                    <View style={[styles.listWrap, { paddingBottom: 120 }]} {...contentPanResponder.panHandlers}>
                        {loading ? (
                            <ActivityIndicator size="large" color="#fff" />
                        ) : filteredFollowers.length === 0 ? (
                            <View style={styles.emptyWrap}>
                                <Text style={[styles.emptyText, { color: theme?.placeholder }]}>
                                    {followers.length === 0
                                        ? 'No followers to share with'
                                        : 'No matches found'}
                                </Text>
                            </View>
                        ) : (
                            <FlatList
                                ref={flatListRef}
                                data={filteredFollowers}
                                keyExtractor={(item) => String(item._id)}
                                onScroll={handleScroll}
                                scrollEventThrottle={16}
                                contentContainerStyle={{ paddingBottom: 100 }}
                                renderItem={({ item }) => {
                                    const isSelected = selectedIds.has(item._id);
                                    return (
                                        <TouchableOpacity
                                            style={[
                                                styles.followerRow,
                                                isSelected && {
                                                    backgroundColor:
                                                        theme?.cardBackground || '#1a1a1a',
                                                },
                                            ]}
                                            onPress={() => toggleSelect(item._id)}
                                            activeOpacity={0.7}
                                        >
                                            <Image
                                                source={getImageSource(
                                                    item.avatarUrl ||
                                                    'https://via.placeholder.com/40x40.png?text=U'
                                                )}
                                                style={styles.avatar}
                                            />
                                            <View style={styles.followerInfo}>
                                                <Text
                                                    style={[
                                                        styles.followerName,
                                                        { color: theme?.text },
                                                    ]}
                                                >
                                                    {item.displayName || item.username}
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.followerUsername,
                                                        { color: theme?.placeholder },
                                                    ]}
                                                >
                                                    @{item.username}
                                                </Text>
                                            </View>
                                            <View
                                                style={[
                                                    styles.checkbox,
                                                    isSelected && styles.checkboxSelected,
                                                ]}
                                            >
                                                {isSelected && (
                                                    <Icon name="check" size={14} color="#fff" />
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        )}
                    </View>
                </Animated.View>

                {/* Animated buttons at bottom - slide down with sheet */}
                <Animated.View
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: 16,
                        backgroundColor: theme?.background || '#121212',
                        transform: [{
                            translateY: translateY.interpolate({
                                inputRange: [0, FULL_HEIGHT - DEFAULT_HEIGHT, FULL_HEIGHT],
                                outputRange: [0, 0, 150], // Slide down 150px when closed
                                extrapolate: 'clamp'
                            })
                        }]
                    }}
                >
                    {/* Share to other apps button - commented out for now */}
                    {/* ... code ... */}

                    {/* Button row */}
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        {/* Copy Link button */}
                        <TouchableOpacity
                            style={[styles.shareBtn, { flex: 1, backgroundColor: 'transparent', borderWidth: 1, borderColor: '#444' }]}
                            onPress={async () => {
                                try {
                                    const deepLink = `https://atmosphere.app/${type}/${contentId}`;
                                    const Clipboard = require('@react-native-clipboard/clipboard').default;
                                    Clipboard.setString(deepLink);
                                    // Could show a toast here
                                } catch (err) {
                                    console.warn('Copy link failed:', err);
                                }
                            }}
                        >
                            <Text style={[styles.shareBtnText, { color: '#fff' }]}>Copy Link</Text>
                        </TouchableOpacity>

                        {/* Send button */}
                        <TouchableOpacity
                            style={[
                                styles.shareBtn,
                                { flex: 1 },
                                (submitting || selectedIds.size === 0) && styles.shareBtnDisabled,
                            ]}
                            onPress={handleShare}
                            disabled={submitting || selectedIds.size === 0}
                        >
                            <Text style={styles.shareBtnText}>
                                {submitting ? 'Sending...' : 'Send'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal >
    );
};

const styles = StyleSheet.create({
    backdrop: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: '#000',
    },
    container: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    sheet: {
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        padding: 16,
        position: 'absolute',
        bottom: 0,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#333',
    },
    handleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        marginBottom: 8,
    },
    handle: {
        width: 60,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#444',
    },
    closeBtn: {
        position: 'absolute',
        right: 0,
        padding: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        marginTop: 12,
    },
    subtitle: {
        fontSize: 13,
        textAlign: 'center',
        marginTop: 4,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginTop: 0,
        marginBottom: 8,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
    },
    listWrap: {
        flex: 1,
    },
    emptyWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 14,
    },
    followerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 10,
        marginBottom: 4,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#333',
    },
    followerInfo: {
        flex: 1,
        marginLeft: 12,
    },
    followerName: {
        fontSize: 15,
        fontWeight: '600',
    },
    followerUsername: {
        fontSize: 13,
        marginTop: 2,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#555',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxSelected: {
        backgroundColor: '#fff',
        borderColor: '#fff',
    },
    shareBtn: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 12,
    },
    shareBtnDisabled: {
        backgroundColor: '#555',
    },
    shareBtnText: {
        color: '#000',
        fontSize: 15,
        fontWeight: '700',
    },
    shareToAppsBtn: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#444',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    shareToAppsBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default ShareModal;
