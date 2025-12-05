import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, FlatList, Dimensions, Animated } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { getProfile } from '../lib/api';
import { clearToken } from '../lib/auth';

const mockData = (() => {
    const userName = 'Airbound';
    const userId = 'airbound';
    return {
        name: userName === 'Airbound' ? 'Airbound' : 'Zlyft',
        username: userName === 'Airbound' ? '@airbound' : '@zlyft',
        logo: userId === 'airbound'
            ? 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=400&fit=crop'
            : 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=400&fit=crop',
        tagline: 'Revolutionizing air travel with sustainable technology',
        description: 'Building the next generation of electric aircraft for urban air mobility. Making sustainable air travel accessible to everyone.',
        location: 'San Francisco, CA',
        founded: '2023',
        industry: 'Aviation Tech',
        stage: 'Seed',
        stats: { followers: 1247, teamSize: 12, fundingRaised: 2500000, valuation: 15000000 }
    };
})();


const normalizeProfile = (profileData: any) => {
    if (!profileData) return null;

    const { user, details } = profileData;

    // For startups
    if (user?.accountType === 'startup' && details) {
        return {
            name: details.companyName || user.displayName || user.username || 'Unknown',
            username: user.username ? `@${user.username}` : '',
            logo: details.profileImage || user.avatarUrl || 'https://via.placeholder.com/400x240.png?text=Startup',
            tagline: details.about || user.bio || '',
            description: details.about || user.bio || '',
            location: details.location || '',
            founded: details.establishedOn ? new Date(details.establishedOn).getFullYear() : '',
            industry: details.companyType || '',
            stage: details.stage || '',
            stats: {
                followers: 0,
                teamSize: details.teamMembers?.length || 0,
                fundingRaised: details.fundingRaised || details.financialProfile?.fundingAmount || 0
            },
            profileSetupComplete: user.profileSetupComplete,
            onboardingStep: user.onboardingStep,
        };
    }

    // For investors
    if (user?.accountType === 'investor' && details) {
        return {
            name: user.displayName || user.username || 'Unknown',
            username: user.username ? `@${user.username}` : '',
            logo: details.profileImage || user.avatarUrl || 'https://via.placeholder.com/400x240.png?text=Investor',
            tagline: details.about || user.bio || '',
            description: details.about || user.bio || '',
            location: details.location || '',
            founded: '',
            industry: details.investmentFocus?.join(', ') || '',
            stage: details.stage || '',
            stats: {
                followers: 0,
                teamSize: 0,
                fundingRaised: 0
            },
            profileSetupComplete: user.profileSetupComplete,
            onboardingStep: user.onboardingStep,
        };
    }

    // For personal accounts
    return {
        name: user.displayName || user.username || 'Unknown',
        username: user.username ? `@${user.username}` : '',
        logo: user.avatarUrl || 'https://via.placeholder.com/400x240.png?text=User',
        tagline: user.bio || '',
        description: user.bio || '',
        location: '',
        founded: '',
        industry: '',
        stage: '',
        stats: { followers: 0, teamSize: 0, fundingRaised: 0 },
        profileSetupComplete: user.profileSetupComplete,
        onboardingStep: user.onboardingStep,
    };
};

