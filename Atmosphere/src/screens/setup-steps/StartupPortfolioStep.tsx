import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, Animated, ScrollView, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useAlert } from '../../components/CustomAlert';
import { Picker } from '@react-native-picker/picker';
import { saveStartupProfile, getProfile, getStartupProfile, uploadDocument, uploadVideoFile, searchUsers } from '../../lib/api';

// ... other imports
import { pick, types } from '@react-native-documents/picker';
import CustomCalendar from '../../components/CustomCalendar';
import { X, Plus } from 'lucide-react-native';

// Types for investments (formerly funding rounds)
interface FundingRound {
    id: number;
    amount: string;
    investor: string;
    round: string; // Pre-seed, Seed, Series A, etc.
    docUrl?: string;
    pendingDoc?: { uri: string; name?: string; type?: string } | null;
}

interface TeamMember {
    id: number;
    username: string;
    role: string;
    userId?: string;
}
function CollapsibleSection({ title, open, onPress, children }: any) {
    const [contentHeight, setContentHeight] = useState(0);
    const animatedHeight = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.timing(animatedHeight, {
            toValue: open ? contentHeight : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [open, contentHeight, animatedHeight]);

    return (
        <View style={styles.section}>
            <TouchableOpacity onPress={onPress} style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title}</Text>
                <Text style={styles.sectionToggle}>{open ? '-' : '+'}</Text>
            </TouchableOpacity>
            <Animated.View style={[styles.hiddenOverflow, { height: animatedHeight }]}>
                <View
                    style={[styles.sectionContent, styles.absHidden]}
                    pointerEvents="none"
                    onLayout={e => {
                        if (e.nativeEvent.layout.height !== contentHeight) setContentHeight(e.nativeEvent.layout.height);
                    }}
                >
                    {children}
                </View>
                <View style={styles.sectionContent}>
                    {open ? children : null}
                </View>
            </Animated.View>
        </View>
    );
}

