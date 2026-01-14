/* eslint-disable react-native/no-inline-styles */
import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Animated, FlatList, ActivityIndicator, Image, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { PLACEHOLDER } from '../../lib/localImages';
import { getImageSource } from '../../lib/image';
import styles from './Profile.styles';
import { Play, Video, Copy } from 'lucide-react-native';
import { ENDPOINTS } from '../../lib/api/endpoints';
import { useNavigation } from '@react-navigation/native';
import InvestorExpand from './InvestorExpand';
import StartupExpand from './StartupExpand';
import PersonalExpand from './PersonalExpand';

type Props = {
    posts?: any[];
    reels?: any[];
    postsLoading: boolean;
    reelsLoading?: boolean;
    theme: any;
    onPostPress?: (postId: string) => void;
    onReelPress?: (reelId: string) => void;
    profileData?: any;
    rawProfileData?: any; // Raw API response with details
    accountType?: 'investor' | 'startup' | 'personal';
    trades?: any[];
    tradesLoading?: boolean;
    investorDetails?: any;
};

export default function ProfilePager({
    posts = [],
    reels = [],
    postsLoading,
    reelsLoading = false,
    theme,
    onPostPress,
    onReelPress,
    profileData,
    rawProfileData,
    accountType = 'personal',
    trades = [],
    tradesLoading = false,
    investorDetails,
}: Props) {
    const pagerRef = useRef<any>(null);
    const scrollX = useRef(new Animated.Value(0)).current;
    const screenW = Dimensions.get('window').width;
    const cardContainerWidth = Math.min(screenW - 24, 900);
    const [activeTab, setActiveTab] = useState<'posts' | 'expand' | 'trades'>('posts');
    const [tabHeights, setTabHeights] = useState({ posts: 500, expand: 500, trades: 500 });
    const pagerHeight = useRef(new Animated.Value(500)).current;

    React.useEffect(() => {
        const targetH = tabHeights[activeTab] || 500;
        Animated.timing(pagerHeight, {
            toValue: Math.max(targetH, 500),
            duration: 300,
            useNativeDriver: false // height cannot use native driver
        }).start();
    }, [activeTab, tabHeights]);

    const handleLayout = (tab: 'posts' | 'expand' | 'trades', event: any) => {
        const h = event.nativeEvent.layout.height;
        if (Math.abs(h - tabHeights[tab]) > 10) {
            setTabHeights(prev => ({ ...prev, [tab]: h }));
        }
    };

    const combinedContent = React.useMemo(() => {
        const postsWithType = (posts || []).map(p => ({ ...p, _type: 'post' as const }));
        const reelsWithType = reels.map(r => ({ ...r, _type: 'reel' as const }));
        const all = [...postsWithType, ...reelsWithType];
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
                    {isReel && (
                        <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 4, padding: 2 }}>
                            <Play size={16} color="#fff" />
                        </View>
                    )}
                    {!isReel && Array.isArray(item.media) && item.media.length > 0 && item.media[0]?.type === 'video' && (
                        <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 4, padding: 2 }}>
                            <Video size={16} color="#fff" />
                        </View>
                    )}
                    {!isReel && Array.isArray(item.media) && item.media.length > 1 && (
                        <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 4, padding: 2 }}>
                            <Copy size={14} color="#fff" />
                        </View>
                    )}
                </View>
            </TouchableWithoutFeedback>
        );
    };

    // Render Expand Section based on account type
    const renderExpandSection = () => {
        if (accountType === 'investor') {
            return <InvestorExpand investorDetails={investorDetails} profileData={profileData} cardContainerWidth={cardContainerWidth} />;
        } else if (accountType === 'startup') {
            return <StartupExpand rawProfileData={rawProfileData} profileData={profileData} screenW={screenW} />;
        } else {
            return <PersonalExpand profileData={profileData} cardContainerWidth={cardContainerWidth} />;
        }
    };

    // Render Trade Card (Reference Design: Dark card, avatar, name, shares, For Sale badge, price/value, View Details)
    const renderTradeCard = ({ item }: { item: any }) => {
        const companyName = item.companyName || item.assetName || item.title || 'Unknown';
        const shares = item.shares || item.quantity || 0;
        const pricePerShare = item.pricePerShare || item.price || 0;
        const totalValue = shares * pricePerShare;
        const logo = item.companyLogo || item.logo || item.profileImage || null;

        return (
            <View style={{
                backgroundColor: '#0d0d0d',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#2a2a2a',
                padding: 14,
                marginBottom: 10,
                marginTop: 12,
            }}>
                {/* Header Row: Avatar, Name, Shares, Badge */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                    {logo ? (
                        <Image source={{ uri: logo }} style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12, backgroundColor: '#333' }} />
                    ) : (
                        <View style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12, backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: '#888', fontSize: 18, fontWeight: '600' }}>{companyName.charAt(0).toUpperCase()}</Text>
                        </View>
                    )}
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>{companyName}</Text>
                        <Text style={{ color: '#888', fontSize: 13 }}>{Number(shares).toLocaleString()} shares</Text>
                    </View>
                    <View style={{ backgroundColor: '#2a2a2a', borderWidth: 1, borderColor: '#3a3a3a', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 }}>
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '500' }}>For Sale</Text>
                    </View>
                </View>

                {/* Price Row */}
                <View style={{ flexDirection: 'row', marginBottom: 14 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: '#888', fontSize: 12 }}>Price per Share</Text>
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>${Number(pricePerShare).toLocaleString()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: '#888', fontSize: 12 }}>Total Value</Text>
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>${Number(totalValue).toLocaleString()}</Text>
                    </View>
                </View>

                {/* View Details Button */}
                <TouchableOpacity style={{ backgroundColor: '#3a3a3a', borderRadius: 8, paddingVertical: 12, alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }}>View Details</Text>
                </TouchableOpacity>
            </View>
        );
    };

    // Render Trades Section
    const renderTradesSection = () => {
        if (tradesLoading) {
            return (
                <View style={styles.pagerEmpty}>
                    <ActivityIndicator size="small" color={theme.primary} />
                    <Text style={[styles.emptyText, { color: theme.placeholder }]}>Loading trades...</Text>
                </View>
            );
        }

        if (trades.length === 0) {
            return (
                <View style={[styles.pagerEmpty, { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }]}>
                    <Text style={[styles.emptyTitle, { color: theme.text, textAlign: 'center' }]}>No active trades</Text>
                    <Text style={[styles.emptyText, { color: theme.placeholder, textAlign: 'center' }]}>
                        This user has no active trades.
                    </Text>
                </View>
            );
        }

        return (
            <View style={{ paddingHorizontal: 8, paddingTop: 12, paddingBottom: 150 }}>
                {trades.map((item, index) => (
                    <View key={String(item._id || item.id || index)}>
                        {renderTradeCard({ item })}
                    </View>
                ))}
            </View>
        );
    };

    const isLoading = postsLoading || reelsLoading;

    return (
        <>
            <View style={styles.tabsRow}>
                <TouchableOpacity style={styles.tabItem} onPress={() => { setActiveTab('posts'); pagerRef.current?.scrollTo({ x: 0, animated: true }); }}>
                    <Text style={[activeTab === 'posts' ? styles.tabTextActive : styles.tabText, { color: activeTab === 'posts' ? theme.text : theme.placeholder }]}>Posts</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabItem} onPress={() => { setActiveTab('expand'); pagerRef.current?.scrollTo({ x: screenW, animated: true }); }}>
                    <Text style={[activeTab === 'expand' ? styles.tabTextActive : styles.tabText, { color: activeTab === 'expand' ? theme.text : theme.placeholder }]}>Expand</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabItem} onPress={() => { setActiveTab('trades'); pagerRef.current?.scrollTo({ x: screenW * 2, animated: true }); }}>
                    <Text style={[activeTab === 'trades' ? styles.tabTextActive : styles.tabText, { color: activeTab === 'trades' ? theme.text : theme.placeholder }]}>Trades</Text>
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



            <Animated.View style={[styles.pagerWrap, { height: pagerHeight }]}>
                <Animated.ScrollView
                    horizontal
                    pagingEnabled
                    ref={pagerRef as any}
                    showsHorizontalScrollIndicator={false}
                    decelerationRate="fast"
                    scrollEventThrottle={16}
                    onMomentumScrollEnd={(e) => {
                        const idx = Math.round(e.nativeEvent.contentOffset.x / screenW);
                        setActiveTab(idx === 0 ? 'posts' : idx === 1 ? 'expand' : 'trades');
                    }}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                        { useNativeDriver: true }
                    )}
                    style={{ flex: 1 }}
                >
                    {/* Posts Tab */}
                    <View style={[styles.pagerPage, { width: screenW, alignItems: 'flex-start', justifyContent: 'flex-start' }]}>
                        <View onLayout={(e) => handleLayout('posts', e)} style={{ width: '100%' }}>
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
                                    contentContainerStyle={{ paddingHorizontal: 1, paddingBottom: 80 }}
                                    columnWrapperStyle={{ gap: 2, marginBottom: 2 }}
                                    renderItem={renderGridItem}
                                    removeClippedSubviews={true}
                                    maxToRenderPerBatch={9}
                                    updateCellsBatchingPeriod={50}
                                />
                            )}
                        </View>
                    </View>

                    {/* Expand Tab */}
                    <View style={[styles.pagerPage, { width: screenW, alignItems: 'flex-start', justifyContent: 'flex-start' }]}>
                        <View onLayout={(e) => handleLayout('expand', e)} style={{ width: '100%' }}>
                            {renderExpandSection()}
                        </View>
                    </View>

                    {/* Trades Tab */}
                    <View style={[styles.pagerPage, { width: screenW, alignItems: 'flex-start', justifyContent: 'flex-start' }]}>
                        <View onLayout={(e) => handleLayout('trades', e)} style={{ width: '100%' }}>
                            {renderTradesSection()}
                        </View>
                    </View>
                </Animated.ScrollView>
            </Animated.View>
        </>
    );
}

