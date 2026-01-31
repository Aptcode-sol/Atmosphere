/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, StyleSheet, FlatList } from 'react-native';
import { Play, Video, Heart, Crown, MessageCircle, Send, Building2, Calendar, Globe, Users } from 'lucide-react-native';
import EncryptedStorage from 'react-native-encrypted-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { ENDPOINTS } from '../../lib/api/endpoints';
import { searchUsers } from '../../lib/api/users';
import { getImageSource } from '../../lib/image';

// Video Player Component
const StartupVideoPlayer = ({ videoUrl }: { videoUrl: string }) => {
    const VideoPlayer = require('react-native-video').default;
    const [paused, setPaused] = React.useState(true);
    return (
        <TouchableOpacity activeOpacity={1} onPress={() => setPaused(!paused)} style={{ flex: 1 }}>
            <VideoPlayer
                source={{ uri: videoUrl }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
                paused={paused}
                controls={false}
                onError={(e: any) => console.log('Video error', e)}
            />
            {paused && (
                <View style={{ ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                    <Play size={40} color="#fff" fill="#fff" />
                </View>
            )}
        </TouchableOpacity>
    );
};

type Props = {
    rawProfileData: any;
    profileData: any;
    screenW: number;
};

export default function StartupExpand({ rawProfileData, profileData, screenW }: Props) {
    // Use rawProfileData.details for full backend data (teamMembers, video, fundingRounds)
    const details = rawProfileData?.details || rawProfileData?.startupDetails || rawProfileData || profileData?.details || profileData || {};

    // Team Modal State
    const [showTeamModal, setShowTeamModal] = React.useState(false);
    const [newMemberName, setNewMemberName] = React.useState('');
    const [newMemberRole, setNewMemberRole] = React.useState('');
    const [savingMember, setSavingMember] = React.useState(false);

    // Search State
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchResults, setSearchResults] = React.useState<any[]>([]);
    const [isSearching, setIsSearching] = React.useState(false);
    const [selectedUserId, setSelectedUserId] = React.useState<string>('');
    const searchTimeout = React.useRef<any>(null);

    // Pitch Deck Request State
    const [pitchRequested, setPitchRequested] = React.useState(false);
    const [isOwner, setIsOwner] = React.useState(false);

    React.useEffect(() => {
        checkOwner();
        checkPitchStatus();
    }, [details, profileData]);

    const checkOwner = async () => {
        let uid = await EncryptedStorage.getItem('user_id');
        if (!uid) {
            try {
                const stored = await AsyncStorage.getItem('user');
                if (stored) {
                    const u = JSON.parse(stored);
                    uid = u._id || u.id;
                }
            } catch { }
        }

        // Robust check for owner ID
        // Case 1: details.user is an object with _id
        // Case 2: details.user is a string ID
        // Case 3: details.userId is present
        // Case 4: profileData.user is an object with _id
        let startupOwnerId = details.userId || (details.user && details.user._id) || details.user || (profileData && profileData.user && profileData.user._id) || (profileData && profileData.user);

        console.log('[StartupExpand] Checking owner:', {
            currentUserId: uid,
            startupOwnerId,
            startupId: details._id,
            detailsUserType: typeof details.user,
            profileDataUserType: typeof profileData?.user
        });

        if (uid && startupOwnerId) {
            const ownerIdStr = typeof startupOwnerId === 'object' ? startupOwnerId.toString() : String(startupOwnerId);
            const currentIdStr = String(uid);

            if (currentIdStr === ownerIdStr) {
                console.log('[StartupExpand] Owner Match Confirmed');
                setIsOwner(true);
            } else {
                console.log(`[StartupExpand] Mismatch: ${currentIdStr} !== ${ownerIdStr}`);
            }
        } else {
            console.log('[StartupExpand] Missing IDs for check');
        }
    };

    const checkPitchStatus = async () => {
        if (isOwner) return;
        const startupId = details._id || profileData?._id || details.id;
        if (!startupId) return;

        try {
            const token = await AsyncStorage.getItem('token');
            // Use CREATE_NOTIFICATION base as it points to /api/notifications
            const baseUrl = ENDPOINTS.CREATE_NOTIFICATION || 'http://10.0.2.2:5000/api/notifications';
            const res = await axios.get(`${baseUrl}/check-pitch-deck/${startupId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data && res.data.requested) {
                setPitchRequested(true);
            }
        } catch (error) {
            console.log('Error checking pitch status:', error);
        }
    };

    const handleSaveTeamMember = async () => {
        if (!newMemberName || !newMemberRole) return;
        setSavingMember(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const startupId = details._id || profileData._id || details.id;

            const newMember = {
                name: newMemberName,
                username: newMemberName, // fallback
                role: newMemberRole,
                userId: selectedUserId || ''
            };

            const currentMembers = [...(details.teamMembers || [])];
            currentMembers.push(newMember);

            await axios.put(`${ENDPOINTS.UPDATE_STARTUP_PROFILE || 'http://10.0.2.2:5000/api/startup/details'}/${startupId}`, {
                teamMembers: currentMembers
            }, { headers: { Authorization: `Bearer ${token}` } });

            setShowTeamModal(false);
            setNewMemberName('');
            setNewMemberRole('');
            setSearchQuery('');
            setSearchResults([]);
            setSelectedUserId('');
            Alert.alert('Success', 'Team member added! Pull to refresh.');
        } catch (error) {
            console.log('Error adding team member:', error);
            Alert.alert('Error', 'Failed to add team member');
        } finally {
            setSavingMember(false);
        }
    };

    const handleRequestPitchDeck = async () => {
        if (pitchRequested) return;
        try {
            // Get user from AsyncStorage (standard for this app)
            let uid = '';
            try {
                const stored = await AsyncStorage.getItem('user');
                if (stored) {
                    const u = JSON.parse(stored);
                    uid = u._id || u.id;
                }
            } catch { }

            if (!uid) {
                // Fallback to legacy
                uid = await EncryptedStorage.getItem('user_id') || '';
            }

            const startupOwnerId = details.userId || profileData?.userId || details.user || profileData?.user;
            if (!startupOwnerId) return;

            // Get token
            const token = await AsyncStorage.getItem('token');
            // Fallback just in case
            const legacyToken = token ? null : await EncryptedStorage.getItem('user_session');

            const finalToken = token || legacyToken;

            await axios.post(`${ENDPOINTS.CREATE_NOTIFICATION || 'http://10.0.2.2:5000/api/notifications'}`, {
                userId: startupOwnerId,
                type: 'pitch_deck_request',
                payload: { requesterId: uid, startupId: details._id || profileData._id }
            }, { headers: { Authorization: `Bearer ${finalToken}` } });

            setPitchRequested(true);
        } catch (error: any) {
            console.log('Error requesting pitch deck:', error);
            if (error.response?.status === 400 && error.response?.data?.error === 'Pitch deck already requested') {
                setPitchRequested(true);
                Alert.alert('Info', 'You have already requested the pitch deck.');
            } else {
                Alert.alert('Error', 'Failed to request pitch deck');
            }
        }
    };

    const companyName = details.companyName || profileData?.name || '';
    const about = details.about || profileData?.tagline || profileData?.description || '';
    const location = details.location || profileData?.location || '';
    const industry = details.companyType || profileData?.industry || '';
    const founded = details.establishedOn ? new Date(details.establishedOn).getFullYear() : (profileData?.founded || '');
    const website = details.website || profileData?.website || '';
    const videoUrl = details.video || profileData?.video || '';

    // Fix Team Members: ensure we are getting an array
    let teamMembers = details.teamMembers || profileData?.teamMembers || [];
    if (typeof teamMembers === 'string') {
        try { teamMembers = JSON.parse(teamMembers); } catch { }
    }
    if (!Array.isArray(teamMembers)) teamMembers = [];

    // Get funding rounds (investments) and current round
    const rounds = details.fundingRounds || details.rounds || details.financialProfile?.rounds || [];
    const currentRound = details.roundType || details.stage || details.currentRound || (rounds.length > 0 ? rounds[rounds.length - 1].round : 'Seed');

    // Calculate fundingRaised from investments matching current round only
    const matchingInvestments = Array.isArray(rounds)
        ? rounds.filter((inv: any) => inv.round === currentRound)
        : [];
    const fundingRaisedFromInvestments = matchingInvestments.reduce((sum: number, inv: any) => {
        const amount = Number(inv.amount) || 0;
        return sum + amount;
    }, 0);

    // Use calculated value or fallback to stored values
    const fundingRaised = fundingRaisedFromInvestments > 0
        ? fundingRaisedFromInvestments
        : (details.fundingRaised || details.financialProfile?.fundingAmount || profileData?.stats?.fundingRaised || 0);
    const fundingNeeded = details.fundingNeeded || details.financialProfile?.fundingNeeded || profileData?.stats?.fundingNeeded || 0;

    // Calculate progress percentage for financial bar
    const getFundingPercent = (raised: number | string, needed: number | string) => {
        const r = Number(raised) || 0;
        const n = Number(needed) || 0;
        if (n <= 0) return 0;
        return Math.min(100, Math.round((r / n) * 100));
    };
    const fundingPercent = getFundingPercent(fundingRaised, fundingNeeded);

    const revenueType = details.financialProfile?.revenueType || details.revenueType || 'Pre-revenue';

    // Calculate unique rounds count (distinct round values from investments)
    const uniqueRounds = Array.isArray(rounds)
        ? [...new Set(rounds.map((inv: any) => inv.round).filter(Boolean))]
        : [];
    const roundsCount = uniqueRounds.length || details.roundsRaised || 0;

    // Calculate TOTAL raised across ALL investments (all rounds)
    const totalRaisedAllRounds = Array.isArray(rounds)
        ? rounds.reduce((sum: number, inv: any) => sum + (Number(inv.amount) || 0), 0)
        : (details.fundingRaised || details.financialProfile?.fundingAmount || 0);

    // Fix Investors: comma separated
    let investors: string[] = [];
    if (Array.isArray(rounds)) {
        rounds.forEach((r: any) => {
            if (r.investorName) investors.push(r.investorName);
            if (r.investors && Array.isArray(r.investors)) investors.push(...r.investors);
        });
    }
    if (investors.length === 0) {
        const directInvestors = details.financialProfile?.investorName || details.investors;
        if (directInvestors) {
            if (Array.isArray(directInvestors)) investors = directInvestors;
            else investors = [directInvestors];
        }
    }
    // Deduplicate and join
    const investorsList = [...new Set(investors)].join(', ');

    // Stats for the startup
    // Prioritize raw details stats (from MongoDB model)
    const stats = profileData?.stats || {};
    const meta = details.meta || {};

    const displayStats = {
        likes: typeof details.likesCount === 'number' ? details.likesCount : (meta.likes || stats.likes || 0),
        crowns: typeof meta.crowns === 'number' ? meta.crowns : (meta.crownsCount || stats.crowns || 0),
        comments: typeof meta.commentsCount === 'number' ? meta.commentsCount : (stats.comments || 0),
        shares: typeof details.sharesCount === 'number' ? details.sharesCount : (stats.shares || 0)
    };

    const formatCurrency = (amount: number | string) => {
        const num = Number(amount) || 0;
        if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `$${(num / 1000).toFixed(0)}k`;
        return `$${num.toLocaleString()}`;
    };

    return (
        <View style={{ width: '100%', padding: 0, paddingTop: 10 }}>
            {/* 1. Video Section */}
            {/* Added paddingTop to prevent overlap with header */}
            <View style={{ width: screenW, height: 250, backgroundColor: '#000', marginBottom: 16, paddingTop: 60 }}>
                {videoUrl ? (
                    <StartupVideoPlayer videoUrl={videoUrl} />
                ) : (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' }}>
                        <Play size={40} color="#333" />
                        <Text style={{ color: '#444', marginTop: 8 }}>No company video available</Text>
                    </View>
                )}
            </View>

            <View style={{ paddingHorizontal: 16 }}>
                {/* 2. Stats Row */}
                <View style={cardStyles.card}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Heart size={20} color="#fff" />
                            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{displayStats.likes}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Crown size={20} color="#fff" />
                            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{displayStats.crowns}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <MessageCircle size={20} color="#fff" />
                            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{displayStats.comments}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Send size={20} color="#fff" />
                            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{displayStats.shares}</Text>
                        </View>
                    </View>
                </View>

                {/* 3. What's [company] - Description Card */}
                {about ? (
                    <View style={cardStyles.card}>
                        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 8 }}>What's {companyName || 'this startup'}</Text>
                        <Text style={{ color: '#ccc', fontSize: 13, lineHeight: 19 }}>{about}</Text>
                    </View>
                ) : null}

                {/* 4. Request Pitch Deck Button - Standalone */}
                {!isOwner && (
                    <TouchableOpacity
                        onPress={handleRequestPitchDeck}
                        disabled={pitchRequested}
                        style={{
                            backgroundColor: pitchRequested ? '#222' : '#0d0d0d',
                            borderRadius: 12,
                            paddingVertical: 14,
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: '#1a1a1a',
                            marginBottom: 16,
                        }}
                    >
                        <Text style={{ color: pitchRequested ? '#888' : '#fff', fontWeight: '600', fontSize: 14 }}>
                            {pitchRequested ? 'Requested' : 'Request Pitch Deck'}
                        </Text>
                    </TouchableOpacity>
                )}

                {/* 5. Company Details Card */}
                <View style={cardStyles.card}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12 }}>Company Details</Text>
                    <View style={{ gap: 12 }}>
                        {industry ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <Building2 size={15} color="#888" />
                                <Text style={{ color: '#ccc', fontSize: 13 }}>{industry}</Text>
                            </View>
                        ) : null}

                        {founded ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <Calendar size={15} color="#888" />
                                <Text style={{ color: '#ccc', fontSize: 13 }}>Founded {founded}</Text>
                            </View>
                        ) : null}

                        {website ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <Globe size={15} color="#888" />
                                <Text style={{ color: '#ccc', fontSize: 13 }}>{website.replace(/^https?:\/\//, '')}</Text>
                            </View>
                        ) : null}
                    </View>
                </View>

                {/* 6. Team Section */}
                <View style={[cardStyles.card, { paddingVertical: 20 }]}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12, marginTop: 0 }}>Team</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={{ flexDirection: 'row', gap: 16, paddingHorizontal: 4 }}>
                            {teamMembers.length > 0 ? (
                                teamMembers.map((member: any, idx: number) => (
                                    <View key={idx} style={{ alignItems: 'center', width: 80 }}>
                                        <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#333' }}>
                                            {member.profileImage || member.avatar || member.avatarUrl ? (
                                                <Image source={{ uri: member.profileImage || member.avatar || member.avatarUrl }} style={{ width: 50, height: 50, borderRadius: 25 }} />
                                            ) : (
                                                <Text style={{ color: '#aaa', fontSize: 18 }}>{(member.name || member.username || 'U').charAt(0).toUpperCase()}</Text>
                                            )}
                                        </View>
                                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600', textAlign: 'center' }} numberOfLines={1}>{member.name || member.username}</Text>
                                        <Text style={{ color: '#888', fontSize: 10, textAlign: 'center', marginTop: 2 }} numberOfLines={1}>{member.role || 'Member'}</Text>
                                    </View>
                                ))
                            ) : (
                                <View style={{ paddingHorizontal: 10, justifyContent: 'center' }}>
                                    <Text style={{ color: '#666', fontSize: 12 }}>No team members added</Text>
                                </View>
                            )}

                            {/* Add Member Button - Only for Owner */}
                            {isOwner && (
                                <TouchableOpacity
                                    style={{ alignItems: 'center', width: 80, justifyContent: 'flex-start' }}
                                    onPress={() => setShowTeamModal(true)}
                                >
                                    <View style={{ width: 50, height: 50, borderRadius: 25, borderStyle: 'dashed', borderWidth: 1, borderColor: '#666', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                                        <Users size={20} color="#666" />
                                    </View>
                                    <Text style={{ color: '#666', fontSize: 12 }}>Add</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </ScrollView>
                </View>

                {/* 7. Financial Overview */}
                <View style={cardStyles.card}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12, marginTop: 0 }}>Financial Overview</Text>
                    <View style={{ gap: 12 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ color: '#888', fontSize: 13 }}>Startup Type</Text>
                            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '500' }}>{revenueType}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ color: '#888', fontSize: 13 }}>Rounds Raised</Text>
                            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '500' }}>{roundsCount}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ color: '#888', fontSize: 13 }}>Total Raised</Text>
                            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '500' }}>{formatCurrency(totalRaisedAllRounds)}</Text>
                        </View>
                        {investorsList ? (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={{ color: '#888', fontSize: 13 }}>Investors</Text>
                                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '500', maxWidth: '60%', textAlign: 'right' }}>{investorsList}</Text>
                            </View>
                        ) : null}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ color: '#888', fontSize: 13 }}>Current Round</Text>
                            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '500' }}>{currentRound}</Text>
                        </View>
                    </View>

                    <View style={{ marginTop: 20 }}>
                        <View style={{ height: 32, backgroundColor: '#1a1a1a', borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: '#333' }}>
                            <View style={{ width: `${fundingPercent}%`, height: '100%', backgroundColor: '#666' }} />
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                            <Text style={{ color: '#fff', fontSize: 12 }}>{formatCurrency(fundingRaised)} Filled</Text>
                            <Text style={{ color: '#fff', fontSize: 12 }}>{formatCurrency(fundingNeeded)}</Text>
                        </View>
                    </View>
                </View>

            </View>

            {/* Team Member Modal */}
            <Modal visible={showTeamModal} transparent animationType="fade" onRequestClose={() => setShowTeamModal(false)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ width: '85%', backgroundColor: '#1a1a1a', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#333' }}>
                        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16 }}>Add Team Member</Text>

                        <Text style={{ color: '#ccc', fontSize: 14, marginBottom: 8 }}>Name or Username</Text>
                        <TextInput
                            value={searchQuery}
                            onChangeText={(text) => {
                                setSearchQuery(text);
                                if (searchTimeout.current) clearTimeout(searchTimeout.current);
                                if (text.length > 2) {
                                    setIsSearching(true);
                                    searchTimeout.current = setTimeout(async () => {
                                        try {
                                            const results = await searchUsers(text);
                                            setSearchResults(results.filter((u: any) => u.id !== details.userId)); // Exclude self if needed, though robust check is better
                                            setIsSearching(false);
                                        } catch {
                                            setSearchResults([]);
                                            setIsSearching(false);
                                        }
                                    }, 500);
                                } else {
                                    setSearchResults([]);
                                    setIsSearching(false);
                                }
                            }}
                            placeholder="Search user..."
                            placeholderTextColor="#666"
                            style={{ backgroundColor: '#000', borderRadius: 8, padding: 12, color: '#fff', borderWidth: 1, borderColor: '#333', marginBottom: 16 }}
                        />

                        {/* Search Results */}
                        {isSearching ? (
                            <ActivityIndicator size="small" color="#fff" style={{ marginBottom: 16 }} />
                        ) : searchResults.length > 0 ? (
                            <View style={{ maxHeight: 150, marginBottom: 16, backgroundColor: '#111', borderRadius: 8, overflow: 'hidden' }}>
                                <FlatList
                                    data={searchResults}
                                    keyExtractor={(item) => item.id || item._id}
                                    nestedScrollEnabled
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={{ flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#222' }}
                                            onPress={() => {
                                                setNewMemberName(item.name || item.fullName || item.username);
                                                setSearchQuery(item.name || item.fullName || item.username);
                                                setSelectedUserId(item.id || item._id);
                                                setSearchResults([]);
                                                // Pre-fill role if they have a tagline as a hint? No, just let user edit.
                                            }}
                                        >
                                            <Image
                                                source={getImageSource(item.profileImage || item.avatarUrl || 'https://via.placeholder.com/50')}
                                                style={{ width: 30, height: 30, borderRadius: 15, marginRight: 10 }}
                                            />
                                            <View>
                                                <Text style={{ color: '#fff', fontWeight: '600' }}>{item.username}</Text>
                                                <Text style={{ color: '#888', fontSize: 12 }}>{item.name || item.fullName}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    )}
                                />
                            </View>
                        ) : null}

                        {/* Selected Name Display / Manual Override */}
                        {selectedUserId || newMemberName ? (
                            <View style={{ marginBottom: 16 }}>
                                <Text style={{ color: '#ccc', fontSize: 12, marginBottom: 4 }}>Display Name</Text>
                                <TextInput
                                    value={newMemberName}
                                    onChangeText={setNewMemberName}
                                    style={{ backgroundColor: '#111', borderRadius: 8, padding: 12, color: '#fff' }}
                                />
                            </View>
                        ) : null}

                        <Text style={{ color: '#ccc', fontSize: 14, marginBottom: 8 }}>Role</Text>
                        <TextInput
                            value={newMemberRole}
                            onChangeText={setNewMemberRole}
                            placeholder="e.g. CTO, Lead Dev"
                            placeholderTextColor="#666"
                            style={{ backgroundColor: '#000', borderRadius: 8, padding: 12, color: '#fff', borderWidth: 1, borderColor: '#333', marginBottom: 24 }}
                        />

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity
                                onPress={() => setShowTeamModal(false)}
                                style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#333', alignItems: 'center' }}
                            >
                                <Text style={{ color: '#fff', fontWeight: '600' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSaveTeamMember}
                                disabled={savingMember}
                                style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center' }}
                            >
                                {savingMember ? (
                                    <ActivityIndicator color="#000" size="small" />
                                ) : (
                                    <Text style={{ color: '#000', fontWeight: '700' }}>Add</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View >
    );
};

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
        marginBottom: 6,
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
        marginTop: 8, // Reduced from 12
    },
    row: {
        flexDirection: 'row' as const,
        alignItems: 'flex-start' as const,
        gap: 8,
        marginBottom: 4, // Reduced from 8
    },
    firstRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 8,
        marginTop: 0,
        marginBottom: 4,
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
        marginTop: 0,
        marginBottom: 16, // Added spacing between items
    },
    chipRow: {
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
        gap: 6,
        marginTop: 8,
        marginLeft: 24,
        marginBottom: 20, // Added spacing after chips
    },
    chip: {
        backgroundColor: '#1a1a1a',
        borderWidth: 0,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
    },
    chipText: {
        color: '#999',
        fontSize: 12,
    },
};
