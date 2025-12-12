/* eslint-disable react-native/no-inline-styles */
import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchAndStoreUserRole } from '../lib/api';
import { getBaseUrl } from '../lib/config';

const TABS = ['Jobs', 'Grants', 'Events'];

function OpportunityCard({ item, type, onExpand, expanded }) {
    const { theme } = useContext(ThemeContext) as any;
    const [showFullDesc, setShowFullDesc] = useState(false);
    const tags = [item.sector, item.employmentType, item.locationType, item.companyType].filter(Boolean);
    return (
        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
            {/* Header */}
            <View style={styles.cardHeader}>
                <View style={styles.logoBox}>
                    <Text style={styles.logoText}>{item.title?.charAt(0) || item.roleTitle?.charAt(0) || '?'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>{item.title || item.roleTitle}</Text>
                    <Text style={styles.cardCompany}>{item.poster?.displayName || item.startupName || ''}</Text>
                </View>
                <View style={styles.badge}><Text style={styles.badgeText}>{type}</Text></View>
            </View>
            {/* Details */}
            <View style={styles.cardDetails}>
                <Text style={styles.cardLocation}>{item.locationType || item.location || ''}</Text>
                <Text style={styles.cardComp}>{item.compensation || ''}</Text>
            </View>
            {/* Tags */}
            <View style={styles.tagRow}>
                {tags.map((tag, idx) => (
                    <View key={idx} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
                ))}
            </View>
            {/* Description with More/Less */}
            <View style={{ marginBottom: 8 }}>
                <Text style={styles.cardDesc} numberOfLines={showFullDesc ? undefined : 2}>{item.requirements || item.description || ''}</Text>
                {(item.requirements?.length > 80 || item.description?.length > 80) && (
                    <TouchableOpacity onPress={() => setShowFullDesc(!showFullDesc)}>
                        <Text style={styles.moreLess}>{showFullDesc ? 'Less' : 'More'}</Text>
                    </TouchableOpacity>
                )}
            </View>
            {/* Applicants & Action */}
            <View style={styles.cardFooter}>
                <Text style={styles.applicants}>{item.applicants?.length ? `${item.applicants.length} applicants` : 'Be the first applicant!'}</Text>
                <TouchableOpacity style={styles.applyBtn} onPress={onExpand}>
                    <Text style={styles.applyBtnText}>{expanded ? 'Hide' : 'Apply'}</Text>
                </TouchableOpacity>
            </View>
            {/* Expanded Section */}
            {expanded && (
                <View style={styles.expandedBox}>
                    <Text style={styles.expandedTitle}>Application</Text>
                    <Text style={styles.expandedText}>Answer custom questions and upload resume (UI coming soon)</Text>
                    <TouchableOpacity style={styles.sendBtn} onPress={() => Alert.alert('Application sent!')}>
                        <Text style={styles.sendBtnText}>Send Application</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const Jobs = () => {
    const { theme } = useContext(ThemeContext) as any;
    const [activeTab, setActiveTab] = useState('Jobs');
    // State for each tab
    const [jobs, setJobs] = useState<any[]>([]);
    const [jobsSkip, setJobsSkip] = useState(0);
    const [jobsHasMore, setJobsHasMore] = useState(true);
    const [jobsLoading, setJobsLoading] = useState(true);

    const [grants, setGrants] = useState<any[]>([]);
    const [grantsSkip, setGrantsSkip] = useState(0);
    const [grantsHasMore, setGrantsHasMore] = useState(true);
    const [grantsLoading, setGrantsLoading] = useState(true);

    const [events, setEvents] = useState<any[]>([]);
    const [eventsSkip, setEventsSkip] = useState(0);
    const [eventsHasMore, setEventsHasMore] = useState(true);
    const [eventsLoading, setEventsLoading] = useState(true);

    const [expandedId, setExpandedId] = useState(null);
    const [userRole, setUserRole] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [form, setForm] = useState({
        // Jobs
        title: '', sector: '', locationType: '', employmentType: '', compensation: '', requirements: '',
        // Grants
        name: '', organization: '', location: '', amount: '', deadline: '', type: '', description: '', url: '',
        // Events
        organizer: '', date: '', time: '',
    });
    const [postLoading, setPostLoading] = useState(false);
    const [initialLoadDone, setInitialLoadDone] = useState(false);
    // Track if we have already fetched fresh data for these tabs to avoid constant refetching on tab switch
    const [jobsRefreshed, setJobsRefreshed] = useState(false);
    const [grantsRefreshed, setGrantsRefreshed] = useState(false);
    const [eventsRefreshed, setEventsRefreshed] = useState(false);

    const JOBS_LIMIT = 20;

    // API Helpers import
    const api = require('../lib/api');

    // Initial Load & Caching
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                // Initialize cache and role in parallel
                const loadCachePromise = Promise.all([
                    AsyncStorage.getItem('ATMOSPHERE_JOBS_CACHE'),
                    AsyncStorage.getItem('ATMOSPHERE_GRANTS_CACHE'),
                    AsyncStorage.getItem('ATMOSPHERE_EVENTS_CACHE'),
                ]);

                // Try to fetch role, but don't block if it fails
                const rolePromise = api.fetchAndStoreUserRole().catch(() => AsyncStorage.getItem('role'));

                const [[cachedJobs, cachedGrants, cachedEvents], role] = await Promise.all([loadCachePromise, rolePromise]);

                if (mounted) {
                    if (role) setUserRole(role);
                    if (cachedJobs) setJobs(JSON.parse(cachedJobs));
                    if (cachedGrants) setGrants(JSON.parse(cachedGrants));
                    if (cachedEvents) setEvents(JSON.parse(cachedEvents));
                }
            } catch (e) {
                console.warn('Initialization error', e);
            } finally {
                if (mounted) setInitialLoadDone(true); // Always allow standard fetch to proceed
            }
        })();
        return () => { mounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch Lists
    const loadJobs = async (skip = 0) => {
        if (skip === 0) setJobsLoading(true);
        try {
            const data = await api.fetchJobs(JOBS_LIMIT, skip);
            if (skip === 0) {
                setJobs(data);
                AsyncStorage.setItem('ATMOSPHERE_JOBS_CACHE', JSON.stringify(data)).catch(() => { });
                setJobsRefreshed(true);
            } else {
                setJobs(prev => [...prev, ...data]);
            }
            setJobsHasMore(data.length >= JOBS_LIMIT);
            setJobsSkip(skip + JOBS_LIMIT);
        } catch (e) { console.warn('Jobs load fail', e); }
        finally { setJobsLoading(false); }
    };

    const loadGrants = async (skip = 0) => {
        if (skip === 0) setGrantsLoading(true);
        try {
            const data = await api.fetchGrants(JOBS_LIMIT, skip);
            if (skip === 0) {
                setGrants(data);
                AsyncStorage.setItem('ATMOSPHERE_GRANTS_CACHE', JSON.stringify(data)).catch(() => { });
                setGrantsRefreshed(true);
            } else {
                setGrants(prev => [...prev, ...data]);
            }
            setGrantsHasMore(data.length >= JOBS_LIMIT);
            setGrantsSkip(skip + JOBS_LIMIT);
        } catch (e) { console.warn('Grants load fail', e); }
        finally { setGrantsLoading(false); }
    };

    const loadEvents = async (skip = 0) => {
        if (skip === 0) setEventsLoading(true);
        try {
            const data = await api.fetchEvents(JOBS_LIMIT, skip);
            if (skip === 0) {
                setEvents(data);
                AsyncStorage.setItem('ATMOSPHERE_EVENTS_CACHE', JSON.stringify(data)).catch(() => { });
                setEventsRefreshed(true);
            } else {
                setEvents(prev => [...prev, ...data]);
            }
            setEventsHasMore(data.length >= JOBS_LIMIT);
            setEventsSkip(skip + JOBS_LIMIT);
        } catch (e) { console.warn('Events load fail', e); }
        finally { setEventsLoading(false); }
    };

    // Trigger initial fetches when cache check is done
    // Trigger initial fetches based on active tab
    useEffect(() => {
        if (!initialLoadDone) return;

        if (activeTab === 'Jobs' && !jobsRefreshed) {
            loadJobs(0);
        } else if (activeTab === 'Grants' && !grantsRefreshed) {
            loadGrants(0);
        } else if (activeTab === 'Events' && !eventsRefreshed) {
            loadEvents(0);
        }
    }, [initialLoadDone, activeTab]);

    // Only show plus icon for startups and investors
    const showPlus = typeof userRole === 'string' && (userRole.toLowerCase() === 'startup' || userRole.toLowerCase() === 'investor');

    const handlePlusPress = () => setModalVisible(true);
    const handleFormChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const handleSubmit = async () => {
        setPostLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const baseUrl = await getBaseUrl();

            let endpoint = '';
            let payload = {};
            if (activeTab === 'Jobs') {
                endpoint = '/api/jobs';
                payload = {
                    title: form.title, sector: form.sector, locationType: form.locationType,
                    employmentType: form.employmentType, compensation: form.compensation, requirements: form.requirements,
                };
            } else if (activeTab === 'Grants') {
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
            }

            const res = await fetch(`${baseUrl}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Failed to post');

            setModalVisible(false);
            setForm({
                title: '', sector: '', locationType: '', employmentType: '', compensation: '', requirements: '',
                name: '', organization: '', location: '', amount: '', deadline: '', type: '', description: '', url: '', organizer: '', date: '', time: '',
            });
            Alert.alert('Success', `${activeTab.slice(0, -1)} posted successfully!`);

            // Refresh current tab
            if (activeTab === 'Jobs') loadJobs(0);
            else if (activeTab === 'Grants') loadGrants(0);
            else if (activeTab === 'Events') loadEvents(0);

        } catch (e) {
            Alert.alert('Error', e.message || 'Failed to post');
        }
        setPostLoading(false);
    };

    const loadMore = () => {
        if (activeTab === 'Jobs') {
            if (!jobsHasMore || jobsLoading) return;
            loadJobs(jobsSkip);
        } else if (activeTab === 'Grants') {
            if (!grantsHasMore || grantsLoading) return;
            loadGrants(grantsSkip);
        } else if (activeTab === 'Events') {
            if (!eventsHasMore || eventsLoading) return;
            loadEvents(eventsSkip);
        }
    };

    // Generic list renderer
    const renderList = () => {
        let data = [];
        let type = '';
        let loading = false;

        if (activeTab === 'Jobs') { data = jobs; type = 'Job'; loading = jobsLoading && jobs.length === 0; }
        else if (activeTab === 'Grants') { data = grants; type = 'Grant'; loading = grantsLoading && grants.length === 0; }
        else if (activeTab === 'Events') { data = events; type = 'Event'; loading = eventsLoading && events.length === 0; }

        if (loading && data.length === 0) {
            return (
                <View style={{ marginTop: 40, alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            );
        }

        return (
            <FlatList
                data={data}
                keyExtractor={(item) => String(item._id || item.id)}
                contentContainerStyle={{ paddingBottom: 80 }}
                renderItem={({ item }) => (
                    <OpportunityCard
                        item={item}
                        type={type}
                        expanded={expandedId === (item._id || item.id)}
                        onExpand={() => setExpandedId(expandedId === (item._id || item.id) ? null : (item._id || item.id))}
                    />
                )}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={() => {
                    // Show spinner at bottom if loading more
                    const isLoadingMore = (activeTab === 'Jobs' && jobsLoading) || (activeTab === 'Grants' && grantsLoading) || (activeTab === 'Events' && eventsLoading);
                    if (isLoadingMore && data.length > 0) return <ActivityIndicator style={{ marginVertical: 20 }} color={theme.primary} />;
                    if (data.length === 0) return <Text style={styles.emptyText}>No {type.toLowerCase()}s found.</Text>;
                    return null;
                }}
            />
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.tabBar}>
                {TABS.map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {renderList()}

            {showPlus && (
                <TouchableOpacity style={styles.floatingPlus} onPress={handlePlusPress}>
                    <Text style={styles.plusIcon}>＋</Text>
                </TouchableOpacity>
            )}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContainer}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Post a new {activeTab.slice(0, -1)}</Text>
                        {/* Jobs Form */}
                        {activeTab === 'Jobs' && (
                            <>
                                <TextInput style={styles.input} placeholder="Title" value={form.title} onChangeText={v => handleFormChange('title', v)} />
                                <TextInput style={styles.input} placeholder="Sector" value={form.sector} onChangeText={v => handleFormChange('sector', v)} />
                                <TextInput style={styles.input} placeholder="Location Type" value={form.locationType} onChangeText={v => handleFormChange('locationType', v)} />
                                <TextInput style={styles.input} placeholder="Employment Type" value={form.employmentType} onChangeText={v => handleFormChange('employmentType', v)} />
                                <TextInput style={styles.input} placeholder="Compensation" value={form.compensation} onChangeText={v => handleFormChange('compensation', v)} />
                                <TextInput style={[styles.input, { height: 60 }]} placeholder="Requirements" value={form.requirements} onChangeText={v => handleFormChange('requirements', v)} multiline />
                            </>
                        )}
                        {/* Grants Form */}
                        {activeTab === 'Grants' && (
                            <>
                                <TextInput style={styles.input} placeholder="Name" value={form.name} onChangeText={v => handleFormChange('name', v)} />
                                <TextInput style={styles.input} placeholder="Organization" value={form.organization} onChangeText={v => handleFormChange('organization', v)} />
                                <TextInput style={styles.input} placeholder="Sector" value={form.sector} onChangeText={v => handleFormChange('sector', v)} />
                                <TextInput style={styles.input} placeholder="Location" value={form.location} onChangeText={v => handleFormChange('location', v)} />
                                <TextInput style={styles.input} placeholder="Amount" value={form.amount} onChangeText={v => handleFormChange('amount', v)} />
                                <TextInput style={styles.input} placeholder="Deadline (YYYY-MM-DD)" value={form.deadline} onChangeText={v => handleFormChange('deadline', v)} />
                                <TextInput style={styles.input} placeholder="Type (grant/incubator/accelerator)" value={form.type} onChangeText={v => handleFormChange('type', v)} />
                                <TextInput style={[styles.input, { height: 60 }]} placeholder="Description" value={form.description} onChangeText={v => handleFormChange('description', v)} multiline />
                                <TextInput style={styles.input} placeholder="URL" value={form.url} onChangeText={v => handleFormChange('url', v)} />
                            </>
                        )}
                        {/* Events Form */}
                        {activeTab === 'Events' && (
                            <>
                                <TextInput style={styles.input} placeholder="Name" value={form.name} onChangeText={v => handleFormChange('name', v)} />
                                <TextInput style={styles.input} placeholder="Organizer" value={form.organizer} onChangeText={v => handleFormChange('organizer', v)} />
                                <TextInput style={styles.input} placeholder="Location" value={form.location} onChangeText={v => handleFormChange('location', v)} />
                                <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD)" value={form.date} onChangeText={v => handleFormChange('date', v)} />
                                <TextInput style={styles.input} placeholder="Time (e.g. 18:00)" value={form.time} onChangeText={v => handleFormChange('time', v)} />
                                <TextInput style={[styles.input, { height: 60 }]} placeholder="Description" value={form.description} onChangeText={v => handleFormChange('description', v)} multiline />
                                <TextInput style={styles.input} placeholder="URL" value={form.url} onChangeText={v => handleFormChange('url', v)} />
                            </>
                        )}
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)} disabled={postLoading}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={postLoading}>
                                <Text style={styles.submitText}>{postLoading ? 'Posting...' : 'Submit'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 16, paddingHorizontal: 8 },
    tabBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, backgroundColor: '#f3f3f3', borderRadius: 16, padding: 4 },
    tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
    tabBtnActive: { backgroundColor: '#fff', elevation: 2 },
    tabText: { fontSize: 16, color: '#888' },
    tabTextActive: { color: '#222', fontWeight: 'bold' },
    scrollContent: { paddingBottom: 32 },
    card: { borderRadius: 16, backgroundColor: '#fff', marginBottom: 18, padding: 18, elevation: 3 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    logoBox: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#e3e3e3', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    logoText: { fontSize: 18, fontWeight: 'bold', color: '#007bff' },
    cardTitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 2 },
    cardCompany: { fontSize: 13, color: '#888', marginBottom: 2 },
    badge: { backgroundColor: '#f3f3f3', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
    badgeText: { fontSize: 11, color: '#007bff', fontWeight: 'bold' },
    cardDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    cardLocation: { fontSize: 13, color: '#666' },
    cardComp: { fontSize: 13, color: '#666' },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
    tag: { backgroundColor: '#e9ecef', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginRight: 4, marginBottom: 2 },
    tagText: { fontSize: 11, color: '#444' },
    cardDesc: { fontSize: 13, color: '#444' },
    moreLess: { color: '#007bff', fontSize: 12, marginTop: 2 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    applicants: { fontSize: 12, color: '#888' },
    applyBtn: { backgroundColor: '#007bff', borderRadius: 8, paddingHorizontal: 18, paddingVertical: 7 },
    applyBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
    expandedBox: { marginTop: 14, backgroundColor: '#f9f9f9', borderRadius: 10, padding: 14 },
    expandedTitle: { fontWeight: 'bold', marginBottom: 6, fontSize: 15 },
    expandedText: { fontSize: 13, marginBottom: 14, color: '#444' },
    sendBtn: { backgroundColor: '#28a745', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
    sendBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
    emptyText: { textAlign: 'center', color: '#888', marginTop: 32, fontSize: 16 },
    floatingPlus: {
        position: 'absolute',
        right: 18,
        bottom: 24,
        backgroundColor: '#007bff',
        borderRadius: 28,
        width: 56,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    plusIcon: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    modalBox: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
        fontSize: 15,
        backgroundColor: '#f9f9f9',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    cancelBtn: {
        backgroundColor: '#eee',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 18,
    },
    cancelText: {
        color: '#888',
        fontSize: 15,
    },
    submitBtn: {
        backgroundColor: '#007bff',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 18,
    },
    submitText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
    },
});

export default Jobs;
