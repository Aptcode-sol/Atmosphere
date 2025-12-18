import React, { useState, useContext, useEffect } from 'react';
/* eslint-disable react-native/no-inline-styles */
import { View, Text, ScrollView, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import ThemedRefreshControl from '../components/ThemedRefreshControl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfile, getFollowersCount, getFollowingCount, getStartupProfile, getUserReels } from '../lib/api';
import { getImageSource } from '../lib/image';
import ProfileHeader from './profile/ProfileHeader';
import ProfilePager from './profile/ProfilePager';
import SettingsOverlay from './profile/SettingsOverlay';
import styles from './profile/Profile.styles';
import { NavigationRouteContext } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import VerifiedBadge from '../components/VerifiedBadge';

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
            name: details.companyName || user.fullName || user.username || 'Unknown',
            username: user.username ? `${user.username}` : '',
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
            verified: user.verified || details.verified || false,
            profileSetupComplete: user.profileSetupComplete,
            onboardingStep: user.onboardingStep,
        };
    }

    // For investors
    if ((primaryRole === 'investor') && details) {
        return {
            name: user.fullName || user.username || 'Unknown',
            username: user.username ? `${user.username}` : '',
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
            verified: user.verified || false,
            profileSetupComplete: user.profileSetupComplete,
            onboardingStep: user.onboardingStep,
        };
    }
    // For personal accounts
    return {
        name: user.displayName || user.username || 'Unknown',
        username: user.username ? `${user.username}` : '',
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
        verified: user.verified || false,
        profileSetupComplete: user.profileSetupComplete,
        onboardingStep: user.onboardingStep,
    };
};

type RouteKey = 'home' | 'search' | 'notifications' | 'chats' | 'reels' | 'profile' | 'topstartups' | 'trade' | 'jobs' | 'meetings' | 'setup';

