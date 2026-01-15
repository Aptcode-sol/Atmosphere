import React, { useState, useContext, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Animated } from 'react-native';
import { ThemeContext } from '../../contexts/ThemeContext';
import { NavigationContext } from '@react-navigation/native';
import { followUser, unfollowUser, likePost, unlikePost, likeStartup, unlikeStartup, savePost, unsavePost, crownStartup, uncrownStartup } from '../../lib/api';
import { getImageSource } from '../../lib/image';
import CommentsOverlay from '../CommentsOverlay';
import { useAlert } from '../CustomAlert';
import ShareModal from '../ShareModal';
import { Heart, Crown, MessageCircle, Send, Bookmark } from 'lucide-react-native';

import { StartupPostProps, AlertConfig } from './types';
import { styles } from './styles';
import { formatCurrency, getFundingPercent, getContentId, checkIsInvestor, isStartupCard } from './utils';

const StartupPost = ({ post, company, currentUserId, onOpenProfile }: StartupPostProps) => {
    const { showAlert } = useAlert();
    const companyData = post || company;
    useContext(ThemeContext);

    const [liked, setLiked] = useState(Boolean((companyData as any)?.likedByCurrentUser));
    const [isInvestor, setIsInvestor] = useState(false);
    const [crowned, setCrowned] = useState(Boolean((companyData as any)?.crownedByCurrentUser));
    const [crownLoading, setCrownLoading] = useState(false);
    const stats = companyData?.stats || { likes: 0, comments: 0, crowns: 0, shares: 0 };
    const [likes, setLikes] = useState<number>(stats.likes || 0);
    const [crownsCount, setCrownsCount] = useState<number>(stats.crowns || 0);
    const [commentsCount, setCommentsCount] = useState<number>(stats.comments || 0);

    const [commentsOverlayVisible, setCommentsOverlayVisible] = useState(false);
    const [likeLoading, setLikeLoading] = useState(false);
    const [followed, setFollowed] = useState(Boolean((companyData as any)?.isFollowing));
    const [followLoading, setFollowLoading] = useState(false);
    const [saved, setSaved] = useState(Boolean((companyData as any)?.isSaved));
    const [savedId, setSavedId] = useState<string | null>((companyData as any)?.savedId || null);
    const [saveLoading, setSaveLoading] = useState(false);

    const [shareModalVisible, setShareModalVisible] = useState(false);

    const navigation = useContext(NavigationContext) as any | undefined;

    useEffect(() => {
        checkIsInvestor().then(result => setIsInvestor(result));
    }, [companyData]);

    useEffect(() => {
        const s = (companyData as any)?.stats || {};
        if (typeof s.likes === 'number') setLikes(s.likes);
        else if (typeof s.likesCount === 'number') setLikes(s.likesCount);
        if (typeof s.crowns === 'number') setCrownsCount(s.crowns);
        else if (typeof s.crownsCount === 'number') setCrownsCount(s.crownsCount);
        if (typeof s.comments === 'number') setCommentsCount(s.comments);
        else if (typeof s.commentsCount === 'number') setCommentsCount(s.commentsCount);
        if (typeof (companyData as any)?.likedByCurrentUser === 'boolean') setLiked((companyData as any).likedByCurrentUser);
        if (typeof (companyData as any)?.crownedByCurrentUser === 'boolean') setCrowned((companyData as any).crownedByCurrentUser);
        if (typeof (companyData as any)?.isFollowing === 'boolean') setFollowed((companyData as any).isFollowing);
        if (typeof (companyData as any)?.isSaved === 'boolean') setSaved((companyData as any).isSaved);
    }, [companyData]);

    if (!companyData) return null;

    const contentId = getContentId(companyData);
    const fundingPercent = getFundingPercent(companyData.fundingRaised || 0, companyData.fundingNeeded || 0);

    console.log('StartupPost funding data:', {
        name: companyData.name,
        fundingRaised: companyData.fundingRaised,
        fundingNeeded: companyData.fundingNeeded,
        fundingPercent: fundingPercent
    });

    // Double-tap to like
    const lastTap = useRef<number>(0);
    const heartScale = useRef(new Animated.Value(0)).current;
    const heartOpacity = useRef(new Animated.Value(0)).current;

    const handleDoubleTap = () => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;
        if (now - lastTap.current < DOUBLE_TAP_DELAY) {
            // Double tap detected - like if not already liked
            if (!liked) {
                toggleLike();
            }
            // Reset values first
            heartScale.setValue(0);
            heartOpacity.setValue(0);

            // Instagram-style heart animation
            Animated.sequence([
                // Quick pop in
                Animated.parallel([
                    Animated.spring(heartScale, {
                        toValue: 1.2,
                        useNativeDriver: true,
                        tension: 100,
                        friction: 6,
                    }),
                    Animated.timing(heartOpacity, { toValue: 1, duration: 50, useNativeDriver: true }),
                ]),
                // Brief hold
                Animated.delay(0),
                // Quick fade out
                Animated.parallel([
                    Animated.timing(heartScale, { toValue: 0.9, duration: 50, useNativeDriver: true }),
                    Animated.timing(heartOpacity, { toValue: 0, duration: 50, useNativeDriver: true }),
                ]),
            ]).start();
        }
        lastTap.current = now;
    };

    const toggleLike = async () => {
        if (likeLoading) return;
        setLikeLoading(true);
        const prev = liked;
        setLiked(!prev);
        setLikes(l => prev ? Math.max(0, l - 1) : l + 1);
        try {
            if (isStartupCard(companyData)) {
                prev ? await unlikeStartup(contentId) : await likeStartup(contentId);
            } else {
                prev ? await unlikePost(contentId) : await likePost(contentId);
            }
        } catch {
            setLiked(prev);
            setLikes(l => prev ? l + 1 : Math.max(0, l - 1));
        } finally {
            setLikeLoading(false);
        }
    };

    const toggleCrown = async () => {
        if (!isInvestor) {
            showAlert('Investors Only', 'Only investors can crown startups');
            return;
        }
        if (crownLoading) return;
        const prev = crowned;
        setCrowned(!prev);
        setCrownsCount(c => !prev ? c + 1 : Math.max(0, c - 1));
        setCrownLoading(true);
        try {
            prev ? await uncrownStartup(contentId) : await crownStartup(contentId);
        } catch {
            setCrowned(prev);
            setCrownsCount(c => prev ? c + 1 : Math.max(0, c - 1));
        } finally {
            setCrownLoading(false);
        }
    };

    const toggleSave = async () => {
        if (saveLoading) return;
        setSaveLoading(true);
        const prevSaved = saved;
        const prevSavedId = savedId;
        setSaved(!prevSaved);
        try {
            if (!prevSaved) {
                const result = await savePost(contentId);
                if (result?._id) setSavedId(result._id);
            } else if (prevSavedId) {
                await unsavePost(prevSavedId);
                setSavedId(null);
            }
        } catch {
            setSaved(prevSaved);
            setSavedId(prevSavedId);
        } finally {
            setSaveLoading(false);
        }
    };

    const toggleFollow = async () => {
        if (followLoading) return;
        const newState = !followed;
        setFollowed(newState);
        setFollowLoading(true);
        try {
            const targetId = (companyData as any).userId || (companyData as any).user || (companyData as any).originalId || companyData.id;
            if (!targetId) throw new Error('Missing target user id');
            newState ? await followUser(String(targetId)) : await unfollowUser(String(targetId));
        } catch (err: any) {
            if (err?.message?.toLowerCase().includes('already following')) setFollowed(true);
            else { setFollowed(!newState); showAlert('Error', err?.message || 'Could not update follow status'); }
        } finally {
            setFollowLoading(false);
        }
    };

    const handleOpenProfile = () => {
        const targetId = (companyData as any).userId || (companyData as any).user || null;
        const startupDetailsId = (companyData as any).startupDetailsId || (companyData as any).originalId || (companyData as any).id || null;
        const resolvedUserId = targetId ? String(targetId) : null;
        const resolvedStartupId = startupDetailsId ? String(startupDetailsId) : null;

        if (onOpenProfile && targetId) {
            onOpenProfile(resolvedUserId || resolvedStartupId || '');
            return;
        }
        if (navigation) {
            const params: any = { backToHome: true };
            if (resolvedUserId) params.userId = resolvedUserId;
            else if (resolvedStartupId) params.startupDetailsId = resolvedStartupId;
            navigation.push?.('Profile', params) || navigation.navigate?.('Profile', params);
        }
    };

    return (
        <>
            <View style={[styles.card, styles.cardBackground]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity style={styles.headerLeftRow} activeOpacity={0.8} onPress={handleOpenProfile}>
                        <Image source={getImageSource(companyData.profileImage)} style={styles.avatar} />
                        <View style={styles.headerLeft}>
                            <View style={styles.rowCenter}>
                                <Text style={[styles.companyName, styles.whiteText]}>{companyData.name}</Text>
                            </View>
                            {companyData.verified && <Text style={styles.verifiedSubtext}>Verified startup</Text>}
                        </View>
                    </TouchableOpacity>
                    {contentId !== String(currentUserId) && companyData.userId !== currentUserId && (
                        <TouchableOpacity onPress={toggleFollow} style={[styles.followBtn, followed && styles.followBtnActive]} disabled={followLoading}>
                            <Text style={[styles.followBtnText, followed && styles.followBtnTextActive]}>{followed ? 'Following' : 'Follow'}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <CommentsOverlay
                    startupId={contentId}
                    visible={commentsOverlayVisible}
                    onClose={() => setCommentsOverlayVisible(false)}
                    onCommentAdded={(newCount?: number) => setCommentsCount(c => typeof newCount === 'number' ? newCount : c + 1)}
                    onCommentDeleted={(newCount?: number) => setCommentsCount(c => typeof newCount === 'number' ? newCount : Math.max(0, c - 1))}
                />

                <TouchableOpacity style={styles.imageWrap} activeOpacity={0.9} onPress={handleDoubleTap}>
                    <Image source={getImageSource(companyData.profileImage)} style={styles.mainImage} resizeMode="cover" />
                    <Animated.View style={[styles.doubleTapHeart, { opacity: heartOpacity, transform: [{ scale: heartScale }] }]} pointerEvents="none">
                        <Heart size={70} color="#fff" fill="#fff" strokeWidth={0} />
                    </Animated.View>
                </TouchableOpacity>

                <View style={styles.actionsRow}>
                    <View style={styles.statItemRow}>
                        <TouchableOpacity style={styles.statItem} onPress={toggleLike}>
                            <Heart size={24} color={liked ? '#ef4444' : '#fff'} fill={liked ? '#ef4444' : 'none'} />
                            <Text style={styles.statCount}>{likes}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.statItem} onPress={toggleCrown}>
                            <Crown size={24} color={crowned ? '#eab308' : '#fff'} fill={crowned ? '#eab308' : 'none'} />
                            <Text style={styles.statCount}>{crownsCount}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.statItem} onPress={() => setCommentsOverlayVisible(true)}>
                            <MessageCircle size={24} color="#fff" />
                            <Text style={styles.statCount}>{commentsCount}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.statItem} onPress={() => setShareModalVisible(true)}>
                            <Send size={24} color="#fff" />
                            <Text style={styles.statCount}>{stats.shares}</Text>
                        </TouchableOpacity>
                        <View style={styles.flex1} />
                        <TouchableOpacity onPress={toggleSave}>
                            <Bookmark size={24} color="#fff" fill={saved ? '#fff' : 'none'} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.body}>
                    <Text style={styles.whatsLabel}>WHAT'S {companyData.name.toUpperCase()}</Text>
                    <Text style={styles.descriptionFull}>{companyData.description}</Text>
                    {/* <View style={styles.stageRow}>
                        <Text style={styles.stageText}>STAGE : <Text style={styles.stageValue}>{String(companyData.stage || 'MVP LAUNCHED')}</Text></Text>
                    </View> */}
                    <View style={styles.pillsRow}>
                        <View style={styles.pill}><Text style={styles.pillText}>Rvnu generating</Text></View>
                        <View style={styles.pill}><Text style={styles.pillText}>Rounds : {companyData.rounds ?? 0}</Text></View>
                        <View style={styles.pill}><Text style={styles.pillText}>Age : {companyData.age ?? 0} yr</Text></View>
                    </View>
                    <Text style={styles.currentRound}>Current round : <Text style={styles.currentRoundValue}>{String(companyData.stage || 'Seed')}</Text></Text>
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

            <ShareModal contentId={contentId} type="startup" visible={shareModalVisible} onClose={() => setShareModalVisible(false)} contentTitle={companyData.name} contentImage={companyData.profileImage} contentOwner={companyData.displayName || companyData.name} />
        </>
    );
};

export default StartupPost;
