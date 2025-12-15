import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, Animated, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { saveStartupProfile, getProfile, getStartupProfile, uploadDocument } from '../../lib/api';
import { pick, types } from '@react-native-documents/picker';

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

export default function StartupPortfolioStep({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
    const [activeSection, setActiveSection] = useState('');
    const [companyProfile, setCompanyProfile] = useState('');
    const [about, setAbout] = useState('');
    const [location, setLocation] = useState('');
    const [companyType, setCompanyType] = useState('');
    const [establishedOn, setEstablishedOn] = useState('');
    const [teamName, setTeamName] = useState('');
    const [teamRole, setTeamRole] = useState('');
    const [revenueType, setRevenueType] = useState('Pre-revenue');
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
                        setEstablishedOn(data.establishedOn ? String(data.establishedOn).slice(0, 10) : '');
                        if (Array.isArray(data.teamMembers) && data.teamMembers.length > 0) {
                            setTeamName(data.teamMembers[0].name || '');
                            setTeamRole(data.teamMembers[0].role || '');
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
                        // Load round/stage (backend stores as 'stage', frontend uses 'roundType')
                        setRoundType(data.roundType || data.stage || '');
                        // Load required capital (backend stores as 'fundingNeeded', frontend uses 'requiredCapital')
                        setRequiredCapital(data.requiredCapital || data.fundingNeeded ? String(data.requiredCapital || data.fundingNeeded) : '');
                        // Populate documents URL (but DON'T set uploadName - only show name when user picks new file)
                        if (data.documents) {
                            // setUploadName is intentionally NOT set here - document name only shows for newly picked files
                            setUploadUrl(data.documents);
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
                setPendingDoc({ uri: doc.uri, name: doc.name, type: doc.type });
                setUploadName(doc.name || 'document');
            }
        } catch (err: any) {
            // User cancelled or error
            if (err?.code !== 'DOCUMENT_PICKER_CANCELED') {
                Alert.alert('Error', err.message || 'Failed to pick document');
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
                setPendingInvestorDoc({ uri: doc.uri, name: doc.name, type: doc.type });
                setInvestorDoc(doc.name || 'document');
            }
        } catch (err: any) {
            // User cancelled or error
            if (err?.code !== 'DOCUMENT_PICKER_CANCELED') {
                Alert.alert('Error', err.message || 'Failed to pick document');
            }
        }
    };

    const sendForVerification = async () => {
        if (!consent) return Alert.alert('Consent required', 'Please provide consent to proceed');

        setUploadingDoc(true);
        setUploadingInvestorDoc(true);
        try {
            // Upload staged documents if any
            let finalUploadUrl = uploadUrl;
            if (pendingDoc) {
                try {
                    const url = await uploadDocument(pendingDoc.uri, pendingDoc.name || undefined, pendingDoc.type || undefined);
                    finalUploadUrl = url;
                    setUploadUrl(url);
                    setPendingDoc(null);
                } catch (e: any) {
                    Alert.alert('Upload Failed', e?.message || 'Could not upload document');
                    return;
                }
            }

            let finalInvestorDocUrl = investorDocUrl;
            if (pendingInvestorDoc) {
                try {
                    const url = await uploadDocument(pendingInvestorDoc.uri, pendingInvestorDoc.name || undefined, pendingInvestorDoc.type || undefined);
                    finalInvestorDocUrl = url;
                    setInvestorDocUrl(url);
                    setPendingInvestorDoc(null);
                } catch (e: any) {
                    Alert.alert('Upload Failed', e?.message || 'Could not upload investor document');
                    return;
                }
            }

            const payload = {
                companyName: companyProfile,
                about,
                location,
                companyType,
                establishedOn,
                teamMembers: teamName && teamRole ? [{ name: teamName, role: teamRole }] : [],
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
            Alert.alert('Sent', 'Documents sent for verification');
            onDone();
        } catch (error: any) {
            Alert.alert('Error', error?.message || 'Unable to send for verification');
        } finally {
            setUploadingDoc(false);
            setUploadingInvestorDoc(false);
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
                        <Text style={styles.label}>Company Type</Text>
                        <TextInput placeholder="Select company type" placeholderTextColor="#999" value={companyType} onChangeText={setCompanyType} style={styles.input} />
                    </View>
                    <View style={styles.formField}>
                        <Text style={styles.label}>Company Established On</Text>
                        <TextInput placeholder="dd-mm-yyyy" placeholderTextColor="#999" value={establishedOn} onChangeText={setEstablishedOn} style={styles.input} />
                    </View>
                    <View style={[styles.row, styles.formField]}>
                        <View style={styles.flex1}>
                            <Text style={styles.label}>Team</Text>
                            <TextInput placeholder="@username" placeholderTextColor="#999" value={teamName} onChangeText={setTeamName} style={styles.input} />
                        </View>
                        <View style={styles.flex1}>
                            <Text style={styles.label}>Role</Text>
                            <TextInput placeholder="Role" placeholderTextColor="#999" value={teamRole} onChangeText={setTeamRole} style={styles.input} />
                        </View>
                    </View>
                </View>
            </CollapsibleSection>

            <CollapsibleSection title="Financial profile" open={activeSection === 'financial'} onPress={() => setActiveSection(activeSection === 'financial' ? '' : 'financial')}>
                <View>
                    <View style={styles.formField}>
                        <Text style={styles.label}>Revenue type</Text>
                        <View style={[styles.input, styles.inputDark, styles.pickerWrap]}>
                            <Picker
                                selectedValue={revenueType}
                                onValueChange={setRevenueType}
                                dropdownIconColor="#fff"
                                style={styles.picker}
                            >
                                <Picker.Item label="Pre-revenue" value="Pre-revenue" />
                                <Picker.Item label="Revenue generating" value="Revenue generating" />
                            </Picker>
                        </View>
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
                    <View style={styles.formField}>
                        <Text style={styles.label}>Raised amount</Text>
                        <TextInput
                            placeholder="Enter raised amount"
                            placeholderTextColor="#999"
                            value={raisedAmount}
                            onChangeText={setRaisedAmount}
                            style={styles.input}
                            keyboardType="numeric"
                        />
                    </View>
                    {fundingMethod === 'Capital Raised' && (
                        <>
                            <View style={styles.formField}>
                                <Text style={styles.label}>Investor name</Text>
                                <TextInput
                                    placeholder="Enter investor name"
                                    placeholderTextColor="#999"
                                    value={investorName}
                                    onChangeText={setInvestorName}
                                    style={styles.input}
                                />
                            </View>
                            <View style={styles.uploadWrap}>
                                <TouchableOpacity onPress={pickInvestorDoc} style={styles.uploadBtn} disabled={uploadingInvestorDoc}>
                                    {uploadingInvestorDoc ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.uploadText}>{investorDoc || 'Upload investor proof'}</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            </CollapsibleSection>

            <CollapsibleSection title="Raise a round" open={activeSection === 'raise'} onPress={() => setActiveSection(activeSection === 'raise' ? '' : 'raise')}>
                <View>
                    <View style={styles.formField}>
                        <Text style={styles.label}>Round</Text>
                        <View style={[styles.input, styles.inputDark, styles.pickerWrap]}>
                            <Picker
                                selectedValue={roundType}
                                onValueChange={setRoundType}
                                dropdownIconColor="#fff"
                                style={styles.picker}
                            >
                                <Picker.Item label="Select round" value="" color="#999" />
                                <Picker.Item label="Pre-seed" value="Pre-seed" />
                                <Picker.Item label="Seed" value="Seed" />
                                <Picker.Item label="Series A" value="Series A" />
                                <Picker.Item label="Series B" value="Series B" />
                                <Picker.Item label="Series C" value="Series C" />
                                <Picker.Item label="Series D" value="Series D" />
                                <Picker.Item label="Series D and beyond" value="Series D and beyond" />
                            </Picker>
                        </View>
                    </View>
                    <View style={styles.formField}>
                        <Text style={styles.label}>Required capital</Text>
                        <TextInput
                            placeholder="Enter required capital"
                            placeholderTextColor="#999"
                            value={requiredCapital}
                            onChangeText={setRequiredCapital}
                            style={styles.input}
                            keyboardType="numeric"
                        />
                    </View>
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
        </ScrollView>
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
});
