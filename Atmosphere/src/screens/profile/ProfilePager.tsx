/* eslint-disable react-native/no-inline-styles */
import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Animated, FlatList, ActivityIndicator, Image, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { PLACEHOLDER } from '../../lib/localImages';
import { getImageSource } from '../../lib/image';
import styles from './Profile.styles';
import { Play, Video, Copy, MapPin, Briefcase, TrendingUp, DollarSign, Users, Calendar, Target, Globe, CheckCircle, Building2 } from 'lucide-react-native';

type Props = {
    posts: any[];
    reels?: any[];
    postsLoading: boolean;
    reelsLoading?: boolean;
    theme: any;
    onPostPress?: (postId: string) => void;
    onReelPress?: (reelId: string) => void;
    profileData?: any;
    accountType?: 'investor' | 'startup' | 'personal';
    trades?: any[];
    tradesLoading?: boolean;
    investorDetails?: any;
};

export default function ProfilePager({
    posts,
    reels = [],
    postsLoading,
    reelsLoading = false,
    theme,
    onPostPress,
    onReelPress,
    profileData,
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

    const combinedContent = React.useMemo(() => {
        const postsWithType = posts.map(p => ({ ...p, _type: 'post' as const }));
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

    const renderInvestorExpand = () => {
        const details = investorDetails || profileData?.details || {};
        const about = details.about || profileData?.tagline || profileData?.description || '';
        const investmentFocus = details.investmentFocus || [];
        const stage = details.stage || '';
        const interestedRounds = details.interestedRounds || [];
        const geography = Array.isArray(details.geography) ? details.geography.join(', ') : (details.geography || '');
        const checkSize = details.checkSize || {};
        const holdings = details.previousInvestments || [];

        return (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100, alignItems: 'center' }}>
                <View style={{ width: cardContainerWidth, gap: 16 }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Investor Profile</Text>

                    <View style={[cardStyles.card, { width: '100%' }]}> {/* main investor card */}
                        <View style={cardStyles.aboutSection}>
                            <Text style={cardStyles.aboutLabel}>About</Text>
                            <Text style={cardStyles.aboutText}>
                                {about || 'Angel investor | Early stage startup enthusiast'}
                            </Text>
                        </View>

                        <Text style={cardStyles.sectionTitle}>Investment Focus</Text>

                        <View style={cardStyles.firstRow}>
                            <Target size={16} color="#888" />
                            <Text style={cardStyles.rowTitle}>Industries</Text>
                        </View>
                        <View style={cardStyles.chipRow}>
                            {(investmentFocus.length > 0 ? investmentFocus : ['AI & ML', 'SaaS', 'FinTech', 'HealthTech']).map((focus: string, idx: number) => (
                                <View key={idx} style={cardStyles.chip}>
                                    <Text style={cardStyles.chipText}>{focus}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={cardStyles.row}>
                            <TrendingUp size={16} color="#888" />
                            <Text style={cardStyles.rowTitle}>Stage</Text>
                        </View>
                        <Text style={cardStyles.rowValue}>{stage || 'Early Stage'}</Text>

                        <View style={cardStyles.row}>
                            <Briefcase size={16} color="#888" />
                            <Text style={cardStyles.rowTitle}>Interested rounds</Text>
                        </View>
                        <Text style={cardStyles.rowValue}>
                            {interestedRounds.length > 0 ? interestedRounds.join(', ') : 'Pre-seed, Seed, Series A'}
                        </Text>

                        <View style={cardStyles.row}>
                            <Globe size={16} color="#888" />
                            <Text style={cardStyles.rowTitle}>Investable Geography</Text>
                        </View>
                        <Text style={cardStyles.rowValue}>{geography || 'North America, Europe'}</Text>

                        <View style={cardStyles.row}>
                            <DollarSign size={16} color="#888" />
                            <Text style={cardStyles.rowTitle}>Check Size</Text>
                        </View>
                        <Text style={cardStyles.rowValue}>
                            {checkSize.min || checkSize.max ? `$${(checkSize.min / 1000 || 0)}K - $${(checkSize.max / 1000 || 0)}K` : '$50K - $500K'}
                        </Text>

                        <View style={cardStyles.row}>
                            <CheckCircle size={16} color="#888" />
                            <Text style={cardStyles.rowTitle}>Verified Investments</Text>
                        </View>
                        <Text style={cardStyles.rowValue}>{holdings.length || 4}</Text>
                    </View>

                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 4 }}>Holdings</Text>

                    <View style={[holdingsStyles.grid, { width: '100%' }]}>
                        {(holdings.length > 0 ? holdings : mockHoldings).map((holding: any, idx: number) => (
                            <View key={idx} style={holdingsStyles.card}>
                                <View style={holdingsStyles.cardContent}>
                                    <View style={holdingsStyles.logoContainer}>
                                        {holding.logo ? (
                                            <Image source={{ uri: holding.logo }} style={holdingsStyles.logo} />
                                        ) : (
                                            <View style={holdingsStyles.logoPlaceholder}>
                                                <Text style={holdingsStyles.logoText}>{(holding.name || holding.companyName || 'C').charAt(0)}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={holdingsStyles.info}>
                                        <Text style={holdingsStyles.name} numberOfLines={1}>{holding.name || holding.companyName || 'Company'}</Text>
                                        <Text style={holdingsStyles.sector} numberOfLines={1}>{holding.sector || holding.industry || 'Tech'}</Text>
                                    </View>
                                    <TouchableOpacity style={holdingsStyles.viewBtn}>
                                        <Text style={holdingsStyles.viewBtnText}>View</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        );
    };

    // Mock holdings data for display
    const mockHoldings = [
        { name: 'Airbound.co', sector: 'Logistics', logo: null },
        { name: 'NeuralHealth', sector: 'HealthTech', logo: null },
        { name: 'GreenCharge', sector: 'CleanTech', logo: null },
        { name: 'CodeMentor AI', sector: 'EdTech', logo: null },
    ];

    // Render Startup Expand Section
    const renderStartupExpand = () => {
        const details = profileData?.details || profileData || {};
        const about = details.about || profileData?.tagline || profileData?.description || '';
        const location = details.location || profileData?.location || '';
        const industry = details.companyType || profileData?.industry || '';
        const stage = details.stage || profileData?.stage || '';
        const teamSize = details.teamMembers?.length || profileData?.stats?.teamSize || 0;
        const fundingRaised = details.fundingRaised || details.financialProfile?.fundingAmount || profileData?.stats?.fundingRaised || 0;
        const founded = details.establishedOn ? new Date(details.establishedOn).getFullYear() : (profileData?.founded || '');

        return (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100, alignItems: 'center' }}>
                <View style={{ width: cardContainerWidth, gap: 16 }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Startup Profile</Text>

                    {/* Main Card */}
                    <View style={[cardStyles.card, { width: '100%' }]}>
                        {/* About Section */}
                        {about ? (
                            <View style={cardStyles.aboutSection}>
                                <Text style={cardStyles.aboutLabel}>About</Text>
                                <Text style={cardStyles.aboutText}>{about}</Text>
                            </View>
                        ) : null}

                        {/* Industry */}
                        <View style={cardStyles.firstRow}>
                            <Building2 size={16} color="#888" />
                            <Text style={cardStyles.rowTitle}>Industry</Text>
                        </View>
                        <Text style={cardStyles.rowValue}>{industry || 'Not specified'}</Text>

                        {/* Location */}
                        {location ? (
                            <>
                                <View style={cardStyles.row}>
                                    <MapPin size={16} color="#888" />
                                    <Text style={cardStyles.rowTitle}>Location</Text>
                                </View>
                                <Text style={cardStyles.rowValue}>{location}</Text>
                            </>
                        ) : null}

                        {/* Founded */}
                        {founded ? (
                            <>
                                <View style={cardStyles.row}>
                                    <Calendar size={16} color="#888" />
                                    <Text style={cardStyles.rowTitle}>Founded</Text>
                                </View>
                                <Text style={cardStyles.rowValue}>{founded}</Text>
                            </>
                        ) : null}

                        {/* Stage */}
                        <View style={cardStyles.row}>
                            <TrendingUp size={16} color="#888" />
                            <Text style={cardStyles.rowTitle}>Stage</Text>
                        </View>
                        <Text style={cardStyles.rowValue}>{stage || 'Not specified'}</Text>

                        {/* Team Size */}
                        <View style={cardStyles.row}>
                            <Users size={16} color="#888" />
                            <Text style={cardStyles.rowTitle}>Team Size</Text>
                        </View>
                        <Text style={cardStyles.rowValue}>{teamSize} members</Text>

                        {/* Funding Raised */}
                        <View style={cardStyles.row}>
                            <DollarSign size={16} color="#888" />
                            <Text style={cardStyles.rowTitle}>Funding Raised</Text>
                        </View>
                        <Text style={cardStyles.rowValue}>
                            {fundingRaised ? `$${Number(fundingRaised).toLocaleString()}` : 'Bootstrapped'}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        );
    };

    // Render Personal Expand Section
    const renderPersonalExpand = () => {
        const bio = profileData?.tagline || profileData?.description || profileData?.bio || '';
        const location = profileData?.location || '';

        return (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100, alignItems: 'center' }}>
                <View style={{ width: cardContainerWidth, gap: 16 }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Profile</Text>

                    {/* Main Card */}
                    <View style={[cardStyles.card, { width: '100%' }]}>
                        {/* Bio */}
                        {bio ? (
                            <View style={cardStyles.aboutSection}>
                                <Text style={cardStyles.aboutLabel}>About</Text>
                                <Text style={cardStyles.aboutText}>{bio}</Text>
                            </View>
                        ) : (
                            <View style={{ paddingVertical: 12 }}>
                                <Text style={{ color: '#666', fontSize: 14, textAlign: 'center' }}>
                                    No bio added yet
                                </Text>
                            </View>
                        )}

                        {/* Location */}
                        {location ? (
                            <>
                                <View style={cardStyles.firstRow}>
                                    <MapPin size={16} color="#888" />
                                    <Text style={cardStyles.rowTitle}>Location</Text>
                                </View>
                                <Text style={cardStyles.rowValue}>{location}</Text>
                            </>
                        ) : null}
                    </View>
                </View>
            </ScrollView>
        );
    };

    // Render Expand Section based on account type
    const renderExpandSection = () => {
        if (accountType === 'investor') {
            return renderInvestorExpand();
        } else if (accountType === 'startup') {
            return renderStartupExpand();
        } else {
            return renderPersonalExpand();
        }
    };

    // Render Trade Card
    const renderTradeCard = ({ item }: { item: any }) => {
        const tradeType = item.type || 'Buy';
        const assetName = item.assetName || item.title || 'Unknown Asset';
        const price = item.price || item.amount || 0;
        const status = item.status || 'Active';

        return (
            <View style={[tradeStyles.cardWrap, { width: cardContainerWidth }]}>
                <View style={tradeStyles.card}>
                    <View style={tradeStyles.cardHeader}>
                        <View style={[tradeStyles.typeBadge, { backgroundColor: tradeType === 'Buy' ? '#0a5' : '#d33' }]}>
                            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>{tradeType}</Text>
                        </View>
                        <Text style={[tradeStyles.status, { color: status === 'Active' ? '#0a5' : '#666' }]}>{status}</Text>
                    </View>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 8 }}>{assetName}</Text>
                    <Text style={{ color: '#888', fontSize: 14, marginTop: 4 }}>${Number(price).toLocaleString()}</Text>
                </View>
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
                <View style={[styles.pagerEmpty, { alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={[styles.emptyTitle, { color: theme.text, textAlign: 'center' }]}>No active trades</Text>
                    <Text style={[styles.emptyText, { color: theme.placeholder, textAlign: 'center' }]}>
                        {accountType === 'personal' ? "You haven't made any trades yet." : "No trades to display."}
                    </Text>
                </View>
            );
        }

        return (
            <FlatList
                data={trades}
                keyExtractor={(item) => String(item._id || item.id || Math.random())}
                renderItem={renderTradeCard}
                contentContainerStyle={{ padding: 16, paddingBottom: 100, alignItems: 'center' }}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={<View style={{ height: 12 }} />}
            />
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

            <View style={styles.pagerWrap}>
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

                    {/* Expand Tab */}
                    <View style={[styles.pagerPage, { width: screenW, alignItems: 'flex-start', justifyContent: 'flex-start' }]}>
                        {renderExpandSection()}
                    </View>

                    {/* Trades Tab */}
                    <View style={[styles.pagerPage, { width: screenW }]}>
                        {renderTradesSection()}
                    </View>
                </Animated.ScrollView>
            </View>
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
        width: '100%',
        alignSelf: 'center',
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
        width: '100%',
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
