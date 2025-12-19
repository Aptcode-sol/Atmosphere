import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, Modal, Alert } from 'react-native';
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
                <View style={styles.flex1}>
                    <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{meeting.title || 'Untitled Meeting'}</Text>
                    <Text style={[styles.subtitle, { color: theme.placeholder }]}>
                        by {meeting.host?.displayName || meeting.hostName || meeting.organizer?.displayName || 'Unknown'}
                    </Text>
                    <View style={styles.metaRow}>
                        <Text style={[styles.metaText, { color: theme.placeholder }]}>{getClockLabel()}</Text>
                        <Text style={[styles.metaText, { color: theme.placeholder }, styles.metaTextMargin]}>
                            {typeof meeting.participants === 'number'
                                ? meeting.participants
                                : (Array.isArray(meeting.participantsDetail) ? meeting.participantsDetail.length : 0)
                            } participants
                        </Text>
                    </View>
                </View>
                <TouchableOpacity
                    disabled={disabled}
                    style={[styles.joinBtn, disabled && styles.disabledJoinBtn]}
                    onPress={onJoin}
                >
                    <Text style={styles.whiteBoldText}>{joinLabel}</Text>
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
    <View style={styles.noMeetingsContainer}>
        <MaterialIcons name="video-library" size={42} color="#999" />
        <Text style={styles.noMeetingsText}>No meetings found</Text>
    </View>
);

const TabButton = ({ label, isActive, onPress }: any) => (
    <TouchableOpacity onPress={onPress} style={styles.tabButton}>
        <Text style={[styles.tabButtonText, isActive ? styles.tabButtonActiveText : styles.tabButtonInactiveText]}>{label}</Text>
        <View style={[styles.tabIndicator, { backgroundColor: isActive ? '#fff' : 'transparent' }]} />
    </TouchableOpacity>
);

