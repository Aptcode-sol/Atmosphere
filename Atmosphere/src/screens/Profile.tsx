import React, { useState, useContext, useEffect } from 'react';
/* eslint-disable react-native/no-inline-styles */
import { View, Text, ScrollView, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getProfile, getFollowersCount, getFollowingCount, getStartupProfile } from '../lib/api';
import { getImageSource } from '../lib/image';
import ProfileHeader from './profile/ProfileHeader';
import ProfilePager from './profile/ProfilePager';
import SettingsOverlay from './profile/SettingsOverlay';
import styles from './profile/Profile.styles';
// navigation hooks are used in this file via useNavigation/useRoute

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

const Profile = ({ onNavigate, userId: propUserId, onClose }: { onNavigate?: (route: RouteKey) => void; userId?: string | null; onClose?: () => void }) => {
    const { theme } = useContext(ThemeContext);
    const [data, setData] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
    const navigation: any = useNavigation();
    const route: any = useRoute();
    const routeUserId = route?.params?.userId || null;
    const viewingUserId = propUserId || routeUserId || null;

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                let profileData: any;
                if (viewingUserId) {
                    profileData = await getStartupProfile(String(viewingUserId));
                } else {
                    profileData = await getProfile();
                }
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
    }, [viewingUserId]);

    // format helpers removed (not used in mobile layout)

    const src = data || mockData;
    const [posts, setPosts] = useState<any[]>([]);
    const [postsLoading, setPostsLoading] = useState(true);
    const [followersCount, setFollowersCount] = useState<number | null>(null);
    const [followingCount, setFollowingCount] = useState<number | null>(null);
    const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
    const [followLoading, setFollowLoading] = useState(false);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setPostsLoading(true);
                const api = await import('../lib/api');
                let all: any[] = [];
                if (viewingUserId) {
                    if (typeof api.getPostsByUser === 'function') {
                        all = await api.getPostsByUser(String(viewingUserId));
                    } else {
                        const allPosts = await api.fetchStartupPosts();
                        all = (allPosts || []).filter((p: any) => String(p.userId || p.user?._id || p.user?.id) === String(viewingUserId));
                    }
                } else {
                    all = await api.fetchMyPosts();
                }
                if (mounted) setPosts((all || []));
            } catch {
                if (mounted) setPosts([]);
            } finally {
                if (mounted) setPostsLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [viewingUserId]);

    // fetch follower/following counts for the current logged in profile
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const userId = viewingUserId || null;
                // If viewing another user's profile and we have no id, skip
                if (!userId) {
                    // try to extract from the loaded data if available
                    const profileRaw: any = await getProfile();
                    const derived = profileRaw?.user?._id || profileRaw?.user?.id || null;
                    if (!derived) return;
                    const [fCount, foCount] = await Promise.all([getFollowersCount(String(derived)), getFollowingCount(String(derived))]);
                    if (!mounted) return;
                    setFollowersCount(Number(fCount || 0));
                    setFollowingCount(Number(foCount || 0));
                    return;
                }

                const [fCount, foCount] = await Promise.all([getFollowersCount(String(userId)), getFollowingCount(String(userId))]);
                if (!mounted) return;
                setFollowersCount(Number(fCount || 0));
                setFollowingCount(Number(foCount || 0));
            } catch {
                if (mounted) {
                    setFollowersCount(0);
                    setFollowingCount(0);
                }
            }
        })();
        return () => { mounted = false; };
    }, [viewingUserId]);

    // fetch follow status when viewing another user's profile
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                if (!viewingUserId) {
                    setIsFollowing(null);
                    return;
                }
                const api = await import('../lib/api');
                if (typeof api.getFollowStatus === 'function') {
                    const st = await api.getFollowStatus(String(viewingUserId));
                    if (mounted) setIsFollowing(Boolean(st?.isFollowing));
                } else {
                    const st = await api.checkFollowing(String(viewingUserId));
                    if (mounted) setIsFollowing(Boolean(st?.isFollowing));
                }
            } catch {
                if (mounted) setIsFollowing(false);
            }
        })();
        return () => { mounted = false; };
    }, [viewingUserId]);

    // only open setup when user explicitly taps the pill

    return (
        <View style={{ flex: 1 }}>
            <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={[styles.contentContainer]}>
                <ProfileHeader name={src.name} onOpenSettings={() => setLeftDrawerOpen(true)} onCreate={() => { }} onBack={onClose || (() => navigation.goBack())} theme={theme} />

                {/* Setup is opened via parent navigation (LandingPage route 'setup') */}

                {loading ? (
                    <View style={styles.loadingWrap}>
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                ) : (
                    <>
                        <View style={styles.profileHeader}>
                            <View style={styles.avatarWrap}>
                                {src.logo && !src.logo.includes('placeholder.com') ? (
                                    <Image source={getImageSource(src.logo)} style={styles.avatarLarge} onError={(e) => { console.warn('Profile avatar load error', e.nativeEvent, src.logo); }} />
                                ) : (
                                    <View style={[styles.avatarLarge, { alignItems: 'center', justifyContent: 'center' }]}>
                                        <Text style={{ color: '#fff', fontSize: 28, fontWeight: '700' }}>{(src.name || 'U').charAt(0).toUpperCase()}</Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.headerStats}>
                                <View style={styles.statCol}>
                                    <Text style={[styles.statNum, { color: theme.text }]}>{posts.length}</Text>
                                    <Text style={[styles.statLabel, { color: theme.placeholder }]}>posts</Text>
                                </View>
                                <View style={styles.statCol}>
                                    <Text style={[styles.statNum, { color: theme.text }]}>{followersCount ?? src.stats?.followers ?? 0}</Text>
                                    <Text style={[styles.statLabel, { color: theme.placeholder }]}>followers</Text>
                                </View>
                                <View style={styles.statCol}>
                                    <Text style={[styles.statNum, { color: theme.text }]}>{followingCount ?? 0}</Text>
                                    <Text style={[styles.statLabel, { color: theme.placeholder }]}>following</Text>
                                </View>
                            </View>
                        </View>

                        {viewingUserId ? (
                            <TouchableOpacity
                                style={[styles.setupPill, { borderColor: theme.border, backgroundColor: isFollowing ? '#111' : 'transparent' }]}
                                onPress={async () => {
                                    if (!viewingUserId || followLoading) return;
                                    setFollowLoading(true);
                                    const newState = !isFollowing;
                                    setIsFollowing(newState);
                                    try {
                                        const api = await import('../lib/api');
                                        if (newState) {
                                            await api.followUser(String(viewingUserId));
                                        } else {
                                            await api.unfollowUser(String(viewingUserId));
                                        }
                                    } catch {
                                        setIsFollowing(!newState);
                                    } finally {
                                        setFollowLoading(false);
                                    }
                                }}
                            >
                                <Text style={[styles.setupPillText, { color: '#fff' }]}>{isFollowing ? 'Following' : 'Follow'}</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={[styles.setupPill, { borderColor: theme.border }]} onPress={() => onNavigate ? onNavigate('setup') : null}>
                                <Text style={[styles.setupPillText, { color: theme.text }]}>Setup Profile</Text>
                            </TouchableOpacity>
                        )}

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
