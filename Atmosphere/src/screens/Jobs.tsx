import React, { useState, useEffect, useContext, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions, RefreshControl } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBaseUrl } from '../lib/config';

const TABS = ['Jobs', 'Grants', 'Events'];

function OpportunityCard({ item, type, onExpand, expanded }: { item: any, type: string, onExpand: () => void, expanded: boolean }) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { theme } = useContext(ThemeContext) as any;
    const [showFullDesc, setShowFullDesc] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const tags = [item.sector, item.employmentType, item.locationType, item.companyType].filter(Boolean);

    // The user explicitly requested a "dark theme app" experience matching a specific image.
    // We force these "Pitch Black" styles regardless of the theme context's current mode
    // to ensure the premium look is always visible.
    const isDark = true; // Forced true per user requirement
    const cardBg = '#000000'; // Pitch black
    const borderColor = '#333';
    const textColor = '#f2f2f2';
    const subTextColor = '#888';
    const badgeBg = '#333';
    const applyBtnBg = '#333';
    const applyBtnText = '#fff';

    // Memoized styles to avoid inline style warnings
    const titleRowStyle = useMemo(() => ({ flex: 1, marginRight: 8 }), []);
    const metaItemLeftStyle = useMemo(() => ({ fontSize: 14, color: subTextColor }), [subTextColor]);
    const metaItemRightStyle = useMemo(() => ({ marginLeft: 16, fontSize: 14, color: subTextColor }), [subTextColor]);
    const expandedBgStyle = useMemo(() => ({ backgroundColor: isDark ? '#111' : '#f9f9f9', borderColor }), [isDark, borderColor]);

    return (
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderColor }]}>
            {/* Row 1: Title and Badge */}
            <View style={styles.cardHeaderRow}>
                <View style={titleRowStyle}>
                    <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={1}>{item.title || item.roleTitle}</Text>
                    <Text style={[styles.cardCompany, { color: subTextColor }]}>{item.poster?.displayName || item.startupName || item.organization || 'Unknown Organization'}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                    <Text style={[styles.badgeText, { color: textColor }]}>{type.toLowerCase()}</Text>
                </View>
            </View>

            {/* Row 2: Description */}
            <View style={{ marginBottom: 12 }}>
                <Text style={[styles.cardDesc, { color: subTextColor }]} numberOfLines={showFullDesc ? undefined : 2}>
                    {item.requirements || item.description || 'No description provided.'}
                </Text>
                {(item.requirements?.length > 80 || item.description?.length > 80) && (
                    <TouchableOpacity onPress={() => setShowFullDesc(!showFullDesc)}>
                        <Text style={styles.moreLess}>{showFullDesc ? 'Less' : 'More'}</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Row 3: Meta (Location, Date) */}
            <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                    <Text style={metaItemLeftStyle}>📍 {item.locationType || item.location || 'Remote'}</Text>
                </View>
                {item.deadline || item.date ? (
                    <View style={[styles.metaItem, { marginLeft: 16 }]}>
                        <Text style={metaItemRightStyle}>📅 {item.deadline || item.date}</Text>
                    </View>
                ) : null}
            </View>

            {/* Row 4: Bottom Action Bar (Price/Comp left, Apply right) */}
            <View style={styles.actionRow}>
                <Text style={[styles.compensationText, { color: textColor }]}>
                    {item.compensation || item.amount || (type === 'Event' ? (item.time || 'Free') : 'Unpaid')}
                </Text>

                <TouchableOpacity style={[styles.applyBtn, { backgroundColor: applyBtnBg }]} onPress={onExpand}>
                    <Text style={[styles.applyBtnText, { color: applyBtnText }]}>{expanded ? 'Hide' : 'Apply ↗'}</Text>
                </TouchableOpacity>
            </View>

            {/* Expanded Section */}
            {expanded && (
                <View style={[styles.expandedBox, expandedBgStyle]}>
                    <Text style={[styles.expandedTitle, { color: textColor }]}>Application</Text>
                    <Text style={[styles.expandedText, { color: subTextColor }]}>Answer custom questions and upload resume (UI coming soon)</Text>
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
    const [refreshing, setRefreshing] = useState(false);

    const JOBS_LIMIT = 20;

    // Memoized styles to avoid inline style warnings
    const emptyLoaderStyle = useMemo(() => ({ width: Dimensions.get('window').width, alignItems: 'center', marginTop: 40 }), []);
    const flatListContentStyle = useMemo(() => ({ paddingBottom: 80, paddingHorizontal: 16 }), []);
    const filterButtonTextStyle = useMemo(() => ({ fontSize: 14, fontWeight: 'bold' }), []);
    const loadMoreLoaderStyle = useMemo(() => ({ marginVertical: 20 }), []);
    const containerBgStyle = useMemo(() => ({ backgroundColor: '#000000' }), []);
    const tabBarBgStyle = useMemo(() => ({ backgroundColor: '#111' }), []);
    const tabBtnActiveStyle = useMemo(() => ({ backgroundColor: '#333' }), []);
    const tabTextActiveStyle = useMemo(() => ({ color: '#fff', fontWeight: 'bold' }), []);
    const tabTextInactiveStyle = useMemo(() => ({ color: '#888', fontWeight: 'normal' }), []);

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
        if (jobsLoading) return; // Prevent concurrent requests
        if (skip === 0) setJobsLoading(true);
        else setJobsLoading(true);
        try {
            const data = await api.fetchJobs(JOBS_LIMIT, skip);
            if (skip === 0) {
                setJobs(data);
                AsyncStorage.setItem('ATMOSPHERE_JOBS_CACHE', JSON.stringify(data)).catch(() => { });
                setJobsRefreshed(true);
            } else {
                // Deduplicate when appending
                setJobs(prev => {
                    const existingIds = new Set(prev.map(item => item._id || item.id));
                    const newItems = data.filter(item => !existingIds.has(item._id || item.id));
                    return [...prev, ...newItems];
                });
            }
            setJobsHasMore(data.length >= JOBS_LIMIT);
            setJobsSkip(skip + JOBS_LIMIT);
        } catch (e) { console.warn('Jobs load fail', e); }
        finally { setJobsLoading(false); }
    };

    const loadGrants = async (skip = 0) => {
        if (grantsLoading) return; // Prevent concurrent requests
        if (skip === 0) setGrantsLoading(true);
        else setGrantsLoading(true);
        try {
            const data = await api.fetchGrants(JOBS_LIMIT, skip);
            if (skip === 0) {
                setGrants(data);
                AsyncStorage.setItem('ATMOSPHERE_GRANTS_CACHE', JSON.stringify(data)).catch(() => { });
                setGrantsRefreshed(true);
            } else {
                // Deduplicate when appending
                setGrants(prev => {
                    const existingIds = new Set(prev.map(item => item._id || item.id));
                    const newItems = data.filter(item => !existingIds.has(item._id || item.id));
                    return [...prev, ...newItems];
                });
            }
            setGrantsHasMore(data.length >= JOBS_LIMIT);
            setGrantsSkip(skip + JOBS_LIMIT);
        } catch (e) { console.warn('Grants load fail', e); }
        finally { setGrantsLoading(false); }
    };

    const loadEvents = async (skip = 0) => {
        if (eventsLoading) return; // Prevent concurrent requests
        if (skip === 0) setEventsLoading(true);
        else setEventsLoading(true);
        try {
            const data = await api.fetchEvents(JOBS_LIMIT, skip);
            if (skip === 0) {
                setEvents(data);
                AsyncStorage.setItem('ATMOSPHERE_EVENTS_CACHE', JSON.stringify(data)).catch(() => { });
                setEventsRefreshed(true);
            } else {
                // Deduplicate when appending
                setEvents(prev => {
                    const existingIds = new Set(prev.map(item => item._id || item.id));
                    const newItems = data.filter(item => !existingIds.has(item._id || item.id));
                    return [...prev, ...newItems];
                });
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

            const res = await fetch(`${baseUrl}${endpoint} `, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token} ` },
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

    const { width } = Dimensions.get('window');
    const flatListRef = React.useRef<FlatList>(null);

    // Sync tab press with scroll
    const handleTabPress = (tab: string, index: number) => {
        setActiveTab(tab);
        flatListRef.current?.scrollToIndex({ index, animated: true });
    };

    // Sync scroll with active tab state
    const handleMomentumScrollEnd = (event: any) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        const newTab = TABS[index];
        if (newTab && newTab !== activeTab) {
            setActiveTab(newTab);
        }
    };

    // Generic list renderer for a specific tab
    const renderTabContent = ({ item: tabName }: { item: string }) => {
        let data: any[] = [];
        let type = '';
        let loading = false;

        if (tabName === 'Jobs') {
            data = jobs; type = 'Job'; loading = jobsLoading && jobs.length === 0;
        } else if (tabName === 'Grants') {
            data = grants; type = 'Grant'; loading = grantsLoading && grants.length === 0;
        } else if (tabName === 'Events') {
            data = events; type = 'Event'; loading = eventsLoading && events.length === 0;
        }

        const loadMoreCurrent = () => {
            if (tabName === 'Jobs') { if (!jobsHasMore || jobsLoading) return; loadJobs(jobsSkip); }
            else if (tabName === 'Grants') { if (!grantsHasMore || grantsLoading) return; loadGrants(grantsSkip); }
            else if (tabName === 'Events') { if (!eventsHasMore || eventsLoading) return; loadEvents(eventsSkip); }
        };

        const onRefreshCurrent = async () => {
            setRefreshing(true);
            if (tabName === 'Jobs') await loadJobs(0);
            else if (tabName === 'Grants') await loadGrants(0);
            else if (tabName === 'Events') await loadEvents(0);
            setRefreshing(false);
        };

        if (loading) {
            return (
                <View style={emptyLoaderStyle}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            );
        }

        return (
            <View style={{ width }}>
                <FlatList
                    data={data}
                    keyExtractor={(item) => String(item._id || item.id)}
                    contentContainerStyle={flatListContentStyle}
                    renderItem={({ item }) => (
                        <OpportunityCard
                            item={item}
                            type={type}
                            expanded={expandedId === (item._id || item.id)}
                            onExpand={() => setExpandedId(expandedId === (item._id || item.id) ? null : (item._id || item.id))}
                        />
                    )}
                    onEndReached={loadMoreCurrent}
                    onEndReachedThreshold={0.5}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefreshCurrent}
                            tintColor={theme.primary}
                            title="Release to refresh"
                            titleColor={theme.text}
                        />
                    }
                    ListHeaderComponent={() => (
                        <View style={styles.listHeader}>
                            <Text style={[styles.resultCount, { color: '#fff' }]}>Total {type.toLowerCase()}s: {data.length}</Text>
                            <TouchableOpacity>
                                <Text style={[filterButtonTextStyle, { color: theme.primary }]}>Filter</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    ListFooterComponent={() => {
                        const isLoadingMore = (tabName === 'Jobs' && jobsLoading) || (tabName === 'Grants' && grantsLoading) || (tabName === 'Events' && eventsLoading);
                        if (isLoadingMore && data.length > 0) return <ActivityIndicator style={loadMoreLoaderStyle} color={theme.primary} />;
                        if (data.length === 0) return <Text style={styles.emptyText}>No {type.toLowerCase()}s found.</Text>;
                        return null;
                    }}
                />
            </View>
        );
    };

    return (
        <View style={[styles.container, containerBgStyle]}>
            <View style={[styles.tabBar, tabBarBgStyle]}>
                {TABS.map((tab, index) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tabBtn, activeTab === tab && tabBtnActiveStyle]}
                        onPress={() => handleTabPress(tab, index)}
                    >
                        <Text style={[styles.tabText, activeTab === tab ? tabTextActiveStyle : tabTextInactiveStyle]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

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
                getItemLayout={(data, index) => ({ length: width, offset: width * index, index })}
            />
            {/* Modal and FAB remain unchanged below... */}

            {/* Always show plus for now if role exists, or stick to logic but ensure zIndex */}
            {/* Adding zIndex to style below */}
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
                    <View style={[styles.modalBox, { backgroundColor: theme.cardBackground }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Post a new {activeTab.slice(0, -1)}</Text>
                        {/* Jobs Form */}
                        {activeTab === 'Jobs' && (
                            <>
                                <TextInput placeholderTextColor={theme.placeholder} style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} placeholder="Title" value={form.title} onChangeText={v => handleFormChange('title', v)} />
                                <TextInput placeholderTextColor={theme.placeholder} style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} placeholder="Sector" value={form.sector} onChangeText={v => handleFormChange('sector', v)} />
                                <TextInput placeholderTextColor={theme.placeholder} style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} placeholder="Location Type" value={form.locationType} onChangeText={v => handleFormChange('locationType', v)} />
                                <TextInput placeholderTextColor={theme.placeholder} style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} placeholder="Employment Type" value={form.employmentType} onChangeText={v => handleFormChange('employmentType', v)} />
                                <TextInput placeholderTextColor={theme.placeholder} style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} placeholder="Compensation" value={form.compensation} onChangeText={v => handleFormChange('compensation', v)} />
                                <TextInput placeholderTextColor={theme.placeholder} style={[styles.input, { height: 60, color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} placeholder="Requirements" value={form.requirements} onChangeText={v => handleFormChange('requirements', v)} multiline />
                            </>
                        )}
                        {/* Grants Form */}
                        {activeTab === 'Grants' && (
                            <>
                                <TextInput placeholderTextColor={theme.placeholder} style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} placeholder="Name" value={form.name} onChangeText={v => handleFormChange('name', v)} />
                                <TextInput placeholderTextColor={theme.placeholder} style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} placeholder="Organization" value={form.organization} onChangeText={v => handleFormChange('organization', v)} />
                                <TextInput placeholderTextColor={theme.placeholder} style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} placeholder="Sector" value={form.sector} onChangeText={v => handleFormChange('sector', v)} />
                                <TextInput placeholderTextColor={theme.placeholder} style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} placeholder="Location" value={form.location} onChangeText={v => handleFormChange('location', v)} />
                                <TextInput placeholderTextColor={theme.placeholder} style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} placeholder="Amount" value={form.amount} onChangeText={v => handleFormChange('amount', v)} />
                                <TextInput placeholderTextColor={theme.placeholder} style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} placeholder="Deadline (YYYY-MM-DD)" value={form.deadline} onChangeText={v => handleFormChange('deadline', v)} />
                                <TextInput placeholderTextColor={theme.placeholder} style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} placeholder="Type (grant/incubator/accelerator)" value={form.type} onChangeText={v => handleFormChange('type', v)} />
                                <TextInput placeholderTextColor={theme.placeholder} style={[styles.input, { height: 60, color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} placeholder="Description" value={form.description} onChangeText={v => handleFormChange('description', v)} multiline />
                                <TextInput placeholderTextColor={theme.placeholder} style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} placeholder="URL" value={form.url} onChangeText={v => handleFormChange('url', v)} />
                            </>
                        )}
                        {/* Events Form */}
                        {activeTab === 'Events' && (
                            <>
                                <TextInput placeholderTextColor={theme.placeholder} style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} placeholder="Name" value={form.name} onChangeText={v => handleFormChange('name', v)} />
                                <TextInput placeholderTextColor={theme.placeholder} style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} placeholder="Organizer" value={form.organizer} onChangeText={v => handleFormChange('organizer', v)} />
                                <TextInput placeholderTextColor={theme.placeholder} style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} placeholder="Location" value={form.location} onChangeText={v => handleFormChange('location', v)} />
                                <TextInput placeholderTextColor={theme.placeholder} style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} placeholder="Date (YYYY-MM-DD)" value={form.date} onChangeText={v => handleFormChange('date', v)} />
                                <TextInput placeholderTextColor={theme.placeholder} style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} placeholder="Time (e.g. 18:00)" value={form.time} onChangeText={v => handleFormChange('time', v)} />
                                <TextInput placeholderTextColor={theme.placeholder} style={[styles.input, { height: 60, color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} placeholder="Description" value={form.description} onChangeText={v => handleFormChange('description', v)} multiline />
                                <TextInput placeholderTextColor={theme.placeholder} style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} placeholder="URL" value={form.url} onChangeText={v => handleFormChange('url', v)} />
                            </>
                        )}
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: theme.border }]} onPress={() => setModalVisible(false)} disabled={postLoading}>
                                <Text style={[styles.cancelText, { color: theme.text }]}>Cancel</Text>
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
    container: { flex: 1, paddingTop: 16, paddingHorizontal: 0 }, // Removed paddingHorizontal for full width swipe
    tabBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, borderRadius: 25, padding: 4, marginHorizontal: 12 }, // Moved margin to here
    tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    tabText: { fontSize: 14 },
    listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 },
    resultCount: { fontSize: 14, opacity: 0.7 },

    // Card Styles
    card: { borderRadius: 16, marginBottom: 16, padding: 16, borderWidth: 1 },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    cardCompany: { fontSize: 13 },
    badge: { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
    badgeText: { fontSize: 11, fontWeight: '600' },

    cardDesc: { fontSize: 13, lineHeight: 18 },
    moreLess: { color: '#007bff', fontSize: 12, marginTop: 4 },

    metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    metaItem: { flexDirection: 'row', alignItems: 'center' },

    actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
    compensationText: { fontSize: 18, fontWeight: 'bold' },
    applyBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#444' },
    applyBtnText: { fontSize: 13, fontWeight: '600' },

    expandedBox: { marginTop: 16, borderRadius: 12, padding: 16, borderWidth: 1 },
    expandedTitle: { fontWeight: 'bold', marginBottom: 8, fontSize: 15 },
    expandedText: { fontSize: 13, marginBottom: 16 },
    sendBtn: { backgroundColor: '#28a745', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
    sendBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },

    // Empty & Loading
    emptyText: { textAlign: 'center', color: '#888', marginTop: 32, fontSize: 16 },

    // FAB
    floatingPlus: {
        position: 'absolute', right: 18, bottom: 24, backgroundColor: '#007bff', borderRadius: 28, width: 56, height: 56,
        alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4,
        zIndex: 9999, // FIX: Ensure it sits above the list
    },
    plusIcon: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 2 },

    // Modal
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
    modalBox: { width: '90%', borderRadius: 16, padding: 20, elevation: 8 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
    input: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 15 },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    cancelBtn: { borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20 },
    cancelText: { fontSize: 15, fontWeight: '600' },
    submitBtn: { backgroundColor: '#007bff', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});

export default Jobs;
