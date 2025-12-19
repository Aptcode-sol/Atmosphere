import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { Image } from 'react-native';
import { Crown, Heart, Flame, Send } from 'lucide-react-native';
import ShareModal from '../components/ShareModal';
import * as api from '../lib/api';
import { ThemeContext } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ThemedRefreshControl from '../components/ThemedRefreshControl';
// import TopNavbar from '../components/TopNavbar';

const { width } = Dimensions.get('window');

type StartupCard = any;

const HottestStartups = () => {
    const [filterDay] = useState<'today' | '7days'>('today');
    const [loading, setLoading] = useState(true);
    const [topList, setTopList] = useState<StartupCard[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const { theme } = useContext(ThemeContext);

    const CACHE_KEY = 'ATMOSPHERE_HOTTEST_STARTUPS_CACHE';

    const loadStartups = async (isRefresh = false) => {
        if (isRefresh) setLoading(true); // Optional: keep loading spinner for full refresh feel or just rely on RC

        // Try cache first if not refreshing
        if (!isRefresh) {
            try {
                const cached = await AsyncStorage.getItem(CACHE_KEY);
                if (cached) {
                    setTopList(JSON.parse(cached));
                    setLoading(false);
                }
            } catch (e) { console.warn('HottestStartups: failed cache', e); }
        }

        // Fetch fresh
        try {
            const startups = await api.fetchHottestStartups(10);
            if (startups) {
                setTopList(startups);
                AsyncStorage.setItem(CACHE_KEY, JSON.stringify(startups)).catch(() => { });
            }
        } catch (e) {
            console.warn('HottestStartups: failed to fetch', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStartups();
    }, [filterDay]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadStartups(true); // Force fetch
        setRefreshing(false);
    };

    // legacy safe getters removed — using server-provided `weekCounts` now

    const shortOf = (s: any) => s?.about || s?.tagline || s?.shortDescription || s?.description || s?.details?.about || s?.details?.tagline || s?.details?.shortDescription || '';

    const renderPodium = () => {
        const first = topList[0] || null;
        const second = topList[1] || null;
        const third = topList[2] || null;
        const initialsOf = (s: any) => s?.initials || (s?.name ? s.name.split(' ').map((p: string) => p.charAt(0)).slice(0, 2).join('').toUpperCase() : (s?.companyName ? s.companyName.charAt(0).toUpperCase() : ''));
        const avatarOf = (s: any) => s?.logo || s?.profileImage || s?.details?.profileImage || s?.user?.avatarUrl || s?.image || null;
        return (
            <View style={styles.podiumWrap}>
                {/* 2nd */}
                <View style={[styles.podiumItem, styles.podiumSecond]}>
                    <View style={[styles.medal, { backgroundColor: second?.color || '#9CA3AF' }, styles.medalSilver]}>
                        {avatarOf(second) ? (
                            <Image source={{ uri: avatarOf(second) }} style={styles.podiumImage} />
                        ) : (
                            <Text style={styles.medalText}>{initialsOf(second)}</Text>
                        )}
                    </View>
                    <View style={[styles.podiumBase, styles.silverPodiumBase]}>
                        <Text style={styles.podiumRank}>2</Text>
                    </View>
                    <View style={styles.podiumLabel}>
                        <Text style={[styles.podiumName, { color: theme?.text }]} numberOfLines={1} ellipsizeMode="tail">{second?.name ?? second?.companyName ?? second?.company?.name ?? '—'}</Text>
                        <Text style={[styles.shortDesc, { color: theme?.placeholder }]} numberOfLines={1} ellipsizeMode="tail">{shortOf(second)}</Text>
                        <View style={styles.likesRow}>
                            <View style={styles.statPair}>
                                <Crown size={14} color="#F59E0B" />
                                <Text style={styles.likesText}>{second?.weekCounts?.crowns ?? second?.stats?.crowns ?? 0}</Text>
                            </View>
                            <View style={styles.statPair}>
                                <Heart size={14} color="#F472B6" />
                                <Text style={styles.likesText}>{second?.weekCounts?.likes ?? second?.stats?.likes ?? 0}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* 1st */}
                <View style={styles.podiumItemCenter}>
                    <View style={[styles.champion, { backgroundColor: first?.color || '#F59E0B' }, styles.championGold]}>
                        {avatarOf(first) ? (
                            <Image source={{ uri: avatarOf(first) }} style={styles.championImage} />
                        ) : (
                            <Text style={styles.championText}>{initialsOf(first)}</Text>
                        )}
                    </View>
                    <View style={[styles.podiumBaseCenter, styles.goldPodiumBase]}>
                        <Text style={styles.podiumRankCenter}>1</Text>
                    </View>
                    <View style={styles.podiumLabelCenter}>
                        <Text style={[styles.championName, { color: theme?.text }]} numberOfLines={1} ellipsizeMode="tail">{first?.name ?? first?.companyName ?? first?.company?.name ?? '—'}</Text>
                        <Text style={[styles.shortDescCenter, { color: theme?.placeholder }]} numberOfLines={1} ellipsizeMode="tail">{shortOf(first)}</Text>
                        <View style={styles.likesRow}>
                            <View style={styles.statPair}>
                                <Crown size={16} color="#F59E0B" />
                                <Text style={styles.likesText}>{first?.weekCounts?.crowns ?? first?.stats?.crowns ?? 0}</Text>
                            </View>
                            <View style={styles.statPair}>
                                <Heart size={16} color="#F472B6" />
                                <Text style={styles.likesText}>{first?.weekCounts?.likes ?? first?.stats?.likes ?? 0}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* 3rd */}
                <View style={[styles.podiumItem, styles.podiumThird]}>
                    <View style={[styles.medal, { backgroundColor: third?.color || '#FB923C' }, styles.medalBronze]}>
                        {avatarOf(third) ? (
                            <Image source={{ uri: avatarOf(third) }} style={styles.podiumImage} />
                        ) : (
                            <Text style={styles.medalText}>{initialsOf(third)}</Text>
                        )}
                    </View>
                    <View style={[styles.podiumBase, styles.bronzePodiumBase]}>
                        <Text style={styles.podiumRank}>3</Text>
                    </View>
                    <View style={styles.podiumLabel}>
                        <Text style={[styles.podiumName, { color: theme?.text }]} numberOfLines={1} ellipsizeMode="tail">{third?.name ?? third?.companyName ?? third?.company?.name ?? '—'}</Text>
                        <Text style={[styles.shortDesc, { color: theme?.placeholder }]} numberOfLines={1} ellipsizeMode="tail">{shortOf(third)}</Text>
                        <View style={styles.likesRow}>
                            <View style={styles.statPair}>
                                <Crown size={14} color="#F59E0B" />
                                <Text style={styles.likesText}>{third?.weekCounts?.crowns ?? third?.stats?.crowns ?? 0}</Text>
                            </View>
                            <View style={styles.statPair}>
                                <Heart size={14} color="#F472B6" />
                                <Text style={styles.likesText}>{third?.weekCounts?.likes ?? third?.stats?.likes ?? 0}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [sharingContent, setSharingContent] = useState<any>(null);

    const openShare = (item: any) => {
        setSharingContent(item);
        setShareModalVisible(true);
    };

    const renderListItem = ({ item }: { item: any }) => (
        <View style={styles.listCard}>
            <View style={styles.listAvatar}>
                {(item.logo || item.profileImage || item.details?.profileImage || item.user?.avatarUrl || item.image) ? (
                    <Image source={{ uri: (item.logo || item.profileImage || item.details?.profileImage || item.user?.avatarUrl || item.image) }} style={styles.listImage} resizeMode="cover" />
                ) : (
                    <Text style={styles.listInitials}>{item.initials || (item.name ? item.name.charAt(0).toUpperCase() : (item.companyName ? item.companyName.charAt(0).toUpperCase() : '?'))}</Text>
                )}
            </View>
            <View style={styles.listBody}>
                <Text style={[styles.listName, { color: theme?.text }]} numberOfLines={1} ellipsizeMode="tail">{item.name || item.companyName || item.company?.name || '—'}</Text>
                <Text style={[styles.listTag, { color: theme?.placeholder }]} numberOfLines={1} ellipsizeMode="tail">{shortOf(item)}</Text>
                <View style={styles.likesRow}>
                    <View style={styles.statPair}>
                        <Crown size={14} color="#F59E0B" />
                        <Text style={styles.likesText}>{item.weekCounts?.crowns ?? item.stats?.crowns ?? 0}</Text>
                    </View>
                    <View style={styles.statPair}>
                        <Heart size={14} color="#F472B6" />
                        <Text style={styles.likesText}>{item.weekCounts?.likes ?? item.stats?.likes ?? 0}</Text>
                    </View>
                </View>
            </View>
            <View style={styles.actionsRight}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => openShare(item)}>
                    <Send size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.viewBtn} onPress={() => { /* navigate to profile */ }}>
                    <Text style={styles.viewBtnText}>View {'>'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // Use a single FlatList as the main scroll container to avoid nesting VirtualizedLists
    if (loading) {
        return (
            <View style={[styles.container, styles.loadingWrap, { backgroundColor: theme?.background || '#fff' }]}>
                <ActivityIndicator size="large" color="#FB923C" />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme?.background || '#fff' }]}>
            {/* <TopNavbar /> */}
            <FlatList
                data={topList.slice(3)}
                keyExtractor={i => String(i._startupId || i.id || i._id)}
                renderItem={renderListItem}
                ItemSeparatorComponent={Separator}
                contentContainerStyle={[styles.content, { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 60 }]}
                style={styles.flatList}
                ListHeaderComponent={Header({ theme, renderPodium })}
                refreshControl={
                    <ThemedRefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        progressViewOffset={Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 60 : 60}
                    />
                }
            />
            {sharingContent && (
                <ShareModal
                    visible={shareModalVisible}
                    onClose={() => setShareModalVisible(false)}
                    contentId={String(sharingContent._startupId || sharingContent.id || sharingContent._id)}
                    type="startup"
                    contentTitle={sharingContent.name || sharingContent.companyName || 'Startup'}
                    contentImage={sharingContent.logo || sharingContent.profileImage || sharingContent.image}
                    contentOwner={sharingContent.name || sharingContent.companyName}
                />
            )}
        </View>
    );
};

