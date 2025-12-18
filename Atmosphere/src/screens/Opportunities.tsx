import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
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
import { ThemeContext } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBaseUrl } from '../lib/config';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Tab order matches web: Grants, Events, Team
const TABS = ['Grants', 'Events', 'Team'];

// Filter options matching web
const sectors = ['All Sectors', 'Verified Startup'];
const companyTypes = [
    'Artificial Intelligence', 'Blockchain', 'HealthTech', 'FinTech',
    'EdTech', 'AgriTech', 'AI Research', 'Retail', 'Manufacturing',
];
const locations = [
    'All Locations', 'USA', 'UK', 'Europe', 'Asia', 'Global', 'Germany',
    'Singapore', 'San Francisco, USA', 'Online', 'London', 'Berlin, Germany',
    'Amsterdam, Netherlands', 'Dubai, UAE', 'Tokyo, Japan', 'New York',
];
const grantTypes = ['all', 'grant', 'incubator', 'accelerator'];
const eventTypes = ['all', 'physical', 'virtual', 'hybrid', 'e-summit', 'conference', 'workshop', 'networking'];
const remoteOptions = ['all', 'remote', 'on-site'];
const employmentOptions = ['all', 'Full-time', 'Part-time'];

// Helper to get badge variant color
const getBadgeColor = (type: string) => {
    switch (type) {
        case 'grant': return '#3b82f6';
        case 'incubator': return '#8b5cf6';
        case 'accelerator': return '#22c55e';
        case 'physical': return '#3b82f6';
        case 'virtual': return '#8b5cf6';
        case 'hybrid': return '#f59e0b';
        default: return '#6b7280';
    }
};

