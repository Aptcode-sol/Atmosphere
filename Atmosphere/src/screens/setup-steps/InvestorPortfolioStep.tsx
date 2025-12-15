/* eslint-disable react-native/no-inline-styles */
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Animated, Alert, ActivityIndicator } from 'react-native';
import { updateProfile, getProfile, uploadDocument } from '../../lib/api';
import CustomCalendar from '../../components/CustomCalendar';
import { pick, types } from '@react-native-documents/picker';

function Collapsible({ title, open, onToggle, children }: any) {
    const [measuredHeight, setMeasuredHeight] = useState(0);
    const animatedValue = useRef(new Animated.Value(open ? 1 : 0)).current;

    React.useEffect(() => {
        Animated.timing(animatedValue, { toValue: open ? 1 : 0, duration: 300, useNativeDriver: false }).start();
    }, [open, animatedValue]);

    const containerHeight = animatedValue.interpolate({ inputRange: [0, 1], outputRange: [0, measuredHeight] });

    return (
        <View style={localStyles.section}>
            <TouchableOpacity onPress={onToggle} style={localStyles.sectionHeader}>
                <Text style={localStyles.sectionTitle}>{title}</Text>
                <Text style={localStyles.sectionToggle}>{open ? '-' : '+'}</Text>
            </TouchableOpacity>

            {/* Invisible measurer placed absolutely so it doesn't affect layout */}
            <View style={{ position: 'absolute', left: 0, right: 0, opacity: 0 }} pointerEvents="none">
                <View
                    onLayout={(e) => {
                        const h = e.nativeEvent.layout.height;
                        if (h !== measuredHeight) setMeasuredHeight(h);
                    }}
                >
                    {children}
                </View>
            </View>

            <Animated.View style={{ height: containerHeight, overflow: 'hidden' }}>
                <View style={localStyles.sectionContent}>
                    {children}
                </View>
            </Animated.View>
        </View>
    );
}

