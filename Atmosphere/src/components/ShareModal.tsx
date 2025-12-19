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
} from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { getFollowersList, getProfile, shareContent } from '../lib/api';
import { getImageSource } from '../lib/image';
import Icon from 'react-native-vector-icons/Feather';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = Math.round(SCREEN_HEIGHT * 0.55);

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
    const anim = useRef(new Animated.Value(0)).current;
    const [followers, setFollowers] = useState<Follower[]>([]);
    const [filteredFollowers, setFilteredFollowers] = useState<Follower[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    // current user id is not used here; omit state to avoid lint warnings

    useEffect(() => {
        let mounted = true;
        const fetch = async () => {
            if (!visible) return;
            setLoading(true);
            try {
                const profile = await getProfile();
                const id = profile?.user?._id || profile?.user?.id || profile?.id || null;
                if (mounted && id) {
                    const list = await getFollowersList(String(id));
                    if (mounted) {
                        setFollowers(list || []);
                        setFilteredFollowers(list || []);
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
            setFilteredFollowers(followers);
        } else {
            const q = searchQuery.toLowerCase();
            setFilteredFollowers(
                followers.filter(
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
            Animated.timing(anim, {
                toValue: 1,
                duration: 300,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(anim, {
                toValue: 0,
                duration: 240,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }).start();
        }
    }, [visible, anim]);

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

            // Use a slight delay or optimistic response for share count
            // Since unified share might process differently, for now just pass back 1 or generic count
            // if we need accurate count, we'd depend on the response from shareContent
            if (onShareComplete) {
                onShareComplete(1); // Indicate success
            }

            // Close modal after share
            Animated.timing(anim, {
                toValue: 0,
                duration: 240,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }).start(() => onClose && onClose());
        } catch (err) {
            console.warn('ShareModal: share failed', err);
            // @ts-ignore
            const { Alert } = require('react-native');
            Alert.alert('Share Failed', 'Could not send share. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const closeModal = () => {
        Animated.timing(anim, {
            toValue: 0,
            duration: 240,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
        }).start(() => onClose && onClose());
    };

    return (
        <Modal visible={visible} transparent onRequestClose={closeModal}>
            <TouchableWithoutFeedback onPress={closeModal}>
                <Animated.View
                    style={[
                        styles.backdrop,
                        {
                            opacity: anim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 0.6],
                            }),
                        },
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
                            width: Math.min(640, SCREEN_WIDTH - 40),
                            height: SHEET_HEIGHT,
                            transform: [
                                {
                                    translateY: anim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [SHEET_HEIGHT, 0],
                                    }),
                                },
                            ],
                            opacity: anim,
                        },
                    ]}
                >
                    {/* Handle and close */}
                    <View style={styles.handleRow}>
                        <View style={styles.handle} />
                        <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
                            <Icon name="x" size={20} color={theme?.placeholder || '#999'} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.title, { color: theme?.text }]}>
                        {alreadyShared ? 'Share Again' : `Send to...`}
                    </Text>

                    {/* Search */}
                    <View style={[styles.searchRow, { borderColor: theme?.border || '#333' }]}>
                        <Icon name="search" size={16} color={theme?.placeholder || '#888'} />
                        <TextInput
                            style={[styles.searchInput, { color: theme?.text }]}
                            placeholder="Search followers..."
                            placeholderTextColor={theme?.placeholder || '#888'}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    {/* Followers list */}
                    <View style={styles.listWrap}>
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
                                data={filteredFollowers}
                                keyExtractor={(item) => String(item._id)}
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

                    {/* Share button */}
                    <TouchableOpacity
                        style={[
                            styles.shareBtn,
                            (submitting || selectedIds.size === 0) && styles.shareBtnDisabled,
                        ]}
                        onPress={handleShare}
                        disabled={submitting || selectedIds.size === 0}
                    >
                        <Text style={styles.shareBtnText}>
                            {submitting
                                ? 'Send...'
                                : selectedIds.size > 0
                                    ? `Send to ${selectedIds.size} person${selectedIds.size > 1 ? 's' : ''}`
                                    : 'Select people'}
                        </Text>
                    </TouchableOpacity>
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
    },
    handle: {
        width: 48,
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
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginTop: 16,
        marginBottom: 12,
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
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 12,
    },
    shareBtnDisabled: {
        backgroundColor: '#555',
    },
    shareBtnText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default ShareModal;
