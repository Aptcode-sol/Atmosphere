import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    ScrollView,
    Modal,
    Alert,
    RefreshControl,
    Image,
} from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { getBaseUrl } from '../lib/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

type Meeting = {
    _id?: string;
    id?: number | string;
    host?: any;
    hostName?: string;
    hostAvatar?: string;
    title: string;
    industries?: string[];
    category?: string;
    eligible?: boolean;
    participants?: number;
    startTime?: string | Date;
    endTime?: string | Date;
    isVerified?: boolean;
    description?: string;
    organizer?: any;
    scheduledAt?: string | Date;
    participantsDetail?: any[];
};

function formatAMPM(dateLike: Date | string) {
    const d = typeof dateLike === 'string' ? new Date(dateLike) : dateLike;
    const h = d.getHours();
    const m = d.getMinutes();
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

// MeetingCard - Exact match to web version
const MeetingCard = ({ meeting, onJoin, joinLabel = 'Join', isExpanded, onToggleExpand }: any) => {
    const hostName = meeting.host?.displayName || meeting.hostName || meeting.organizer?.displayName || 'Unknown';
    const hostAvatar = meeting.host?.avatarUrl || meeting.hostAvatar || meeting.organizer?.avatarUrl;
    const isVerified = meeting.host?.verified || meeting.isVerified || meeting.organizer?.verified;
    const participantCount = typeof meeting.participants === 'number'
        ? meeting.participants
        : (Array.isArray(meeting.participantsDetail) ? meeting.participantsDetail.length : 0);

    const getClockLabel = () => {
        if (!meeting.startTime && !meeting.scheduledAt) return 'Starts soon';
        const now = new Date();
        const start = meeting.scheduledAt ? new Date(meeting.scheduledAt) : new Date(meeting.startTime);
        const end = meeting.endTime ? new Date(meeting.endTime) : new Date(start.getTime() + 45 * 60000);
        if (now >= start && now <= end) return 'Ongoing';
        return `Starts at ${formatAMPM(start)}`;
    };

    const category = meeting.category || (meeting.industries?.[0] ? 'Pitch' : 'Networking');

    return (
        <View style={styles.card}>
            {/* ROW 1: Avatar + Title/Host + Join Button */}
            <View style={styles.cardRow1}>
                {/* Avatar */}
                <View style={styles.avatarContainer}>
                    {hostAvatar ? (
                        <Image source={{ uri: hostAvatar }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarText}>{hostName.charAt(0).toUpperCase()}</Text>
                        </View>
                    )}
                </View>

                {/* Title + Host */}
                <View style={styles.cardMiddle}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{meeting.title || 'Untitled Meeting'}</Text>
                    <View style={styles.hostRow}>
                        <Text style={styles.hostText}>by {hostName}</Text>
                        {isVerified && (
                            <MaterialIcons name="verified" size={14} color="#666" style={{ marginLeft: 4 }} />
                        )}
                    </View>
                </View>

                {/* Join Button */}
                <TouchableOpacity style={styles.joinBtn} onPress={onJoin}>
                    <Text style={styles.joinBtnText}>{joinLabel}</Text>
                </TouchableOpacity>
            </View>

            {/* ROW 2: Eligible + Time + Participants + Category */}
            <View style={styles.cardRow2}>
                {/* Left group: Eligible + Time + Participants */}
                <View style={styles.leftGroup}>
                    {meeting.eligible !== false && (
                        <View style={styles.eligibleBadge}>
                            <Text style={styles.eligibleText}>Eligible</Text>
                        </View>
                    )}
                    <View style={styles.timeGroup}>
                        <MaterialIcons name="access-time" size={12} color="#666" />
                        <Text style={styles.metaText}>{getClockLabel()}</Text>
                    </View>
                    <View style={styles.participantsGroup}>
                        <MaterialIcons name="people-outline" size={12} color="#666" />
                        <Text style={styles.metaText}>{participantCount}</Text>
                    </View>
                </View>

                {/* Right: Category badge */}
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{category === 'pitch' ? 'Pitch' : 'Networking'}</Text>
                </View>
            </View>

            {/* ROW 3: Expand Arrow */}
            {meeting.description && (
                <TouchableOpacity style={styles.expandRow} onPress={onToggleExpand}>
                    <MaterialIcons
                        name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                        size={20}
                        color="#666"
                    />
                </TouchableOpacity>
            )}

            {/* Expanded Description */}
            {isExpanded && meeting.description && (
                <View style={styles.expandedContent}>
                    {meeting.industries && meeting.industries.length > 0 && (
                        <View style={styles.industryTags}>
                            {meeting.industries.slice(0, 2).map((tag: string, idx: number) => (
                                <View key={idx} style={styles.industryTag}>
                                    <Text style={styles.industryTagText}>{tag}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                    <Text style={styles.descriptionText}>{meeting.description}</Text>
                </View>
            )}
        </View>
    );
};

const NoMeetings = () => (
    <View style={styles.noMeetingsContainer}>
        <MaterialIcons name="videocam-off" size={48} color="#444" />
        <Text style={styles.noMeetingsText}>No meetings found</Text>
    </View>
);

const Meetings = ({ onJoinMeeting }: { onJoinMeeting?: (meetingId: string) => void }) => {
    const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [myMeetings, setMyMeetings] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchBar, setShowSearchBar] = useState(false);
    const [launchExpanded, setLaunchExpanded] = useState(false);
    const [expandedMeetingId, setExpandedMeetingId] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Date Picker State
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dateMode, setDateMode] = useState<'date' | 'time'>('date');
    const [dateField, setDateField] = useState<'start' | 'end'>('start');

    // Participant Search State
    const [participantQuery, setParticipantQuery] = useState('');
    const [participantResults, setParticipantResults] = useState<any[]>([]);
    const [searchingParticipants, setSearchingParticipants] = useState(false);
    const [selectedParticipants, setSelectedParticipants] = useState<any[]>([]);

    const [createForm, setCreateForm] = useState({
        title: '',
        description: '',
        scheduledAt: new Date(),
        endScheduledAt: new Date(new Date().getTime() + 60 * 60000),
        location: '',
    });

    const DateTimePicker = require('@react-native-community/datetimepicker').default;

    // Search Users Debounce
    useEffect(() => {
        if (!participantQuery.trim()) {
            setParticipantResults([]);
            return;
        }
        const delay = setTimeout(async () => {
            setSearchingParticipants(true);
            try {
                const baseUrl = await getBaseUrl();
                const res = await fetch(`${baseUrl}/api/users/search?q=${encodeURIComponent(participantQuery)}`);
                if (res.ok) {
                    const data = await res.json();
                    const filtered = (data.users || []).filter((u: any) => !selectedParticipants.some(sp => sp._id === u._id));
                    setParticipantResults(filtered);
                }
            } catch (e) {
                console.error('User search failed', e);
            } finally {
                setSearchingParticipants(false);
            }
        }, 500);
        return () => clearTimeout(delay);
    }, [participantQuery, selectedParticipants]);

    const fetchMeetings = useCallback(async (force: boolean = false) => {
        try {
            if (!refreshing) setLoading(true);
            const baseUrl = await getBaseUrl();
            const token = await AsyncStorage.getItem('token');

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
            if (token) headers.Authorization = `Bearer ${token}`;
            let url = `${baseUrl}/api/meetings?filter=all`;
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
    }, [refreshing]);

    useEffect(() => { fetchMeetings(); }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchMeetings(true);
    }, [fetchMeetings]);

    const filtered = meetings.filter(m => {
        const q = searchQuery.toLowerCase();
        return m.title.toLowerCase().includes(q) || (m.host?.displayName || '').toLowerCase().includes(q);
    });

    const myMeetingsList = filtered.filter(m => myMeetings.includes(String(m._id || m.id)));

    const handleJoin = async (meeting: Meeting) => {
        try {
            const baseUrl = await getBaseUrl();
            const token = await AsyncStorage.getItem('token');
            let userId = await AsyncStorage.getItem('userId');
            if (!userId) {
                const userJson = await AsyncStorage.getItem('user');
                if (userJson) {
                    const user = JSON.parse(userJson);
                    userId = user._id || user.id;
                }
            }

            if (!token || !userId) {
                Alert.alert('Error', 'Please log in to join meetings');
                return;
            }

            const headers: any = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
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

    const handleCreateMeeting = async () => {
        try {
            const { title, description, scheduledAt, endScheduledAt, location } = createForm;
            if (!title) {
                Alert.alert('Error', 'Title is required');
                return;
            }
            const diffMs = endScheduledAt.getTime() - scheduledAt.getTime();
            if (diffMs <= 0) {
                Alert.alert('Error', 'End time must be after start time');
                return;
            }
            const duration = Math.ceil(diffMs / 60000);

            const baseUrl = await getBaseUrl();
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert('Error', 'Please log in to create meetings');
                return;
            }

            const headers: any = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
            const res = await fetch(`${baseUrl}/api/meetings`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    title,
                    description,
                    scheduledAt: scheduledAt.toISOString(),
                    startTime: scheduledAt.toISOString(),
                    endTime: endScheduledAt.toISOString(),
                    duration,
                    location,
                    participants: selectedParticipants.map(p => ({ userId: p._id, status: 'invited' })),
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to create meeting');
            }

            Alert.alert('Success', 'Meeting created successfully');
            setShowCreateModal(false);
            setLaunchExpanded(false);
            setCreateForm({
                title: '',
                description: '',
                scheduledAt: new Date(),
                endScheduledAt: new Date(new Date().getTime() + 3600000),
                location: ''
            });
            setSelectedParticipants([]);
            fetchMeetings(true);
        } catch (err) {
            console.error('Create meeting error:', err);
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create meeting');
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate && event.type !== 'dismissed') {
            if (dateField === 'start') {
                setCreateForm(prev => {
                    const newStart = new Date(selectedDate);
                    let newEnd = prev.endScheduledAt;
                    if (newEnd <= newStart) {
                        newEnd = new Date(newStart.getTime() + 3600000);
                    }
                    return { ...prev, scheduledAt: newStart, endScheduledAt: newEnd };
                });
            } else {
                setCreateForm(prev => ({ ...prev, endScheduledAt: selectedDate }));
            }
        }
    };

    const openDatePicker = (field: 'start' | 'end', mode: 'date' | 'time') => {
        setDateField(field);
        setDateMode(mode);
        setShowDatePicker(true);
    };

    const addParticipant = (user: any) => {
        setSelectedParticipants(prev => [...prev, user]);
        setParticipantResults(prev => prev.filter(u => u._id !== user._id));
        setParticipantQuery('');
    };

    const removeParticipant = (userId: string) => {
        setSelectedParticipants(prev => prev.filter(u => u._id !== userId));
    };

    const displayList = activeTab === 'all' ? filtered : myMeetingsList;

    return (
        <View style={styles.container}>
            {/* Launch Meeting Button - Matches Web */}
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

            {/* Tabs + Search - Matches Web */}
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
                        <MaterialIcons name="search" size={20} color="#888" />
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
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#22c55e" />
                </View>
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
            <Modal visible={showCreateModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Launch Meeting</Text>
                            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                                <MaterialIcons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm} contentContainerStyle={{ paddingBottom: 40 }}>
                            <Text style={styles.label}>Title *</Text>
                            <TextInput
                                value={createForm.title}
                                onChangeText={(v) => setCreateForm(prev => ({ ...prev, title: v }))}
                                style={styles.input}
                                placeholder="Meeting title"
                                placeholderTextColor="#666"
                            />

                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                value={createForm.description}
                                onChangeText={(v) => setCreateForm(prev => ({ ...prev, description: v }))}
                                style={[styles.input, styles.textArea]}
                                placeholder="Add a description for your meeting..."
                                placeholderTextColor="#666"
                                multiline
                                numberOfLines={3}
                            />

                            <Text style={styles.label}>Start Time *</Text>
                            <View style={styles.dateRow}>
                                <TouchableOpacity onPress={() => openDatePicker('start', 'date')} style={styles.dateBtn}>
                                    <Text style={styles.dateText}>{createForm.scheduledAt.toLocaleDateString()}</Text>
                                    <MaterialIcons name="calendar-today" size={16} color="#888" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => openDatePicker('start', 'time')} style={styles.dateBtn}>
                                    <Text style={styles.dateText}>{formatAMPM(createForm.scheduledAt)}</Text>
                                    <MaterialIcons name="access-time" size={16} color="#888" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.label}>End Time *</Text>
                            <View style={styles.dateRow}>
                                <TouchableOpacity onPress={() => openDatePicker('end', 'date')} style={styles.dateBtn}>
                                    <Text style={styles.dateText}>{createForm.endScheduledAt.toLocaleDateString()}</Text>
                                    <MaterialIcons name="calendar-today" size={16} color="#888" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => openDatePicker('end', 'time')} style={styles.dateBtn}>
                                    <Text style={styles.dateText}>{formatAMPM(createForm.endScheduledAt)}</Text>
                                    <MaterialIcons name="access-time" size={16} color="#888" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.label}>Participants</Text>
                            {selectedParticipants.length > 0 && (
                                <View style={styles.chipsContainer}>
                                    {selectedParticipants.map(u => (
                                        <View key={u._id} style={styles.chip}>
                                            <Text style={styles.chipText}>{u.displayName || u.username}</Text>
                                            <TouchableOpacity onPress={() => removeParticipant(u._id)}>
                                                <MaterialIcons name="close" size={16} color="#fff" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}

                            <TextInput
                                value={participantQuery}
                                onChangeText={setParticipantQuery}
                                style={styles.input}
                                placeholder="Search & Add Participants..."
                                placeholderTextColor="#666"
                            />
                            {participantResults.length > 0 && (
                                <View style={styles.searchResults}>
                                    {participantResults.map(u => (
                                        <TouchableOpacity key={u._id} style={styles.searchResultItem} onPress={() => addParticipant(u)}>
                                            <Text style={styles.searchResultText}>{u.displayName || u.username}</Text>
                                            <MaterialIcons name="add" size={20} color="#888" />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                            {searchingParticipants && <ActivityIndicator size="small" color="#22c55e" style={{ marginTop: 8 }} />}

                            <Text style={styles.label}>Location</Text>
                            <TextInput
                                value={createForm.location}
                                onChangeText={(v) => setCreateForm(prev => ({ ...prev, location: v }))}
                                style={styles.input}
                                placeholder="Office, Online, etc."
                                placeholderTextColor="#666"
                            />

                            <TouchableOpacity style={styles.createBtn} onPress={handleCreateMeeting}>
                                <Text style={styles.createBtnText}>Launch Meeting</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {showDatePicker && (
                <DateTimePicker
                    value={dateField === 'start' ? createForm.scheduledAt : createForm.endScheduledAt}
                    mode={dateMode}
                    is24Hour={false}
                    display="default"
                    onChange={onDateChange}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    // Launch Meeting Button
    launchBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 16,
        marginTop: 25,
        paddingVertical: 20,
        paddingHorizontal: 20,
        backgroundColor: '#040709',
        borderWidth: 1,
        borderColor: '#272727',
        borderRadius: 20,
    },
    launchBtnLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    launchIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 100,
        backgroundColor: '#1a1a1a',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    launchBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    // Tabs
    tabsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginTop: 24,
        marginBottom: 16,
        marginLeft: 10,
    },
    tabsRow: {
        flexDirection: 'row',
    },
    tabBtn: {
        marginRight: 20,
        paddingBottom: 12,
    },
    tabText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '500',
    },
    tabTextActive: {
        color: '#fff',
    },
    tabUnderline: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: '#fff',
    },
    searchIconBtn: {
        padding: 8,
    },
    // Search
    searchRow: {
        paddingHorizontal: 16,
        marginBottom: 12,
        position: 'relative',
    },
    searchInput: {
        backgroundColor: '#111',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingLeft: 30,
        paddingRight: 40,
        color: '#fff',
        fontSize: 15,
        marginVertical: 5,
        marginBottom: 12,
    },
    clearSearchBtn: {
        position: 'absolute',
        right: 28,
        top: 25,
    },
    // List
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Card
    card: {
        backgroundColor: '#0d0d0d',
        borderWidth: 1,
        borderColor: '#272727',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 15,
    },
    cardRow1: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    avatarContainer: {
        marginRight: 12,
    },
    avatar: {
        width: 45,
        height: 45,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    avatarPlaceholder: {
        backgroundColor: '#333',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    cardMiddle: {
        flex: 1,
    },
    cardTitle: {
        color: '#fff',
        fontSize: 14.5,
        fontWeight: '500',
        marginBottom: 2,
    },
    hostRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    hostText: {
        color: '#888',
        fontSize: 13,
    },
    joinBtn: {
        backgroundColor: '#2C2C2C',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        marginLeft: 12,
    },
    joinBtnText: {
        color: '#fff',
        fontSize: 12.5,
        fontWeight: '600',
    },
    // Row 2
    cardRow2: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    leftGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
    },
    eligibleBadge: {
        backgroundColor: '#0e2416',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    eligibleText: {
        color: '#22c55e',
        fontSize: 11,
        fontWeight: '500',
    },
    timeGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    participantsGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        color: '#666',
        fontSize: 11,
    },
    categoryBadge: {
        backgroundColor: '#0e1118',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        minWidth: 70,
        alignItems: 'center',
    },
    categoryText: {
        color: '#888',
        fontSize: 11.5,
    },
    // Expand
    expandRow: {
        alignItems: 'flex-start',
        paddingTop: 8,
    },
    expandedContent: {
        paddingTop: 8,
    },
    industryTags: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 8,
    },
    industryTag: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    industryTagText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 10,
    },
    descriptionText: {
        color: '#888',
        fontSize: 12,
        lineHeight: 18,
    },
    // No Meetings
    noMeetingsContainer: {
        padding: 48,
        alignItems: 'center',
    },
    noMeetingsText: {
        marginTop: 12,
        color: '#666',
        fontSize: 14,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#111',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    modalTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    modalForm: {
        padding: 16,
    },
    label: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
        marginTop: 16,
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#0a0a0a',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: '#fff',
        fontSize: 14,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    dateRow: {
        flexDirection: 'row',
        gap: 12,
    },
    dateBtn: {
        flex: 1,
        backgroundColor: '#0a0a0a',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 8,
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dateText: {
        color: '#fff',
        fontSize: 14,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 8,
    },
    chip: {
        backgroundColor: '#22c55e',
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginRight: 8,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    chipText: {
        color: '#fff',
        marginRight: 4,
        fontSize: 12,
    },
    searchResults: {
        backgroundColor: '#0a0a0a',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 8,
        marginTop: 4,
        maxHeight: 150,
    },
    searchResultItem: {
        padding: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    searchResultText: {
        color: '#fff',
    },
    createBtn: {
        backgroundColor: '#fff',
        marginTop: 24,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    createBtnText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default Meetings;