// Expand section styles
const expandStyles = {
    section: {
        marginBottom: 20,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '600' as const,
        marginBottom: 8,
        textTransform: 'uppercase' as const,
    },
    row: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 8,
        marginBottom: 4,
    },
    rowLabel: {
        fontSize: 14,
        fontWeight: '500' as const,
    },
    chipContainer: {
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
        gap: 8,
        marginTop: 8,
        marginLeft: 24,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
};

// Trade card styles
const tradeStyles = {
    cardWrap: {
        width: '100%' as any,
        alignSelf: 'center' as any,
    },
    card: {
        backgroundColor: '#0d0d0d',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#1a1a1a',
        padding: 18,
        marginBottom: 12,
    },
    cardHeader: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
    },
    typeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
    },
    status: {
        fontSize: 12,
        fontWeight: '500' as const,
    },
};

// Card styles for Investor Expand section (matching reference design)
const cardStyles = {
    card: {
        backgroundColor: '#0d0d0d',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#1a1a1a',
        padding: 18,
        marginBottom: 16,
    },
    aboutSection: {
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1d1d1d',
    },
    aboutLabel: {
        color: '#666',
        fontSize: 12,
        fontWeight: '600' as const,
        marginBottom: 8,
    },
    aboutText: {
        color: '#e5e5e5',
        fontSize: 14,
        lineHeight: 20,
    },
    sectionTitle: {
        color: '#666',
        fontSize: 12,
        fontWeight: '600' as const,
        marginBottom: 12,
        marginTop: 12,
    },
    row: {
        flexDirection: 'row' as const,
        alignItems: 'flex-start' as const,
        gap: 8,
        marginBottom: 8,
    },
    firstRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 8,
        marginTop: 0,
        marginBottom: 8,
    },
    rowTitle: {
        color: '#e5e5e5',
        fontSize: 13,
        fontWeight: '600' as const,
    },
    rowValue: {
        color: '#999',
        fontSize: 13,
        marginLeft: 24,
        marginTop: 2,
    },
    chipRow: {
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
        gap: 6,
        marginTop: 8,
        marginLeft: 24,
    },
    chip: {
        backgroundColor: '#1a1a1a',
        borderWidth: 0,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    chipText: {
        color: '#999',
        fontSize: 12,
    },
};

// Holdings section styles
const holdingsStyles = {
    grid: {
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
        gap: 12,
        width: '100%' as any,
    },
    card: {
        width: '48%' as any,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 12,
        marginBottom: 4,
    },
    cardContent: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
    },
    logoContainer: {
        marginRight: 10,
    },
    logo: {
        width: 40,
        height: 40,
        borderRadius: 8,
    },
    logoPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#333',
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
    },
    logoText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600' as const,
    },
    info: {
        flex: 1,
    },
    name: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500' as const,
    },
    sector: {
        color: '#888',
        fontSize: 12,
        marginTop: 2,
    },
    viewBtn: {
        backgroundColor: '#333',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 6,
    },
    viewBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500' as const,
    },
};
