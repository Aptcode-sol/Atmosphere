/* eslint-disable react-native/no-inline-styles */
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, Dimensions, Modal, TextInput, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useAlert } from '../../components/CustomAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from './Profile.styles';
import { clearToken } from '../../lib/auth';
import { getSettings, updateSettings, changePassword, getProfile, updateProfile, saveStartupProfile, getStartupProfile, uploadDocument, checkUsernameAvailability, resendOtp, verifyEmail } from '../../lib/api';
import { Picker } from '@react-native-picker/picker';
import { pick, types } from '@react-native-documents/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ArrowLeft, User, AtSign, Key, Mail, Phone, BarChart2, Bookmark, Settings2, MessageSquare, Users, Shield, Briefcase, Crown, HelpCircle, Info, Eye, EyeOff, Check, X } from 'lucide-react-native';

const SETTINGS_CACHE_KEY = 'ATMOSPHERE_SETTINGS_CACHE';

type Props = {
    src: any;
    theme: any;
    accountType?: 'investor' | 'startup' | 'personal';
    onClose: () => void;
    onNavigate?: (route: string) => void;
};

type Settings = {
    displayName: string;
    username: string;
    email: string;
    phone: string;
};

// Collapsible Section Component
function Collapsible({ title, open, onToggle, children, theme }: any) {
    const [measuredHeight, setMeasuredHeight] = useState(0);
    const animatedValue = useRef(new Animated.Value(open ? 1 : 0)).current;

    React.useEffect(() => {
        Animated.timing(animatedValue, { toValue: open ? 1 : 0, duration: 300, useNativeDriver: false }).start();
    }, [open, animatedValue]);

    const containerHeight = animatedValue.interpolate({ inputRange: [0, 1], outputRange: [0, measuredHeight] });

    return (
        <View style={localStyles.collapsibleSection}>
            <TouchableOpacity onPress={onToggle} style={localStyles.collapsibleHeader}>
                <Text style={[localStyles.collapsibleTitle, { color: theme.text }]}>{title}</Text>
                <Text style={[localStyles.collapsibleToggle, { color: theme.placeholder }]}>{open ? '−' : '+'}</Text>
            </TouchableOpacity>

            {/* Invisible measurer */}
            <View style={{ position: 'absolute', left: 0, right: 0, opacity: 0 }} pointerEvents="none">
                <View onLayout={(e) => {
                    const h = e.nativeEvent.layout.height;
                    if (h !== measuredHeight) setMeasuredHeight(h);
                }}>
                    {children}
                </View>
            </View>

            <Animated.View style={{ height: containerHeight, overflow: 'hidden' }}>
                <View style={localStyles.collapsibleContent}>
                    {children}
                </View>
            </Animated.View>
        </View>
    );
}