const Separator = () => <View style={styles.separator} />;

const Header = ({ theme, renderPodium }: { theme: any; renderPodium: () => JSX.Element | null; }) => () => (
    <>
        <View style={styles.headerCenter}>
            <View style={styles.headerHeadingRow}>
                <Flame size={24} color="#F59E0B" fill="#F59E0B" />
                <Text style={[styles.heading, { color: theme?.text, marginTop: 0 }]}>Hottest Startups This Week</Text>
            </View>
            <Text style={[styles.sub, { color: theme?.placeholder }]}>Discover the top 10 most liked companies in the past 7 days.</Text>
        </View>
        {renderPodium()}
        <View style={styles.headerSpacer} />
    </>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f1724' },
    content: { padding: 16, paddingBottom: 40 },
    headerCenter: { alignItems: 'center', marginBottom: 18 },
    heading: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 8 },
    sub: { color: '#9CA3AF', fontSize: 12, textAlign: 'center', marginTop: 6, maxWidth: width - 40 },
    podiumWrap: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 18, marginVertical: 16 },
    podiumItem: { width: 100, alignItems: 'center' },
    podiumItemCenter: { width: 120, alignItems: 'center' },
    podiumSecond: { transform: [{ translateY: 10 }] },
    podiumThird: { transform: [{ translateY: 18 }] },
    medal: { width: 80, height: 80, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.3, elevation: 6 },
    medalText: { color: '#fff', fontSize: 20, fontWeight: '800' },
    champion: { width: 96, height: 96, borderRadius: 20, borderBottomLeftRadius: 25, borderBottomRightRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#FBBF24', shadowColor: '#000', shadowOpacity: 0.35, elevation: 8 },
    championText: { color: '#fff', fontSize: 26, fontWeight: '900' },
    podiumBase: { width: 72, height: 32, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: -10 },
    podiumBaseCenter: { width: 88, height: 40, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: -16 },
    podiumRank: { fontWeight: '700', color: '#374151' },
    podiumRankCenter: { fontWeight: '900', color: '#92400E', fontSize: 16 },
    podiumLabel: { alignItems: 'center', marginTop: 8 },
    podiumLabelCenter: { alignItems: 'center', marginTop: 8 },
    podiumName: { color: '#fff', fontWeight: '700' },
    championName: { color: '#fff', fontWeight: '900', fontSize: 16 },
    podiumTag: { color: '#9CA3AF', fontSize: 12, maxWidth: 120 },
    shortDesc: { color: '#9CA3AF', fontSize: 12, maxWidth: 120 },
    shortDescCenter: { color: '#9CA3AF', fontSize: 12, maxWidth: 140, textAlign: 'center' },
    likesRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
    statPair: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    likesText: { color: '#F472B6', fontSize: 12, fontWeight: '600' },
    listWrap: { marginTop: 20 },
    listCard: { backgroundColor: '#0A0A0A', borderRadius: 28, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    listAvatar: { width: 56, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    listInitials: { color: '#fff', fontWeight: '800', textAlign: 'center' },
    listImage: { width: 56, height: 56, borderRadius: 12, alignSelf: 'stretch' },
    listBody: { flex: 1, marginLeft: 12 },
    podiumImage: { width: 72, height: 72, borderRadius: 10 },
    championImage: { width: 84, height: 84, borderRadius: 14 },
    listName: { color: '#fff', fontWeight: '700', maxWidth: width - 160 },
    listTag: { color: '#9CA3AF', fontSize: 12, maxWidth: width - 200 },
    actionsRight: { flexDirection: 'row', alignItems: 'center' },
    iconBtn: { padding: 8, marginRight: 4 },
    viewBtn: { backgroundColor: '#000', borderWidth: 1, borderColor: '#333', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 24, marginLeft: 8 },
    viewBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 }
    , separator: { height: 12 },
    loadingWrap: { justifyContent: 'center', alignItems: 'center' },
    headerSpacer: { height: 25 },
    flatList: { flex: 1 },
    silverPodiumBase: { backgroundColor: '#E5E7EB' },
    goldPodiumBase: { backgroundColor: '#FDE68A' },
    bronzePodiumBase: { backgroundColor: '#FED7AA' },
    medalSilver: { borderWidth: 3, borderColor: '#C0C0C0' },
    medalBronze: { borderWidth: 3, borderColor: '#CD7F32' },
    championGold: { borderColor: '#FBBF24', borderWidth: 4 },
    headerHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
});

export default HottestStartups;