// Grant/Event Card Component (matches web design)
function GrantEventCard({ item, type }: { item: any; type: 'Grant' | 'Event' }) {
    const [expanded, setExpanded] = useState(false);
    const [applied, setApplied] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', notes: '' });
    const [showFullDesc, setShowFullDesc] = useState(false);

    const icon = type === 'Grant' ? '' : '';
    const companyName = type === 'Grant' ? (item.organization || 'Unknown Org') : (item.organizer || 'Unknown Host');

    const cardBg = '#000';
    const borderColor = '#333';
    const textColor = '#f2f2f2';
    const subTextColor = '#888';
    const primaryColor = '#3b82f6';

    const description = item.description || 'No description provided.';
    const badgeType = item.type || type.toLowerCase();
    const badgeColor = getBadgeColor(badgeType);

    const handleApply = () => {
        if (!form.name || !form.email) {
            Alert.alert('Error', 'Please fill in required fields');
            return;
        }
        // Mock API call
        setTimeout(() => {
            setApplied(true);
            Alert.alert('Success', `Successfully ${type === 'Grant' ? 'applied' : 'registered'}!`);
            setExpanded(false);
        }, 1000);
    };

    return (
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            {/* Header: Title + Badge */}
            {/* Header: Company + Badge (Matches RoleCard) */}
            {/* Header: Company + Badge (Matches RoleCard) */}
            <View style={styles.cardHeaderRow}>
                <View style={styles.companyRow}>
                    <View style={[styles.companyIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                        <MaterialIcons name={type === 'Grant' ? 'monetization-on' : 'event'} size={24} color="#3b82f6" />
                    </View>
                    <View style={styles.companyInfo}>
                        <View style={styles.companyNameRow}>
                            <Text style={[styles.companyName, { color: textColor }]} numberOfLines={1}>
                                {companyName}
                            </Text>
                            <View style={[styles.myAdBadge, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                                <Text style={[styles.myAdText, { color: '#22c55e' }]}>{badgeType}</Text>
                            </View>
                        </View>
                        <Text style={[styles.companyType, { color: subTextColor }]}>
                            {item.sector || 'Various Sectors'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Title + Location (Matches RoleCard roleSection) */}
            <View style={styles.roleSection}>
                <Text style={[styles.roleTitle, { color: textColor }]} numberOfLines={2}>
                    {item.name || item.title}
                </Text>
                <View style={styles.locationRow}>
                    <View style={styles.metaItem}>
                        <MaterialIcons name="place" size={14} color={subTextColor} style={{ marginRight: 4 }} />
                        <Text style={[styles.metaText, { color: subTextColor }]}>
                            {item.location || 'Remote'}
                        </Text>
                    </View>
                    <View style={styles.metaItem}>
                        <MaterialIcons name="event" size={14} color={subTextColor} style={{ marginRight: 4 }} />
                        <Text style={[styles.metaText, { color: subTextColor }]}>
                            {item.deadline || item.date || 'TBD'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Description */}
            <View style={styles.descContainer}>
                <Text style={[styles.cardDesc, { color: subTextColor }]} numberOfLines={expanded || showFullDesc ? undefined : 2}>
                    {description}
                </Text>
                {!expanded && description.length > 80 && (
                    <TouchableOpacity onPress={() => setShowFullDesc(!showFullDesc)}>
                        <Text style={styles.moreLess}>{showFullDesc ? 'Less' : 'More'}</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Expanded Form Section */}
            {expanded ? (
                <View style={[styles.expandedSection, { borderColor, backgroundColor: '#111' }]}>
                    {!applied ? (
                        <>
                            <Text style={[styles.formHeader, { color: textColor }]}>
                                {type === 'Grant' ? 'Application Details' : 'Registration Details'}
                            </Text>

                            <TextInput
                                style={[styles.input, { color: textColor, borderColor }]}
                                placeholder="Full Name *"
                                placeholderTextColor={subTextColor}
                                value={form.name}
                                onChangeText={t => setForm({ ...form, name: t })}
                            />
                            <TextInput
                                style={[styles.input, { color: textColor, borderColor }]}
                                placeholder="Email Address *"
                                placeholderTextColor={subTextColor}
                                value={form.email}
                                onChangeText={t => setForm({ ...form, email: t })}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            {type === 'Grant' && (
                                <TextInput
                                    style={[styles.input, { color: textColor, borderColor, minHeight: 80, textAlignVertical: 'top' }]}
                                    placeholder="Why are you a good fit? (Optional)"
                                    placeholderTextColor={subTextColor}
                                    value={form.notes}
                                    onChangeText={t => setForm({ ...form, notes: t })}
                                    multiline
                                />
                            )}

                            <View style={styles.formActions}>
                                <TouchableOpacity
                                    style={[styles.cancelBtn, { borderColor }]}
                                    onPress={() => setExpanded(false)}
                                >
                                    <Text style={styles.cancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.submitBtn, { backgroundColor: '#fff' }]}
                                    onPress={handleApply}
                                >
                                    <Text style={[styles.submitText, { color: '#000' }]}>
                                        {type === 'Grant' ? 'Submit Application' : 'Register Now'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        <View style={styles.appliedContainer}>
                            <Text style={styles.appliedText}>✓ {type === 'Grant' ? 'Application Sent' : 'Registered Successfully'}</Text>
                        </View>
                    )}
                </View>
            ) : (
                /* Action Row when NOT expanded */
                <View style={[styles.footerRow, { borderTopColor: borderColor }]}>
                    {/* Left side info: Amount or Attendees */}
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {type === 'Grant' && (
                            <Text style={[styles.employmentText, { color: '#22c55e', fontWeight: '600' }]}>
                                {item.amount || 'Varies'}
                            </Text>
                        )}
                        {type === 'Event' && item.attendees && (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <MaterialIcons name="group" size={14} color={subTextColor} style={{ marginRight: 4 }} />
                                <Text style={[styles.employmentText, { color: subTextColor }]}>
                                    {item.attendees}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Right side: Expand/Apply Button */}
                    {applied ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ color: '#22c55e', marginRight: 4 }}>✓ Applied</Text>
                        </View>
                    ) : (
                        <TouchableOpacity onPress={() => setExpanded(true)} style={styles.applicantsBtn}>
                            <Text style={[styles.applicantsText, { color: '#fff', fontWeight: 'bold', fontSize: 13 }]}>
                                {type === 'Grant' ? 'Apply Now' : 'Register'}
                            </Text>
                            <Text style={[styles.chevron, { color: '#fff', marginLeft: 4, transform: [{ rotate: '-90deg' }] }]}>▼</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}

// Team/Role Card Component (matches web RoleCard design)
function RoleCard({
    item,
    isMyAd = false,
    expanded = false,
    onExpand,
}: {
    item: any;
    isMyAd?: boolean;
    expanded?: boolean;
    onExpand: () => void;
}) {
    const [showFullDesc, setShowFullDesc] = useState(false);
    const [applied, setApplied] = useState(false);
    const [applicantsCount, setApplicantsCount] = useState(item.applicantsCount || 0);
    const [questionAnswers, setQuestionAnswers] = useState<string[]>(
        (item.customQuestions || []).map(() => '')
    );

    const cardBg = '#000000';
    const borderColor = '#333';
    const textColor = '#f2f2f2';
    const subTextColor = '#888';
    const primaryColor = '#3b82f6';

    const tags = ['AI', 'B2B', 'SaaS', 'Startup'];
    const description = item.description || item.requirements || 'No description provided.';

    const handleSubmit = () => {
        const customQuestions = item.customQuestions || [];
        const hasQuestions = customQuestions.some((q: string) => q?.trim() !== '');
        const answered = questionAnswers.every((ans, i) =>
            customQuestions[i] ? ans.trim() !== '' : true
        );

        if (hasQuestions && !answered) {
            Alert.alert('Error', 'Please answer all questions before submitting.');
            return;
        }

        setApplied(true);
        setApplicantsCount((prev: number) => prev + 1);
        Alert.alert('Success', 'Application sent successfully!');
    };

    return (
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            {/* Header: Company + Badge */}
            <View style={styles.cardHeaderRow}>
                <View style={styles.companyRow}>
                    <View style={styles.companyIcon}>
                        <MaterialIcons name="business" size={20} color="#3b82f6" />
                    </View>
                    <View style={styles.companyInfo}>
                        <View style={styles.companyNameRow}>
                            <Text style={[styles.companyName, { color: textColor }]} numberOfLines={1}>
                                {item.startupName || item.poster?.displayName || 'Unknown Startup'}
                            </Text>
                            {isMyAd && (
                                <View style={[styles.myAdBadge]}>
                                    <Text style={styles.myAdText}>My Ad</Text>
                                </View>
                            )}
                        </View>
                        <Text style={[styles.companyType, { color: subTextColor }]}>
                            {item.companyType || item.sector || 'Startup'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Role Title + Location */}
            <View style={styles.roleSection}>
                <Text style={[styles.roleTitle, { color: textColor }]} numberOfLines={2}>
                    {item.roleTitle || item.title}
                </Text>
                <View style={styles.locationRow}>
                    <View style={styles.metaItem}>
                        <MaterialIcons name="place" size={14} color={subTextColor} style={{ marginRight: 4 }} />
                        <Text style={[styles.metaText, { color: subTextColor }]}>
                            {item.location || item.locationType || 'Remote'}
                        </Text>
                    </View>
                    <Text style={[styles.remoteText, { color: item.isRemote ? primaryColor : subTextColor }]}>
                        {item.isRemote ? 'Remote' : 'On-site'}
                    </Text>
                </View>
            </View>

            {/* Description */}
            <View style={styles.descContainer}>
                <Text style={[styles.cardDesc, { color: subTextColor }]} numberOfLines={showFullDesc ? undefined : 2}>
                    {description}
                </Text>
                {description.length > 80 && (
                    <TouchableOpacity onPress={() => setShowFullDesc(!showFullDesc)}>
                        <Text style={styles.moreLess}>{showFullDesc ? 'Less' : 'More'}</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Tags */}
            <View style={styles.tagsRow}>
                {tags.map((tag, idx) => (
                    <View key={idx} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                    </View>
                ))}
            </View>

            {/* Footer: Applicants + Employment Type */}
            <View style={[styles.footerRow, { borderTopColor: borderColor }]}>
                <TouchableOpacity onPress={onExpand} style={styles.applicantsBtn}>
                    <Text style={[styles.chevron, { transform: [{ rotate: expanded ? '180deg' : '0deg' }] }]}>▼</Text>
                    <Text style={[styles.applicantsText, { color: subTextColor }]}>
                        {applicantsCount} applicants
                    </Text>
                </TouchableOpacity>
                <Text style={[styles.employmentText, { color: textColor }]}>
                    {item.employmentType || 'Full-time'} • {item.isRemote ? 'Remote' : 'On-site'}
                </Text>
            </View>

            {/* Expanded Application Section */}
            {expanded && (
                <View style={[styles.expandedSection, { backgroundColor: '#111', borderColor }]}>
                    {!applied ? (
                        <>
                            {/* Custom Questions */}
                            {(item.customQuestions || []).map((q: string, i: number) => (
                                <View key={i} style={styles.questionContainer}>
                                    <Text style={[styles.questionLabel, { color: textColor }]}>{q}</Text>
                                    <TextInput
                                        style={[styles.questionInput, { color: textColor, borderColor }]}
                                        placeholder="Your answer..."
                                        placeholderTextColor={subTextColor}
                                        value={questionAnswers[i]}
                                        onChangeText={(text) => {
                                            const updated = [...questionAnswers];
                                            updated[i] = text;
                                            setQuestionAnswers(updated);
                                        }}
                                        multiline
                                    />
                                </View>
                            ))}

                            {/* File Upload Placeholder */}
                            <View style={styles.uploadContainer}>
                                <Text style={[styles.uploadLabel, { color: textColor }]}>
                                    Attach Resume (Optional)
                                </Text>
                                <TouchableOpacity style={[styles.uploadBtn, { borderColor }]}>
                                    <Text style={[styles.uploadBtnText, { color: subTextColor }]}>
                                        Choose File
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Submit Button */}
                            <TouchableOpacity style={styles.sendBtn} onPress={handleSubmit}>
                                <Text style={styles.sendBtnText}>Send Application</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View style={styles.appliedContainer}>
                            <Text style={styles.appliedText}>✓ Application Sent Successfully</Text>
                            <Text style={[styles.appliedSubtext, { color: subTextColor }]}>
                                You can track your application in My Jobs
                            </Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

// Filter Modal Component
function FilterModal({
    visible,
    onClose,
    tabType,
    filters,
    setFilters,
}: {
    visible: boolean;
    onClose: () => void;
    tabType: string;
    filters: any;
    setFilters: (filters: any) => void;
}) {
    const [expandedSection, setExpandedSection] = useState<string | null>('type');

    const textColor = '#f2f2f2';
    const subTextColor = '#888';
    const bgColor = '#111';
    const borderColor = '#333';

    const renderFilterSection = (title: string, key: string, options: string[], currentValue: string) => (
        <View style={styles.filterSection}>
            <TouchableOpacity
                style={[styles.filterHeader, { borderColor }]}
                onPress={() => setExpandedSection(expandedSection === key ? null : key)}
            >
                <Text style={[styles.filterTitle, { color: textColor }]}>
                    {title}: {currentValue === 'all' ? 'All' : currentValue}
                </Text>
                <Text style={[styles.filterChevron, { transform: [{ rotate: expandedSection === key ? '180deg' : '0deg' }] }]}>
                    ▼
                </Text>
            </TouchableOpacity>
            {expandedSection === key && (
                <View style={styles.filterOptions}>
                    {options.map((option) => (
                        <TouchableOpacity
                            key={option}
                            style={[
                                styles.filterOption,
                                currentValue === option && styles.filterOptionActive,
                            ]}
                            onPress={() => {
                                setFilters({ ...filters, [key]: option });
                                setExpandedSection(null);
                            }}
                        >
                            <Text
                                style={[
                                    styles.filterOptionText,
                                    { color: currentValue === option ? '#fff' : subTextColor },
                                ]}
                            >
                                {option === 'all' ? 'All' : option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );

    const hasActiveFilters = () => {
        if (tabType === 'Grants') {
            return filters.grantType !== 'all' || filters.grantSector !== 'All Sectors';
        } else if (tabType === 'Events') {
            return filters.eventType !== 'all' || filters.eventSector !== 'All Sectors' || filters.eventLocation !== 'All Locations';
        } else {
            return filters.teamSector !== 'All Sectors' || filters.teamLocation !== 'All Locations' ||
                filters.teamRemote !== 'all' || filters.teamEmployment !== 'all';
        }
    };

    const clearFilters = () => {
        if (tabType === 'Grants') {
            setFilters({ ...filters, grantType: 'all', grantSector: 'All Sectors' });
        } else if (tabType === 'Events') {
            setFilters({ ...filters, eventType: 'all', eventSector: 'All Sectors', eventLocation: 'All Locations' });
        } else {
            setFilters({ ...filters, teamSector: 'All Sectors', teamLocation: 'All Locations', teamRemote: 'all', teamEmployment: 'all' });
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.filterModalOverlay}>
                <View style={[styles.filterModalContent, { backgroundColor: bgColor }]}>
                    <View style={styles.filterModalHeader}>
                        <Text style={[styles.filterModalTitle, { color: textColor }]}>Filters</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={[styles.filterCloseBtn, { color: subTextColor }]}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.filterScrollView}>
                        {tabType === 'Grants' && (
                            <>
                                {renderFilterSection('Type', 'grantType', grantTypes, filters.grantType)}
                                {renderFilterSection('Sector', 'grantSector', sectors, filters.grantSector)}
                            </>
                        )}
                        {tabType === 'Events' && (
                            <>
                                {renderFilterSection('Type', 'eventType', eventTypes, filters.eventType)}
                                {renderFilterSection('Sector', 'eventSector', sectors, filters.eventSector)}
                                {renderFilterSection('Location', 'eventLocation', locations, filters.eventLocation)}
                            </>
                        )}
                        {tabType === 'Team' && (
                            <>
                                {renderFilterSection('Sector', 'teamSector', sectors, filters.teamSector)}
                                {renderFilterSection('Location', 'teamLocation', locations, filters.teamLocation)}
                                {renderFilterSection('Work Mode', 'teamRemote', remoteOptions, filters.teamRemote)}
                                {renderFilterSection('Employment', 'teamEmployment', employmentOptions, filters.teamEmployment)}
                            </>
                        )}

                        {hasActiveFilters() && (
                            <TouchableOpacity style={styles.clearFiltersBtn} onPress={clearFilters}>
                                <Text style={styles.clearFiltersText}>✕ Clear all filters</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const Opportunities = () => {
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
        // Grants
        name: '', organization: '', sector: '', location: '', amount: '', deadline: '', type: '', description: '', url: '',
        // Events
        organizer: '', date: '', time: '',
        // Team
        startupName: '', roleTitle: '', locationType: '', employmentType: 'Full-time', compensation: '', requirements: '',
        isRemote: false, customQuestions: ['', '', ''],
    });
    const [postLoading, setPostLoading] = useState(false);
    const [initialLoadDone, setInitialLoadDone] = useState(false);
    const [grantsRefreshed, setGrantsRefreshed] = useState(false);
    const [eventsRefreshed, setEventsRefreshed] = useState(false);
    const [teamRefreshed, setTeamRefreshed] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

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
    const flatListRef = React.useRef<FlatList>(null);

    const api = require('../lib/api');

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
            // Uses the jobs endpoint for team data
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

    const showPlus = typeof userRole === 'string' &&
        (userRole.toLowerCase() === 'startup' || userRole.toLowerCase() === 'investor');

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
                endpoint = '/api/jobs';
                payload = {
                    title: form.roleTitle, startupName: form.startupName, sector: form.sector,
                    locationType: form.locationType, employmentType: form.employmentType,
                    compensation: form.compensation, requirements: form.requirements,
                    isRemote: form.isRemote, customQuestions: form.customQuestions.filter(q => q.trim() !== ''),
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
                name: '', organization: '', sector: '', location: '', amount: '', deadline: '', type: '',
                description: '', url: '', organizer: '', date: '', time: '',
                startupName: '', roleTitle: '', locationType: '', employmentType: 'Full-time',
                compensation: '', requirements: '', isRemote: false, customQuestions: ['', '', ''],
            });
            Alert.alert('Success', `Posted successfully!`);

            if (activeTab === 'Grants') loadGrants(0);
            else if (activeTab === 'Events') loadEvents(0);
            else if (activeTab === 'Team') loadTeam(0);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to post');
        }
        setPostLoading(false);
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
                            {/* Action Buttons for Team Tab */}
                            {tabName === 'Team' && (
                                <View style={styles.actionButtonsContainer}>
                                    <TouchableOpacity style={[styles.actionBtn, styles.createBtn]} onPress={() => setModalVisible(true)}>
                                        <Text style={styles.createBtnText}>＋ Create Job Ad</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.actionBtn, styles.myTeamsBtn]} onPress={() => { /* Navigate to My Teams or filter */ }}>
                                        <Text style={styles.myTeamsBtnText}>My Teams</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* List Header / Count */}
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

            {/* FAB for creating new posts */}


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
                        <Text style={styles.modalTitle}>Post a new {activeTab === 'Team' ? 'Job' : activeTab.slice(0, -1)}</Text>
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
                                    <TextInput placeholderTextColor="#888" style={styles.input} placeholder="Startup Name" value={form.startupName} onChangeText={v => handleFormChange('startupName', v)} />
                                    <TextInput placeholderTextColor="#888" style={styles.input} placeholder="Role Title" value={form.roleTitle} onChangeText={v => handleFormChange('roleTitle', v)} />
                                    <TextInput placeholderTextColor="#888" style={styles.input} placeholder="Sector" value={form.sector} onChangeText={v => handleFormChange('sector', v)} />
                                    <TextInput placeholderTextColor="#888" style={styles.input} placeholder="Location" value={form.locationType} onChangeText={v => handleFormChange('locationType', v)} />
                                    <TextInput placeholderTextColor="#888" style={styles.input} placeholder="Employment Type" value={form.employmentType} onChangeText={v => handleFormChange('employmentType', v)} />
                                    <TextInput placeholderTextColor="#888" style={styles.input} placeholder="Compensation" value={form.compensation} onChangeText={v => handleFormChange('compensation', v)} />
                                    <TextInput placeholderTextColor="#888" style={[styles.input, { height: 80 }]} placeholder="Requirements" value={form.requirements} onChangeText={v => handleFormChange('requirements', v)} multiline />
                                    <TouchableOpacity
                                        style={styles.remoteToggle}
                                        onPress={() => handleFormChange('isRemote', !form.isRemote)}
                                    >
                                        <View style={[styles.checkbox, form.isRemote && styles.checkboxActive]} />
                                        <Text style={styles.remoteToggleText}>Remote Position</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.questionsLabel}>Custom Questions (Optional)</Text>
                                    {[0, 1, 2].map((i) => (
                                        <TextInput
                                            key={i}
                                            placeholderTextColor="#888"
                                            style={styles.input}
                                            placeholder={`Question ${i + 1}`}
                                            value={form.customQuestions[i]}
                                            onChangeText={v => {
                                                const updated = [...form.customQuestions];
                                                updated[i] = v;
                                                handleFormChange('customQuestions', updated);
                                            }}
                                        />
                                    ))}
                                </>
                            )}
                        </ScrollView>
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
    container: {
        flex: 1,
        backgroundColor: '#000000',
        paddingTop: 16,
    },
    tabBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        backgroundColor: '#111',
        borderRadius: 25,
        padding: 4,
        marginHorizontal: 12,
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabBtnActive: {
        backgroundColor: '#333',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
    },
    tabTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    tabTextInactive: {
        color: '#888',
    },

    // List
    listContent: {
        paddingBottom: 80,
        paddingHorizontal: 16,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    resultCount: {
        fontSize: 14,
        color: '#888',
    },
    filterIcon: {
        fontSize: 18,
    },
    loaderContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    footerLoader: {
        marginVertical: 20,
    },
    emptyText: {
        textAlign: 'center',
        color: '#888',
        marginTop: 32,
        fontSize: 16,
    },

    // Card Base
    card: {
        borderRadius: 24,
        marginBottom: 16,
        padding: 20,
        borderWidth: 1,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    cardHeaderText: {
        flex: 1,
        marginRight: 8,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    cardOrg: {
        fontSize: 12,
    },
    badge: {
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderWidth: 1,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'capitalize',
    },

    // Description
    descContainer: {
        marginBottom: 12,
    },
    cardDesc: {
        fontSize: 13,
        lineHeight: 18,
    },
    moreLess: {
        color: '#3b82f6',
        fontSize: 12,
        marginTop: 4,
        fontWeight: '500',
    },

    // Meta Row
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaIcon: {
        fontSize: 12,
        marginRight: 4,
    },
    metaText: {
        fontSize: 12,
    },

    // Action Row
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    amountText: {
        fontSize: 15,
        fontWeight: '600',
    },
    applyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3b82f6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    applyBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    applyBtnIcon: {
        color: '#fff',
        fontSize: 12,
        marginLeft: 4,
    },

    // Role Card specific
    companyRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flex: 1,
    },
    companyIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    companyIconText: {
        fontSize: 20,
    },
    companyInfo: {
        flex: 1,
    },
    companyNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    companyName: {
        fontSize: 14,
        fontWeight: '600',
    },
    companyType: {
        fontSize: 12,
        marginTop: 2,
    },
    myAdBadge: {
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    myAdText: {
        color: '#8b5cf6',
        fontSize: 10,
        fontWeight: '600',
    },

    // Role Section
    roleSection: {
        marginBottom: 12,
    },
    roleTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    locationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    remoteText: {
        fontSize: 12,
    },

    // Tags
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 12,
    },
    tag: {
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#111',
    },
    tagText: {
        color: '#ccc',
        fontSize: 11,
        fontWeight: '500',
    },

    // Footer
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
    },
    applicantsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    chevron: {
        color: '#888',
        fontSize: 10,
        marginRight: 6,
    },
    applicantsText: {
        fontSize: 12,
    },
    employmentText: {
        fontSize: 12,
    },

    // Expanded Section
    expandedSection: {
        marginTop: 16,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
    },
    questionContainer: {
        marginBottom: 16,
    },
    questionLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 8,
    },
    questionInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 13,
        minHeight: 60,
        textAlignVertical: 'top',
    },
    uploadContainer: {
        marginBottom: 16,
    },
    uploadLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 8,
    },
    uploadBtn: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        borderStyle: 'dashed',
    },
    uploadBtnText: {
        fontSize: 13,
    },
    sendBtn: {
        backgroundColor: '#22c55e',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
    },
    sendBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    appliedContainer: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    appliedText: {
        color: '#22c55e',
        fontSize: 14,
        fontWeight: '500',
    },
    appliedSubtext: {
        fontSize: 12,
        marginTop: 4,
    },

    // Filter Modal
    filterModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    filterModalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    filterModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    filterModalTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    filterCloseBtn: {
        fontSize: 20,
    },
    filterScrollView: {
        padding: 16,
    },
    filterSection: {
        marginBottom: 12,
    },
    filterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        borderWidth: 1,
    },
    filterTitle: {
        fontSize: 14,
        fontWeight: '500',
    },
    filterChevron: {
        color: '#888',
        fontSize: 12,
    },
    filterOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        padding: 12,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        marginTop: 8,
    },
    filterOption: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#1a1a1a',
        borderWidth: 1,
        borderColor: '#333',
    },
    filterOptionActive: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    filterOptionText: {
        fontSize: 12,
        fontWeight: '500',
    },
    clearFiltersBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        marginTop: 8,
    },
    clearFiltersText: {
        color: '#888',
        fontSize: 14,
    },

    // Action Buttons
    actionButtonsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    actionBtn: {
        flex: 1,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    createBtn: {
        backgroundColor: '#333',
        borderColor: '#444',
    },
    createBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    myTeamsBtn: {
        backgroundColor: 'transparent',
        borderColor: '#444',
    },
    myTeamsBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },

    // Modal
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    modalBox: {
        width: '90%',
        maxHeight: '85%',
        borderRadius: 16,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
        color: '#fff',
    },
    modalScroll: {
        maxHeight: 400,
    },
    input: {
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
        fontSize: 15,
        color: '#fff',
        backgroundColor: '#1a1a1a',
    },
    remoteToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#333',
        marginRight: 12,
    },
    checkboxActive: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    remoteToggleText: {
        color: '#fff',
        fontSize: 14,
    },
    questionsLabel: {
        color: '#888',
        fontSize: 13,
        marginBottom: 12,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    cancelBtn: {
        backgroundColor: '#333',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    cancelText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    submitBtn: {
        backgroundColor: '#3b82f6',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
        flex: 1,
    },
    submitText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
    },
    formHeader: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    formActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
});

export default Opportunities;