export default function StartupPortfolioStep({ onBack, onDone, onNavigateToTrade }: { onBack: () => void; onDone: () => void; onNavigateToTrade?: () => void }) {
    const { showAlert } = useAlert();
    const [activeSection, setActiveSection] = useState('');
    const [companyProfile, setCompanyProfile] = useState('');
    const [about, setAbout] = useState('');
    const [location, setLocation] = useState('');
    const [companyType, setCompanyType] = useState('');
    // Multi-select industries (Startup Focus)
    const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
    const [showIndustriesPicker, setShowIndustriesPicker] = useState(false);
    const [establishedOn, setEstablishedOn] = useState('');
    const [teamName, setTeamName] = useState('');
    const [teamRole, setTeamRole] = useState('');
    const [revenueType, setRevenueType] = useState('Pre-revenue');
    const [showRevenueDropdown, setShowRevenueDropdown] = useState(false);
    const [showRoundDropdown, setShowRoundDropdown] = useState(false);
    // Investment round picker state (separate from activeSection to avoid closing form)
    const [openRoundPickerId, setOpenRoundPickerId] = useState<number | null>(null);
    const [fundingMethod, setFundingMethod] = useState('');
    const [consent, setConsent] = useState(false);
    const [uploadName, setUploadName] = useState('');
    const [raisedAmount, setRaisedAmount] = useState('');
    const [investorName, setInvestorName] = useState('');
    const [investorDoc, setInvestorDoc] = useState('');
    const [roundType, setRoundType] = useState('');
    const [requiredCapital, setRequiredCapital] = useState('');
    const [uploadUrl, setUploadUrl] = useState('');
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [investorDocUrl, setInvestorDocUrl] = useState('');
    const [uploadingInvestorDoc, setUploadingInvestorDoc] = useState(false);
    const [pendingDoc, setPendingDoc] = useState<{ uri: string; name?: string; type?: string } | null>(null);
    const [pendingInvestorDoc, setPendingInvestorDoc] = useState<{ uri: string; name?: string; type?: string } | null>(null);

    // Date picker state
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dateValue, setDateValue] = useState<Date | null>(null);

    // Investment tracking state (formerly funding rounds)
    const [fundingRounds, setFundingRounds] = useState<FundingRound[]>([{ id: 1, amount: '', investor: '', round: '', docUrl: '', pendingDoc: null }]);

    // Team members array state
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([{ id: 1, username: '', role: '', userId: '' }]);
    const [searchingUser, setSearchingUser] = useState<number | null>(null);
    const [userSearchResults, setUserSearchResults] = useState<any[]>([]);

    const [website, setWebsite] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [pendingVideo, setPendingVideo] = useState<{ uri: string; name?: string; type?: string } | null>(null);
    const [videoName, setVideoName] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const profile = await getProfile();
                console.log('getProfile() response:', profile);
                const userId = profile?.user?._id;
                console.log('Fetched userId:', userId);
                if (!userId) {
                    console.log('No userId found in profile');
                    return;
                }
                try {
                    const res = await getStartupProfile(userId);
                    console.log('Fetched startup profile response:', res);
                    // API may return { details: {...} } or { startupDetails: {...} }
                    const data = res?.details || res?.startupDetails || res;
                    if (data) {
                        console.log('Fetched startup data:', data);
                        setCompanyProfile(data.companyName || '');
                        setAbout(data.about || '');
                        setLocation(data.location || '');
                        setCompanyType(data.companyType || '');
                        // Load industries array for multi-select
                        if (Array.isArray(data.industries)) {
                            setSelectedIndustries(data.industries);
                        } else if (data.companyType) {
                            // Fallback: use companyType as single item if industries not set
                            setSelectedIndustries([data.companyType]);
                        }
                        setWebsite(data.website || '');
                        setVideoUrl(data.video || '');
                        setEstablishedOn(data.establishedOn ? String(data.establishedOn).slice(0, 10) : '');

                        // Correctly load array of team members
                        if (Array.isArray(data.teamMembers) && data.teamMembers.length > 0) {
                            setTeamMembers(data.teamMembers.map((m: any, i: number) => ({
                                id: i + 1,
                                username: m.name || m.username || '', // Backend might send 'name' or 'username'
                                role: m.role || '',
                                userId: m.userId || ''
                            })));
                        }

                        if (data.financialProfile) {
                            setRevenueType(data.financialProfile.revenueType || 'Pre-revenue');
                            setFundingMethod(data.financialProfile.fundingMethod || '');
                            setRaisedAmount(data.financialProfile.fundingAmount ? String(data.financialProfile.fundingAmount) : '');
                            setInvestorName(data.financialProfile.investorName || '');
                            setInvestorDoc(data.financialProfile.investorDoc || '');
                            // Also populate the URL if available
                            if (data.financialProfile.investorDoc) {
                                setInvestorDocUrl(data.financialProfile.investorDoc);
                            }
                        }

                        // Load fundingRounds (investments) from backend
                        if (Array.isArray(data.fundingRounds) && data.fundingRounds.length > 0) {
                            setFundingRounds(data.fundingRounds.map((r: any, i: number) => ({
                                id: i + 1,
                                amount: r.amount ? String(r.amount) : '',
                                investor: r.investorName || '',
                                round: r.round || '',  // Load the round field
                                docUrl: r.doc || '',
                                pendingDoc: null
                            })));
                        }

                        // Load round/stage (backend stores as 'stage', frontend uses 'roundType')
                        setRoundType(data.roundType || data.stage || '');
                        // Load required capital (backend stores as 'fundingNeeded', frontend uses 'requiredCapital')
                        setRequiredCapital(data.requiredCapital || data.fundingNeeded ? String(data.requiredCapital || data.fundingNeeded) : '');
                        // Populate documents URL
                        if (data.documents) {
                            setUploadUrl(data.documents);
                        }

                        // Load video name if video URL exists
                        if (data.video) {
                            const parts = data.video.split('/');
                            setVideoName(parts[parts.length - 1] || 'Video uploaded');
                        }
                    } else {
                        console.log('No startup data found for user');
                    }
                } catch (err: any) {
                    if (err?.message && err.message.toLowerCase().includes('not found')) {
                        console.log('No startup profile found yet');
                    } else {
                        console.log('Error fetching startup profile:', err?.message || err);
                    }
                }
            } catch (err: any) {
                console.log('Error fetching user profile:', err?.message || err);
            }
        })();
    }, []);

    const uploadDoc = async () => {
        try {
            // Allow all document types
            const result = await pick({
                type: [types.allFiles],
            });

            if (!result || result.length === 0) return;

            const doc = result[0];
            if (doc && doc.uri) {
                // stage file for later upload
                setPendingDoc({ uri: doc.uri, name: doc.name ? doc.name : undefined, type: doc.type ? doc.type : undefined });
                setUploadName(doc.name || 'document');
            }
        } catch (err: any) {
            // User cancelled or error
            if (err?.code !== 'DOCUMENT_PICKER_CANCELED') {
                showAlert('Error', err.message || 'Failed to pick document');
            }
        }
    };

    const pickVideo = async () => {
        try {
            const result = await pick({
                type: [types.video],
            });

            if (!result || result.length === 0) return;

            const vid = result[0];
            if (vid && vid.uri) {
                setPendingVideo({ uri: vid.uri, name: vid.name ? vid.name : undefined, type: vid.type ? vid.type : undefined });
                setVideoName(vid.name || 'video');
            }
        } catch (err: any) {
            if (err?.code !== 'DOCUMENT_PICKER_CANCELED') {
                showAlert('Error', err.message || 'Failed to pick video');
            }
        }
    };

    const pickInvestorDoc = async () => {
        try {
            // Allow all document types
            const result = await pick({
                type: [types.allFiles],
            });

            if (!result || result.length === 0) return;

            const doc = result[0];
            if (doc && doc.uri) {
                // stage investor doc for upload on submit
                setPendingInvestorDoc({ uri: doc.uri, name: doc.name ? doc.name : undefined, type: doc.type ? doc.type : undefined });
                setInvestorDoc(doc.name || 'document');
            }
        } catch (err: any) {
            // User cancelled or error
            if (err?.code !== 'DOCUMENT_PICKER_CANCELED') {
                showAlert('Error', err.message || 'Failed to pick document');
            }
        }
    };

    // Investment helpers
    const addFundingRound = () => {
        const newId = fundingRounds.length > 0 ? Math.max(...fundingRounds.map(r => r.id)) + 1 : 1;
        setFundingRounds([...fundingRounds, { id: newId, amount: '', investor: '', round: '', docUrl: '', pendingDoc: null }]);
    };

    const removeFundingRound = (id: number) => {
        if (fundingRounds.length > 1) {
            setFundingRounds(fundingRounds.filter(r => r.id !== id));
        }
    };

    const updateFundingRound = (id: number, field: 'amount' | 'investor' | 'round', value: string) => {
        setFundingRounds(fundingRounds.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const pickRoundDoc = async (roundId: number) => {
        try {
            const result = await pick({ type: [types.allFiles] });
            if (!result || result.length === 0) return;
            const doc = result[0];
            if (doc && doc.uri) {
                setFundingRounds(fundingRounds.map(r => r.id === roundId ? {
                    ...r,
                    pendingDoc: { uri: doc.uri, name: doc.name ? doc.name : undefined, type: doc.type ? doc.type : undefined },
                    docUrl: doc.name || 'document'
                } : r));
            }
        } catch (err: any) {
            if (err?.code !== 'DOCUMENT_PICKER_CANCELED') {
                showAlert('Error', err.message || 'Failed to pick document');
            }
        }
    };

    // Team member helpers
    const addTeamMember = () => {
        const newId = teamMembers.length > 0 ? Math.max(...teamMembers.map(m => m.id)) + 1 : 1;
        setTeamMembers([...teamMembers, { id: newId, username: '', role: '', userId: '' }]);
    };

    const removeTeamMember = (id: number) => {
        if (teamMembers.length > 1) {
            setTeamMembers(teamMembers.filter(m => m.id !== id));
        }
    };

    const updateTeamMember = (id: number, field: 'username' | 'role', value: string) => {
        setTeamMembers(teamMembers.map(m => m.id === id ? { ...m, [field]: value } : m));
        // Trigger user search when username changes
        if (field === 'username' && value.length > 1) {
            setSearchingUser(id);
            handleUserSearch(value, id);
        } else if (field === 'username') {
            setUserSearchResults([]);
            setSearchingUser(null);
        }
    };

    const handleUserSearch = async (query: string, memberId: number) => {
        try {
            const results = await searchUsers(query);
            if (searchingUser === memberId) {
                setUserSearchResults(results || []);
            }
        } catch (err) {
            console.log('User search error:', err);
            setUserSearchResults([]);
        }
    };

    const selectUser = (memberId: number, user: any) => {
        setTeamMembers(teamMembers.map(m => m.id === memberId ? {
            ...m,
            username: user.username || user.displayName || '',
            userId: user._id || user.id || ''
        } : m));
        setUserSearchResults([]);
        setSearchingUser(null);
    };

    const sendForVerification = async () => {
        if (!consent) return showAlert('Consent required', 'Please provide consent to proceed');

        setUploadingDoc(true);
        setUploadingInvestorDoc(true);
        setUploadingVideo(true);
        try {
            // Upload staged documents if any
            let finalUploadUrl = uploadUrl;
            if (pendingDoc) {
                try {
                    const url = await uploadDocument(pendingDoc.uri, pendingDoc.name || 'document', pendingDoc.type || 'application/octet-stream');
                    finalUploadUrl = url;
                    setUploadUrl(url);
                    setPendingDoc(null);
                } catch (e: any) {
                    showAlert('Upload Failed', e?.message || 'Could not upload document');
                    return;
                }
            }

            let finalInvestorDocUrl = investorDocUrl;
            if (pendingInvestorDoc) {
                try {
                    const url = await uploadDocument(pendingInvestorDoc.uri, pendingInvestorDoc.name || 'document', pendingInvestorDoc.type || 'application/octet-stream');
                    finalInvestorDocUrl = url;
                    setInvestorDocUrl(url);
                    setPendingInvestorDoc(null);
                } catch (e: any) {
                    showAlert('Upload Failed', e?.message || 'Could not upload investor document');
                    return;
                }
            }

            let finalVideoUrl = videoUrl;
            if (pendingVideo) {
                try {
                    const url = await uploadVideoFile(pendingVideo.uri, pendingVideo.name || 'video.mp4', pendingVideo.type || 'video/mp4');
                    finalVideoUrl = url;
                    setVideoUrl(url);
                    setPendingVideo(null);
                } catch (e: any) {
                    showAlert('Upload Failed', e?.message || 'Could not upload video');
                    return;
                }
            }

            const payload = {
                companyName: companyProfile,
                about,
                location,
                companyType,
                industries: selectedIndustries, // Multi-select industries
                website,
                video: finalVideoUrl,
                establishedOn,
                teamMembers: teamMembers.map(m => ({
                    name: m.username, // mapping username to 'name' as per schema logic
                    username: m.username,
                    role: m.role,
                    userId: m.userId
                })),
                fundingRounds: fundingMethod === 'Capital Raised' ? fundingRounds.map(r => ({
                    round: r.round || 'Seed',  // Use actual selected round
                    amount: Number(r.amount) || 0,
                    investorName: r.investor,
                    doc: r.docUrl || ''
                })) : [],
                financialProfile: {
                    revenueType,
                    fundingMethod,
                    fundingAmount: raisedAmount,
                    investorName: fundingMethod === 'Capital Raised' ? investorName : undefined,
                    investorDoc: fundingMethod === 'Capital Raised' ? finalInvestorDocUrl : undefined,
                },
                roundType,
                requiredCapital,
                documents: finalUploadUrl,
            };
            await saveStartupProfile(payload);
            showAlert('Sent', 'Documents sent for verification');
            onDone();
        } catch (error: any) {
            showAlert('Error', error?.message || 'Unable to send for verification');
        } finally {
            setUploadingDoc(false);
            setUploadingInvestorDoc(false);
            setUploadingVideo(false);
        }
    };

    return (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerTitleWrap}>
                    <Text style={styles.headerTitle}>Portfolio</Text>
                </View>
                <View style={styles.w40} />
            </View>

            <CollapsibleSection title="Company profile" open={activeSection === 'company'} onPress={() => setActiveSection(activeSection === 'company' ? '' : 'company')}>
                <View>
                    <View style={styles.formField}>
                        <Text style={styles.label}>Company Legal Name</Text>
                        <TextInput placeholder="Enter full legal name" placeholderTextColor="#999" value={companyProfile} onChangeText={setCompanyProfile} style={styles.input} />
                    </View>
                    <View style={styles.formField}>
                        <Text style={styles.label}>About your company</Text>
                        <TextInput placeholder="Write about your company..." placeholderTextColor="#999" multiline numberOfLines={4} value={about} onChangeText={setAbout} style={[styles.input, styles.textTop]} />
                    </View>
                    <View style={styles.formField}>
                        <Text style={styles.label}>Location</Text>
                        <TextInput placeholder="Search location" placeholderTextColor="#999" value={location} onChangeText={setLocation} style={styles.input} />
                    </View>
                    <View style={styles.formField}>
                        <Text style={styles.label}>Startup Focus</Text>
                        <TouchableOpacity onPress={() => setShowIndustriesPicker(true)} style={styles.input}>
                            <Text style={{ color: selectedIndustries.length > 0 ? '#fff' : '#999' }}>
                                {selectedIndustries.length > 0 ? selectedIndustries.join(', ') : 'Select focus areas'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.formField}>
                        <Text style={styles.label}>Website</Text>
                        <TextInput placeholder="https://..." placeholderTextColor="#999" value={website} onChangeText={setWebsite} style={styles.input} autoCapitalize="none" keyboardType="url" />
                    </View>
                    <View style={styles.formField}>
                        <Text style={styles.label}>Company Established On</Text>
                        <TouchableOpacity onPress={() => {
                            setDateValue(establishedOn ? new Date(establishedOn) : new Date());
                            setShowDatePicker(true);
                        }} style={styles.input}>
                            <Text style={{ color: establishedOn ? '#fff' : '#999' }}>{establishedOn || 'Select date'}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Team Members */}
                    <View style={styles.formField}>
                        <Text style={styles.label}>Team Members</Text>
                        {teamMembers.map((member, index) => (
                            <View key={member.id} style={{ marginBottom: 12 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                    <Text style={{ color: '#888', fontSize: 12 }}>Member {index + 1}</Text>
                                    {teamMembers.length > 1 && (
                                        <TouchableOpacity onPress={() => removeTeamMember(member.id)} style={{ marginLeft: 8 }}>
                                            <X size={16} color="#666" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <View style={[styles.row, { gap: 8 }]}>
                                    <View style={[styles.flex1, { position: 'relative' }]}>
                                        <TextInput
                                            placeholder="@username"
                                            placeholderTextColor="#999"
                                            value={member.username}
                                            onChangeText={(v) => updateTeamMember(member.id, 'username', v)}
                                            style={styles.input}
                                        />
                                        {searchingUser === member.id && userSearchResults.length > 0 && (
                                            <View style={{ position: 'absolute', top: 48, left: 0, right: 0, backgroundColor: '#222', borderRadius: 8, zIndex: 10, maxHeight: 150 }}>
                                                <ScrollView nestedScrollEnabled>
                                                    {userSearchResults.slice(0, 5).map((user: any) => (
                                                        <TouchableOpacity
                                                            key={user._id || user.id}
                                                            onPress={() => selectUser(member.id, user)}
                                                            style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#333' }}
                                                        >
                                                            <Text style={{ color: '#fff' }}>@{user.username}</Text>
                                                            {user.displayName && <Text style={{ color: '#888', fontSize: 12 }}>{user.displayName}</Text>}
                                                        </TouchableOpacity>
                                                    ))}
                                                </ScrollView>
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.flex1}>
                                        <TextInput
                                            placeholder="Role"
                                            placeholderTextColor="#999"
                                            value={member.role}
                                            onChangeText={(v) => updateTeamMember(member.id, 'role', v)}
                                            style={styles.input}
                                        />
                                    </View>
                                </View>
                            </View>
                        ))}
                        <TouchableOpacity onPress={addTeamMember} style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333', borderRadius: 24, paddingVertical: 14, marginTop: 12 }}>
                            <Text style={{ color: '#fff', fontSize: 15 }}>+   Add Member</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </CollapsibleSection>





            <CollapsibleSection title="Financial profile" open={activeSection === 'financial'} onPress={() => setActiveSection(activeSection === 'financial' ? '' : 'financial')}>
                <View>
                    <View style={styles.formField}>
                        <Text style={styles.label}>Revenue type</Text>
                        <TouchableOpacity
                            style={styles.dropdownButton}
                            onPress={() => setShowRevenueDropdown(true)}
                        >
                            <View>
                                <Text style={styles.dropdownValue}>{revenueType || 'Select revenue type'}</Text>
                            </View>
                            <Text style={styles.dropdownArrow}>▼</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.btnRow}>
                        <TouchableOpacity
                            style={[styles.btn, fundingMethod === 'Bootstrapped' && styles.btnActive]}
                            onPress={() => setFundingMethod('Bootstrapped')}
                        >
                            <Text style={styles.btnText}>Bootstrapped</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.btn, fundingMethod === 'Capital Raised' && styles.btnActive]}
                            onPress={() => setFundingMethod('Capital Raised')}
                        >
                            <Text style={styles.btnText}>Capital Raised</Text>
                        </TouchableOpacity>
                    </View>

                    {fundingMethod === 'Capital Raised' && (
                        <View style={{ marginTop: 16 }}>
                            {/* Add Investment button at top */}
                            <TouchableOpacity onPress={addFundingRound} style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333', borderRadius: 24, paddingVertical: 14, marginBottom: 16 }}>
                                <Text style={{ color: '#fff', fontSize: 15 }}>+   Add Investment</Text>
                            </TouchableOpacity>

                            {/* Display investments in reverse order (oldest first, newest at bottom) */}
                            {[...fundingRounds].reverse().map((investment, index) => (
                                <View key={investment.id} style={{ marginBottom: 20, padding: 12, backgroundColor: '#151515', borderRadius: 8, borderWidth: 1, borderColor: '#222' }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <Text style={{ color: '#fff', fontWeight: '600' }}>Investment {fundingRounds.length - index}</Text>
                                        {fundingRounds.length > 1 && (
                                            <TouchableOpacity onPress={() => removeFundingRound(investment.id)}>
                                                <X size={18} color="#888" />
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    <View style={[styles.formField, { marginBottom: 12 }]}>
                                        <Text style={styles.label}>Amount (USD)</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#222', borderRadius: 8, backgroundColor: '#111' }}>
                                            <Text style={{ color: '#888', paddingLeft: 12 }}>$</Text>
                                            <TextInput
                                                placeholder="200000"
                                                placeholderTextColor="#666"
                                                value={investment.amount}
                                                onChangeText={(v) => updateFundingRound(investment.id, 'amount', v)}
                                                style={[styles.input, { flex: 1, borderWidth: 0 }]}
                                                keyboardType="numeric"
                                            />
                                            <Text style={{ color: '#888', paddingRight: 12 }}>USD</Text>
                                        </View>
                                    </View>

                                    <View style={[styles.formField, { marginBottom: 12 }]}>
                                        <Text style={styles.label}>Investor / Grant name</Text>
                                        <TextInput
                                            placeholder="Enter investor name"
                                            placeholderTextColor="#666"
                                            value={investment.investor}
                                            onChangeText={(v) => updateFundingRound(investment.id, 'investor', v)}
                                            style={styles.input}
                                        />
                                    </View>

                                    {/* Round Selection Dropdown */}
                                    <View style={[styles.formField, { marginBottom: 12 }]}>
                                        <Text style={styles.label}>Funding Round</Text>
                                        <TouchableOpacity
                                            style={styles.dropdownButton}
                                            onPress={() => {
                                                // Toggle round picker for this investment (separate from activeSection)
                                                setOpenRoundPickerId(openRoundPickerId === investment.id ? null : investment.id);
                                            }}
                                        >
                                            <Text style={[styles.dropdownValue, { color: investment.round ? '#fff' : '#666' }]}>
                                                {investment.round || 'Select round'}
                                            </Text>
                                            <Text style={styles.dropdownArrow}>▼</Text>
                                        </TouchableOpacity>
                                        {openRoundPickerId === investment.id && (
                                            <View style={{ backgroundColor: '#1a1a1a', borderRadius: 8, marginTop: 8, padding: 8, borderWidth: 1, borderColor: '#333' }}>
                                                {['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D+'].map((roundOption) => (
                                                    <TouchableOpacity
                                                        key={roundOption}
                                                        style={{ padding: 12, borderRadius: 6, backgroundColor: investment.round === roundOption ? '#333' : 'transparent' }}
                                                        onPress={() => {
                                                            updateFundingRound(investment.id, 'round', roundOption);
                                                            setOpenRoundPickerId(null);
                                                        }}
                                                    >
                                                        <Text style={{ color: investment.round === roundOption ? '#fff' : '#aaa' }}>{roundOption}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        )}
                                    </View>

                                    <TouchableOpacity onPress={() => pickRoundDoc(investment.id)} style={styles.uploadBtn}>
                                        <Text style={styles.uploadText}>{investment.docUrl || 'Upload investor proof'}</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </CollapsibleSection>

            <CollapsibleSection title="Raise a round" open={activeSection === 'raise'} onPress={() => setActiveSection(activeSection === 'raise' ? '' : 'raise')}>
                <View>
                    {/* Trade Button */}
                    <TouchableOpacity
                        style={styles.tradeButton}
                        onPress={() => {
                            console.log('Trade button pressed, onNavigateToTrade:', !!onNavigateToTrade);
                            // Navigate to Trading section with Sell tab
                            if (onNavigateToTrade) {
                                onNavigateToTrade();
                            } else {
                                console.warn('onNavigateToTrade is not defined!');
                            }
                        }}
                    >
                        <Text style={styles.tradeButtonText}>TRADE</Text>
                        <ChevronRight size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </CollapsibleSection>

            <View style={styles.uploadWrap}>
                <TouchableOpacity onPress={uploadDoc} style={styles.uploadBtn} disabled={uploadingDoc}>
                    {uploadingDoc ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.uploadText}>{uploadName || 'Upload documents for verification'}</Text>
                    )}
                </TouchableOpacity>
            </View>
            <View style={styles.uploadWrap}>
                <TouchableOpacity onPress={pickVideo} style={styles.uploadBtn} disabled={uploadingVideo}>
                    {uploadingVideo ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.uploadText}>{videoUrl ? 'Video Uploaded - Tap to Change' : 'Upload company video / demo'}</Text>
                    )}
                </TouchableOpacity>
            </View>
            <View style={styles.consentRow}>
                <TouchableOpacity onPress={() => setConsent(!consent)} style={styles.consentBtn}>
                    <View style={[styles.consentBox, consent ? styles.consentBoxChecked : styles.consentBoxUnchecked]}>
                        {consent && <View style={styles.consentCheck} />}
                    </View>
                    <Text style={styles.consentText}>I consent to the collection, processing, and verification of the information and documents provided.</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={sendForVerification} disabled={!consent} style={[styles.btn, styles.btnSend, consent && styles.btnSendActive]}>
                <Text style={[styles.btnText, consent ? styles.btnTextEnabled : styles.btnTextDisabled]}>Update Details</Text>
            </TouchableOpacity>
            <Text style={styles.infoText}>All submitted documents will be reviewed and updated automatically.</Text>

            {/* Revenue Dropdown Modal */}
            <Modal visible={showRevenueDropdown} transparent animationType="fade" onRequestClose={() => setShowRevenueDropdown(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowRevenueDropdown(false)}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Revenue Type</Text>
                        {['Pre-revenue', 'Revenue generating'].map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={[styles.modalOption, revenueType === type && styles.modalOptionActive]}
                                onPress={() => { setRevenueType(type); setShowRevenueDropdown(false); }}
                            >
                                <Text style={[styles.modalOptionLabel, revenueType === type && styles.modalOptionLabelActive]}>{type}</Text>
                                {revenueType === type && <Text style={styles.checkmark}>✓</Text>}
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.modalCancel} onPress={() => setShowRevenueDropdown(false)}>
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Round Dropdown Modal */}
            <Modal visible={showRoundDropdown} transparent animationType="fade" onRequestClose={() => setShowRoundDropdown(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowRoundDropdown(false)}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Round</Text>
                        {['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D', 'Series D and beyond'].map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={[styles.modalOption, roundType === type && styles.modalOptionActive]}
                                onPress={() => { setRoundType(type); setShowRoundDropdown(false); }}
                            >
                                <Text style={[styles.modalOptionLabel, roundType === type && styles.modalOptionLabelActive]}>{type}</Text>
                                {roundType === type && <Text style={styles.checkmark}>✓</Text>}
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.modalCancel} onPress={() => setShowRoundDropdown(false)}>
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Startup Focus (Industries) Multi-Select Picker Modal */}
            <Modal visible={showIndustriesPicker} transparent animationType="fade" onRequestClose={() => setShowIndustriesPicker(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowIndustriesPicker(false)}>
                    <View style={[styles.modalContent, { maxHeight: 400 }]}>
                        <Text style={styles.modalTitle}>Startup Focus</Text>
                        <ScrollView style={{ maxHeight: 280 }}>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                {['AI', 'SaaS', 'Drones', 'FinTech', 'HealthTech', 'EdTech', 'E-commerce', 'Blockchain', 'IoT', 'CleanTech'].map((opt) => {
                                    const active = selectedIndustries.includes(opt);
                                    return (
                                        <TouchableOpacity
                                            key={opt}
                                            onPress={() => {
                                                setSelectedIndustries((prev) => prev.includes(opt) ? prev.filter(p => p !== opt) : [...prev, opt]);
                                            }}
                                            style={[styles.modalOption, { width: '48%' }, active && styles.modalOptionActive]}
                                        >
                                            <Text style={[styles.modalOptionLabel, active && styles.modalOptionLabelActive]}>{opt}</Text>
                                            {active && <Text style={styles.checkmark}>✓</Text>}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>
                        <TouchableOpacity style={[styles.modalCancel, { marginTop: 12, backgroundColor: '#1a1a1a' }]} onPress={() => setShowIndustriesPicker(false)}>
                            <Text style={[styles.modalCancelText, { fontWeight: '700' }]}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Date picker modal */}
            {
                showDatePicker && (
                    <CustomCalendar
                        visible={showDatePicker}
                        value={dateValue ?? new Date()}
                        onChange={(selected: Date) => {
                            setDateValue(selected);
                            const d = selected;
                            const formatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                            setEstablishedOn(formatted);
                        }}
                        onClose={() => setShowDatePicker(false)}
                    />
                )
            }
        </ScrollView >
    );
}

const styles = StyleSheet.create({
    scrollView: { flex: 1, backgroundColor: '#000' },
    scrollContent: { padding: 20, paddingBottom: 40 },
    header: { height: 56, flexDirection: 'row', alignItems: 'center' },
    backBtn: { padding: 8 },
    backText: { color: '#fff', fontSize: 22 },
    headerTitleWrap: { flex: 1, alignItems: 'center' },
    headerTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
    section: { marginBottom: 16, backgroundColor: '#111', borderRadius: 10 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 8 },
    sectionTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
    sectionToggle: { color: '#fff', fontSize: 22 },
    sectionContent: { padding: 8, paddingTop: 0 },
    label: { color: '#fff', marginBottom: 4 },
    input: { borderWidth: 1, borderColor: '#222', borderRadius: 8, padding: 10, color: '#fff', backgroundColor: '#111' },
    inputDark: { backgroundColor: '#222' },
    row: { flexDirection: 'row', gap: 8 },
    flex1: { flex: 1 },
    btnRow: { flexDirection: 'row', gap: 16 },
    btn: { flex: 1, borderWidth: 1, borderColor: '#444', borderRadius: 12, padding: 14, alignItems: 'center' },
    btnActive: { backgroundColor: '#222' },
    btnText: { color: '#fff', fontWeight: '500' },
    uploadWrap: { marginBottom: 32 },
    uploadBtn: { borderWidth: 1, borderColor: '#222', borderRadius: 8, padding: 16, alignItems: 'center', backgroundColor: '#111' },
    uploadText: { color: '#fff', fontWeight: '500' },
    consentRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 32 },
    consentBtn: { flexDirection: 'row', alignItems: 'center' },
    consentBox: { width: 24, height: 24, borderWidth: 2, borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
    consentBoxChecked: { borderColor: '#4caf50' },
    consentBoxUnchecked: { borderColor: '#777' },
    consentCheck: { width: 16, height: 16, backgroundColor: '#4caf50', borderRadius: 2 },
    gap16: { rowGap: 16 },
    w40: { width: 40 },
    textTop: { textAlignVertical: 'top' },
    infoText: { color: '#999', fontSize: 12 },
    consentText: { color: '#fff' },
    btnSend: { backgroundColor: '#222', marginBottom: 24 },
    btnSendActive: { backgroundColor: '#444' },
    hiddenOverflow: { overflow: 'hidden' },
    absHidden: { position: 'absolute', width: '100%', opacity: 0, zIndex: -1 },
    btnTextDisabled: { color: '#777' },
    btnTextEnabled: { color: '#fff' },
    formField: { marginBottom: 16 },
    pickerWrap: { padding: 0 },
    picker: { color: '#fff', width: '100%' },
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#111',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 8,
        padding: 16,
    },
    dropdownLabel: {
        fontSize: 12,
        color: '#8e8e8e',
        marginBottom: 4,
    },
    dropdownValue: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '500',
    },
    dropdownArrow: {
        fontSize: 12,
        color: '#8e8e8e',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1a1a1a',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
    },
    modalOptionActive: {
        backgroundColor: '#262626',
        marginHorizontal: -24,
        paddingHorizontal: 24,
    },
    modalOptionLabel: {
        fontSize: 16,
        color: '#ccc',
    },
    modalOptionLabelActive: {
        color: '#fff',
        fontWeight: '600',
    },
    checkmark: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    modalCancel: {
        marginTop: 20,
        padding: 16,
        alignItems: 'center',
    },
    modalCancelText: {
        color: '#ef4444',
        fontSize: 16,
        fontWeight: '600',
    },
    // Trade button styles
    tradeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1a1a1a',
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
    },
    tradeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    tradeConsentRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginTop: 8,
    },
    tradeConsentBtn: {
        marginTop: 2,
    },
    tradeConsentBox: {
        width: 20,
        height: 20,
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tradeConsentBoxChecked: {
        borderColor: '#4caf50',
        backgroundColor: '#4caf50',
    },
    tradeConsentCheck: {
        width: 10,
        height: 10,
        backgroundColor: '#fff',
        borderRadius: 5,
    },
    tradeConsentText: {
        flex: 1,
        color: '#888',
        fontSize: 13,
        lineHeight: 18,
    },
});
