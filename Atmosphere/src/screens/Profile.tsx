import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { getProfile } from '../lib/api';

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

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={[styles.contentContainer]}>
            {/* Header bar */}
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.iconButton}>
                    <Text style={{ color: theme.text }}>≡</Text>
                </TouchableOpacity>
                <Text style={[styles.topTitle, { color: theme.text }]}>{src.name}</Text>
                <TouchableOpacity style={styles.iconButton}>
                    <Text style={{ color: theme.text }}>＋</Text>
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
                        <TouchableOpacity style={styles.tabItem}>
                            <Text style={[styles.tabTextActive, { color: theme.text }]}>Posts</Text>
                            <View style={styles.tabUnderline} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.tabItem}>
                            <Text style={[styles.tabText, { color: theme.placeholder }]}>Expand</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.tabItem}>
                            <Text style={[styles.tabText, { color: theme.placeholder }]}>Trades</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Grid placeholders */}
                    <View style={styles.gridWrap}>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <View key={i} style={styles.gridItem} />
                        ))}
                    </View>
                </>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    contentContainer: { paddingBottom: 120 },
    topBar: { height: 56, paddingHorizontal: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
    iconButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    topTitle: { fontWeight: '700' },
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
    tabsRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#222', marginTop: 8 },
    tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    tabText: { fontSize: 14 },
    tabTextActive: { fontSize: 14, fontWeight: '700' },
    tabUnderline: { height: 2, backgroundColor: '#fff', marginTop: 8, width: '100%' },
    gridWrap: { padding: 12, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    gridItem: { width: '31%', aspectRatio: 1, backgroundColor: '#222', borderRadius: 6, marginBottom: 12 },
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