export default function SettingsOverlay({ src, theme, accountType = 'personal', onClose, onNavigate }: Props) {
    const { showAlert } = useAlert();
    const slideAnim = useRef(new Animated.Value(-Dimensions.get('window').width)).current;
    const width = Dimensions.get('window').width;

    // Settings state
    const [settings, setSettings] = useState<Settings>({
        displayName: src?.name || '',
        username: src?.username?.replace('@', '') || '',
        email: '',
        phone: '',
    });
    const [loading, setLoading] = useState(true);

    // Modal states
    const [editModal, setEditModal] = useState<{ visible: boolean; field: string; value: string }>({
        visible: false,
        field: '',
        value: '',
    });
    const [passwordModal, setPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);
    // Password visibility toggles
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    // Username validation states
    const [usernameChecking, setUsernameChecking] = useState(false);
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [usernameWarning, setUsernameWarning] = useState('');
    // Email OTP states
    const [emailModal, setEmailModal] = useState({ visible: false, value: '' });
    const [emailOtpSent, setEmailOtpSent] = useState(false);
    const [emailOtp, setEmailOtp] = useState('');
    const [emailVerified, setEmailVerified] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);


    // Collapsible states
    const [openInterests, setOpenInterests] = useState(false);
    const [openHoldings, setOpenHoldings] = useState(false);
    const [openCompanyProfile, setOpenCompanyProfile] = useState(false);
    const [openFinancialProfile, setOpenFinancialProfile] = useState(false);
    const [openRaiseRound, setOpenRaiseRound] = useState(false);

    // Investor state
    const [about, setAbout] = useState('');
    const [location, setLocation] = useState('');
    const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
    const [selectedRounds, setSelectedRounds] = useState<string[]>([]);
    const [selectedStages, setSelectedStages] = useState<string[]>([]);
    const [geography, setGeography] = useState('');
    const [minCheck, setMinCheck] = useState('');
    const [maxCheck, setMaxCheck] = useState('');
    const [holdings, setHoldings] = useState<Array<{ name: string; date: string; amount: number }>>([]);

    // Add holding modal state
    const [showAddHoldingModal, setShowAddHoldingModal] = useState(false);
    const [newHoldingName, setNewHoldingName] = useState('');
    const [newHoldingDate, setNewHoldingDate] = useState<Date | null>(null);
    const [showHoldingDatePicker, setShowHoldingDatePicker] = useState(false);
    const [newHoldingAmount, setNewHoldingAmount] = useState('');
    const [newHoldingDocName, setNewHoldingDocName] = useState('');
    const [pendingHoldingDoc, setPendingHoldingDoc] = useState<{ uri: string; name?: string; type?: string } | null>(null);
    const [uploadingHoldingDoc, setUploadingHoldingDoc] = useState(false);

    // Startup state
    const [companyName, setCompanyName] = useState('');
    const [companyAbout, setCompanyAbout] = useState('');
    const [companyLocation, setCompanyLocation] = useState('');
    const [companyType, setCompanyType] = useState('');
    const [establishedOn, setEstablishedOn] = useState('');
    const [teamName, setTeamName] = useState('');
    const [teamRole, setTeamRole] = useState('');
    const [revenueType, setRevenueType] = useState('Pre-revenue');
    const [fundingMethod, setFundingMethod] = useState('');
    const [raisedAmount, setRaisedAmount] = useState('');
    const [investorName, setInvestorName] = useState('');
    const [roundType, setRoundType] = useState('');
    const [requiredCapital, setRequiredCapital] = useState('');

    // Verification status
    const [isVerified, setIsVerified] = useState(false);

    // Fetch settings on mount with caching
    useEffect(() => {
        (async () => {
            try {
                // Load from cache first for instant display
                const cached = await AsyncStorage.getItem(SETTINGS_CACHE_KEY);
                if (cached) {
                    const cachedData = JSON.parse(cached);
                    setSettings(cachedData);
                    setLoading(false);
                }

                // Fetch fresh data from API
                const data = await getSettings();
                const newSettings = {
                    displayName: data.displayName || src?.name || '',
                    username: data.username || src?.username?.replace('@', '') || '',
                    email: data.email || '',
                    phone: data.phone || '',
                };
                setSettings(newSettings);
                // Update cache
                await AsyncStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(newSettings));

                // Fetch profile details for investor/startup
                if (accountType === 'investor' || accountType === 'startup') {
                    try {
                        const profile = await getProfile();
                        const details = profile?.details;

                        // Set verified status from profile
                        if (profile?.user?.verified) {
                            setIsVerified(true);
                        }

                        if (details) {
                            if (accountType === 'investor') {
                                setAbout(details.about || '');
                                setLocation(details.location || '');
                                setSelectedFocus(Array.isArray(details.investmentFocus) ? details.investmentFocus : []);
                                setSelectedRounds(Array.isArray(details.interestedRounds) ? details.interestedRounds : []);
                                setSelectedStages(Array.isArray(details.stage) ? details.stage : (details.stage ? [details.stage] : []));
                                setGeography(Array.isArray(details.geography) ? details.geography.join(', ') : (details.geography || ''));
                                if (details.checkSize) {
                                    setMinCheck(details.checkSize.min ? String(details.checkSize.min) : '');
                                    setMaxCheck(details.checkSize.max ? String(details.checkSize.max) : '');
                                }
                                if (Array.isArray(details.previousInvestments)) {
                                    const mapped = details.previousInvestments.map((pi: any) => ({
                                        name: pi.companyName || pi.name || '',
                                        date: pi.date ? (new Date(pi.date)).toLocaleDateString() : '',
                                        amount: pi.amount || 0,
                                    }));
                                    setHoldings(mapped);
                                }
                            }
                        }

                        // Fetch startup details
                        if (accountType === 'startup' && profile?.user?._id) {
                            try {
                                const startupRes = await getStartupProfile(profile.user._id);
                                const startupData = startupRes?.details || startupRes?.startupDetails || startupRes;
                                if (startupData) {
                                    setCompanyName(startupData.companyName || '');
                                    setCompanyAbout(startupData.about || '');
                                    setCompanyLocation(startupData.location || '');
                                    setCompanyType(startupData.companyType || '');
                                    setEstablishedOn(startupData.establishedOn ? String(startupData.establishedOn).slice(0, 10) : '');
                                    if (Array.isArray(startupData.teamMembers) && startupData.teamMembers.length > 0) {
                                        setTeamName(startupData.teamMembers[0].name || '');
                                        setTeamRole(startupData.teamMembers[0].role || '');
                                    }
                                    if (startupData.financialProfile) {
                                        setRevenueType(startupData.financialProfile.revenueType || 'Pre-revenue');
                                        setFundingMethod(startupData.financialProfile.fundingMethod || '');
                                        setRaisedAmount(startupData.financialProfile.fundingAmount ? String(startupData.financialProfile.fundingAmount) : '');
                                        setInvestorName(startupData.financialProfile.investorName || '');
                                    }
                                    setRoundType(startupData.roundType || startupData.stage || '');
                                    setRequiredCapital(startupData.requiredCapital || startupData.fundingNeeded ? String(startupData.requiredCapital || startupData.fundingNeeded) : '');
                                }
                            } catch (err) {
                                console.warn('Failed to fetch startup profile:', err);
                            }
                        }
                    } catch (err) {
                        console.warn('Failed to fetch profile details:', err);
                    }
                }
            } catch (err) {
                console.warn('Failed to fetch settings:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, [src, accountType]);

    const handleClose = () => {
        Animated.timing(slideAnim, {
            toValue: -width,
            duration: 200,
            useNativeDriver: true,
        }).start(({ finished }) => {
            if (finished) onClose();
        });
    };

    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [slideAnim]);

    const _openEditModal = (field: string, value: string) => {
        setEditModal({ visible: true, field, value });
    };

    const saveField = async () => {
        if (!editModal.field) return;
        setSaving(true);
        try {
            const payload: any = {};
            if (editModal.field === 'Name') payload.fullName = editModal.value;
            if (editModal.field === 'Username') payload.username = editModal.value;
            if (editModal.field === 'Phone') payload.phone = editModal.value;

            console.log('saveField - field:', editModal.field, 'value:', editModal.value);
            console.log('saveField - payload:', JSON.stringify(payload));

            const result = await updateSettings(payload);
            console.log('saveField - API result:', JSON.stringify(result));

            if (result?.settings) {
                setSettings(prev => ({
                    ...prev,
                    displayName: result.settings.displayName || prev.displayName,
                    username: result.settings.username || prev.username,
                    phone: result.settings.phone || prev.phone,
                }));
            }
            setEditModal({ visible: false, field: '', value: '' });
        } catch (err: any) {
            console.log('saveField - error:', err?.message || err);
            showAlert('Error', err.message || 'Failed to update');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) {
            showAlert('Error', 'Please fill in all fields');
            return;
        }
        if (newPassword !== confirmPassword) {
            showAlert('Error', 'New passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            showAlert('Error', 'Password must be at least 6 characters');
            return;
        }

        setSaving(true);
        try {
            await changePassword(currentPassword, newPassword);
            showAlert('Success', 'Password changed successfully');
            setPasswordModal(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            showAlert('Error', err.message || 'Failed to change password');
        } finally {
            setSaving(false);
        }
    };

    const saveInvestorDetails = async () => {
        setSaving(true);
        try {
            const detailsData = {
                about,
                location,
                investmentFocus: selectedFocus,
                interestedRounds: selectedRounds,
                stage: selectedStages.join(', '),
                geography: geography ? geography.split(',').map(s => s.trim()) : undefined,
                checkSize: {
                    min: minCheck ? Number(minCheck) : undefined,
                    max: maxCheck ? Number(maxCheck) : undefined,
                },
                previousInvestments: holdings.map(h => ({
                    companyName: h.name,
                    date: h.date, // Already ISO format
                    amount: h.amount
                })),
            };
            await updateProfile({ detailsData });
            showAlert('Success', 'Investor details saved');
        } catch (err: any) {
            showAlert('Error', err.message || 'Failed to save investor details');
        } finally {
            setSaving(false);
        }
    };

    const saveCompanyProfile = async () => {
        setSaving(true);
        try {
            const payload = {
                companyName,
                about: companyAbout,
                location: companyLocation,
                companyType,
                establishedOn,
                teamMembers: teamName && teamRole ? [{ name: teamName, role: teamRole }] : [],
            };
            await saveStartupProfile(payload);
            showAlert('Success', 'Company profile saved');
        } catch (err: any) {
            showAlert('Error', err.message || 'Failed to save company profile');
        } finally {
            setSaving(false);
        }
    };

    const saveFinancialProfile = async () => {
        setSaving(true);
        try {
            const payload = {
                financialProfile: {
                    revenueType,
                    fundingMethod,
                    fundingAmount: raisedAmount,
                    investorName: fundingMethod === 'Capital Raised' ? investorName : undefined,
                },
            };
            await saveStartupProfile(payload);
            showAlert('Success', 'Financial profile saved');
        } catch (err: any) {
            showAlert('Error', err.message || 'Failed to save financial profile');
        } finally {
            setSaving(false);
        }
    };

    const saveRaiseRound = async () => {
        setSaving(true);
        try {
            const payload = {
                roundType,
                requiredCapital,
            };
            await saveStartupProfile(payload);
            showAlert('Success', 'Round details saved');
        } catch (err: any) {
            showAlert('Error', err.message || 'Failed to save round details');
        } finally {
            setSaving(false);
        }
    };

    const pickHoldingDocument = async () => {
        try {
            const [result] = await pick({ type: [types.pdf, types.images] });
            if (result) {
                const docName = result.name || result.uri.split('/').pop() || 'document';
                setNewHoldingDocName(docName);
                setPendingHoldingDoc({
                    uri: result.uri,
                    name: docName,
                    type: result.type || 'application/pdf',
                });
            }
        } catch (err: any) {
            if (err?.code !== 'DOCUMENT_PICKER_CANCELED') {
                showAlert('Error', 'Failed to pick document');
            }
        }
    };

    const animatedContainerStyle = useMemo(() => ({ backgroundColor: theme.background, transform: [{ translateX: slideAnim }] }), [theme.background, slideAnim]);
    const themeTextStyle = useMemo(() => ({ color: theme.text }), [theme.text]);
    const themePlaceholderStyle = useMemo(() => ({ color: theme.placeholder }), [theme.placeholder]);
    const themeBorderStyle = useMemo(() => ({ borderColor: theme.border }), [theme.border]);
    const centerPaddingStyle = useMemo(() => ({ padding: 40, alignItems: 'center' as const }), []);
    const spacerWidthStyle = useMemo(() => ({ width: 40 }), []);
    const spacerHeightStyle = useMemo(() => ({ height: 24 }), []);

    // Multi-select picker state
    const [showFocusPicker, setShowFocusPicker] = useState(false);
    const [showRoundPicker, setShowRoundPicker] = useState(false);
    const [showStagePicker, setShowStagePicker] = useState(false);

    const renderMultiPicker = (visible: boolean, title: string, options: string[], selected: string[], setSelected: (v: string[]) => void, onClose: () => void) => {
        if (!visible) return null;
        return (
            <Modal visible={visible} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: theme.cardBackground || '#222', borderRadius: 12, padding: 20 }}>
                        <Text style={{ color: theme.text, fontSize: 18, fontWeight: '600', marginBottom: 16 }}>{title}</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {options.map((opt) => {
                                const active = selected.includes(opt);
                                return (
                                    <TouchableOpacity
                                        key={opt}
                                        onPress={() => setSelected(selected.includes(opt) ? selected.filter(p => p !== opt) : [...selected, opt])}
                                        style={{ paddingVertical: 10, paddingHorizontal: 16, backgroundColor: active ? '#444' : '#222', borderRadius: 8, borderWidth: 1, borderColor: active ? '#666' : '#333' }}
                                    >
                                        <Text style={{ color: '#fff' }}>{opt}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        <TouchableOpacity onPress={onClose} style={{ marginTop: 16, backgroundColor: theme.primary || '#1FADFF', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}>
                            <Text style={{ color: '#fff', fontWeight: '600' }}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <Animated.View style={[styles.fullPage, animatedContainerStyle]}>
            <View style={styles.settingsHeader}>
                <TouchableOpacity onPress={handleClose} style={styles.headerBack}>
                    <ArrowLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.settingsTitle, themeTextStyle]}>Settings</Text>
                <View style={spacerWidthStyle} />
            </View>

            <ScrollView contentContainerStyle={[styles.settingsContent, { paddingBottom: 48 }]}>
                {loading ? (
                    <View style={centerPaddingStyle}>
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                ) : (
                    <>
                        {/* ACCOUNT INFORMATION Section */}
                        <Text style={[styles.sectionLabel, themePlaceholderStyle]}>ACCOUNT INFORMATION</Text>
                        <View style={[styles.sectionCard, themeBorderStyle]}>
                            <TouchableOpacity style={styles.settingRow} onPress={() => { _openEditModal('Name', settings.displayName); }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <User size={20} color={theme.placeholder} style={{ marginRight: 12 }} />
                                    <View style={styles.settingLeft}>
                                        <Text style={[styles.settingTitle, themeTextStyle]}>Name</Text>
                                        <Text style={[styles.settingSubtitle, themePlaceholderStyle]}>{settings.displayName || 'Not set'}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.chev, themePlaceholderStyle]}>{'›'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.settingRow} onPress={() => { _openEditModal('Username', settings.username); }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <AtSign size={20} color={theme.placeholder} style={{ marginRight: 12 }} />
                                    <View style={styles.settingLeft}>
                                        <Text style={[styles.settingTitle, themeTextStyle]}>Username</Text>
                                        <Text style={[styles.settingSubtitle, themePlaceholderStyle]}>@{settings.username || 'Not set'}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.chev, themePlaceholderStyle]}>{'›'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.settingRow} onPress={() => setPasswordModal(true)}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <Key size={20} color={theme.placeholder} style={{ marginRight: 12 }} />
                                    <View style={styles.settingLeft}>
                                        <Text style={[styles.settingTitle, themeTextStyle]}>Password</Text>
                                        <Text style={[styles.settingSubtitle, themePlaceholderStyle]}>Change your password</Text>
                                    </View>
                                </View>
                                <Text style={[styles.chev, themePlaceholderStyle]}>{'›'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.settingRow} onPress={() => { setEmailModal({ visible: true, value: settings.email || '' }); setEmailOtpSent(false); setEmailOtp(''); setEmailVerified(false); }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <Mail size={20} color={theme.placeholder} style={{ marginRight: 12 }} />
                                    <View style={styles.settingLeft}>
                                        <Text style={[styles.settingTitle, themeTextStyle]}>Email</Text>
                                        <Text style={[styles.settingSubtitle, themePlaceholderStyle]}>{settings.email || 'Not set'}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.chev, themePlaceholderStyle]}>{'›'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.settingRow} onPress={() => { _openEditModal('Phone', settings.phone); }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <Phone size={20} color={theme.placeholder} style={{ marginRight: 12 }} />
                                    <View style={styles.settingLeft}>
                                        <Text style={[styles.settingTitle, themeTextStyle]}>Phone</Text>
                                        <Text style={[styles.settingSubtitle, themePlaceholderStyle]}>{settings.phone || 'Not set'}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.chev, themePlaceholderStyle]}>{'›'}</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.sectionLabel, themePlaceholderStyle]}>CONTENT</Text>
                        <View style={[styles.sectionCard, themeBorderStyle]}>
                            <TouchableOpacity style={styles.settingRow} onPress={() => { }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <BarChart2 size={20} color={theme.placeholder} style={{ marginRight: 12 }} />
                                    <View style={styles.settingLeft}>
                                        <Text style={[styles.settingTitle, themeTextStyle]}>Professional Dashboard</Text>
                                        <Text style={[styles.settingSubtitle, themePlaceholderStyle]}>View analytics and insights</Text>
                                    </View>
                                </View>
                                <Text style={[styles.chev, themePlaceholderStyle]}>{'›'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.settingRow} onPress={() => {
                                handleClose();
                                if (onNavigate) onNavigate('saved');
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <Bookmark size={20} color={theme.placeholder} style={{ marginRight: 12 }} />
                                    <View style={styles.settingLeft}>
                                        <Text style={[styles.settingTitle, themeTextStyle]}>Saved Content</Text>
                                        <Text style={[styles.settingSubtitle, themePlaceholderStyle]}>Access your saved posts and startups</Text>
                                    </View>
                                </View>
                                <Text style={[styles.chev, themePlaceholderStyle]}>{'›'}</Text>
                            </TouchableOpacity>
                            {/* <TouchableOpacity style={styles.settingRow} onPress={() => { }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <Settings2 size={20} color={theme.placeholder} style={{ marginRight: 12 }} />
                                    <View style={styles.settingLeft}>
                                        <Text style={[styles.settingTitle, themeTextStyle]}>Content Preference</Text>
                                        <Text style={[styles.settingSubtitle, themePlaceholderStyle]}>Customize your feed</Text>
                                    </View>
                                </View>
                                <Text style={[styles.chev, themePlaceholderStyle]}>{'›'}</Text>
                            </TouchableOpacity> */}
                        </View>

                        {/* <Text style={[styles.sectionLabel, themePlaceholderStyle]}>PRIVACY</Text> */}
                        {/* <View style={[styles.sectionCard, themeBorderStyle]}>
                            <TouchableOpacity style={styles.settingRow} onPress={() => { }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <MessageSquare size={20} color={theme.placeholder} style={{ marginRight: 12 }} />
                                    <View style={styles.settingLeft}>
                                        <Text style={[styles.settingTitle, themeTextStyle]}>Comments</Text>
                                        <Text style={[styles.settingSubtitle, themePlaceholderStyle]}>Control who can comment on your posts</Text>
                                    </View>
                                </View>
                                <Text style={[styles.chev, themePlaceholderStyle]}>{'›'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.settingRow} onPress={() => { }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <Users size={20} color={theme.placeholder} style={{ marginRight: 12 }} />
                                    <View style={styles.settingLeft}>
                                        <Text style={[styles.settingTitle, themeTextStyle]}>Connect</Text>
                                        <Text style={[styles.settingSubtitle, themePlaceholderStyle]}>Manage direct message permissions</Text>
                                    </View>
                                </View>
                                <Text style={[styles.chev, themePlaceholderStyle]}>{'›'}</Text>
                            </TouchableOpacity>
                        </View> */}

                        {/* ACCOUNT section - Get Verified (if not verified) and Portfolio (for investor/startup) */}
                        <Text style={[styles.sectionLabel, themePlaceholderStyle]}>ACCOUNT</Text>
                        <View style={[styles.sectionCard, themeBorderStyle]}>
                            {/* Get Verified - only show if not verified */}
                            {!isVerified && (
                                <TouchableOpacity style={styles.settingRow} onPress={() => {
                                    handleClose();
                                    if (onNavigate) onNavigate('verify');
                                }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <Shield size={20} color={theme.placeholder} style={{ marginRight: 12 }} />
                                        <View style={styles.settingLeft}>
                                            <Text style={[styles.settingTitle, themeTextStyle]}>Verification</Text>
                                            <Text style={[styles.settingSubtitle, themePlaceholderStyle]}>Verify your identity</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.chev, themePlaceholderStyle]}>{'›'}</Text>
                                </TouchableOpacity>
                            )}
                            {/* Portfolio - only for investor/startup */}
                            {(accountType === 'investor' || accountType === 'startup') && (
                                <TouchableOpacity style={styles.settingRow} onPress={() => {
                                    handleClose();
                                    if (onNavigate) onNavigate('portfolio');
                                }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <Briefcase size={20} color={theme.placeholder} style={{ marginRight: 12 }} />
                                        <View style={styles.settingLeft}>
                                            <Text style={[styles.settingTitle, themeTextStyle]}>Portfolio Verification</Text>
                                            <Text style={[styles.settingSubtitle, themePlaceholderStyle]}>Verify your {accountType === 'investor' ? 'investment' : 'startup'} portfolio</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.chev, themePlaceholderStyle]}>{'›'}</Text>
                                </TouchableOpacity>
                            )}
                            {/* Get Premium */}
                            <TouchableOpacity style={styles.settingRow} onPress={() => { }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <Crown size={20} color={theme.placeholder} style={{ marginRight: 12 }} />
                                    <View style={styles.settingLeft}>
                                        <Text style={[styles.settingTitle, themeTextStyle]}>Get Premium</Text>
                                        <Text style={[styles.settingSubtitle, themePlaceholderStyle]}>Unlock exclusive features</Text>
                                    </View>
                                </View>
                                <Text style={[styles.chev, themePlaceholderStyle]}>{'›'}</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.sectionLabel, themePlaceholderStyle]}>HELP</Text>
                        <View style={[styles.sectionCard, themeBorderStyle]}>
                            <TouchableOpacity style={styles.settingRow} onPress={() => { }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <HelpCircle size={20} color={theme.placeholder} style={{ marginRight: 12 }} />
                                    <View style={styles.settingLeft}>
                                        <Text style={[styles.settingTitle, themeTextStyle]}>Support</Text>
                                        <Text style={[styles.settingSubtitle, themePlaceholderStyle]}>Get help or contact us</Text>
                                    </View>
                                </View>
                                <Text style={[styles.chev, themePlaceholderStyle]}>{'›'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.settingRow} onPress={() => { }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <Info size={20} color={theme.placeholder} style={{ marginRight: 12 }} />
                                    <View style={styles.settingLeft}>
                                        <Text style={[styles.settingTitle, themeTextStyle]}>About</Text>
                                        <Text style={[styles.settingSubtitle, themePlaceholderStyle]}>Version 1.0.0</Text>
                                    </View>
                                </View>
                                <Text style={[styles.chev, themePlaceholderStyle]}>{'›'}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={spacerHeightStyle} />
                        <TouchableOpacity
                            style={[styles.logoutBtn]}
                            onPress={async () => {
                                await clearToken();
                                // Clear settings cache on logout
                                await AsyncStorage.removeItem(SETTINGS_CACHE_KEY);
                                // Clear user data
                                await AsyncStorage.removeItem('user');
                                await AsyncStorage.removeItem('token');
                                await AsyncStorage.removeItem('role');
                                onClose();

                                // Navigate to landing page (works in both dev and release)
                                if (onNavigate) {
                                    onNavigate('landing');
                                }

                                // Try DevSettings reload for dev mode as fallback
                                try {
                                    const { DevSettings } = require('react-native');
                                    if (__DEV__ && DevSettings && typeof DevSettings.reload === 'function') {
                                        DevSettings.reload();
                                    }
                                } catch {
                                    // ignore - release mode doesn't have DevSettings
                                }
                            }}
                        >
                            <Text style={styles.logoutText}>Log Out</Text>
                        </TouchableOpacity>
                        <View style={{ height: 48 }} />
                    </>
                )}
            </ScrollView >

            {/* Edit Field Modal */}
            <Modal visible={editModal.visible} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: theme.cardBackground || '#222', borderRadius: 12, padding: 20 }}>
                        <Text style={{ color: theme.text, fontSize: 18, fontWeight: '600', marginBottom: 16 }}>
                            Edit {editModal.field}
                        </Text>
                        <View style={{ position: 'relative' }}>
                            <TextInput
                                style={{
                                    backgroundColor: theme.background,
                                    color: theme.text,
                                    borderRadius: 8,
                                    padding: 12,
                                    paddingRight: editModal.field === 'Username' ? 70 : 12,
                                    fontSize: 16,
                                    borderWidth: 1,
                                    borderColor: theme.border,
                                }}
                                value={editModal.value}
                                onChangeText={(text) => {
                                    if (editModal.field === 'Username') {
                                        // Reset validation state
                                        setUsernameAvailable(null);
                                        // Replace spaces with underscores
                                        if (text.includes(' ')) {
                                            setUsernameWarning('Spaces replaced with underscores');
                                            text = text.replace(/ /g, '_');
                                        } else {
                                            setUsernameWarning('');
                                        }
                                        // Check for special characters
                                        if (/[^a-zA-Z0-9_]/.test(text)) {
                                            setUsernameWarning('Only letters, numbers, and underscores allowed');
                                            text = text.replace(/[^a-zA-Z0-9_]/g, '');
                                        }
                                    }
                                    setEditModal(prev => ({ ...prev, value: text }));
                                }}
                                placeholder={`Enter ${editModal.field.toLowerCase()}`}
                                placeholderTextColor={theme.placeholder}
                                autoFocus
                            />
                            {/* Username Check Button */}
                            {editModal.field === 'Username' && (
                                <TouchableOpacity
                                    style={{ position: 'absolute', right: 8, top: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, backgroundColor: usernameAvailable === true ? '#22c55e' : usernameAvailable === false ? '#ef4444' : theme.primary }}
                                    onPress={async () => {
                                        if (!editModal.value || editModal.value.length < 3) {
                                            showAlert('Invalid', 'Username must be at least 3 characters');
                                            return;
                                        }
                                        setUsernameChecking(true);
                                        try {
                                            const data = await checkUsernameAvailability(editModal.value);
                                            setUsernameAvailable(data.available);
                                        } catch {
                                            showAlert('Error', 'Failed to check username');
                                        } finally {
                                            setUsernameChecking(false);
                                        }
                                    }}
                                    disabled={usernameChecking}
                                >
                                    {usernameChecking ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : usernameAvailable === true ? (
                                        <Check size={16} color="#fff" />
                                    ) : usernameAvailable === false ? (
                                        <X size={16} color="#fff" />
                                    ) : (
                                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Check</Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>
                        {/* Username warning */}
                        {editModal.field === 'Username' && usernameWarning ? (
                            <Text style={{ color: '#f59e0b', fontSize: 12, marginTop: 4 }}>{usernameWarning}</Text>
                        ) : null}
                        {editModal.field === 'Username' && usernameAvailable === false ? (
                            <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>Username already taken</Text>
                        ) : null}
                        <View style={{ flexDirection: 'row', marginTop: 20, gap: 12 }}>
                            <TouchableOpacity
                                style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: theme.border, alignItems: 'center' }}
                                onPress={() => {
                                    setEditModal({ visible: false, field: '', value: '' });
                                    setUsernameAvailable(null);
                                    setUsernameWarning('');
                                }}
                            >
                                <Text style={{ color: theme.text }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: (editModal.field === 'Username' && usernameAvailable !== true) ? '#666' : (theme.primary || '#1FADFF'), alignItems: 'center' }}
                                onPress={saveField}
                                disabled={saving || (editModal.field === 'Username' && usernameAvailable !== true)}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Change Password Modal */}
            <Modal visible={passwordModal} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: theme.cardBackground || '#222', borderRadius: 12, padding: 20 }}>
                        <Text style={{ color: theme.text, fontSize: 18, fontWeight: '600', marginBottom: 16 }}>
                            Change Password
                        </Text>
                        <View style={{ position: 'relative' }}>
                            <TextInput
                                style={{
                                    backgroundColor: theme.background,
                                    color: theme.text,
                                    borderRadius: 8,
                                    padding: 12,
                                    fontSize: 16,
                                    borderWidth: 1,
                                    borderColor: theme.border,
                                    marginBottom: 12,
                                }}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                placeholder="Current password"
                                placeholderTextColor={theme.placeholder}
                                secureTextEntry={!showCurrentPassword}
                            />
                            <TouchableOpacity
                                style={{ position: 'absolute', right: 12, top: 12 }}
                                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                                {showCurrentPassword ? <EyeOff size={20} color={theme.placeholder} /> : <Eye size={20} color={theme.placeholder} />}
                            </TouchableOpacity>
                        </View>
                        <View style={{ position: 'relative' }}>
                            <TextInput
                                style={{
                                    backgroundColor: theme.background,
                                    color: theme.text,
                                    borderRadius: 8,
                                    padding: 12,
                                    paddingRight: 44,
                                    fontSize: 16,
                                    borderWidth: 1,
                                    borderColor: theme.border,
                                    marginBottom: 12,
                                }}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder="New password"
                                placeholderTextColor={theme.placeholder}
                                secureTextEntry={!showNewPassword}
                            />
                            <TouchableOpacity
                                style={{ position: 'absolute', right: 12, top: 12 }}
                                onPress={() => setShowNewPassword(!showNewPassword)}
                            >
                                {showNewPassword ? <EyeOff size={20} color={theme.placeholder} /> : <Eye size={20} color={theme.placeholder} />}
                            </TouchableOpacity>
                        </View>
                        <View style={{ position: 'relative' }}>
                            <TextInput
                                style={{
                                    backgroundColor: theme.background,
                                    color: theme.text,
                                    borderRadius: 8,
                                    padding: 12,
                                    paddingRight: 44,
                                    fontSize: 16,
                                    borderWidth: 1,
                                    borderColor: theme.border,
                                }}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Confirm new password"
                                placeholderTextColor={theme.placeholder}
                                secureTextEntry={!showConfirmPassword}
                            />
                            <TouchableOpacity
                                style={{ position: 'absolute', right: 12, top: 12 }}
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff size={20} color={theme.placeholder} /> : <Eye size={20} color={theme.placeholder} />}
                            </TouchableOpacity>
                        </View>
                        <View style={{ flexDirection: 'row', marginTop: 20, gap: 12 }}>
                            <TouchableOpacity
                                style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: theme.border, alignItems: 'center' }}
                                onPress={() => {
                                    setPasswordModal(false);
                                    setCurrentPassword('');
                                    setNewPassword('');
                                    setConfirmPassword('');
                                }}
                            >
                                <Text style={{ color: theme.text }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: theme.primary || '#1FADFF', alignItems: 'center' }}
                                onPress={handleChangePassword}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={{ color: '#fff', fontWeight: '600' }}>Change</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Email Change Modal with OTP */}
            <Modal visible={emailModal.visible} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: theme.cardBackground || '#222', borderRadius: 12, padding: 20 }}>
                        <Text style={{ color: theme.text, fontSize: 18, fontWeight: '600', marginBottom: 16 }}>
                            Change Email
                        </Text>
                        {/* Email Input with Send OTP button */}
                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                            <TextInput
                                style={{
                                    flex: 1,
                                    backgroundColor: theme.background,
                                    color: theme.text,
                                    borderRadius: 8,
                                    padding: 12,
                                    fontSize: 16,
                                    borderWidth: 1,
                                    borderColor: theme.border,
                                }}
                                value={emailModal.value}
                                onChangeText={(text) => {
                                    setEmailModal(prev => ({ ...prev, value: text }));
                                    setEmailVerified(false);
                                    setEmailOtpSent(false);
                                }}
                                placeholder="Enter new email"
                                placeholderTextColor={theme.placeholder}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                editable={!emailOtpSent}
                            />
                            <TouchableOpacity
                                style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, backgroundColor: emailOtpSent ? '#22c55e' : (theme.primary || '#1FADFF'), justifyContent: 'center' }}
                                onPress={async () => {
                                    if (!emailModal.value || !emailModal.value.includes('@')) {
                                        showAlert('Error', 'Please enter a valid email');
                                        return;
                                    }
                                    setSendingOtp(true);
                                    try {
                                        await resendOtp(emailModal.value);
                                        setEmailOtpSent(true);
                                        showAlert('OTP Sent', 'Check your email for the verification code');
                                    } catch (err: any) {
                                        showAlert('Error', err.message || 'Failed to send OTP');
                                    } finally {
                                        setSendingOtp(false);
                                    }
                                }}
                                disabled={sendingOtp || emailOtpSent}
                            >
                                {sendingOtp ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : emailOtpSent ? (
                                    <Check size={18} color="#fff" />
                                ) : (
                                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Send OTP</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* OTP Input - shows after OTP sent */}
                        {emailOtpSent && (
                            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                                <TextInput
                                    style={{
                                        flex: 1,
                                        backgroundColor: theme.background,
                                        color: theme.text,
                                        borderRadius: 8,
                                        padding: 12,
                                        fontSize: 16,
                                        borderWidth: 1,
                                        borderColor: emailVerified ? '#22c55e' : theme.border,
                                    }}
                                    value={emailOtp}
                                    onChangeText={setEmailOtp}
                                    placeholder="Enter OTP code"
                                    placeholderTextColor={theme.placeholder}
                                    keyboardType="number-pad"
                                    editable={!emailVerified}
                                />
                                <TouchableOpacity
                                    style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, backgroundColor: emailVerified ? '#22c55e' : (theme.primary || '#1FADFF'), justifyContent: 'center' }}
                                    onPress={async () => {
                                        if (!emailOtp) {
                                            showAlert('Error', 'Please enter the OTP code');
                                            return;
                                        }
                                        setSaving(true);
                                        try {
                                            await verifyEmail(emailOtp, emailModal.value);
                                            setEmailVerified(true);
                                            showAlert('Success', 'Email verified! Click Save to update.');
                                        } catch (err: any) {
                                            showAlert('Error', err.message || 'Invalid OTP');
                                        } finally {
                                            setSaving(false);
                                        }
                                    }}
                                    disabled={saving || emailVerified}
                                >
                                    {saving ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : emailVerified ? (
                                        <Check size={18} color="#fff" />
                                    ) : (
                                        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Verify</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Buttons */}
                        <View style={{ flexDirection: 'row', marginTop: 12, gap: 12 }}>
                            <TouchableOpacity
                                style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: theme.border, alignItems: 'center' }}
                                onPress={() => {
                                    setEmailModal({ visible: false, value: '' });
                                    setEmailOtpSent(false);
                                    setEmailOtp('');
                                    setEmailVerified(false);
                                }}
                            >
                                <Text style={{ color: theme.text }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: emailVerified ? (theme.primary || '#1FADFF') : '#666', alignItems: 'center' }}
                                onPress={async () => {
                                    if (!emailVerified) return;
                                    setSaving(true);
                                    try {
                                        await updateSettings({ email: emailModal.value } as any);
                                        setSettings(prev => ({ ...prev, email: emailModal.value }));
                                        setEmailModal({ visible: false, value: '' });
                                        setEmailOtpSent(false);
                                        setEmailOtp('');
                                        setEmailVerified(false);
                                        showAlert('Success', 'Email updated successfully');
                                    } catch (err: any) {
                                        showAlert('Error', err.message || 'Failed to update email');
                                    } finally {
                                        setSaving(false);
                                    }
                                }}
                                disabled={!emailVerified || saving}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Add Holding Modal */}
            <Modal visible={showAddHoldingModal} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: theme.cardBackground || '#222', borderRadius: 12, padding: 20 }}>
                        <Text style={{ color: theme.text, fontSize: 18, fontWeight: '600', marginBottom: 16 }}>
                            Add Holding
                        </Text>
                        <Text style={{ color: theme.placeholder, marginBottom: 6, fontSize: 13 }}>Company Name</Text>
                        <TextInput
                            style={{
                                backgroundColor: theme.background,
                                color: theme.text,
                                borderRadius: 8,
                                padding: 12,
                                fontSize: 16,
                                borderWidth: 1,
                                borderColor: theme.border,
                                marginBottom: 12,
                            }}
                            value={newHoldingName}
                            onChangeText={setNewHoldingName}
                            placeholder="Enter company name"
                            placeholderTextColor={theme.placeholder}
                        />
                        <Text style={{ color: theme.placeholder, marginBottom: 6, fontSize: 13 }}>Date of Investment</Text>
                        <TouchableOpacity
                            onPress={() => setShowHoldingDatePicker(true)}
                            style={{
                                backgroundColor: theme.background,
                                borderRadius: 8,
                                padding: 12,
                                borderWidth: 1,
                                borderColor: theme.border,
                                marginBottom: 12,
                            }}
                        >
                            <Text style={{ color: newHoldingDate ? theme.text : theme.placeholder, fontSize: 16 }}>
                                {newHoldingDate ? newHoldingDate.toLocaleDateString() : 'Select date'}
                            </Text>
                        </TouchableOpacity>
                        {showHoldingDatePicker && (
                            <DateTimePicker
                                value={newHoldingDate || new Date()}
                                mode="date"
                                display="default"
                                onChange={(event, selectedDate) => {
                                    setShowHoldingDatePicker(false);
                                    if (event.type === 'set' && selectedDate) {
                                        setNewHoldingDate(selectedDate);
                                    }
                                }}
                            />
                        )}
                        <Text style={{ color: theme.placeholder, marginBottom: 6, fontSize: 13 }}>Amount Invested (USD)</Text>
                        <TextInput
                            style={{
                                backgroundColor: theme.background,
                                color: theme.text,
                                borderRadius: 8,
                                padding: 12,
                                fontSize: 16,
                                borderWidth: 1,
                                borderColor: theme.border,
                            }}
                            value={newHoldingAmount}
                            onChangeText={setNewHoldingAmount}
                            placeholder="0.00"
                            placeholderTextColor={theme.placeholder}
                            keyboardType="numeric"
                        />

                        {/* Document Upload */}
                        <Text style={{ color: theme.placeholder, marginBottom: 6, fontSize: 13, marginTop: 12 }}>Supporting Document (Optional)</Text>
                        <TouchableOpacity
                            onPress={pickHoldingDocument}
                            style={{
                                backgroundColor: theme.background,
                                borderRadius: 8,
                                padding: 12,
                                borderWidth: 1,
                                borderColor: theme.border,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <Text style={{ color: pendingHoldingDoc ? theme.text : theme.placeholder }}>
                                {pendingHoldingDoc ? newHoldingDocName : 'Tap to upload document'}
                            </Text>
                            <Text style={{ color: theme.placeholder }}>📎</Text>
                        </TouchableOpacity>
                        {uploadingHoldingDoc && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                <ActivityIndicator size="small" color={theme.primary} />
                                <Text style={{ color: theme.placeholder, marginLeft: 8, fontSize: 12 }}>Uploading document...</Text>
                            </View>
                        )}

                        <View style={{ flexDirection: 'row', marginTop: 20, gap: 12 }}>
                            <TouchableOpacity
                                style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: theme.border, alignItems: 'center' }}
                                onPress={() => {
                                    setShowAddHoldingModal(false);
                                    setNewHoldingName('');
                                    setNewHoldingDate(null);
                                    setNewHoldingAmount('');
                                    setNewHoldingDocName('');
                                    setPendingHoldingDoc(null);
                                }}
                            >
                                <Text style={{ color: theme.text }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: theme.primary || '#1FADFF', alignItems: 'center' }}
                                onPress={async () => {
                                    if (!newHoldingName || !newHoldingAmount) {
                                        showAlert('Missing fields', 'Please provide company name and amount');
                                        return;
                                    }

                                    let documentUrl: string | undefined;

                                    // Upload document if selected
                                    if (pendingHoldingDoc) {
                                        setUploadingHoldingDoc(true);
                                        try {
                                            const uploadResult = await uploadDocument(
                                                pendingHoldingDoc.uri,
                                                pendingHoldingDoc.name || 'document',
                                                pendingHoldingDoc.type || 'application/pdf'
                                            );
                                            documentUrl = (uploadResult as any)?.url || (uploadResult as any)?.documentUrl;
                                        } catch (err: any) {
                                            showAlert('Upload Error', err.message || 'Failed to upload document');
                                            setUploadingHoldingDoc(false);
                                            return;
                                        }
                                        setUploadingHoldingDoc(false);
                                    }

                                    // Create ISO date string for backend compatibility
                                    const dateForBackend = newHoldingDate ? newHoldingDate.toISOString() : new Date().toISOString();
                                    const newHolding = {
                                        name: newHoldingName,
                                        date: dateForBackend, // Store ISO date string
                                        amount: parseFloat(newHoldingAmount) || 0,
                                    };
                                    const updatedHoldings = [...holdings, newHolding];
                                    setHoldings(updatedHoldings);
                                    setShowAddHoldingModal(false);
                                    setNewHoldingName('');
                                    setNewHoldingDate(null);
                                    setNewHoldingAmount('');
                                    setNewHoldingDocName('');
                                    setPendingHoldingDoc(null);

                                    // Save to backend - use ISO date format for Mongoose compatibility
                                    try {
                                        await updateProfile({
                                            detailsData: {
                                                previousInvestments: updatedHoldings.map((h, idx) => ({
                                                    companyName: h.name,
                                                    date: h.date, // Already ISO format
                                                    amount: h.amount,
                                                    document: idx === updatedHoldings.length - 1 ? documentUrl : undefined,
                                                })),
                                            },
                                        });
                                        showAlert('Success', 'Holding added successfully');
                                    } catch (err: any) {
                                        showAlert('Error', err.message || 'Failed to save holding');
                                    }
                                }}
                                disabled={saving || uploadingHoldingDoc}
                            >
                                {saving || uploadingHoldingDoc ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={{ color: '#fff', fontWeight: '600' }}>Add</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </Animated.View >
    );
}

const localStyles = StyleSheet.create({
    collapsibleSection: {
        marginBottom: 0,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#222',
    },
    collapsibleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 14,
    },
    collapsibleTitle: {
        fontSize: 15,
        fontWeight: '600',
    },
    collapsibleToggle: {
        fontSize: 20,
    },
    collapsibleContent: {
        paddingHorizontal: 14,
        paddingBottom: 14,
    },
    formSection: {
        paddingTop: 8,
    },
    fieldLabel: {
        marginBottom: 6,
        fontSize: 13,
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    textarea: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    saveBtn: {
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 8,
    },
    holdingCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 8,
        backgroundColor: '#111',
    },
    optionBtn: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#444',
        alignItems: 'center',
    },
    addHoldingsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 10,
        borderWidth: 1,
        backgroundColor: '#1a1a1a',
        marginTop: 8,
    },
});
