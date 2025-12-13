/* eslint-disable react-native/no-inline-styles */
import React, { useState, useContext } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { NavigationContext } from '@react-navigation/native';
import { followUser, unfollowUser, likePost, unlikePost, likeStartup, unlikeStartup } from '../lib/api';
import { getImageSource } from '../lib/image';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import CommentsOverlay from './CommentsOverlay';
import { crownStartup, uncrownStartup } from '../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

type StartupCard = {
    id: string;
    name: string;
    displayName: string;
    verified: boolean;
    profileImage: string;
    description: string;
    stage: string;
    rounds: number;
    age: number;
    fundingRaised: number;
    fundingNeeded: number;
    stats?: { likes: number; comments: number; crowns: number; shares: number };
};

const StartupPost = ({ post, company, currentUserId, onOpenProfile }: { post?: StartupCard; company?: StartupCard; currentUserId?: string | null; onOpenProfile?: (id: string) => void }) => {
    const companyData = post || company;
    useContext(ThemeContext); // keep theme context in case other components rely on it
    const [liked, setLiked] = useState(Boolean((companyData as any).likedByCurrentUser));
    const [isInvestor, setIsInvestor] = useState(false);
    const [crowned, setCrowned] = useState(Boolean((companyData as any).crownedByCurrentUser));
    const [crownLoading, setCrownLoading] = useState(false);
    const stats = companyData?.stats || { likes: 0, comments: 0, crowns: 0, shares: 0 };
    const [likes, setLikes] = useState<number>(stats.likes || 0);
    const [crownsCount, setCrownsCount] = useState<number>(stats.crowns || 0);
    const [commentsCount, setCommentsCount] = useState<number>(stats.comments || 0);

    const [commentsOverlayVisible, setCommentsOverlayVisible] = useState(false);
    const [likeLoading, setLikeLoading] = useState(false);
    const [followed, setFollowed] = useState(Boolean((companyData as any).isFollowing));
    const [followLoading, setFollowLoading] = useState(false);

    useEffect(() => {
        // follow and liked state are provided by the feed as flags (likedByCurrentUser, isFollowing)
        // check stored role for investor privileges
        (async () => {
            try {
                const role = await AsyncStorage.getItem('role');
                if (role === 'investor') { setIsInvestor(true); return; }
                // fallback: check stored user object for roles array
                const userJson = await AsyncStorage.getItem('user');
                if (userJson) {
                    try {
                        const userObj = JSON.parse(userJson);
                        if (Array.isArray(userObj.roles) && userObj.roles.includes('investor')) {
                            setIsInvestor(true);
                        }
                    } catch { /* ignore parse errors */ }
                }
            } catch { /* ignore */ }
        })();
        // no per-item checks — initial state comes from the feed
        return () => { /* cleanup */ };
    }, [companyData]);

    // Keep local counts in sync if the parent feed updates the item
    useEffect(() => {
        const s = (companyData as any)?.stats || {};
        if (typeof s.likes === 'number') setLikes(s.likes);
        else if (typeof s.likesCount === 'number') setLikes(s.likesCount);
        if (typeof s.crowns === 'number') setCrownsCount(s.crowns);
        else if (typeof s.crownsCount === 'number') setCrownsCount(s.crownsCount);
        if (typeof s.comments === 'number') setCommentsCount(s.comments);
        else if (typeof s.commentsCount === 'number') setCommentsCount(s.commentsCount);
        if (typeof (companyData as any).likedByCurrentUser === 'boolean') setLiked((companyData as any).likedByCurrentUser);
        if (typeof (companyData as any).crownedByCurrentUser === 'boolean') setCrowned((companyData as any).crownedByCurrentUser);
        if (typeof (companyData as any).isFollowing === 'boolean') setFollowed((companyData as any).isFollowing);
    }, [companyData]);

    const navigation = useContext(NavigationContext) as any | undefined;

    if (!companyData) return null;

    const toggleLike = async () => {
        if (likeLoading) return;
        setLikeLoading(true);
        const prev = liked;
        setLiked(!prev);
        setLikes(l => prev ? Math.max(0, l - 1) : l + 1);
        try {
            // Determine if this is a startup card by structure (Home passes startups as `post` prop)
            const isStartupCard = Boolean((companyData as any).fundingRaised || (companyData as any).fundingNeeded || (companyData as any).stage);
            const id = String((companyData as any).originalId || (companyData as any).id || (companyData as any).userId || (companyData as any).user);
            if (isStartupCard) {
                if (!prev) {
                    await likeStartup(id);
                } else {
                    await unlikeStartup(id);
                }
            } else {
                if (!prev) {
                    await likePost(id);
                } else {
                    await unlikePost(id);
                }
            }
            // Don't update state from API response - trust optimistic update
        } catch {
            // revert optimistic on error
            setLiked(prev);
            setLikes(l => prev ? l + 1 : Math.max(0, l - 1));
        }
        finally {
            setLikeLoading(false);
        }
    };

    const toggleCrown = async () => {
        if (!isInvestor) { Alert.alert('Not allowed', 'Only investors can crown profiles'); return; }
        if (crownLoading) return;
        const id = String((companyData as any).originalId || (companyData as any).id || (companyData as any).userId || (companyData as any).user);
        const prev = crowned;
        // optimistic update
        setCrowned(!prev);
        setCrownsCount(c => !prev ? c + 1 : Math.max(0, c - 1));
        setCrownLoading(true);
        try {
            if (!prev) {
                await crownStartup(id);
            } else {
                await uncrownStartup(id);
            }
            // Don't update state from API response - trust optimistic update
        } catch {
            // revert optimistic on error
            setCrowned(prev);
            setCrownsCount(c => prev ? c + 1 : Math.max(0, c - 1));
        } finally {
            setCrownLoading(false);
        }
    };



    const totalFunding = (companyData.fundingRaised || 0) + (companyData.fundingNeeded || 0);
    const fundingPercent = totalFunding > 0 ? ((companyData.fundingRaised || 0) / totalFunding) * 100 : 0;

    const formatCurrency = (num: number) => {
        if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
        return `$${num}`;
    };

    return (
        <View style={[styles.card, { backgroundColor: '#070707', borderColor: '#0b0b0b' }]}>
            <View style={styles.headerTop}>
                <TouchableOpacity style={styles.headerLeftRow} activeOpacity={0.8} onPress={() => {
                    try {
                        const targetId = (companyData as any).userId || (companyData as any).user || null;
                        const startupDetailsId = (companyData as any).startupDetailsId || (companyData as any).originalId || (companyData as any).id || null;
                        const resolvedUserId = targetId ? String(targetId) : null;
                        const resolvedStartupId = startupDetailsId ? String(startupDetailsId) : null;
                        if (onOpenProfile && targetId) {
                            const chosen = resolvedUserId || resolvedStartupId || '';
                            console.debug('StartupPost: onOpenProfile chosen id', chosen, { resolvedUserId, resolvedStartupId, companyData });
                            onOpenProfile(chosen);
                            return;
                        }
                        if (navigation) {
                            const params: any = { backToHome: true };
                            if (resolvedUserId) params.userId = resolvedUserId;
                            else if (resolvedStartupId) params.startupDetailsId = resolvedStartupId;
                            if (typeof navigation.push === 'function') {
                                navigation.push('Profile', params);
                            } else if (typeof navigation.navigate === 'function') {
                                navigation.navigate('Profile', params);
                            }
                            return;
                        }
                        console.warn('StartupPost: no navigation available to open profile for', targetId);
                    } catch (err) {
                        console.warn('StartupPost: navigation error', err);
                    }
                }}>
                    <Image source={getImageSource(companyData.profileImage)} style={styles.avatar} onError={(e) => { console.warn('StartupPost avatar error', e.nativeEvent, companyData.profileImage); }} />
                    <View style={styles.headerLeft}>
                        <Text style={[styles.companyName, { color: '#fff' }]}>{companyData.name}</Text>
                        {companyData.verified && <Text style={styles.verifiedSmall}>Verified startup</Text>}
                    </View>
                </TouchableOpacity>
                {((companyData as any).userId || (companyData as any).user || companyData.id) !== String(currentUserId) && (
                    <TouchableOpacity
                        onPress={async () => {
                            if (followLoading) return;
                            const newState = !followed;
                            setFollowed(newState); // optimistic
                            setFollowLoading(true);
                            try {
                                const targetId = (companyData as any).userId || (companyData as any).user || (companyData as any).originalId || companyData.id;
                                if (!targetId) throw new Error('Missing target user id');
                                if (newState) {
                                    await followUser(String(targetId));
                                } else {
                                    await unfollowUser(String(targetId));
                                }
                            } catch (err: any) {
                                // If server says already following, reconcile UI to true
                                if (err && err.message && err.message.toLowerCase().includes('already following')) {
                                    setFollowed(true);
                                } else {
                                    // revert optimistic
                                    setFollowed(!newState);
                                    Alert.alert('Error', err?.message || 'Could not update follow status');
                                }
                            } finally {
                                setFollowLoading(false);
                            }
                        }}
                        style={[styles.followBtn, followed && styles.followBtnActive]}
                        disabled={followLoading}
                    >
                        <Text style={[styles.followBtnText, followed && styles.followBtnTextActive]}>{followed ? 'Following' : 'Follow'}</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Comments overlay is used instead of inline input */}
            <CommentsOverlay
                startupId={String((companyData as any).originalId || (companyData as any).id || (companyData as any).userId || (companyData as any).user)}
                visible={commentsOverlayVisible}
                onClose={() => setCommentsOverlayVisible(false)}
                onCommentAdded={(newCount?: number) => {
                    if (typeof newCount === 'number') setCommentsCount(newCount);
                    else setCommentsCount(c => c + 1);
                }}
                onCommentDeleted={(newCount?: number) => {
                    if (typeof newCount === 'number') setCommentsCount(newCount);
                    else setCommentsCount(c => Math.max(0, c - 1));
                }}
            />

            <View style={styles.imageWrap}>
                <Image source={getImageSource(companyData.profileImage)} style={styles.mainImage} resizeMode="cover" onError={(e) => { console.warn('StartupPost main image error', e.nativeEvent, companyData.profileImage); }} />
            </View>

            <View style={styles.actionsRow}>
                <View style={styles.statItemRow}>
                    <TouchableOpacity style={styles.statItem} onPress={toggleLike}>
                        <Text style={[styles.heart, { color: liked ? '#e74c3c' : '#ddd' }]}>❤</Text>
                        <Text style={[styles.statCount, { color: '#ddd' }]}>{likes}</Text>
                    </TouchableOpacity>
                    <View style={styles.statItem}>
                        {isInvestor ? (
                            <TouchableOpacity onPress={toggleCrown} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={[styles.statIcon, { color: '#ffd700' }]}>👑</Text>
                                <Text style={[styles.statCount, { color: '#ddd' }]}>{crownsCount}</Text>
                            </TouchableOpacity>
                        ) : (
                            <>
                                <Text style={[styles.statIcon, { color: '#ddd' }]}>👑</Text>
                                <Text style={[styles.statCount, { color: '#ddd' }]}>{crownsCount}</Text>
                            </>
                        )}
                    </View>
                    <View style={styles.statItem}>
                        <TouchableOpacity onPress={() => setCommentsOverlayVisible(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={[styles.statIcon, { color: '#ddd' }]}>💬</Text>
                            <Text style={[styles.statCount, { color: '#ddd' }]}>{commentsCount}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.statItem}><Text style={[styles.statIcon, { color: '#ddd' }]}>📤</Text><Text style={[styles.statCount, { color: '#ddd' }]}>{stats.shares}</Text></View>
                </View>
            </View>

            <View style={styles.body}>
                <Text style={styles.whatsLabel}>WHAT'S {companyData.name.toUpperCase()}</Text>
                <Text style={styles.descriptionFull}>{companyData.description}</Text>

                <View style={styles.stageRow}>
                    <Text style={styles.stageText}>STAGE : <Text style={styles.stageValue}>{String(companyData.stage || 'MVP LAUNCHED')}</Text></Text>
                </View>

                <View style={styles.pillsRow}>
                    <View style={styles.pill}><Text style={styles.pillText}>Rvnu generating</Text></View>
                    <View style={styles.pill}><Text style={styles.pillText}>Rounds : {companyData.rounds ?? 0}</Text></View>
                    <View style={styles.pill}><Text style={styles.pillText}>Age : {companyData.age ?? 0} yr</Text></View>
                </View>

                <Text style={styles.currentRound}>Current round : <Text style={styles.currentRoundValue}>Series A</Text></Text>

                <View style={styles.fundingBarWrap}>
                    <View style={styles.fundingBarTrack}>
                        <View style={[styles.fundingFilled, { width: `${fundingPercent}%` }]} />
                    </View>
                    <View style={styles.fundingLabelsRow}>
                        <Text style={styles.filledLabel}>{formatCurrency(companyData.fundingRaised ?? 0)} Filled</Text>
                        <Text style={styles.totalLabel}>{formatCurrency(companyData.fundingNeeded ?? 0)}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderWidth: 1,
        borderRadius: 8,
        marginVertical: 8,
        overflow: 'hidden',
        marginHorizontal: 12
    },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
    headerLeftRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    headerLeft: { marginLeft: 10 },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#333', borderWidth: 2, borderColor: '#111' },
    followBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
    followBtnActive: { backgroundColor: '#111', borderColor: '#111' },
    followBtnText: { color: '#fff', fontWeight: '700' },
    followBtnTextActive: { color: '#fff' },
    companyName: { fontWeight: '700', fontSize: 16 },
    verifiedSmall: { color: '#bbb', fontSize: 12, marginTop: 2 },
    imageWrap: { paddingHorizontal: 12, paddingTop: 8 },
    mainImage: { width: '100%', height: 420, backgroundColor: '#222', borderRadius: 6 },
    actionsRow: { paddingHorizontal: 12, paddingTop: 12 },
    statItemRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    statCount: { fontSize: 12, fontWeight: '600' },
    heart: { fontSize: 18 },
    statIcon: { fontSize: 14 },
    body: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 16 },
    whatsLabel: { color: '#bbb', fontSize: 12, marginBottom: 8 },
    descriptionFull: { color: '#ddd', fontSize: 14, lineHeight: 20, marginBottom: 12 },
    stageRow: { marginTop: 8, marginBottom: 8 },
    stageText: { color: '#bbb', fontSize: 12 },
    stageValue: { color: '#fff', fontWeight: '700' },
    pillsRow: { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 12 },
    pill: { borderWidth: 1, borderColor: '#222', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#111' },
    pillText: { color: '#ddd', fontWeight: '700' },
    currentRound: { color: '#bbb', marginTop: 12, marginBottom: 8 },
    currentRoundValue: { color: '#fff', fontWeight: '700' },
    fundingBarWrap: { marginTop: 8 },
    fundingBarTrack: { height: 18, borderRadius: 10, backgroundColor: '#0f0f0f', overflow: 'hidden' },
    fundingFilled: { height: '100%', backgroundColor: '#888888' },
    fundingLabelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    filledLabel: { color: '#bbb' },
    totalLabel: { color: '#bbb' },
});

export default StartupPost;
