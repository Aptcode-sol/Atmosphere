import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, Modal, Alert } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { getBaseUrl } from '../lib/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
/* eslint-disable react-native/no-inline-styles */
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

const MeetingCard = ({ meeting, onJoin, joinLabel = 'Join', disabled = false, showRemove: _showRemove = false, onRemove: _onRemove }: any) => {
    const context = React.useContext(ThemeContext);
    const theme = context?.theme || {
        cardBackground: '#f5f5f5',
        border: '#ddd',
        text: '#000',
        placeholder: '#999',
    };

    const getClockLabel = () => {
        if (!meeting.startTime && !meeting.scheduledAt) return '';
        const now = new Date();
        const start = meeting.scheduledAt ? new Date(meeting.scheduledAt) : new Date(meeting.startTime);
        const end = meeting.endTime ? new Date(meeting.endTime) : new Date(start.getTime() + 45 * 60000);
        if (now >= start && now <= end) return 'Ongoing';
        return `Starts at ${formatAMPM(start)}`;
    };

    return (
        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{meeting.title || 'Untitled Meeting'}</Text>
                    <Text style={[styles.subtitle, { color: theme.placeholder }]}>
                        by {meeting.host?.displayName || meeting.hostName || meeting.organizer?.displayName || 'Unknown'}
                    </Text>
                    <View style={styles.metaRow}>
                        <Text style={[styles.metaText, { color: theme.placeholder }]}>{getClockLabel()}</Text>
                        <Text style={[styles.metaText, { color: theme.placeholder, marginLeft: 8 }]}>
                            {typeof meeting.participants === 'number'
                                ? meeting.participants
                                : (Array.isArray(meeting.participantsDetail) ? meeting.participantsDetail.length : 0)
                            } participants
                        </Text>
                    </View>
                </View>
                <TouchableOpacity
                    disabled={disabled}
                    style={[styles.joinBtn, disabled && { backgroundColor: '#999' }]}
                    onPress={onJoin}
                >
                    <Text style={{ color: '#fff', fontWeight: '700' }}>{joinLabel}</Text>
                </TouchableOpacity>
            </View>

            {meeting.description ? (
                <Text style={[styles.description, { color: theme.placeholder }]} numberOfLines={2}>{meeting.description}</Text>
            ) : null}
        </View>
    );
};