export default function InvestorPortfolioStep({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
    const [openInterests, setOpenInterests] = useState(false);
    const [openHoldings, setOpenHoldings] = useState(false);

    const [about, setAbout] = useState('qwd');
    const [location, setLocation] = useState('ad');

    const [showFocusPicker, setShowFocusPicker] = useState(false);
    const [selectedFocus, setSelectedFocus] = useState<string[]>(['AI']);
    const [showRoundPicker, setShowRoundPicker] = useState(false);
    const [selectedRounds, setSelectedRounds] = useState<string[]>(['Pre-seed']);
    const [showStagePicker, setShowStagePicker] = useState(false);
    const [selectedStages, setSelectedStages] = useState<string[]>(['Idea']);
    const [geography, setGeography] = useState('dsa');
    const [minCheck, setMinCheck] = useState('123');
    const [maxCheck, setMaxCheck] = useState('12345');

    // Holdings state & add form
    const [holdings, setHoldings] = useState<Array<{ name: string; date: string; amount: number; companyId?: string; docUrl?: string }>>([]);
    const [addingHolding, setAddingHolding] = useState(false);
    const [companyName, setCompanyName] = useState('ldnlk');
    const [companyId, setCompanyId] = useState('123123');
    const [date, setDate] = useState('');
    const [dateValue, setDateValue] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [amount, setAmount] = useState('123');
    const [docName, setDocName] = useState('');
    const [docUrl, setDocUrl] = useState('');
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [pendingDoc, setPendingDoc] = useState<{ uri: string; name?: string; type?: string } | null>(null);

    const resetForm = () => {
        setCompanyName(''); setCompanyId(''); setDate(''); setAmount(''); setDocName(''); setDocUrl('');
    };

    const pickDocument = async () => {
        try {
            // Allow all document types
            const result = await pick({
                type: [types.allFiles],
            });

            if (!result || result.length === 0) return;

            const doc = result[0];
            if (doc && doc.uri) {
                // Stage the file locally and show name, do NOT upload yet
                setPendingDoc({ uri: doc.uri, name: doc.name, type: doc.type });
                setDocName(doc.name || 'document');
            }
        } catch (err: any) {
            // User cancelled or error
            if (err?.code !== 'DOCUMENT_PICKER_CANCELED') {
                Alert.alert('Error', err.message || 'Failed to pick document');
            }
        }
    };

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const profile = await getProfile();
                const details = profile?.details;
                if (!mounted) return;
                if (details) {
                    setAbout(details.about || '');
                    setLocation(details.location || '');
                    setSelectedFocus(Array.isArray(details.investmentFocus) ? details.investmentFocus : (details.investmentFocus ? details.investmentFocus.split(',').map((s: string) => s.trim()) : []));
                    setSelectedRounds(Array.isArray(details.interestedRounds) ? details.interestedRounds : (details.interestedRounds ? details.interestedRounds.split(',').map((s: string) => s.trim()) : []));
                    setSelectedStages(Array.isArray(details.stage) ? details.stage : (details.stage ? details.stage.split(',').map((s: string) => s.trim()) : []));
                    setGeography(Array.isArray(details.geography) ? details.geography.join(', ') : (details.geography || ''));
                    if (details.checkSize) {
                        setMinCheck(details.checkSize.min ? String(details.checkSize.min) : '');
                        setMaxCheck(details.checkSize.max ? String(details.checkSize.max) : '');
                    }
                    // map previousInvestments to holdings
                    if (Array.isArray(details.previousInvestments)) {
                        const mapped = details.previousInvestments.map((pi: any) => ({
                            name: pi.companyName || pi.name || '',
                            companyId: pi.companyId,
                            date: pi.date ? (new Date(pi.date)).toLocaleDateString() : '',
                            amount: pi.amount || 0,
                        }));
                        setHoldings(mapped);
                    }
                }
            } catch (err: any) {
                console.warn('Could not load profile for investor step', err && err.message);
            }
        })();
        return () => { mounted = false; };
    }, []);

    const handleVerifyHolding = async () => {
        // basic validation
        if (!companyName || !amount) {
            // minimal feedback — in real app use Alert
            Alert.alert('Missing fields', 'Please provide company name and amount');
            return;
        }

        setUploadingDoc(true);
        try {
            let finalDocUrl = docUrl;
            if (pendingDoc) {
                try {
                    const url = await uploadDocument(pendingDoc.uri, pendingDoc.name || undefined, pendingDoc.type || undefined);
                    finalDocUrl = url;
                    setDocUrl(url);
                    setPendingDoc(null);
                } catch (e: any) {
                    Alert.alert('Upload Failed', e?.message || 'Could not upload document');
                    return;
                }
            }

            const amt = parseFloat(amount) || 0;
            const newHolding = { name: companyName, date: date || new Date().toLocaleDateString(), amount: amt, docUrl: finalDocUrl };
            setHoldings((prev) => {
                const updated = [...prev, newHolding];
                // persist updated holdings immediately
                saveInvestorDetails({ previousInvestments: updated });
                return updated;
            });
            setAddingHolding(false);
            resetForm();
        } finally {
            setUploadingDoc(false);
        }
    };

    async function saveInvestorDetails(overrides: any = {}) {
        // Compose details payload from current state + overrides
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        let pending: any = {};
        try {
            const raw = await AsyncStorage.getItem('pending.investor.details');
            if (raw) pending = JSON.parse(raw || '{}');
        } catch {
            pending = {};
        }

        const detailsData: any = {
            // prefer current screen values, fallback to pending saved values
            about: about || pending.about,
            location: location || pending.location,
            investmentFocus: (selectedFocus && selectedFocus.length) ? selectedFocus : (pending.investmentFocus || []),
            interestedRounds: (selectedRounds && selectedRounds.length) ? selectedRounds : (pending.interestedRounds || []),
            stage: selectedStages.join(', '),
            geography: geography ? geography.split(',').map(s => s.trim()) : (pending.geography || undefined),
            checkSize: {
                min: minCheck ? Number(minCheck) : (pending.checkSize ? pending.checkSize.min : undefined),
                max: maxCheck ? Number(maxCheck) : (pending.checkSize ? pending.checkSize.max : undefined),
            },
            previousInvestments: holdings.map(h => ({ companyName: h.name, companyId: h.companyId || undefined, date: h.date, amount: h.amount, docs: h.docUrl ? [h.docUrl] : [] })),
            ...overrides,
        };

        try {
            await updateProfile({ detailsData });
            // feedback
            // in future update local cache / context
            try { await AsyncStorage.removeItem('pending.investor.details'); } catch { }
        } catch (err: any) {
            console.error('Error saving investor details', err);
            Alert.alert('Save failed', err.message || 'Could not save investor details');
        }
    }

    return (
        <View style={localStyles.container}>
            <View style={localStyles.header}>
                <TouchableOpacity onPress={onBack} style={localStyles.backBtn}>
                    <Text style={localStyles.backText}>{'←'}</Text>
                </TouchableOpacity>
                <View style={localStyles.headerCenter}>
                    <Text style={localStyles.headerTitle}>Expand Your Profile</Text>
                    <Text style={localStyles.stepText}>Step 3 of 3</Text>
                </View>
                <TouchableOpacity onPress={async () => { await saveInvestorDetails(); }} style={localStyles.saveBtn}><Text style={localStyles.saveText}>Save</Text></TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={localStyles.content}>
                <Collapsible title="Personal Interests" open={openInterests} onToggle={() => { setOpenInterests((v) => !v); if (!openInterests) setOpenHoldings(false); }}>
                    <Text style={localStyles.fieldLabel}>About Myself</Text>
                    <TextInput value={about} onChangeText={setAbout} placeholder="Tell us more about yourself..." placeholderTextColor="#777" style={localStyles.textarea} />

                    <Text style={localStyles.fieldLabel}>Location</Text>
                    <TextInput value={location} onChangeText={setLocation} placeholder="San Francisco, USA" placeholderTextColor="#777" style={localStyles.input} />

                    <Text style={localStyles.fieldLabel}>Investment Focus</Text>
                    <TouchableOpacity onPress={() => setShowFocusPicker(true)} style={localStyles.input}>
                        <Text style={{ color: selectedFocus.length ? '#fff' : '#777' }}>{selectedFocus.length ? selectedFocus.join(', ') : 'Select focus areas'}</Text>
                    </TouchableOpacity>

                    <Text style={localStyles.fieldLabel}>Interested round</Text>
                    <TouchableOpacity onPress={() => setShowRoundPicker(true)} style={localStyles.input}>
                        <Text style={{ color: selectedRounds.length ? '#fff' : '#777' }}>{selectedRounds.length ? selectedRounds.join(', ') : 'Select interested rounds'}</Text>
                    </TouchableOpacity>

                    <Text style={localStyles.fieldLabel}>Stage</Text>
                    <TouchableOpacity onPress={() => setShowStagePicker(true)} style={localStyles.input}>
                        <Text style={{ color: selectedStages.length ? '#fff' : '#777' }}>{selectedStages.length ? selectedStages.join(', ') : 'Select stage'}</Text>
                    </TouchableOpacity>

                    <Text style={localStyles.fieldLabel}>Investment Geography</Text>
                    <TextInput value={geography} onChangeText={setGeography} placeholder="Search geographies" placeholderTextColor="#777" style={localStyles.input} />

                    <Text style={localStyles.hint}>If empty → Default: Worldwide</Text>

                    <Text style={[localStyles.fieldLabel, { marginTop: 12 }]}>Check Size (USD)</Text>
                    <View style={localStyles.checkRow}>
                        <TextInput value={minCheck} onChangeText={setMinCheck} placeholder="Min in $" placeholderTextColor="#777" style={[localStyles.input, localStyles.checkInput]} />
                        <TextInput value={maxCheck} onChangeText={setMaxCheck} placeholder="Max in $" placeholderTextColor="#777" style={[localStyles.input, localStyles.checkInput]} />
                    </View>
                </Collapsible>

                <Collapsible title="Holdings" open={openHoldings} onToggle={() => { setOpenHoldings((v) => !v); if (!openHoldings) setOpenInterests(false); }}>
                    <View>
                        {holdings.map((h, idx) => (
                            <View key={idx} style={localStyles.holdingCard}>
                                <View style={localStyles.holdingLeft}>
                                    <Text style={localStyles.holdingName}>{h.name}</Text>
                                    <Text style={localStyles.holdingDate}>{h.date}</Text>
                                </View>
                                <View style={localStyles.holdingRight}>
                                    <Text style={localStyles.holdingAmount}>${Number(h.amount).toLocaleString()}</Text>
                                </View>
                            </View>
                        ))}

                        <TouchableOpacity style={localStyles.addHoldingsBtn} onPress={() => setAddingHolding(true)}>
                            <Text style={localStyles.addHoldingsPlus}>+</Text>
                            <Text style={localStyles.addHoldingsText}>Add holdings</Text>
                        </TouchableOpacity>

                        {addingHolding && (
                            <View style={localStyles.addForm}>
                                <Text style={localStyles.formLabel}>Company Full Legal Name</Text>
                                <TextInput value={companyName} onChangeText={setCompanyName} placeholder="Enter company name" placeholderTextColor="#777" style={localStyles.input} />

                                <Text style={localStyles.formLabel}>Company ID</Text>
                                <TextInput value={companyId} onChangeText={setCompanyId} placeholder="Enter company ID" placeholderTextColor="#777" style={localStyles.input} />

                                <Text style={localStyles.formLabel}>Date of Investment</Text>
                                <TouchableOpacity onPress={() => {
                                    // open date picker if available
                                    setDateValue(date ? new Date(date) : new Date());
                                    setShowDatePicker(true);
                                }} style={localStyles.input}>
                                    <Text style={{ color: date ? '#fff' : '#777' }}>{date || 'dd-mm-yyyy'}</Text>
                                </TouchableOpacity>

                                {showDatePicker && (
                                    <CustomCalendar
                                        visible={showDatePicker}
                                        value={dateValue ?? new Date()}
                                        onChange={(selected: Date) => {
                                            setDateValue(selected);
                                            const d = selected;
                                            const s = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
                                            setDate(s);
                                        }}
                                        onClose={() => setShowDatePicker(false)}
                                    />
                                )}

                                <Text style={localStyles.formLabel}>Amount Invested (USD)</Text>
                                <TextInput value={amount} onChangeText={setAmount} placeholder="0.00" placeholderTextColor="#777" keyboardType="numeric" style={localStyles.input} />

                                <Text style={localStyles.formLabel}>Upload Documents</Text>
                                <TouchableOpacity style={localStyles.chooseFile} onPress={pickDocument} disabled={uploadingDoc}>
                                    {uploadingDoc ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={{ color: docName ? '#fff' : '#777' }}>{docName || 'Choose file'}</Text>
                                    )}
                                </TouchableOpacity>

                                <View style={localStyles.formActions}>
                                    <TouchableOpacity onPress={() => { setAddingHolding(false); resetForm(); }} style={localStyles.cancelBtn}>
                                        <Text style={localStyles.cancelText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => { handleVerifyHolding(); }} style={localStyles.verifyBtn}>
                                        <Text style={localStyles.verifyText}>Verify</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </Collapsible>

                {showFocusPicker && (
                    <View style={localStyles.pickerBackdrop}>
                        <View style={localStyles.pickerBox}>
                            <Text style={localStyles.pickerTitle}>Investment Focus</Text>
                            <View style={localStyles.pickerGrid}>
                                {['AI', 'SaaS', 'Drones', 'FinTech', 'HealthTech', 'EdTech', 'E-commerce', 'Blockchain', 'IoT', 'CleanTech'].map((opt) => {
                                    const active = selectedFocus.includes(opt);
                                    return (
                                        <TouchableOpacity key={opt} onPress={() => {
                                            setSelectedFocus((prev) => prev.includes(opt) ? prev.filter(p => p !== opt) : [...prev, opt]);
                                        }} style={[localStyles.pickerItem, active && localStyles.pickerItemActive]}>
                                            <Text style={[localStyles.pickerItemText, active && localStyles.pickerItemTextActive]}>{opt}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                            <TouchableOpacity onPress={() => { setSelectedFocus(selectedFocus); setShowFocusPicker(false); }} style={localStyles.pickerDone}>
                                <Text style={localStyles.pickerDoneText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {showRoundPicker && (
                    <View style={localStyles.pickerBackdrop}>
                        <View style={localStyles.pickerBox}>
                            <Text style={localStyles.pickerTitle}>Interested rounds</Text>
                            <View style={localStyles.pickerGrid}>
                                {['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D+'].map((opt) => {
                                    const active = selectedRounds.includes(opt);
                                    return (
                                        <TouchableOpacity key={opt} onPress={() => {
                                            setSelectedRounds((prev) => prev.includes(opt) ? prev.filter(p => p !== opt) : [...prev, opt]);
                                        }} style={[localStyles.pickerItem, active && localStyles.pickerItemActive]}>
                                            <Text style={[localStyles.pickerItemText, active && localStyles.pickerItemTextActive]}>{opt}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                            <TouchableOpacity onPress={() => { setSelectedRounds(selectedRounds); setShowRoundPicker(false); }} style={localStyles.pickerDone}>
                                <Text style={localStyles.pickerDoneText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {showStagePicker && (
                    <View style={localStyles.pickerBackdrop}>
                        <View style={localStyles.pickerBox}>
                            <Text style={localStyles.pickerTitle}>Stage</Text>
                            <View style={localStyles.pickerGrid}>
                                {['Idea', 'Prototype', 'MVP', 'Beta Users', 'Launched Product', 'Scaling'].map((opt) => {
                                    const active = selectedStages.includes(opt);
                                    return (
                                        <TouchableOpacity key={opt} onPress={() => {
                                            setSelectedStages((prev) => prev.includes(opt) ? prev.filter(p => p !== opt) : [...prev, opt]);
                                        }} style={[localStyles.pickerItem, active && localStyles.pickerItemActive]}>
                                            <Text style={[localStyles.pickerItemText, active && localStyles.pickerItemTextActive]}>{opt}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                            <TouchableOpacity onPress={() => { setSelectedStages(selectedStages); setShowStagePicker(false); }} style={localStyles.pickerDone}>
                                <Text style={localStyles.pickerDoneText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <TouchableOpacity onPress={async () => { await saveInvestorDetails(); onDone(); }} style={localStyles.doneBtn}>
                    <Text style={localStyles.doneBtnText}>Update Details</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const localStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0b0b0b' },
    header: { height: 84, paddingTop: 28, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' },
    backBtn: { width: 48 },
    backText: { fontSize: 22, color: '#fff' },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
    stepText: { fontSize: 12, color: '#bbb', marginTop: 4 },
    saveBtn: { padding: 8 },
    saveText: { color: '#fff' },
    content: { padding: 20 },
    section: { marginBottom: 16, backgroundColor: 'transparent' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
    sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
    sectionToggle: { color: '#fff', fontSize: 18 },
    sectionContent: { paddingVertical: 8 },
    fieldLabel: { color: '#ddd', marginBottom: 8 },
    input: { borderWidth: 1, borderColor: '#222', padding: 12, borderRadius: 12, color: '#fff', marginBottom: 12 },
    textarea: { borderWidth: 1, borderColor: '#222', padding: 16, borderRadius: 12, color: '#fff', minHeight: 120, textAlignVertical: 'top', marginBottom: 12 },
    hint: { color: '#888', fontSize: 12 },
    checkRow: { flexDirection: 'row', gap: 12 },
    checkInput: { flex: 1 },
    doneBtn: { marginTop: 20, padding: 16, backgroundColor: '#111', borderRadius: 12, alignItems: 'center' },
    doneBtnText: { color: '#fff', fontWeight: '700' },
    holdingCard: {
        backgroundColor: '#0f0f0f',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#222',
    },
    holdingLeft: { flex: 1 },
    holdingName: { color: '#fff', fontWeight: '700', marginBottom: 6 },
    holdingDate: { color: '#bbb', fontSize: 12 },
    holdingRight: { width: 120, alignItems: 'flex-end' },
    holdingAmount: { color: '#fff', fontWeight: '700' },
    addHoldingsBtn: { marginTop: 8, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#1a1a1a', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#222', minWidth: '100%' },
    addHoldingsPlus: { color: '#fff', fontSize: 20, marginRight: 8 },
    addHoldingsText: { color: '#fff', fontWeight: '700' },
    addForm: { marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: '#0f0f0f', borderWidth: 1, borderColor: '#222' },
    formLabel: { color: '#ddd', marginBottom: 6 },
    chooseFile: { borderWidth: 1, borderColor: '#222', padding: 12, borderRadius: 12, marginBottom: 12 },
    formActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    cancelBtn: { paddingVertical: 12, paddingHorizontal: 20 },
    cancelText: { color: '#fff' },
    verifyBtn: { paddingVertical: 12, paddingHorizontal: 20, backgroundColor: '#2b2b2b', borderRadius: 20 },
    verifyText: { color: '#fff', fontWeight: '700' },
    pickerBackdrop: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: '#00000066', justifyContent: 'center', alignItems: 'center' },
    pickerBox: { width: '90%', backgroundColor: '#070707', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#222' },
    pickerTitle: { color: '#fff', fontWeight: '700', marginBottom: 12 },
    pickerGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    pickerItem: { width: '48%', paddingVertical: 12, backgroundColor: '#0f0f0f', borderRadius: 8, marginBottom: 8, alignItems: 'center', borderWidth: 1, borderColor: '#222' },
    pickerItemActive: { backgroundColor: '#222', borderColor: '#444' },
    pickerItemText: { color: '#fff' },
    pickerItemTextActive: { color: '#fff', fontWeight: '700' },
    pickerDone: { marginTop: 12, backgroundColor: '#1a1a1a', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
    pickerDoneText: { color: '#fff', fontWeight: '700' },
    modalInput: { borderWidth: 1, borderColor: '#222', padding: 12, borderRadius: 8, color: '#fff', backgroundColor: '#0b0b0b' },
});

// styles intentionally removed: localStyles contains the usable styling for this screen
