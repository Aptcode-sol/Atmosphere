import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { Search } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { getBaseUrl } from '../../lib/config';
import { Meeting } from './types';
import { styles } from './Meetings.styles';
import { MeetingCard, NoMeetings, CreateMeetingModal } from './components';
import MeetingSkeleton from '../../components/skeletons/MeetingSkeleton';

type MeetingsProps = {
    onJoinMeeting?: (meetingId: string) => void;
};

/**
 * Meetings screen - displays list of meetings with tabs, search, and create functionality
 */
const Meetings = ({ onJoinMeeting }: MeetingsProps) => {
    const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [myMeetings, setMyMeetings] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchBar, setShowSearchBar] = useState(false);
    const [expandedMeetingId, setExpandedMeetingId] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [token, setToken] = useState<string | null>(null);

    // Load token on mount
    useEffect(() => {
        AsyncStorage.getItem('token').then(setToken);
    }, []);

    const fetchMeetings = useCallback(async (force: boolean = false) => {
        try {
            if (!refreshing) setLoading(true);
            const baseUrl = await getBaseUrl();
            const storedToken = await AsyncStorage.getItem('token');

            let currentUserId = await AsyncStorage.getItem('userId');
            if (!currentUserId) {
                const userJson = await AsyncStorage.getItem('user');
                if (userJson) {
                    try {
                        const user = JSON.parse(userJson);
                        currentUserId = user._id || user.id;
                    } catch { }
                }
            }

            const headers: any = { 'Content-Type': 'application/json' };
            if (storedToken) headers.Authorization = `Bearer ${storedToken}`;

            const filterParam = activeTab === 'my' ? 'my-meetings' : 'all';
            let url = `${baseUrl}/api/meetings?filter=${filterParam}`;
            if (force) url = `${url}&_ts=${Date.now()}`;

            const res = await fetch(url, { headers });

            if (res.status === 304 || res.status === 204) {
                if (res.status === 204) setMeetings([]);
                return;
            }

            if (!res.ok) throw new Error('Failed to fetch meetings');

            const data = await res.json();
            const meetingsArray = data.meetings || [];
            setMeetings(meetingsArray);

            if (currentUserId) {
                const allIds = meetingsArray.map((m: Meeting) => String(m._id || m.id));
                setMyMeetings(allIds);
            }
        } catch (err) {
            console.error('fetchMeetings ERROR:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [refreshing, activeTab]);

    useEffect(() => { fetchMeetings(); }, [activeTab]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchMeetings(true);
    }, [fetchMeetings]);

    const filtered = meetings.filter(m => {
        const q = searchQuery.toLowerCase();
        return m.title.toLowerCase().includes(q) || (m.host?.displayName || '').toLowerCase().includes(q);
    });

    const handleJoin = async (meeting: Meeting) => {
        try {
            const baseUrl = await getBaseUrl();
            const storedToken = await AsyncStorage.getItem('token');
            let userId = await AsyncStorage.getItem('userId');
            if (!userId) {
                const userJson = await AsyncStorage.getItem('user');
                if (userJson) {
                    const user = JSON.parse(userJson);
                    userId = user._id || user.id;
                }
            }

            if (!storedToken || !userId) {
                Alert.alert('Error', 'Please log in to join meetings');
                return;
            }

            const headers: any = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${storedToken}` };
            const url = `${baseUrl}/api/meetings/${meeting._id || meeting.id}/add-participant`;

            const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ userId }) });
            if (!res.ok) throw new Error('Failed to join');

            setMyMeetings(prev => [...prev, String(meeting._id || meeting.id)]);
            if (onJoinMeeting) onJoinMeeting(String(meeting._id || meeting.id));
            else setActiveTab('my');
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to join meeting');
        }
    };

    const handleCreateSuccess = () => {
        Alert.alert('Success', 'Meeting created successfully');
        fetchMeetings(true);
    };

    const displayList = filtered;

    return (
        <View style={styles.container}>
            {/* Launch Meeting Button */}
            <TouchableOpacity
                style={styles.launchBtn}
                onPress={() => setShowCreateModal(true)}
            >
                <View style={styles.launchBtnLeft}>
                    <View style={styles.launchIconContainer}>
                        <MaterialIcons name="add" size={20} color="#fff" />
                    </View>
                    <Text style={styles.launchBtnText}>Launch meeting</Text>
                </View>
                <MaterialIcons name="keyboard-arrow-down" size={24} color="#888" />
            </TouchableOpacity>

            {/* Tabs + Search */}
            <View style={styles.tabsContainer}>
                <View style={styles.tabsRow}>
                    <TouchableOpacity
                        style={styles.tabBtn}
                        onPress={() => setActiveTab('all')}
                    >
                        <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>All</Text>
                        {activeTab === 'all' && <View style={styles.tabUnderline} />}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.tabBtn}
                        onPress={() => setActiveTab('my')}
                    >
                        <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>My meetings</Text>
                        {activeTab === 'my' && <View style={styles.tabUnderline} />}
                    </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => setShowSearchBar(s => !s)} style={styles.searchIconBtn}>
                    {showSearchBar ? (
                        <MaterialIcons name="close" size={20} color="#888" />
                    ) : (
                        <Search size={20} color="#888" />
                    )}
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            {showSearchBar && (
                <View style={styles.searchRow}>
                    <TextInput
                        placeholder="Search meetings by title or host..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={styles.searchInput}
                        placeholderTextColor="#666"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                            <MaterialIcons name="close" size={16} color="#888" />
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Meeting List with Pull to Refresh */}
            {loading && !refreshing ? (
                <MeetingSkeleton />
            ) : (
                <FlatList
                    data={displayList}
                    keyExtractor={(item) => String(item._id || item.id)}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <MeetingCard
                            meeting={item}
                            joinLabel={myMeetings.includes(String(item._id || item.id)) ? 'Enter' : 'Join'}
                            isExpanded={expandedMeetingId === String(item._id || item.id)}
                            onToggleExpand={() => setExpandedMeetingId(
                                expandedMeetingId === String(item._id || item.id) ? null : String(item._id || item.id)
                            )}
                            onJoin={() => {
                                if (myMeetings.includes(String(item._id || item.id))) {
                                    if (onJoinMeeting) onJoinMeeting(String(item._id || item.id));
                                } else {
                                    handleJoin(item);
                                }
                            }}
                        />
                    )}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#22c55e"
                            colors={['#22c55e']}
                        />
                    }
                    ListEmptyComponent={<NoMeetings />}
                />
            )}

            {/* Create Meeting Modal */}
            <CreateMeetingModal
                visible={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreateSuccess={handleCreateSuccess}
                token={token}
            />
        </View>
    );
};

export default Meetings;