const Profile = ({ onNavigate, userId: propUserId, onClose, onCreatePost, onPostPress, onReelSelect }: { onNavigate?: (route: RouteKey) => void; userId?: string | null; onClose?: () => void; onCreatePost?: () => void; onPostPress?: (postId: string) => void; onReelSelect?: (reelId: string, userId: string) => void }) => {
    const { theme } = useContext(ThemeContext);
    const [data, setData] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
    const [ownProfileId, setOwnProfileId] = useState<string | null>(null);
    const [accountType, setAccountType] = useState<'investor' | 'startup' | 'personal'>('personal');
    const routeCtx: any = useContext(NavigationRouteContext) as any | undefined;
    const routeUserId = routeCtx?.params?.userId || null;
    const routeStartupDetailsId = routeCtx?.params?.startupDetailsId || null;
    const viewingUserId = propUserId || routeUserId || null;

    const getCacheKeys = (targetId: string | null) => {
        const suffix = targetId ? targetId : 'ME';
        return {
            DATA: `ATMOSPHERE_PROFILE_DATA_${suffix}`,
            POSTS: `ATMOSPHERE_PROFILE_POSTS_${suffix}`
        };
    };

    const [refreshing, setRefreshing] = useState(false);
    const [forceUpdate, setForceUpdate] = useState(0); // Trigger to re-run effects

    // 1. Profile Data Effect
    useEffect(() => {
        let mounted = true;
        let cachedData: any = null;

        (async () => {
            // Determine ID for cache key purposes
            const targetId = viewingUserId || routeUserId || (routeStartupDetailsId ? `SD_${routeStartupDetailsId}` : null);
            const { DATA: CACHE_KEY } = getCacheKeys(targetId);

            // 1. Try Load Cache first (only if not refreshing forcefully)
            try {
                const cached = await AsyncStorage.getItem(CACHE_KEY);
                if (cached && mounted && !refreshing) {
                    cachedData = JSON.parse(cached);
                    setData(cachedData);
                    setLoading(false);
                }
            } catch { /* ignore */ }

            // 2. Fetch fresh data from network
            try {
                let profileData: any;
                if (routeStartupDetailsId) {
                    profileData = await getStartupProfile(String(routeStartupDetailsId));
                } else if (viewingUserId) {
                    // Try to get any profile (startup or regular user)
                    const api = await import('../lib/api');
                    if (api.getAnyUserProfile) {
                        profileData = await api.getAnyUserProfile(String(viewingUserId));
                    } else {
                        profileData = await getStartupProfile(String(viewingUserId));
                    }
                } else {
                    profileData = await getProfile();
                }

                if (mounted) {
                    // Ensure profileData.user is a full object
                    try {
                        if (profileData && profileData.user && typeof profileData.user === 'string') {
                            const api = await import('../lib/api');
                            const fetched = await api.getUserByIdentifier(String(profileData.user));
                            if (fetched) profileData.user = fetched;
                        }
                    } catch { /* ignore */ }

                    const normalized = normalizeProfile(profileData);
                    const finalData = normalized || mockData;

                    // Only update if data is different to avoid re-render flicker
                    const dataChanged = JSON.stringify(finalData) !== JSON.stringify(cachedData);
                    if (dataChanged) {
                        setData(finalData);
                        // Save to Cache
                        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(finalData)).catch(() => { });
                    }

                    if (!viewingUserId) {
                        const derived = profileData?.user?._id || profileData?.user?.id || null;
                        if (derived) setOwnProfileId(String(derived));
                        // Extract accountType from user roles
                        const roles = profileData?.user?.roles || [];
                        const primaryRole = roles[0] || profileData?.user?.accountType || 'personal';
                        setAccountType(primaryRole as 'investor' | 'startup' | 'personal');
                    }
                }
            } catch {
                if (mounted && !data && !cachedData) setData(mockData); // Only fallback if no data
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewingUserId, ownProfileId, routeUserId, routeStartupDetailsId, forceUpdate]);

    // format helpers removed (not used in mobile layout)

    // Only use mockData as absolute fallback after loading completes with no data
    const src = data || (loading ? null : mockData);
    const [posts, setPosts] = useState<any[]>([]);
    const [postsLoading, setPostsLoading] = useState(true);
    const [reels, setReels] = useState<any[]>([]);
    const [reelsLoading, setReelsLoading] = useState(true);
    const [followersCount, setFollowersCount] = useState<number | null>(null);
    const [followingCount, setFollowingCount] = useState<number | null>(null);
    const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
    const [followLoading, setFollowLoading] = useState(false);

    // 2. Posts Effect
    useEffect(() => {
        let mounted = true;
        (async () => {
            const targetId = viewingUserId || routeUserId || null;
            const { POSTS: CACHE_KEY } = getCacheKeys(targetId);

            setPostsLoading(true);

            // Try Cache
            try {
                const cached = await AsyncStorage.getItem(CACHE_KEY);
                if (cached && mounted && !refreshing) {
                    setPosts(JSON.parse(cached));
                    setPostsLoading(false);
                }
            } catch { /* ignore */ }

            try {
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
                if (mounted) {
                    setPosts((all || []));
                    AsyncStorage.setItem(CACHE_KEY, JSON.stringify(all || [])).catch(() => { });
                }
            } catch {
                if (mounted && posts.length === 0) setPosts([]);
            } finally {
                if (mounted) setPostsLoading(false);
            }
        })();
        return () => { mounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewingUserId, forceUpdate]);

    // 3. Reels Effect
    useEffect(() => {
        let mounted = true;
        (async () => {
            const targetId = viewingUserId || ownProfileId || null;
            if (!targetId && !ownProfileId) {
                // Try to get own user id
                try {
                    const stored = await AsyncStorage.getItem('user');
                    if (stored) {
                        const u = JSON.parse(stored);
                        const derivedId = u && (u._id || u.id);
                        if (derivedId && mounted) {
                            setOwnProfileId(String(derivedId));
                        }
                    }
                } catch { /* ignore */ }
            }

            setReelsLoading(true);
            try {
                const userId = targetId || ownProfileId;
                if (userId) {
                    const userReels = await getUserReels(String(userId));
                    if (mounted) {
                        setReels(userReels || []);
                    }
                }
            } catch (err) {
                console.warn('Failed to fetch reels:', err);
                if (mounted) setReels([]);
            } finally {
                if (mounted) setReelsLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [viewingUserId, ownProfileId, forceUpdate]);

    const onRefresh = async () => {
        setRefreshing(true);
        setForceUpdate(prev => prev + 1);
        // Wait a bit to simulate refresh since effects run asynchronously
        setTimeout(() => setRefreshing(false), 1500);
    };

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
            <ScrollView
                style={[styles.container, { backgroundColor: theme.background }]}
                contentContainerStyle={[styles.contentContainer]}
                refreshControl={
                    <ThemedRefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        progressViewOffset={0}
                    />
                }
            >
                <ProfileHeader name={loading ? '' : (src?.username || '')} onOpenSettings={() => setLeftDrawerOpen(true)} onCreate={onCreatePost} onBack={onClose} theme={theme} />

                {/* Setup is opened via parent navigation (LandingPage route 'setup') */}

                {loading ? (
                    <View style={styles.loadingWrap}>
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                ) : (
                    <>
                        <View style={styles.profileHeader}>
                            <View style={styles.avatarWrap}>
                                {src?.logo && !src.logo.includes('placeholder.com') ? (
                                    <Image source={getImageSource(src.logo)} style={styles.avatarLarge} onError={(e) => { console.warn('Profile avatar load error', e.nativeEvent, src.logo); }} />
                                ) : (
                                    <View style={[styles.avatarLarge, { alignItems: 'center', justifyContent: 'center' }]}>
                                        <Text style={{ color: '#fff', fontSize: 28, fontWeight: '700' }}>{(src?.name || 'U').charAt(0).toUpperCase()}</Text>
                                    </View>
                                )}
                            </View>
                            <View style={{ flex: 1, justifyContent: 'center', marginLeft: 12 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                    <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700' }}>{src?.name}</Text>
                                    {src?.verified && <VerifiedBadge size={18} />}
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingRight: 16 }}>
                                    <View style={styles.statCol}>
                                        <Text style={[styles.statNum, { color: theme.text }]}>{posts.length}</Text>
                                        <Text style={[styles.statLabel, { color: theme.placeholder }]}>posts</Text>
                                    </View>
                                    <View style={styles.statCol}>
                                        <Text style={[styles.statNum, { color: theme.text }]}>{followersCount ?? src?.stats?.followers ?? 0}</Text>
                                        <Text style={[styles.statLabel, { color: theme.placeholder }]}>followers</Text>
                                    </View>
                                    <View style={styles.statCol}>
                                        <Text style={[styles.statNum, { color: theme.text }]}>{followingCount ?? 0}</Text>
                                        <Text style={[styles.statLabel, { color: theme.placeholder }]}>following</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
                            {src?.location ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                    <Ionicons name="location-outline" size={16} color={theme.placeholder} style={{ marginRight: 2 }} />
                                    <Text style={{ color: theme.placeholder, fontSize: 13 }}>{src.location}</Text>
                                </View>
                            ) : null}
                            <Text style={{ color: theme.text, fontSize: 14, lineHeight: 20, marginLeft: 5 }}>
                                {src?.tagline && src?.description && src?.tagline !== src?.description
                                    ? `${src.tagline} | ${src.description}`
                                    : (src?.tagline || src?.description || '')}
                            </Text>
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
                                <Text style={[styles.setupPillText, { color: theme.text }]}>
                                    {src?.profileSetupComplete ? 'Edit Profile' : 'Setup Profile'}
                                </Text>
                            </TouchableOpacity>
                        )}

                        <ProfilePager
                            posts={posts}
                            reels={reels}
                            postsLoading={postsLoading}
                            reelsLoading={reelsLoading}
                            theme={theme}
                            onPostPress={onPostPress}
                            onReelPress={(reelId) => {
                                if (onReelSelect && (viewingUserId || ownProfileId)) {
                                    onReelSelect(reelId, String(viewingUserId || ownProfileId));
                                } else {
                                    onNavigate?.('reels');
                                }
                            }}
                        />
                    </>
                )}
            </ScrollView>
            {leftDrawerOpen && <SettingsOverlay src={src} theme={theme} accountType={accountType} onClose={() => setLeftDrawerOpen(false)} />}
        </View>
    );
};

// styles are imported from ./profile/Profile.styles

export default Profile;
