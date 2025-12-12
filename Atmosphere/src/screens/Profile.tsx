import React, { useState, useContext, useEffect } from 'react';
/* eslint-disable react-native/no-inline-styles */
import { View, Text, ScrollView, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfile, getFollowersCount, getFollowingCount, getStartupProfile } from '../lib/api';
import { getImageSource } from '../lib/image';
import ProfileHeader from './profile/ProfileHeader';
import ProfilePager from './profile/ProfilePager';
import SettingsOverlay from './profile/SettingsOverlay';
import styles from './profile/Profile.styles';
import { NavigationRouteContext } from '@react-navigation/native';

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
    const { user, details } = profileData || {};
    // If startup details are present prefer the startup view even if user.role/accountType is missing or mismatched
    const hasStartupDetails = details && (details.companyName || details.profileImage || details.fundingRaised !== undefined);
    const primaryRole = user && Array.isArray(user.roles) && user.roles.length ? user.roles[0] : user?.accountType;
    if (hasStartupDetails && details) {
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
                followers: user.followersCount || 0,
                following: user.followingCount || 0,
                teamSize: details.teamMembers?.length || 0,
                fundingRaised: details.fundingRaised || details.financialProfile?.fundingAmount || 0
            },
            profileSetupComplete: user.profileSetupComplete,
            onboardingStep: user.onboardingStep,
        };
    }

    // For investors
    if ((primaryRole === 'investor') && details) {
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
                followers: user.followersCount || 0,
                following: user.followingCount || 0,
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
        stats: {
            followers: user.followersCount || 0,
            following: user.followingCount || 0,
            teamSize: 0,
            fundingRaised: 0
        },
        profileSetupComplete: user.profileSetupComplete,
        onboardingStep: user.onboardingStep,
    };
};

type RouteKey = 'home' | 'search' | 'notifications' | 'chats' | 'reels' | 'profile' | 'topstartups' | 'trade' | 'jobs' | 'meetings' | 'setup';

const Profile = ({ onNavigate, userId: propUserId, onClose, onCreatePost, onPostPress }: { onNavigate?: (route: RouteKey) => void; userId?: string | null; onClose?: () => void; onCreatePost?: () => void; onPostPress?: (postId: string) => void }) => {
    const { theme } = useContext(ThemeContext);
    const [data, setData] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
    const [ownProfileId, setOwnProfileId] = useState<string | null>(null);
    const routeCtx: any = useContext(NavigationRouteContext) as any | undefined;
    const routeUserId = routeCtx?.params?.userId || null;
    const routeStartupDetailsId = routeCtx?.params?.startupDetailsId || null;
    const viewingUserId = propUserId || routeUserId || null;

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                let profileData: any;
                if (routeStartupDetailsId) {
                    console.log('Profile: loading startup by startupDetailsId', routeStartupDetailsId);
                    profileData = await getStartupProfile(String(routeStartupDetailsId));
                } else if (viewingUserId) {
                    console.log('Profile: loading startup by viewingUserId', viewingUserId);
                    profileData = await getStartupProfile(String(viewingUserId));
                } else {
                    console.log('Profile: loading own profile');
                    profileData = await getProfile();
                }
                if (mounted) {
                    console.log('Profile: route params', { routeUserId, routeStartupDetailsId, viewingUserId });
                    console.log(profileData)
                    // Ensure profileData.user is a full object; sometimes backend returns only user id
                    try {
                        if (profileData && profileData.user && typeof profileData.user === 'string') {
                            const api = await import('../lib/api');
                            const fetched = await api.getUserByIdentifier(String(profileData.user));
                            if (fetched) profileData.user = fetched;
                        }
                    } catch { /* ignore */ }
                    const normalized = normalizeProfile(profileData);
                    setData(normalized || mockData);
                    // Ensure posts and follower counts are fetched when viewing another user's profile
                    try {
                        if (viewingUserId) {
                            const api = await import('../lib/api');
                            // fetch posts explicitly (prefer server endpoint)
                            try {
                                if (typeof api.getPostsByUser === 'function') {
                                    const userPosts = await api.getPostsByUser(String(viewingUserId));
                                    if (mounted) setPosts(userPosts || []);
                                } else {
                                    const myPosts = await api.fetchStartupPosts();
                                    if (mounted) setPosts((myPosts || []).filter((p: any) => String(p.userId || p.user?._id || p.user?.id) === String(viewingUserId)));
                                }
                            } catch { /* ignore for now */ }

                            // fetch follower/following counts if not provided
                            try {
                                const f = await import('../lib/api');
                                const [fCount, foCount] = await Promise.all([f.getFollowersCount(String(viewingUserId)), f.getFollowingCount(String(viewingUserId))]);
                                if (mounted) {
                                    setFollowersCount(Number(fCount || 0));
                                    setFollowingCount(Number(foCount || 0));
                                }
                            } catch { /* ignore */ }
                        }
                    } catch { /* ignore */ }
                    // cache own profile id for subsequent requests to avoid refetch
                    if (!viewingUserId) {
                        const derived = profileData?.user?._id || profileData?.user?.id || null;
                        if (derived) setOwnProfileId(String(derived));
                    }
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
    }, [viewingUserId, ownProfileId, routeUserId, routeStartupDetailsId, src]);

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
                let userId = viewingUserId || ownProfileId || null;
                // If normalized data already has follower counts (from server), use them
                // and skip the separate follower/following API calls which can overwrite
                // the correct server-provided value.
                if (src && typeof src.stats?.followers === 'number') {
                    if (mounted) {
                        setFollowersCount(Number(src.stats.followers || 0));
                        setFollowingCount(Number(src.stats?.following || 0));
                    }
                    return;
                }
                if (!userId) {
                    try {
                        const stored = await AsyncStorage.getItem('user');
                        if (stored) {
                            const u = JSON.parse(stored);
                            const derived = u && (u._id || u.id);
                            if (derived) {
                                userId = String(derived);
                                if (!ownProfileId) setOwnProfileId(userId);
                            }
                        }
                    } catch (e) {
                        console.warn('Profile: failed to parse stored user', e);
                    }
                }
                if (!userId) return;

                const [fCount, foCount] = await Promise.all([getFollowersCount(String(userId)), getFollowingCount(String(userId))]);
                console.debug('Profile: followers/following raw', { fCount, foCount, userId });
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
    }, [viewingUserId, ownProfileId, src]);

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
                <ProfileHeader name={src.name} onOpenSettings={() => setLeftDrawerOpen(true)} onCreate={onCreatePost} onBack={onClose} theme={theme} />

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
                                            const resp: any = await api.followUser(String(viewingUserId));
                                            if (resp && typeof resp.followersCount === 'number') setFollowersCount(resp.followersCount);
                                        } else {
                                            const resp: any = await api.unfollowUser(String(viewingUserId));
                                            if (resp && typeof resp.followersCount === 'number') setFollowersCount(resp.followersCount);
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

                        <ProfilePager posts={posts} postsLoading={postsLoading} theme={theme} onPostPress={onPostPress} />
                    </>
                )}
            </ScrollView>
            {leftDrawerOpen && <SettingsOverlay src={src} theme={theme} onClose={() => setLeftDrawerOpen(false)} />}
        </View>
    );
};

// styles are imported from ./profile/Profile.styles

export default Profile;