function formatAMPM(dateLike: Date | string) {
    const d = typeof dateLike === 'string' ? new Date(dateLike) : dateLike;
    const h = d.getHours();
    const m = d.getMinutes();
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

const NoMeetings = () => (
    <View style={{ padding: 24, alignItems: 'center' }}>
        <MaterialIcons name="video-library" size={42} color="#999" />
        <Text style={{ marginTop: 8, color: '#999' }}>No meetings found</Text>
    </View>
);

const TabButton = ({ label, isActive, onPress }: any) => (
    <TouchableOpacity onPress={onPress} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
        <Text style={{ fontWeight: isActive ? '700' : '500', color: '#fff' }}>{label}</Text>
        <View style={{ height: 2, backgroundColor: isActive ? '#fff' : 'transparent', marginTop: 6 }} />
    </TouchableOpacity>
);

const Meetings = () => {
    const context = React.useContext(ThemeContext);
    const theme = context?.theme || {
        background: '#fff',
        cardBackground: '#f5f5f5',
        border: '#ddd',
        text: '#000',
        placeholder: '#999',
        primary: '#2C2C2C',
    };
    const [activeTab, setActiveTab] = useState<'public' | 'my'>('public');
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [myMeetings, setMyMeetings] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [_error, _setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchBar, setShowSearchBar] = useState(false);
    const [userRole, setUserRole] = useState<string>('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({
        title: '',
        description: '',
        scheduledAt: '',
        duration: '60',
        meetingLink: '',
        location: '',
    });

    // Add debug logging
    React.useEffect(() => {
        console.log('Meetings screen mounted, theme ready:', !!context?.theme);
    }, [context?.theme]);

    const fetchMeetings = async (force: boolean = false) => {
        console.log('=== fetchMeetings START, force=', force);
        try {
            setLoading(true);
            setError(null);
            const baseUrl = await getBaseUrl();
            const token = await AsyncStorage.getItem('token');

            // Get current user ID
            let currentUserId = await AsyncStorage.getItem('userId');
            if (!currentUserId) {
                const userJson = await AsyncStorage.getItem('user');
                if (userJson) {
                    try {
                        const user = JSON.parse(userJson);
                        currentUserId = user._id || user.id;
                    } catch (parseErr) {
                        console.error('Failed to parse user:', parseErr);
                    }
                }
            }

            console.log('baseUrl=', baseUrl, 'hasToken=', !!token, 'currentUserId=', currentUserId);

            const headers: any = { 'Content-Type': 'application/json' };
            if (token) headers.Authorization = `Bearer ${token}`;
            let url = `${baseUrl}/api/meetings`;
            if (force) url = `${url}?_ts=${Date.now()}`;
            console.log('Fetching meetings from', url);
            const res = await fetch(url, { headers });
            console.log('Meetings response status', res.status, 'ok=', res.ok);

            if (res.status === 304) {
                console.log('Meetings: 304 Not Modified — keeping current list');
                setLoading(false);
                return;
            }

            if (res.status === 204) {
                console.log('Meetings: 204 No Content — setting empty list');
                setMeetings([]);
                setLoading(false);
                return;
            }

            if (!res.ok) {
                const text = await res.text().catch(() => '');
                console.error('Meetings fetch failed:', res.status, text);
                throw new Error(`Failed to fetch (${res.status}) ${text}`);
            }

            let data: any = null;
            try {
                const rawText = await res.text();
                console.log('Raw response length:', rawText.length);
                if (rawText.trim()) {
                    data = JSON.parse(rawText);
                    console.log('Parsed meetings data:', data);
                }
            } catch (e) {
                console.warn('Failed to parse meetings JSON response', e);
                data = null;
            }

            if (!data) {
                console.log('No data parsed, setting empty meetings');
                setMeetings([]);
            } else {
                const meetingsArray = data.meetings || [];
                console.log('Setting meetings count:', meetingsArray.length);
                setMeetings(meetingsArray);

                // Extract meetings where current user is a participant (not just organizer)
                if (currentUserId) {
                    const joinedIds = meetingsArray
                        .filter((m: Meeting) => {
                            const participants = Array.isArray(m.participants)
                                ? m.participants
                                : (Array.isArray(m.participantsDetail) ? m.participantsDetail : []);
                            return participants.some((p: any) => {
                                const uid = p?.userId?._id || p?.userId || p;
                                return String(uid) === String(currentUserId);
                            });
                        })
                        .map((m: Meeting) => String(m._id || m.id));

                    console.log('User is participant in:', joinedIds.length, 'meetings');
                    setMyMeetings(joinedIds);
                }
            }
        } catch (err) {
            console.error('fetchMeetings ERROR:', err);
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
            console.log('=== fetchMeetings END');
        }
    };

    useEffect(() => { fetchMeetings(); }, []);

    useEffect(() => {
        const loadUserRole = async () => {
            try {
                const role = await AsyncStorage.getItem('role');
                const userJson = await AsyncStorage.getItem('user');
                if (role) {
                    setUserRole(role);
                } else if (userJson) {
                    const user = JSON.parse(userJson);
                    setUserRole(user.role || user.accountType || '');
                }
            } catch (e) {
                console.error('Failed to load user role:', e);
            }
        };
        loadUserRole();
    }, []);

    const filtered = meetings.filter(m => {
        const q = searchQuery.toLowerCase();
        return m.title.toLowerCase().includes(q) || (m.host?.displayName || '').toLowerCase().includes(q);
    });

    const publicMeetings = filtered.filter(m => !myMeetings.includes(String(m._id || m.id)));
    const myMeetingsList = meetings.filter(m => myMeetings.includes(String(m._id || m.id)));

    const handleJoin = async (meeting: Meeting) => {
        try {
            console.log('=== handleJoin START for meeting', meeting._id || meeting.id);
            const baseUrl = await getBaseUrl();
            const token = await AsyncStorage.getItem('token');

            // Try to get userId from multiple possible storage keys
            let userId = await AsyncStorage.getItem('userId');
            if (!userId) {
                const userJson = await AsyncStorage.getItem('user');
                if (userJson) {
                    try {
                        const user = JSON.parse(userJson);
                        userId = user._id || user.id;
                        console.log('Extracted userId from user object:', userId);
                    } catch (e) {
                        console.error('Failed to parse user JSON:', e);
                    }
                }
            }

            console.log('baseUrl=', baseUrl, 'hasToken=', !!token, 'userId=', userId);

            if (!token) {
                setError('No auth token found. Please log in.');
                return;
            }
            if (!userId) {
                setError('User ID not found. Please log in again.');
                return;
            }

            const headers: any = { 'Content-Type': 'application/json' };
            headers.Authorization = `Bearer ${token}`;
            const url = `${baseUrl}/api/meetings/${meeting._id || meeting.id}/add-participant`;
            console.log('Calling', url, 'with userId=', userId);

            const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ userId }) });
            console.log('Join response status:', res.status);

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
                console.error('Join failed:', errorData);
                throw new Error(errorData.error || `Failed to join (${res.status})`);
            }

            console.log('Successfully joined meeting');
            setMyMeetings(prev => [...prev, String(meeting._id || meeting.id)]);
            setActiveTab('my');
        } catch (err) {
            console.error('handleJoin ERROR:', err);
            setError(err instanceof Error ? err.message : String(err));
        }
    };

    // removal helper intentionally removed; implement when removal UI is added

    const handleCreateMeeting = async () => {
        try {
            const { title, description, scheduledAt, duration, meetingLink, location } = createForm;
            if (!title || !scheduledAt) {
                Alert.alert('Error', 'Title and scheduled time are required');
                return;
            }

            const baseUrl = await getBaseUrl();
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                setError('Please log in to create meetings');
                return;
            }

            const headers: any = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
            const res = await fetch(`${baseUrl}/api/meetings`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    title,
                    description,
                    scheduledAt: new Date(scheduledAt).toISOString(),
                    duration: parseInt(duration, 10) || 60,
                    meetingLink,
                    location,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Failed to create meeting' }));
                throw new Error(errorData.error || 'Failed to create meeting');
            }

            Alert.alert('Success', 'Meeting created successfully');
            setShowCreateModal(false);
            setCreateForm({ title: '', description: '', scheduledAt: '', duration: '60', meetingLink: '', location: '' });
            fetchMeetings(true);
        } catch (err) {
            console.error('Create meeting error:', err);
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create meeting');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.headerRow}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Meetings</Text>
                <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity onPress={() => setShowSearchBar(s => !s)} style={styles.iconBtn}>
                        <MaterialIcons name="search" size={22} color={theme.text} />
                    </TouchableOpacity>
                    {(userRole.toLowerCase() === 'investor' || userRole.toLowerCase() === 'startup') && (
                        <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.iconBtn}>
                            <MaterialIcons name="add" size={24} color={theme.text} />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => fetchMeetings(true)} style={styles.iconBtn}>
                        <MaterialIcons name="refresh" size={22} color={theme.text} />
                    </TouchableOpacity>
                </View>
            </View>

            {showSearchBar && (
                <View style={styles.searchRow}>
                    <TextInput placeholder="Search meetings" value={searchQuery} onChangeText={setSearchQuery} style={[styles.searchInput, { color: theme.text, borderColor: theme.border }]} placeholderTextColor={theme.placeholder} />
                </View>
            )}



            <View style={styles.tabsRow}>
                <TabButton label="All" isActive={activeTab === 'public'} onPress={() => setActiveTab('public')} />
                <TabButton label="My meetings" isActive={activeTab === 'my'} onPress={() => setActiveTab('my')} />
            </View>

            <View style={{ flex: 1 }}>
                {loading ? (
                    <View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View>
                ) : (
                    <>
                        {activeTab === 'public' && (
                            publicMeetings.length ? (
                                <FlatList
                                    data={publicMeetings}
                                    keyExtractor={(item) => String(item._id || item.id)}
                                    contentContainerStyle={{ padding: 12 }}
                                    renderItem={({ item }) => (
                                        <MeetingCard
                                            meeting={item}
                                            onJoin={() => handleJoin(item)}
                                            joinLabel="Join"
                                        />
                                    )}
                                    refreshing={loading}
                                    onRefresh={fetchMeetings}
                                />
                            ) : <NoMeetings />
                        )}

                        {activeTab === 'my' && (
                            myMeetingsList.length ? (
                                <FlatList
                                    data={myMeetingsList}
                                    keyExtractor={(item) => String(item._id || item.id)}
                                    contentContainerStyle={{ padding: 12 }}
                                    renderItem={({ item }) => (
                                        <MeetingCard
                                            meeting={item}
                                            joinLabel="Joined"
                                            disabled={true}
                                            onJoin={() => { }}
                                        />
                                    )}
                                    refreshing={loading}
                                    onRefresh={fetchMeetings}
                                />
                            ) : <NoMeetings />
                        )}
                    </>
                )}
            </View>

            {/* Create Meeting Modal */}
            <Modal visible={showCreateModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Create Meeting</Text>
                            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                                <MaterialIcons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm}>
                            <Text style={[styles.label, { color: theme.text }]}>Title *</Text>
                            <TextInput
                                value={createForm.title}
                                onChangeText={(v) => setCreateForm(prev => ({ ...prev, title: v }))}
                                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                placeholder="Meeting title"
                                placeholderTextColor={theme.placeholder}
                            />

                            <Text style={[styles.label, { color: theme.text }]}>Description</Text>
                            <TextInput
                                value={createForm.description}
                                onChangeText={(v) => setCreateForm(prev => ({ ...prev, description: v }))}
                                style={[styles.input, styles.textArea, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                placeholder="Meeting description"
                                placeholderTextColor={theme.placeholder}
                                multiline
                                numberOfLines={3}
                            />

                            <Text style={[styles.label, { color: theme.text }]}>Scheduled Date & Time *</Text>
                            <TextInput
                                value={createForm.scheduledAt}
                                onChangeText={(v) => setCreateForm(prev => ({ ...prev, scheduledAt: v }))}
                                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                placeholder="YYYY-MM-DD HH:MM (e.g., 2025-12-10 15:30)"
                                placeholderTextColor={theme.placeholder}
                            />

                            <Text style={[styles.label, { color: theme.text }]}>Duration (minutes)</Text>
                            <TextInput
                                value={createForm.duration}
                                onChangeText={(v) => setCreateForm(prev => ({ ...prev, duration: v }))}
                                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                placeholder="60"
                                placeholderTextColor={theme.placeholder}
                                keyboardType="numeric"
                            />

                            <Text style={[styles.label, { color: theme.text }]}>Meeting Link</Text>
                            <TextInput
                                value={createForm.meetingLink}
                                onChangeText={(v) => setCreateForm(prev => ({ ...prev, meetingLink: v }))}
                                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                placeholder="https://meet.google.com/..."
                                placeholderTextColor={theme.placeholder}
                            />

                            <Text style={[styles.label, { color: theme.text }]}>Location</Text>
                            <TextInput
                                value={createForm.location}
                                onChangeText={(v) => setCreateForm(prev => ({ ...prev, location: v }))}
                                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                placeholder="Office, Online, etc."
                                placeholderTextColor={theme.placeholder}
                            />

                            <TouchableOpacity
                                style={[styles.createBtn, { backgroundColor: theme.primary }]}
                                onPress={handleCreateMeeting}
                            >
                                <Text style={styles.createBtnText}>Create Meeting</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerRow: { height: 56, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { fontSize: 20, fontWeight: '700' },
    iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    searchRow: { paddingHorizontal: 12, paddingBottom: 8 },
    searchInput: { height: 40, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10 },
    tabsRow: { flexDirection: 'row', paddingHorizontal: 8, paddingBottom: 8 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    card: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12, overflow: 'hidden' },
    cardRow: { flexDirection: 'row', alignItems: 'center' },
    title: { fontSize: 16, fontWeight: '700' },
    subtitle: { fontSize: 12, marginTop: 4 },
    metaRow: { flexDirection: 'row', marginTop: 6 },
    metaText: { fontSize: 12 },
    joinBtn: { backgroundColor: '#2C2C2C', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
    description: { marginTop: 8, fontSize: 13, lineHeight: 18 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalTitle: { color: '#000', fontSize: 18, fontWeight: '700' },
    modalForm: { padding: 16 },
    label: { fontSize: 14, fontWeight: '600', marginTop: 12, marginBottom: 4 },
    input: { height: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 14 },
    textArea: { height: 80, paddingTop: 10, textAlignVertical: 'top' },
    createBtn: { marginTop: 20, marginBottom: 20, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
    createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default Meetings;