const Meetings = ({ onJoinMeeting }: { onJoinMeeting?: (meetingId: string) => void }) => {
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
    const [_userRole, setUserRole] = useState<string>('');
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
        endScheduledAt: new Date(new Date().getTime() + 60 * 60000), // Default 1 hour later
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
                    // Filter out already selected
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


    useEffect(() => {
        console.log('Meetings screen mounted, theme ready:', !!context?.theme);
    }, [context?.theme]);

    const fetchMeetings = async (force: boolean = false) => {
        try {
            setLoading(true);
            _setError(null);
            const baseUrl = await getBaseUrl();
            const token = await AsyncStorage.getItem('token');

            let currentUserId = await AsyncStorage.getItem('userId');
            if (!currentUserId) {
                const userJson = await AsyncStorage.getItem('user');
                if (userJson) {
                    try {
                        const user = JSON.parse(userJson);
                        currentUserId = user._id || user.id;
                    } catch (parseErr) {
                        // ignore
                    }
                }
            }

            const headers: any = { 'Content-Type': 'application/json' };
            if (token) headers.Authorization = `Bearer ${token}`;
            let url = `${baseUrl}/api/meetings?filter=all`;
            if (force) url = `${url}&_ts=${Date.now()}`;

            const res = await fetch(url, { headers });

            if (res.status === 304 || res.status === 204) {
                setLoading(false);
                if (res.status === 204) setMeetings([]);
                return;
            }

            if (!res.ok) {
                throw new Error('Failed to fetch meetings');
            }

            const data = await res.json();
            const meetingsArray = data.meetings || [];
            setMeetings(meetingsArray);

            if (currentUserId) {
                // Since the backend now strictly returns ONLY meetings where the user is 
                // Organizer OR Participant, we can safely assume ALL these meetings are "My Meetings".
                // This resolves any issues with ID matching or filtering on the frontend.
                const allIds = meetingsArray.map((m: Meeting) => String(m._id || m.id));
                setMyMeetings(allIds);
            }
        } catch (err) {
            console.error('fetchMeetings ERROR:', err);
            _setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
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

    // "All" tab shows everything returned (which is just the user's meetings now)
    const publicMeetings = filtered;
    // "My Meetings" shows the same list since privacy is enforced
    const myMeetingsList = filtered;

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
                _setError('Auth error. Please log in.');
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
            // Calculate duration in minutes
            const diffMs = endScheduledAt.getTime() - scheduledAt.getTime();
            if (diffMs <= 0) {
                Alert.alert('Error', 'End time must be after start time');
                return;
            }
            const duration = Math.ceil(diffMs / 60000);

            const baseUrl = await getBaseUrl();
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                _setError('Please log in to create meetings');
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
            // Reset form
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
                    // Auto adjust end time if it becomes before start
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

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.headerRow}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Meetings</Text>
                <View style={styles.row}>
                    <TouchableOpacity onPress={() => setShowSearchBar(s => !s)} style={styles.iconBtn}>
                        <MaterialIcons name="search" size={22} color={theme.text} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.iconBtn}>
                        <MaterialIcons name="add" size={24} color={theme.text} />
                    </TouchableOpacity>
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

            <View style={styles.flex1}>
                {loading ? (
                    <View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View>
                ) : (
                    <>
                        {activeTab === 'public' && (
                            // Show all relevant meetings as 'public' tab is slightly misnamed now based on privacy, but serves as 'Incoming/All'
                            meetings.length ? (
                                <FlatList
                                    data={meetings} // Just show what backend returns (which is now filtered)
                                    keyExtractor={(item) => String(item._id || item.id)}
                                    contentContainerStyle={styles.listPadding}
                                    renderItem={({ item }) => (
                                        <MeetingCard
                                            meeting={item}
                                            joinLabel={myMeetings.includes(String(item._id || item.id)) ? "Enter" : "Join"}
                                            onJoin={() => {
                                                if (myMeetings.includes(String(item._id || item.id))) {
                                                    if (onJoinMeeting) onJoinMeeting(String(item._id || item.id));
                                                } else {
                                                    handleJoin(item);
                                                }
                                            }}
                                        />
                                    )}
                                    refreshing={loading}
                                    onRefresh={fetchMeetings}
                                />
                            ) : <NoMeetings />
                        )}

                        {activeTab === 'my' && (
                            // Keeping 'my meetings' tab for explicit 'ones I have joined' vs 'ones I am invited to' differentiation if needed, 
                            // but simplifying to just show same list for now if backend filter overlaps.
                            // Actually user said "meetings will be only shown to the participant who were in the list". 
                            // So 'meetings' state already contains ONLY that.
                            // We can just reuse the list or filter by 'accepted' status if we had that detail easily avail.
                            // For now, My Meetings can strictly be "Where I am Participant".
                            myMeetingsList.length ? (
                                <FlatList
                                    data={myMeetingsList}
                                    keyExtractor={(item) => String(item._id || item.id)}
                                    contentContainerStyle={styles.listPadding}
                                    renderItem={({ item }) => (
                                        <MeetingCard
                                            meeting={item}
                                            joinLabel="Enter"
                                            disabled={false}
                                            onJoin={() => {
                                                if (onJoinMeeting) {
                                                    onJoinMeeting(String(item._id || item.id));
                                                }
                                            }}
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

                        <ScrollView style={styles.modalForm} contentContainerStyle={{ paddingBottom: 40 }}>
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

                            {/* Date Time Pickers */}
                            <Text style={[styles.label, { color: theme.text }]}>Start Time *</Text>
                            <View style={styles.dateRow}>
                                <TouchableOpacity onPress={() => openDatePicker('start', 'date')} style={[styles.dateBtn, { borderColor: theme.border, backgroundColor: theme.background }]}>
                                    <Text style={{ color: theme.text }}>{createForm.scheduledAt.toLocaleDateString()}</Text>
                                    <MaterialIcons name="calendar-today" size={16} color={theme.placeholder} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => openDatePicker('start', 'time')} style={[styles.dateBtn, { borderColor: theme.border, backgroundColor: theme.background }]}>
                                    <Text style={{ color: theme.text }}>{formatAMPM(createForm.scheduledAt)}</Text>
                                    <MaterialIcons name="access-time" size={16} color={theme.placeholder} />
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.label, { color: theme.text }]}>End Time *</Text>
                            <View style={styles.dateRow}>
                                <TouchableOpacity onPress={() => openDatePicker('end', 'date')} style={[styles.dateBtn, { borderColor: theme.border, backgroundColor: theme.background }]}>
                                    <Text style={{ color: theme.text }}>{createForm.endScheduledAt.toLocaleDateString()}</Text>
                                    <MaterialIcons name="calendar-today" size={16} color={theme.placeholder} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => openDatePicker('end', 'time')} style={[styles.dateBtn, { borderColor: theme.border, backgroundColor: theme.background }]}>
                                    <Text style={{ color: theme.text }}>{formatAMPM(createForm.endScheduledAt)}</Text>
                                    <MaterialIcons name="access-time" size={16} color={theme.placeholder} />
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.label, { color: theme.text }]}>Participants</Text>
                            {/* Selected Participants Chips */}
                            {selectedParticipants.length > 0 && (
                                <View style={styles.chipsContainer}>
                                    {selectedParticipants.map(u => (
                                        <View key={u._id} style={[styles.chip, { backgroundColor: theme.primary }]}>
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
                                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                placeholder="Search & Add Participants..."
                                placeholderTextColor={theme.placeholder}
                            />
                            {/* Search Results */}
                            {participantResults.length > 0 && (
                                <View style={[styles.searchResults, { backgroundColor: theme.background, borderColor: theme.border }]}>
                                    {participantResults.map(u => (
                                        <TouchableOpacity key={u._id} style={styles.searchResultItem} onPress={() => addParticipant(u)}>
                                            <Text style={{ color: theme.text }}>{u.displayName || u.username}</Text>
                                            <MaterialIcons name="add" size={20} color={theme.placeholder} />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                            {searchingParticipants && <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 8 }} />}


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
    flex1: { flex: 1 },
    metaTextMargin: { marginLeft: 8 },
    disabledJoinBtn: { backgroundColor: '#999' },
    whiteBoldText: { color: '#fff', fontWeight: '700' },
    noMeetingsContainer: { padding: 24, alignItems: 'center' },
    noMeetingsText: { marginTop: 8, color: '#999' },
    tabButton: { paddingHorizontal: 12, paddingVertical: 8 },
    tabButtonText: { color: '#fff' },
    tabButtonActiveText: { fontWeight: '700' },
    tabButtonInactiveText: { fontWeight: '500' },
    tabIndicator: { height: 2, marginTop: 6 },
    row: { flexDirection: 'row' },
    listPadding: { padding: 12 },
    // New Styles
    dateRow: { flexDirection: 'row', justifyContent: 'space-between' },
    dateBtn: { flex: 0.48, height: 44, borderWidth: 1, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 },
    chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
    chip: { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4, marginRight: 8, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
    chipText: { color: '#fff', marginRight: 4, fontSize: 12 },
    searchResults: { borderWidth: 1, borderRadius: 8, marginTop: 4, maxHeight: 150 },
    searchResultItem: { padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
});

export default Meetings;
