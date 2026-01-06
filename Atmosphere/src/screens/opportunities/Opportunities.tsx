import React, { useState, useEffect, useContext, useMemo, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Alert,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Dimensions,
    RefreshControl,
    ScrollView,
} from 'react-native';
import { ThemeContext } from '../../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBaseUrl } from '../../lib/config';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { TABS } from './constants';
import GrantEventCard from './components/GrantEventCard';
import RoleCard from './components/RoleCard';
import FilterModal from './components/FilterModal';
import styles from './Opportunities.styles';

const Opportunities = ({ onNavigate }: { onNavigate?: (route: string) => void }) => {
    const { theme } = useContext(ThemeContext) as any;
    const [activeTab, setActiveTab] = useState('Grants');

    // Data states
    const [grants, setGrants] = useState<any[]>([]);
    const [grantsSkip, setGrantsSkip] = useState(0);
    const [grantsHasMore, setGrantsHasMore] = useState(true);
    const [grantsLoading, setGrantsLoading] = useState(false);

    const [events, setEvents] = useState<any[]>([]);
    const [eventsSkip, setEventsSkip] = useState(0);
    const [eventsHasMore, setEventsHasMore] = useState(true);
    const [eventsLoading, setEventsLoading] = useState(false);

    const [team, setTeam] = useState<any[]>([]);
    const [teamSkip, setTeamSkip] = useState(0);
    const [teamHasMore, setTeamHasMore] = useState(true);
    const [teamLoading, setTeamLoading] = useState(false);

    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [userRole, setUserRole] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [form, setForm] = useState({
        name: '', organization: '', sector: '', location: '', amount: '', deadline: '', type: '', description: '', url: '',
        organizer: '', date: '', time: '',
        startupName: '', roleTitle: '', locationType: '', employmentType: 'Full-time', compensation: '', requirements: '',
        isRemote: false, applicationUrl: '',
    });
    const [postLoading, setPostLoading] = useState(false);
    const [initialLoadDone, setInitialLoadDone] = useState(false);
    const [grantsRefreshed, setGrantsRefreshed] = useState(false);
    const [eventsRefreshed, setEventsRefreshed] = useState(false);
    const [teamRefreshed, setTeamRefreshed] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Active Job Posts state
    const [myJobPosts, setMyJobPosts] = useState<any[]>([]);
    const [activeJobsExpanded, setActiveJobsExpanded] = useState(false);
    const [myJobsLoading, setMyJobsLoading] = useState(false);
    const [editingJobId, setEditingJobId] = useState<string | null>(null);

    // Filter states
    const [filters, setFilters] = useState({
        grantType: 'all',
        grantSector: 'All Sectors',
        eventType: 'all',
        eventSector: 'All Sectors',
        eventLocation: 'All Locations',
        teamSector: 'All Sectors',
        teamLocation: 'All Locations',
        teamRemote: 'all',
        teamEmployment: 'all',
    });

    const LIMIT = 20;
    const { width } = Dimensions.get('window');
    const flatListRef = useRef<FlatList>(null);

    const api = require('../../lib/api');

    // Memoized filtered data
    const filteredGrants = useMemo(() => {
        return grants.filter((grant) => {
            const sectorMatch = filters.grantSector === 'All Sectors' || grant.sector === filters.grantSector;
            const typeMatch = filters.grantType === 'all' || grant.type === filters.grantType;
            return sectorMatch && typeMatch;
        });
    }, [grants, filters.grantSector, filters.grantType]);

    const filteredEvents = useMemo(() => {
        return events.filter((event) => {
            const sectorMatch = filters.eventSector === 'All Sectors' || event.sector === filters.eventSector;
            const typeMatch = filters.eventType === 'all' || event.type === filters.eventType;
            const locationMatch = filters.eventLocation === 'All Locations' ||
                event.location?.includes(filters.eventLocation) ||
                filters.eventLocation.includes(event.location);
            return sectorMatch && typeMatch && locationMatch;
        });
    }, [events, filters.eventSector, filters.eventType, filters.eventLocation]);

    const filteredTeam = useMemo(() => {
        return team.filter((posting) => {
            const sectorMatch = filters.teamSector === 'All Sectors' || posting.sector === filters.teamSector;
            const locationMatch = filters.teamLocation === 'All Locations' ||
                posting.location?.includes(filters.teamLocation) ||
                filters.teamLocation === 'Global';
            const remoteMatch = filters.teamRemote === 'all' ||
                (filters.teamRemote === 'remote' && posting.isRemote) ||
                (filters.teamRemote === 'on-site' && !posting.isRemote);
            const employmentMatch = filters.teamEmployment === 'all' || posting.employmentType === filters.teamEmployment;
            return sectorMatch && locationMatch && remoteMatch && employmentMatch;
        });
    }, [team, filters.teamSector, filters.teamLocation, filters.teamRemote, filters.teamEmployment]);

    // Initial Load
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const [[cachedGrants, cachedEvents, cachedTeam], role] = await Promise.all([
                    Promise.all([
                        AsyncStorage.getItem('ATMOSPHERE_GRANTS_CACHE'),
                        AsyncStorage.getItem('ATMOSPHERE_EVENTS_CACHE'),
                        AsyncStorage.getItem('ATMOSPHERE_TEAM_CACHE'),
                    ]),
                    api.fetchAndStoreUserRole().catch(() => AsyncStorage.getItem('role')),
                ]);

                if (mounted) {
                    if (role) setUserRole(role);
                    if (cachedGrants) setGrants(JSON.parse(cachedGrants));
                    if (cachedEvents) setEvents(JSON.parse(cachedEvents));
                    if (cachedTeam) setTeam(JSON.parse(cachedTeam));
                }
            } catch (e) {
                console.warn('Initialization error', e);
            } finally {
                if (mounted) setInitialLoadDone(true);
            }
        })();
        return () => { mounted = false; };
    }, []);

    // Load functions
    const loadGrants = useCallback(async (skip = 0) => {
        if (grantsLoading && skip > 0) return;
        setGrantsLoading(true);
        try {
            const data = await api.fetchGrants(LIMIT, skip);
            if (skip === 0) {
                setGrants(data);
                AsyncStorage.setItem('ATMOSPHERE_GRANTS_CACHE', JSON.stringify(data)).catch(() => { });
                setGrantsRefreshed(true);
            } else {
                setGrants(prev => {
                    const existingIds = new Set(prev.map(item => item._id || item.id));
                    const newItems = data.filter((item: any) => !existingIds.has(item._id || item.id));
                    return [...prev, ...newItems];
                });
            }
            setGrantsHasMore(data.length >= LIMIT);
            setGrantsSkip(skip + LIMIT);
        } catch (e) {
            console.warn('Grants load fail', e);
        } finally {
            setGrantsLoading(false);
        }
    }, [grantsLoading]);

    const loadEvents = useCallback(async (skip = 0) => {
        if (eventsLoading && skip > 0) return;
        setEventsLoading(true);
        try {
            const data = await api.fetchEvents(LIMIT, skip);
            if (skip === 0) {
                setEvents(data);
                AsyncStorage.setItem('ATMOSPHERE_EVENTS_CACHE', JSON.stringify(data)).catch(() => { });
                setEventsRefreshed(true);
            } else {
                setEvents(prev => {
                    const existingIds = new Set(prev.map(item => item._id || item.id));
                    const newItems = data.filter((item: any) => !existingIds.has(item._id || item.id));
                    return [...prev, ...newItems];
                });
            }
            setEventsHasMore(data.length >= LIMIT);
            setEventsSkip(skip + LIMIT);
        } catch (e) {
            console.warn('Events load fail', e);
        } finally {
            setEventsLoading(false);
        }
    }, [eventsLoading]);

    const loadTeam = useCallback(async (skip = 0) => {
        if (teamLoading && skip > 0) return;
        setTeamLoading(true);
        try {
            const data = await api.fetchJobs(LIMIT, skip);
            if (skip === 0) {
                setTeam(data);
                AsyncStorage.setItem('ATMOSPHERE_TEAM_CACHE', JSON.stringify(data)).catch(() => { });
                setTeamRefreshed(true);
            } else {
                setTeam(prev => {
                    const existingIds = new Set(prev.map(item => item._id || item.id));
                    const newItems = data.filter((item: any) => !existingIds.has(item._id || item.id));
                    return [...prev, ...newItems];
                });
            }
            setTeamHasMore(data.length >= LIMIT);
            setTeamSkip(skip + LIMIT);
        } catch (e) {
            console.warn('Team load fail', e);
        } finally {
            setTeamLoading(false);
        }
    }, [teamLoading]);

    // Trigger fetches based on active tab
    useEffect(() => {
        if (!initialLoadDone) return;

        if (activeTab === 'Grants' && !grantsRefreshed) {
            loadGrants(0);
        } else if (activeTab === 'Events' && !eventsRefreshed) {
            loadEvents(0);
        } else if (activeTab === 'Team' && !teamRefreshed) {
            loadTeam(0);
        }
    }, [initialLoadDone, activeTab, grantsRefreshed, eventsRefreshed, teamRefreshed, loadGrants, loadEvents, loadTeam]);

    const handleFormChange = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

    const handleSubmit = async () => {
        setPostLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const baseUrl = await getBaseUrl();

            let endpoint = '';
            let payload = {};
            if (activeTab === 'Grants') {
                endpoint = '/api/grants';
                payload = {
                    name: form.name, organization: form.organization, sector: form.sector, location: form.location,
                    amount: form.amount, deadline: form.deadline, type: form.type, description: form.description, url: form.url,
                };
            } else if (activeTab === 'Events') {
                endpoint = '/api/events';
                payload = {
                    name: form.name, organizer: form.organizer, location: form.location,
                    date: form.date, time: form.time, description: form.description, url: form.url,
                };
            } else if (activeTab === 'Team') {
                endpoint = editingJobId ? `/api/jobs/${editingJobId}` : '/api/jobs';
                payload = {
                    title: form.roleTitle, startupName: form.startupName, sector: form.sector,
                    locationType: form.locationType, employmentType: form.employmentType,
                    compensation: form.compensation, requirements: form.requirements,
                    isRemote: form.isRemote, applicationUrl: form.applicationUrl,
                };
            }

            const res = await fetch(`${baseUrl}${endpoint}`, {
                method: editingJobId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Failed to post');

            setModalVisible(false);
            setEditingJobId(null);
            setForm({
                name: '', organization: '', sector: '', location: '', amount: '', deadline: '', type: '',
                description: '', url: '', organizer: '', date: '', time: '',
                startupName: '', roleTitle: '', locationType: '', employmentType: 'Full-time',
                compensation: '', requirements: '', isRemote: false, applicationUrl: '',
            });
            Alert.alert('Success', editingJobId ? 'Job post updated successfully!' : 'Posted successfully!');

            if (activeTab === 'Grants') loadGrants(0);
            else if (activeTab === 'Events') loadEvents(0);
            else if (activeTab === 'Team') {
                loadTeam(0);
                loadMyJobPosts(); // Refresh user's job posts
            }
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to post');
        }
        setPostLoading(false);
    };

    // Load user's own job posts
    const loadMyJobPosts = useCallback(async () => {
        setMyJobsLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const userJson = await AsyncStorage.getItem('user');
            if (!token || !userJson) return;

            const user = JSON.parse(userJson);
            const userId = user._id || user.id;
            const baseUrl = await getBaseUrl();

            const res = await fetch(`${baseUrl}/api/jobs?poster=${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setMyJobPosts(data.jobs || []);
            }
        } catch (e) {
            console.warn('Failed to load my job posts', e);
        } finally {
            setMyJobsLoading(false);
        }
    }, []);

    // Close/Delete a job post
    const handleCloseJobPost = async (jobId: string) => {
        Alert.alert(
            'Close Job Post',
            'Are you sure you want to close this job post? It will no longer accept applications.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Close',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('token');
                            const baseUrl = await getBaseUrl();
                            const res = await fetch(`${baseUrl}/api/jobs/${jobId}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` },
                            });
                            if (res.ok) {
                                setMyJobPosts(prev => prev.filter(job => (job._id || job.id) !== jobId));
                                loadTeam(0);
                                Alert.alert('Success', 'Job post closed successfully');
                            } else {
                                throw new Error('Failed to close job post');
                            }
                        } catch (e: any) {
                            Alert.alert('Error', e.message || 'Failed to close job post');
                        }
                    },
                },
            ]
        );
    };

    // Edit a job post (opens modal with pre-filled data)
    const handleEditJobPost = (job: any) => {
        setEditingJobId(job._id || job.id);
        setForm({
            ...form,
            roleTitle: job.title || '',
            startupName: job.startupName || '',
            sector: job.sector || '',
            locationType: job.locationType || '',
            employmentType: job.employmentType || 'Full-time',
            compensation: job.compensation || '',
            requirements: job.requirements || '',
            isRemote: job.isRemote || false,
            applicationUrl: job.applicationUrl || '',
        });
        setActiveTab('Team');
        setModalVisible(true);
    };

    const handleTabPress = (tab: string, index: number) => {
        setActiveTab(tab);
        flatListRef.current?.scrollToIndex({ index, animated: true });
    };

    const handleMomentumScrollEnd = (event: any) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        const newTab = TABS[index];
        if (newTab && newTab !== activeTab) {
            setActiveTab(newTab);
        }
    };

    const renderTabContent = ({ item: tabName }: { item: string }) => {
        let data: any[] = [];
        let loading = false;
        let loadMore: () => void = () => { };
        let onRefresh: () => Promise<void> = async () => { };

        if (tabName === 'Grants') {
            data = filteredGrants;
            loading = grantsLoading && grants.length === 0;
            loadMore = () => { if (grantsHasMore && !grantsLoading) loadGrants(grantsSkip); };
            onRefresh = async () => { setRefreshing(true); await loadGrants(0); setRefreshing(false); };
        } else if (tabName === 'Events') {
            data = filteredEvents;
            loading = eventsLoading && events.length === 0;
            loadMore = () => { if (eventsHasMore && !eventsLoading) loadEvents(eventsSkip); };
            onRefresh = async () => { setRefreshing(true); await loadEvents(0); setRefreshing(false); };
        } else if (tabName === 'Team') {
            data = filteredTeam;
            loading = teamLoading && team.length === 0;
            loadMore = () => { if (teamHasMore && !teamLoading) loadTeam(teamSkip); };
            onRefresh = async () => { setRefreshing(true); await loadTeam(0); setRefreshing(false); };
        }

        if (loading) {
            return (
                <View style={[styles.loaderContainer, { width }]}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            );
        }

        return (
            <View style={{ width }}>
                <FlatList
                    data={data}
                    keyExtractor={(item) => String(item._id || item.id)}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => {
                        if (tabName === 'Team') {
                            const isMyAd = item.id?.startsWith?.('user-') || false;
                            return (
                                <RoleCard
                                    item={item}
                                    isMyAd={isMyAd}
                                    expanded={expandedId === (item._id || item.id)}
                                    onExpand={() => setExpandedId(
                                        expandedId === (item._id || item.id) ? null : (item._id || item.id)
                                    )}
                                />
                            );
                        }
                        return (
                            <GrantEventCard
                                item={item}
                                type={tabName === 'Grants' ? 'Grant' : 'Event'}
                            />
                        );
                    }}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.primary}
                            title="Release to refresh"
                            titleColor={theme.text}
                        />
                    }
                    ListHeaderComponent={() => (
                        <View>
                            {tabName === 'Team' && (
                                <>
                                    <View style={styles.actionButtonsContainer}>
                                        <TouchableOpacity style={[styles.actionBtn, styles.createBtn]} onPress={() => setModalVisible(true)}>
                                            <Text style={styles.createBtnText}>＋ Create Job Ad</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.actionBtn, styles.myTeamsBtn]} onPress={() => onNavigate && onNavigate('myTeam')}>
                                            <Text style={styles.myTeamsBtnText}>My Teams</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Your Active Job Posts - Expandable */}
                                    <TouchableOpacity
                                        style={styles.activeJobsHeader}
                                        onPress={() => {
                                            setActiveJobsExpanded(!activeJobsExpanded);
                                            if (!activeJobsExpanded && myJobPosts.length === 0) {
                                                loadMyJobPosts();
                                            }
                                        }}
                                    >
                                        <Text style={styles.activeJobsTitle}>Your active job posts</Text>
                                        <MaterialIcons
                                            name={activeJobsExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                                            size={24}
                                            color="#888"
                                        />
                                    </TouchableOpacity>

                                    {activeJobsExpanded && (
                                        <View style={styles.activeJobsContainer}>
                                            {myJobsLoading ? (
                                                <ActivityIndicator size="small" color={theme.primary} />
                                            ) : myJobPosts.length === 0 ? (
                                                <Text style={styles.noActiveJobsText}>No active job posts</Text>
                                            ) : (
                                                myJobPosts.map((job) => (
                                                    <View key={job._id || job.id} style={styles.myJobCard}>
                                                        <View style={styles.myJobCardContent}>
                                                            <Text style={styles.myJobTitle} numberOfLines={1}>{job.title}</Text>
                                                            <Text style={styles.myJobMeta}>
                                                                {job.applicants?.length || 0} applicants • {job.employmentType || 'Full-time'}
                                                            </Text>
                                                        </View>
                                                        <View style={styles.myJobActions}>
                                                            <TouchableOpacity
                                                                style={styles.myJobActionBtn}
                                                                onPress={() => handleCloseJobPost(job._id || job.id)}
                                                            >
                                                                <MaterialIcons name="block" size={18} color="#ef4444" />
                                                                <Text style={styles.closeJobText}>Close</Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity
                                                                style={styles.myJobActionBtn}
                                                                onPress={() => handleEditJobPost(job)}
                                                            >
                                                                <MaterialIcons name="edit" size={18} color="#888" />
                                                                <Text style={styles.editJobText}>Edit</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                ))
                                            )}
                                        </View>
                                    )}
                                </>
                            )}
                            <View style={styles.listHeader}>
                                <Text style={styles.resultCount}>
                                    {tabName === 'Team'
                                        ? `${data.length} position${data.length !== 1 ? 's' : ''} available`
                                        : `Total ${tabName.toLowerCase()}: ${data.length}`}
                                </Text>
                                <TouchableOpacity onPress={() => setFilterModalVisible(true)}>
                                    <Text style={styles.filterIcon}>▼</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                    ListFooterComponent={() => {
                        const isLoadingMore = (tabName === 'Grants' && grantsLoading) ||
                            (tabName === 'Events' && eventsLoading) ||
                            (tabName === 'Team' && teamLoading);
                        if (isLoadingMore && data.length > 0) {
                            return <ActivityIndicator style={styles.footerLoader} color={theme.primary} />;
                        }
                        if (data.length === 0) {
                            return <Text style={styles.emptyText}>No {tabName.toLowerCase()} found.</Text>;
                        }
                        return null;
                    }}
                    ListEmptyComponent={() => (
                        <Text style={styles.emptyText}>No {tabName.toLowerCase()} found.</Text>
                    )}
                />
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Tab Bar */}
            <View style={styles.tabBar}>
                {TABS.map((tab, index) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                        onPress={() => handleTabPress(tab, index)}
                    >
                        <Text style={[styles.tabText, activeTab === tab ? styles.tabTextActive : styles.tabTextInactive]}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Content */}
            <FlatList
                ref={flatListRef}
                data={TABS}
                keyExtractor={(item) => item}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                renderItem={renderTabContent}
                initialScrollIndex={TABS.indexOf(activeTab)}
                getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
            />

            {/* Filter Modal */}
            <FilterModal
                visible={filterModalVisible}
                onClose={() => setFilterModalVisible(false)}
                tabType={activeTab}
                filters={filters}
                setFilters={setFilters}
            />

            {/* Create Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.modalContainer}
                >
                    <View style={[styles.modalBox, { backgroundColor: '#111' }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={[styles.modalTitle, { marginBottom: 0, flex: 1 }]}>
                                {editingJobId ? 'Edit Job Post' : `Post a new ${activeTab === 'Team' ? 'Job' : activeTab.slice(0, -1)}`}
                            </Text>
                            <TouchableOpacity onPress={() => { setModalVisible(false); setEditingJobId(null); }} style={{ padding: 4 }}>
                                <MaterialIcons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalScroll}>
                            {activeTab === 'Grants' && (
                                <>
                                    <TextInput placeholderTextColor="#888" style={styles.input} placeholder="Name" value={form.name} onChangeText={v => handleFormChange('name', v)} />
                                    <TextInput placeholderTextColor="#888" style={styles.input} placeholder="Organization" value={form.organization} onChangeText={v => handleFormChange('organization', v)} />
                                    <TextInput placeholderTextColor="#888" style={styles.input} placeholder="Sector" value={form.sector} onChangeText={v => handleFormChange('sector', v)} />
                                    <TextInput placeholderTextColor="#888" style={styles.input} placeholder="Location" value={form.location} onChangeText={v => handleFormChange('location', v)} />
                                    <TextInput placeholderTextColor="#888" style={styles.input} placeholder="Amount" value={form.amount} onChangeText={v => handleFormChange('amount', v)} />
                                    <TextInput placeholderTextColor="#888" style={styles.input} placeholder="Deadline (YYYY-MM-DD)" value={form.deadline} onChangeText={v => handleFormChange('deadline', v)} />
                                    <TextInput placeholderTextColor="#888" style={styles.input} placeholder="Type (grant/incubator/accelerator)" value={form.type} onChangeText={v => handleFormChange('type', v)} />
                                    <TextInput placeholderTextColor="#888" style={[styles.input, { height: 80 }]} placeholder="Description" value={form.description} onChangeText={v => handleFormChange('description', v)} multiline />
                                    <TextInput placeholderTextColor="#888" style={styles.input} placeholder="URL" value={form.url} onChangeText={v => handleFormChange('url', v)} />
                                </>
                            )}
                            {activeTab === 'Events' && (
                                <>
                                    <TextInput placeholderTextColor="#888" style={styles.input} placeholder="Name" value={form.name} onChangeText={v => handleFormChange('name', v)} />
                                    <TextInput placeholderTextColor="#888" style={styles.input} placeholder="Organizer" value={form.organizer} onChangeText={v => handleFormChange('organizer', v)} />
                                    <TextInput placeholderTextColor="#888" style={styles.input} placeholder="Location" value={form.location} onChangeText={v => handleFormChange('location', v)} />
                                    <TextInput placeholderTextColor="#888" style={styles.input} placeholder="Date (YYYY-MM-DD)" value={form.date} onChangeText={v => handleFormChange('date', v)} />
                                    <TextInput placeholderTextColor="#888" style={styles.input} placeholder="Time (e.g. 18:00)" value={form.time} onChangeText={v => handleFormChange('time', v)} />
                                    <TextInput placeholderTextColor="#888" style={[styles.input, { height: 80 }]} placeholder="Description" value={form.description} onChangeText={v => handleFormChange('description', v)} multiline />
                                    <TextInput placeholderTextColor="#888" style={styles.input} placeholder="URL" value={form.url} onChangeText={v => handleFormChange('url', v)} />
                                </>
                            )}
                            {activeTab === 'Team' && (
                                <>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Role Title</Text>
                                        <TextInput placeholderTextColor="#666" style={styles.inputDark} placeholder="e.g., Co-Founder & CTO" value={form.roleTitle} onChangeText={v => handleFormChange('roleTitle', v)} />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Sector</Text>
                                        <TextInput placeholderTextColor="#666" style={styles.inputDark} placeholder="" value={form.sector} onChangeText={v => handleFormChange('sector', v)} />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Location</Text>
                                        <TextInput placeholderTextColor="#666" style={styles.inputDark} placeholder="e.g., San Francisco, USA" value={form.locationType} onChangeText={v => handleFormChange('locationType', v)} />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Employment Type</Text>
                                        <TextInput placeholderTextColor="#666" style={styles.inputDark} placeholder="Full-time" value={form.employmentType} onChangeText={v => handleFormChange('employmentType', v)} />
                                    </View>
                                    <TouchableOpacity
                                        style={styles.remoteToggle}
                                        onPress={() => handleFormChange('isRemote', !form.isRemote)}
                                    >
                                        <View style={[styles.checkbox, form.isRemote && styles.checkboxActive]} />
                                        <Text style={styles.remoteToggleText}>Remote Position</Text>
                                    </TouchableOpacity>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Compensation</Text>
                                        <TextInput placeholderTextColor="#666" style={styles.inputDark} placeholder="e.g., Equity (15-20%) + Competitive Salary" value={form.compensation} onChangeText={v => handleFormChange('compensation', v)} />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Description</Text>
                                        <TextInput
                                            placeholderTextColor="#666"
                                            style={[styles.inputDark, { height: 100, textAlignVertical: 'top' }]}
                                            placeholder="Describe the role and your startup"
                                            value={form.description}
                                            onChangeText={v => handleFormChange('description', v)}
                                            multiline
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Requirements</Text>
                                        <TextInput
                                            placeholderTextColor="#666"
                                            style={[styles.inputDark, { height: 80, textAlignVertical: 'top' }]}
                                            placeholder="What are you looking for?"
                                            value={form.requirements}
                                            onChangeText={v => handleFormChange('requirements', v)}
                                            multiline
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Application Link</Text>
                                        <TextInput
                                            placeholderTextColor="#666"
                                            style={styles.inputDark}
                                            placeholder="Website or Google Form link for applications"
                                            value={form.applicationUrl}
                                            onChangeText={v => handleFormChange('applicationUrl', v)}
                                            autoCapitalize="none"
                                            keyboardType="url"
                                        />
                                    </View>
                                </>
                            )}
                        </ScrollView>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.submitBtnDark} onPress={handleSubmit} disabled={postLoading}>
                                <Text style={styles.submitText}>
                                    {postLoading
                                        ? (editingJobId ? 'Updating...' : 'Posting...')
                                        : (editingJobId ? 'Edit Job Post' : 'Create Posting')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};

export default Opportunities;