const Profile = () => {
    const { theme } = useContext(ThemeContext);
    // Tabs are currently static in the mobile layout; keep state for future interaction
    const [_tab, _setTab] = useState<'overview' | 'milestones'>('overview');
    const [data, setData] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const profileData = await getProfile();
                if (mounted) {
                    const normalized = normalizeProfile(profileData);
                    setData(normalized || mockData);
                }
            } catch {
                if (mounted) setData(mockData);
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    // format helpers removed (not used in mobile layout)

    const src = data || mockData;
    const [posts, setPosts] = useState<any[]>([]);
    const [postsLoading, setPostsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'posts' | 'expand' | 'trades'>('posts');
    const pagerRef = React.useRef<Animated.ScrollView | null>(null);
    const scrollX = React.useRef(new Animated.Value(0)).current;
    const screenW = Dimensions.get('window').width;

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setPostsLoading(true);
                const api = await import('../lib/api');
                const all = await api.fetchMyPosts();
                if (mounted) setPosts((all || []));
            } catch (e) {
                if (mounted) setPosts([]);
            } finally {
                if (mounted) setPostsLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={[styles.contentContainer]}>
            {/* Header bar */}
            <View style={styles.topBar}>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => setLeftDrawerOpen(true)}
                    accessibilityLabel="Open settings"
                >
                    <Text style={[styles.iconText, { color: theme.text }]}>≡</Text>
                </TouchableOpacity>
                <Text style={[styles.topTitle, { color: theme.text }]}>{src.name}</Text>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => { /* future action */ }}
                    accessibilityLabel="Create new"
                >
                    <Text style={[styles.iconText, { color: theme.text }]}>＋</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <>
                    <View style={styles.profileHeader}>
                        <View style={styles.avatarWrap}>
                            <Image source={{ uri: src.logo }} style={styles.avatarLarge} />
                        </View>
                        <View style={styles.headerStats}>
                            <View style={styles.statCol}>
                                <Text style={[styles.statNum, { color: theme.text }]}>{0}</Text>
                                <Text style={[styles.statLabel, { color: theme.placeholder }]}>posts</Text>
                            </View>
                            <View style={styles.statCol}>
                                <Text style={[styles.statNum, { color: theme.text }]}>{src.stats?.followers ?? 0}</Text>
                                <Text style={[styles.statLabel, { color: theme.placeholder }]}>followers</Text>
                            </View>
                            <View style={styles.statCol}>
                                <Text style={[styles.statNum, { color: theme.text }]}>{0}</Text>
                                <Text style={[styles.statLabel, { color: theme.placeholder }]}>following</Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity style={[styles.setupPill, { borderColor: theme.border }]}>
                        <Text style={[styles.setupPillText, { color: theme.text }]}>Setup Profile ({src.onboardingStep || 0}/4)</Text>
                    </TouchableOpacity>

                    {/* Tabs */}
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

                        {/* Animated indicator */}
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
                            ref={r => (pagerRef.current = r)}
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
                            <View style={[styles.pagerPage, { width: screenW }]}>
                                {postsLoading ? (
                                    <View style={styles.pagerEmpty}><ActivityIndicator size="small" color={theme.primary} /><Text style={[styles.emptyText, { color: theme.placeholder }]}>Loading posts...</Text></View>
                                ) : posts.length === 0 ? (
                                    <View style={styles.pagerEmpty}><Text style={[styles.emptyTitle, { color: theme.text }]}>No posts yet</Text><Text style={[styles.emptyText, { color: theme.placeholder }]}>You haven't posted anything yet. Tap the + button to create your first post.</Text></View>
                                ) : (
                                    <FlatList data={posts} keyExtractor={(it) => String(it._id || it.id || Math.random())} renderItem={({ item }) => (
                                        <View style={styles.postCard}>
                                            <Text style={{ color: theme.text, fontWeight: '700' }}>{item.title || item.name || item.companyName || 'Post'}</Text>
                                            {item.content ? <Text style={{ color: theme.placeholder, marginTop: 6 }}>{item.content}</Text> : null}
                                        </View>
                                    )} />
                                )}
                            </View>

                            <View style={[styles.pagerPage, { width: screenW }]}>
                                <View style={styles.pagerEmpty}><Text style={[styles.emptyTitle, { color: theme.text }]}>Expand</Text><Text style={[styles.emptyText, { color: theme.placeholder }]}>Content for Expand goes here.</Text></View>
                            </View>

                            <View style={[styles.pagerPage, { width: screenW }]}>
                                <View style={styles.pagerEmpty}><Text style={[styles.emptyTitle, { color: theme.text }]}>Trades</Text><Text style={[styles.emptyText, { color: theme.placeholder }]}>Content for Trades goes here.</Text></View>
                            </View>
                        </Animated.ScrollView>
                    </View>
                </>
            )}
            {/* Left drawer overlay */}
            {leftDrawerOpen && (
                <View style={[styles.fullPage, { backgroundColor: theme.background }]}>
                    <View style={styles.settingsHeader}>
                        <TouchableOpacity onPress={() => setLeftDrawerOpen(false)} style={styles.headerBack}>
                            <Text style={{ color: theme.text }}>{'←'}</Text>
                        </TouchableOpacity>
                        <Text style={[styles.settingsTitle, { color: theme.text }]}>Settings</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <ScrollView contentContainerStyle={styles.settingsContent}>
                        <Text style={[styles.sectionLabel, { color: theme.placeholder }]}>ACCOUNT INFORMATION</Text>
                        <View style={[styles.sectionCard, { borderColor: theme.border }]}>
                            <TouchableOpacity style={styles.settingRow} onPress={() => { }}>
                                <View style={styles.settingLeft}>
                                    <Text style={[styles.settingTitle, { color: theme.text }]}>Name</Text>
                                    <Text style={[styles.settingSubtitle, { color: theme.placeholder }]} numberOfLines={2}>{src.name}</Text>
                                </View>
                                <Text style={[styles.chev, { color: theme.placeholder }]}>{'›'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.settingRow} onPress={() => { }}>
                                <View style={styles.settingLeft}>
                                    <Text style={[styles.settingTitle, { color: theme.text }]}>Username</Text>
                                    <Text style={[styles.settingSubtitle, { color: theme.placeholder }]}>{src.username}</Text>
                                </View>
                                <Text style={[styles.chev, { color: theme.placeholder }]}>{'›'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.settingRow} onPress={() => { }}>
                                <View style={styles.settingLeft}>
                                    <Text style={[styles.settingTitle, { color: theme.text }]}>Password</Text>
                                    <Text style={[styles.settingSubtitle, { color: theme.placeholder }]}>Change your password</Text>
                                </View>
                                <Text style={[styles.chev, { color: theme.placeholder }]}>{'›'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.settingRow} onPress={() => { }}>
                                <View style={styles.settingLeft}>
                                    <Text style={[styles.settingTitle, { color: theme.text }]}>Email</Text>
                                    <Text style={[styles.settingSubtitle, { color: theme.placeholder }]}>{'john.doe@example.com'}</Text>
                                </View>
                                <Text style={[styles.chev, { color: theme.placeholder }]}>{'›'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.settingRow} onPress={() => { }}>
                                <View style={styles.settingLeft}>
                                    <Text style={[styles.settingTitle, { color: theme.text }]}>Phone</Text>
                                    <Text style={[styles.settingSubtitle, { color: theme.placeholder }]}>{'+1234567890'}</Text>
                                </View>
                                <Text style={[styles.chev, { color: theme.placeholder }]}>{'›'}</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.sectionLabel, { color: theme.placeholder }]}>CONTENT</Text>
                        <View style={[styles.sectionCard, { borderColor: theme.border }]}>
                            <TouchableOpacity style={styles.settingRow} onPress={() => { }}>
                                <View style={styles.settingLeft}>
                                    <Text style={[styles.settingTitle, { color: theme.text }]}>Professional Dashboard</Text>
                                    <Text style={[styles.settingSubtitle, { color: theme.placeholder }]}>View analytics and insights</Text>
                                </View>
                                <Text style={[styles.chev, { color: theme.placeholder }]}>{'›'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.settingRow} onPress={() => { }}>
                                <View style={styles.settingLeft}>
                                    <Text style={[styles.settingTitle, { color: theme.text }]}>Saved Content</Text>
                                    <Text style={[styles.settingSubtitle, { color: theme.placeholder }]}>Access your saved posts and startups</Text>
                                </View>
                                <Text style={[styles.chev, { color: theme.placeholder }]}>{'›'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.settingRow} onPress={() => { }}>
                                <View style={styles.settingLeft}>
                                    <Text style={[styles.settingTitle, { color: theme.text }]}>Content Preference</Text>
                                    <Text style={[styles.settingSubtitle, { color: theme.placeholder }]}>Customize your feed</Text>
                                </View>
                                <Text style={[styles.chev, { color: theme.placeholder }]}>{'›'}</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.sectionLabel, { color: theme.placeholder }]}>PRIVACY</Text>
                        <View style={[styles.sectionCard, { borderColor: theme.border }]}>
                            <TouchableOpacity style={styles.settingRow} onPress={() => { }}>
                                <View style={styles.settingLeft}>
                                    <Text style={[styles.settingTitle, { color: theme.text }]}>Comments</Text>
                                    <Text style={[styles.settingSubtitle, { color: theme.placeholder }]}>Control who can comment on your posts</Text>
                                </View>
                                <Text style={[styles.chev, { color: theme.placeholder }]}>{'›'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.settingRow} onPress={() => { }}>
                                <View style={styles.settingLeft}>
                                    <Text style={[styles.settingTitle, { color: theme.text }]}>Connect</Text>
                                    <Text style={[styles.settingSubtitle, { color: theme.placeholder }]}>Manage direct message permissions</Text>
                                </View>
                                <Text style={[styles.chev, { color: theme.placeholder }]}>{'›'}</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.sectionLabel, { color: theme.placeholder }]}>HELP</Text>
                        <View style={[styles.sectionCard, { borderColor: theme.border }]}>
                            <TouchableOpacity style={styles.settingRow} onPress={() => { }}>
                                <View style={styles.settingLeft}>
                                    <Text style={[styles.settingTitle, { color: theme.text }]}>Support</Text>
                                    <Text style={[styles.settingSubtitle, { color: theme.placeholder }]}>Get help or contact us</Text>
                                </View>
                                <Text style={[styles.chev, { color: theme.placeholder }]}>{'›'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.settingRow} onPress={() => { }}>
                                <View style={styles.settingLeft}>
                                    <Text style={[styles.settingTitle, { color: theme.text }]}>About</Text>
                                    <Text style={[styles.settingSubtitle, { color: theme.placeholder }]}>Version 1.0.0</Text>
                                </View>
                                <Text style={[styles.chev, { color: theme.placeholder }]}>{'›'}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ height: 24 }} />
                        <TouchableOpacity
                            style={[styles.logoutBtn]}
                            onPress={async () => {
                                await clearToken();
                                setLeftDrawerOpen(false);
                                try {
                                    // fallback: reload the JS bundle (works without navigation)
                                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                                    const { DevSettings } = require('react-native');
                                    if (DevSettings && typeof DevSettings.reload === 'function') DevSettings.reload();
                                } catch (e) {
                                    // ignore
                                }
                            }}
                        >
                            <Text style={styles.logoutText}>Log Out</Text>
                        </TouchableOpacity>
                        <View style={{ height: 48 }} />
                    </ScrollView>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    contentContainer: { flexGrow: 1, paddingBottom: 120 },
    topBar: { height: 64, paddingHorizontal: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
    iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
    iconText: { fontSize: 22, fontWeight: '700' },
    topTitle: { fontWeight: '800', fontSize: 22 },
    loadingWrap: { padding: 28, alignItems: 'center' },
    profileHeader: { flexDirection: 'row', padding: 16, alignItems: 'center' },
    avatarWrap: { marginRight: 12 },
    avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#333' },
    headerStats: { flexDirection: 'row', flex: 1, justifyContent: 'space-around' },
    statCol: { alignItems: 'center' },
    statNum: { fontWeight: '700', fontSize: 16 },
    statLabel: { fontSize: 12 },
    setupPill: { marginHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 1, alignItems: 'center', marginBottom: 8 },
    setupPillText: { fontWeight: '600' },
    tabsRow: { flexDirection: 'row', marginTop: 8, position: 'relative' },
    tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    tabText: { fontSize: 14 },
    tabTextActive: { fontSize: 14, fontWeight: '700' },
    tabUnderline: { height: 2, backgroundColor: '#fff', marginTop: 8, width: '100%' },
    tabIndicator: { height: 3, backgroundColor: '#fff', position: 'absolute', bottom: -2, left: 0 },
    gridWrap: { padding: 12, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    gridItem: { width: '31%', aspectRatio: 1, backgroundColor: '#222', borderRadius: 6, marginBottom: 12 },
    backdrop: { position: 'absolute', left: 0, top: 0, bottom: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
    leftDrawer: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 300, padding: 16, borderRightWidth: 1 },
    drawerTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
    fullPage: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 },
    settingsHeader: { height: 56, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#111' },
    headerBack: { width: 40, alignItems: 'flex-start', justifyContent: 'center' },
    settingsTitle: { fontSize: 18, fontWeight: '700' },
    settingsContent: { padding: 20, paddingBottom: 36 },
    sectionLabel: { fontSize: 13, fontWeight: '700', marginTop: 12, marginBottom: 8 },
    sectionCard: { borderWidth: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: '#0b0b0b', marginBottom: 12 },
    settingRow: { padding: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#111', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    settingLeft: { flex: 1, paddingRight: 8 },
    settingTitle: { fontSize: 15, fontWeight: '600' },
    settingSubtitle: { fontSize: 13.5, marginTop: 6 },
    chev: { fontSize: 18, paddingLeft: 8 },
    logoutBtn: { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
    logoutText: { color: '#c41b1b', fontWeight: '700' },
    postCard: { padding: 12, margin: 12, borderRadius: 8, backgroundColor: '#101010' },
    pagerEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
    emptyText: { fontSize: 14, textAlign: 'center', maxWidth: 420 },
    pagerWrap: { flex: 1 },
    pagerPage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    metaBlock: { paddingHorizontal: 16 },
    tagline: { fontSize: 14, fontWeight: '600', marginTop: 8 },
    description: { marginTop: 8, fontSize: 13, lineHeight: 18 },
    badgesRow: { flexDirection: 'row', marginTop: 8, gap: 8 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, marginRight: 8 },
    overviewCard: { padding: 12, margin: 12, borderRadius: 8, borderWidth: 1 },
    rowSpace: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
    infoLabel: { fontSize: 13 },
    infoValue: { fontSize: 13, fontWeight: '700' },
    milestones: { paddingHorizontal: 12, paddingTop: 8 },
    milestoneItem: { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' },
    milestoneTitle: { fontSize: 14, fontWeight: '700' },
    milestoneDate: { fontSize: 12, marginTop: 4 },
    milestoneDesc: { marginTop: 6 }
});

export default Profile;
