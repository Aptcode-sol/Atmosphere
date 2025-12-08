import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
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
    const [jobs, setJobs] = useState([]);
    const [grants, setGrants] = useState([]);
    const [events, setEvents] = useState([]);
    const [expandedId, setExpandedId] = useState(null);
    const [userRole, setUserRole] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [form, setForm] = useState({
        // Jobs
        title: '',
        sector: '',
        locationType: '',
        employmentType: '',
        compensation: '',
        requirements: '',
        // Grants
        name: '',
        organization: '',
        location: '',
        amount: '',
        deadline: '',
        type: '',
        description: '',
        url: '',
        // Events
        organizer: '',
        date: '',
        time: '',
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                // Fetch and store role using api.ts helper
                let role = await fetchAndStoreUserRole();
                if (!role) {
                    // fallback: try to get from AsyncStorage
                    role = await AsyncStorage.getItem('role');
                }
                setUserRole(role || '');
                console.log('User role:', role); // debug log
                const baseUrl = await getBaseUrl();
                const jobRes = await fetch(`${baseUrl}/api/jobs`, { headers: { 'Authorization': `Bearer ${token}` } });
                const grantRes = await fetch(`${baseUrl}/api/grants`, { headers: { 'Authorization': `Bearer ${token}` } });
                const eventRes = await fetch(`${baseUrl}/api/events`, { headers: { 'Authorization': `Bearer ${token}` } });
                const jobData = await jobRes.json();
                const grantData = await grantRes.json();
                const eventData = await eventRes.json();
                setJobs(jobData.jobs || []);
                setGrants(grantData);
                setEvents(eventData);
            } catch (e) {
                Alert.alert('Error', 'Failed to fetch opportunities');
            }
        };
        fetchData();
    }, []);

    const renderTabContent = () => {
        let data = [];
        let type = '';
        if (activeTab === 'Jobs') {
            data = jobs;
            type = 'Job';
        } else if (activeTab === 'Grants') {
            data = grants;
            type = 'Grant';
        } else if (activeTab === 'Events') {
            data = events;
            type = 'Event';
        }
        if (!data.length) {
            return <Text style={styles.emptyText}>No {type.toLowerCase()}s found.</Text>;
        }
        return data.map((item) => (
            <OpportunityCard
                key={item._id || item.id}
                item={item}
                type={type}
                expanded={expandedId === (item._id || item.id)}
                onExpand={() => setExpandedId(expandedId === (item._id || item.id) ? null : (item._id || item.id))}
            />
        ));
    };

    // Only show plus icon for startups and investors
    const showPlus = typeof userRole === 'string' && (userRole.toLowerCase() === 'startup' || userRole.toLowerCase() === 'investor');

    const handlePlusPress = () => {
        setModalVisible(true);
    };

    const handleFormChange = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            let endpoint = '';
            let payload = {};
            if (activeTab === 'Jobs') {
                endpoint = '/api/jobs';
                payload = {
                    title: form.title,
                    sector: form.sector,
                    locationType: form.locationType,
                    employmentType: form.employmentType,
                    compensation: form.compensation,
                    requirements: form.requirements,
                };
            } else if (activeTab === 'Grants') {
                endpoint = '/api/grants';
                payload = {
                    name: form.name,
                    organization: form.organization,
                    sector: form.sector,
                    location: form.location,
                    amount: form.amount,
                    deadline: form.deadline,
                    type: form.type,
                    description: form.description,
                    url: form.url,
                };
            } else if (activeTab === 'Events') {
                endpoint = '/api/events';
                payload = {
                    name: form.name,
                    organizer: form.organizer,
                    location: form.location,
                    date: form.date,
                    time: form.time,
                    description: form.description,
                    url: form.url,
                };
            }
            const token = await AsyncStorage.getItem('token');
            const baseUrl = await getBaseUrl();
            const res = await fetch(`${baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Failed to post');
            setModalVisible(false);
            setForm({
                title: '', sector: '', locationType: '', employmentType: '', compensation: '', requirements: '',
                name: '', organization: '', location: '', amount: '', deadline: '', type: '', description: '', url: '', organizer: '', date: '', time: '',
            });
            Alert.alert('Success', `${activeTab.slice(0, -1)} posted successfully!`);
        } catch (e) {
            Alert.alert('Error', e.message || 'Failed to post');
        }
        setLoading(false);
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
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {renderTabContent()}
            </ScrollView>
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
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)} disabled={loading}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
                                <Text style={styles.submitText}>{loading ? 'Posting...' : 'Submit'}</Text>
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
