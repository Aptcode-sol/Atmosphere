import React, { useState, useContext, useEffect } from 'react';
import { View, Text, ScrollView, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { getProfile } from '../lib/api';
import ProfileHeader from './profile/ProfileHeader';
import ProfilePager from './profile/ProfilePager';
import SettingsOverlay from './profile/SettingsOverlay';
import styles from './profile/Profile.styles';

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

type RouteKey = 'home' | 'search' | 'notifications' | 'chats' | 'reels' | 'profile' | 'topstartups' | 'trade' | 'jobs' | 'meetings' | 'setup';

const Profile = ({ onNavigate }: { onNavigate?: (route: RouteKey) => void }) => {
    const { theme } = useContext(ThemeContext);
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

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setPostsLoading(true);
                const api = await import('../lib/api');
                const all = await api.fetchMyPosts();
                if (mounted) setPosts((all || []));
            } catch {
                if (mounted) setPosts([]);
            } finally {
                if (mounted) setPostsLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);

    // only open setup when user explicitly taps the pill

    return (
        <View style={{ flex: 1 }}>
            <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={[styles.contentContainer]}>
                <ProfileHeader name={src.name} onOpenSettings={() => setLeftDrawerOpen(true)} onCreate={() => { }} theme={theme} />

                {/* Setup is opened via parent navigation (LandingPage route 'setup') */}

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

                        <TouchableOpacity style={[styles.setupPill, { borderColor: theme.border }]} onPress={() => onNavigate ? onNavigate('setup') : null}>
                            <Text style={[styles.setupPillText, { color: theme.text }]}>Setup Profile ({src.onboardingStep || 0}/4)</Text>
                        </TouchableOpacity>

                        <ProfilePager posts={posts} postsLoading={postsLoading} theme={theme} />
                    </>
                )}
            </ScrollView>
            {leftDrawerOpen && <SettingsOverlay src={src} theme={theme} onClose={() => setLeftDrawerOpen(false)} />}
        </View>
    );
};

// styles are imported from ./profile/Profile.styles

export default Profile;
