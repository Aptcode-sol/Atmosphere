import React, { useState, useContext, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image, ActivityIndicator } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { updateProfile, getProfile, uploadProfilePicture } from '../lib/api';
import ImageCropPicker from 'react-native-image-crop-picker';
import { ArrowLeft, Camera } from 'lucide-react-native';
import StartupVerifyStep from './setup-steps/StartupVerifyStep';
// InvestorSetup and PersonalSetup are not used in this screen
import InvestorPortfolioStep from './setup-steps/InvestorPortfolioStep';
import StartupPortfolioStep from './setup-steps/StartupPortfolioStep';

const makeLocalStyles = (theme: any) => StyleSheet.create({
    fullPage: { flex: 1 },
    header: { height: 84, paddingTop: 28, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' },
    headerLeft: { width: 48 },
    headerRight: { width: 48, alignItems: 'flex-end' },
    headerSaveBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    scrollContent: { padding: 20, paddingBottom: 60 },
    avatarPlaceholder: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    label: { marginBottom: 6, fontSize: 13, fontWeight: '600' },
    input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12, borderColor: theme.border, color: theme.text },
    textarea: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12, minHeight: 80, borderColor: theme.border, color: theme.text },
    dropdownTrigger: { borderWidth: 1, borderRadius: 12, padding: 12, borderColor: theme.border, backgroundColor: theme.background },
    dropdownTriggerText: { color: theme.placeholder },
    modalBackdrop: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: '#00000055' },
    modalWrapper: { position: 'absolute', left: 20, right: 20, top: 150 },
    dropdownList: { borderWidth: 1, borderRadius: 8, overflow: 'hidden', backgroundColor: theme.background, borderColor: theme.border },
    dropdownItem: { padding: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#00000010' },
    dropdownItemHighlighted: { backgroundColor: '#2d2d2d' },
    dropdownItemText: { color: theme.placeholder },
    dropdownItemTextActive: { color: theme.text },
    headerCenter: { alignItems: 'center', flex: 1 },
    headerIcon: { color: theme.text },
    headerTitleColor: { color: theme.text },
    smallText: { color: theme.placeholder, fontSize: 12 },
    saveText: { color: theme.primary },
    avatarRow: { alignItems: 'center', marginBottom: 12 },
    avatarText: { fontSize: 28, color: '#fff' },
    avatarLabel: { color: theme.placeholder, marginTop: 8 },
    verificationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    inputFlex: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12, borderColor: theme.border, color: theme.text, flex: 1 },
    verifyButton: { marginLeft: 8 },
    verifyButtonText: { color: theme.primary },
    verifiedText: { color: '#22c55e', marginLeft: 8 },
    verificationBlock: { marginBottom: 12 },
    verificationRowInner: { flexDirection: 'row', alignItems: 'center' },
    avatarImage: { width: 96, height: 96, borderRadius: 48 },
    avatarUploadOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 4, alignItems: 'center' },
    avatarUploadText: { color: '#fff', fontSize: 10, fontWeight: '600' },
});

export default function SetupProfile({ onDone, onClose }: { onDone: () => void; onClose?: () => void }) {
    const { theme } = useContext(ThemeContext);
    const localStyles = makeLocalStyles(theme);
    const themePlaceholderStyle = useMemo(() => ({ color: theme.placeholder }), [theme.placeholder]);
    const primaryButtonStyle = useMemo(() => ({ marginTop: 12, paddingVertical: 14, borderRadius: 10, backgroundColor: theme.primary, alignItems: 'center' }), [theme.primary]);
    const primaryButtonTextStyle = useMemo(() => ({ color: '#fff', fontWeight: '700' }), []);
    const avatarUploadCenterOverlay = useMemo(() => ({ top: 0, bottom: 0, justifyContent: 'center' }), []);
    const roleOverlayStyle = useMemo(() => ({ backgroundColor: theme.background, position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 10 }), [theme.background]);
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    // Email-related state removed
    const [saving, setSaving] = useState(false);
    const [roleStep, setRoleStep] = useState<'startup' | 'investor' | 'personal' | 'portfolio_investor' | 'portfolio_startup' | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [pendingAvatarUri, setPendingAvatarUri] = useState<string | null>(null); // Local URI before upload
    const [pendingAvatarMeta, setPendingAvatarMeta] = useState<{ fileName: string; type: string } | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [accountType, setAccountType] = useState<'startup' | 'investor' | 'personal' | null>(null);
    const [isKycVerified, setIsKycVerified] = useState(false);
    // portfolioComplete state not used directly here

    useEffect(() => {
        (async () => {
            try {
                const profile = await getProfile();
                if (profile?.user) {
                    setUsername(profile.user.username || '');
                    setDisplayName(profile.user.displayName || profile.user.fullName || '');
                    setBio(profile.user.bio || '');
                    // Email fields omitted
                    setAvatarUrl(profile.user.avatarUrl || null);
                    if (profile.user.profileSetupComplete) setIsEditMode(true);
                    // Get account type from roles array (first role or default to personal)
                    const roles = profile.user.roles || ['personal'];
                    const primaryRole = roles[0] || 'personal';
                    setAccountType(primaryRole as 'startup' | 'investor' | 'personal');
                    // Get KYC status
                    setIsKycVerified(profile.user.isKycVerified || false);
                    // Debug log
                    console.log('[SetupProfile] Loaded user state:', {
                        roles: profile.user.roles,
                        primaryRole,
                        profileSetupComplete: profile.user.profileSetupComplete,
                        isEditMode: !!profile.user.profileSetupComplete,
                        isKycVerified: profile.user.isKycVerified,
                        portfolioComplete: profile.user.portfolioComplete
                    });
                }
            } catch {
                // ignore
            }
        })();
    }, []);

    const pickAvatar = async () => {
        try {
            const image = await ImageCropPicker.openPicker({
                width: 400,
                height: 400,
                cropping: true,
                cropperCircleOverlay: true, // Circular crop overlay
                compressImageQuality: 0.8,
                mediaType: 'photo',
                cropperToolbarTitle: 'Crop Profile Photo',
            });

            if (!image.path) return;

            // Store local URI for preview - will upload on Save
            setPendingAvatarUri(image.path);
            setPendingAvatarMeta({
                fileName: image.filename || 'profile.jpg',
                type: image.mime || 'image/jpeg',
            });
        } catch (err: any) {
            // User cancelled or error
            if (err.code !== 'E_PICKER_CANCELLED') {
                console.error('Image picker error:', err);
            }
        }
    };

    const submit = async () => {
        if (!username || !displayName) {
            Alert.alert('Missing fields', 'Please fill username and full name');
            return;
        }
        setSaving(true);
        try {
            let finalAvatarUrl = avatarUrl;

            // Upload pending avatar if exists
            if (pendingAvatarUri && pendingAvatarMeta) {
                setUploadingAvatar(true);
                try {
                    finalAvatarUrl = await uploadProfilePicture(
                        pendingAvatarUri,
                        pendingAvatarMeta.fileName,
                        pendingAvatarMeta.type
                    );
                    setAvatarUrl(finalAvatarUrl);
                    setPendingAvatarUri(null);
                    setPendingAvatarMeta(null);
                } catch (uploadErr: any) {
                    Alert.alert('Upload failed', uploadErr.message || 'Failed to upload profile picture');
                    setSaving(false);
                    setUploadingAvatar(false);
                    return;
                }
                setUploadingAvatar(false);
            }

            await updateProfile({
                userData: {
                    username,
                    displayName,
                    fullName: displayName,
                    bio,
                    profileSetupComplete: true,
                    onboardingStep: 4,
                    // email omitted
                    ...(finalAvatarUrl && { avatarUrl: finalAvatarUrl })
                }
            });
            Alert.alert('Success', 'Profile saved successfully!');
            if (isEditMode) {
                if (onClose) onClose();
            }
        } catch (err: any) {
            const msg = err && err.message ? err.message : 'Unable to save profile';
            Alert.alert('Error', msg);
        } finally { setSaving(false); }
    };

    // Email verification function removed

    return (
        <View style={[localStyles.fullPage, { backgroundColor: theme.background }]}>
            <View style={localStyles.header}>
                <TouchableOpacity onPress={() => onClose && onClose()} style={localStyles.headerLeft}><ArrowLeft size={24} color={theme.text} /></TouchableOpacity>
                <View style={localStyles.headerCenter}>
                    <Text style={[localStyles.headerTitle, localStyles.headerTitleColor]}>
                        {isEditMode ? 'Edit Profile' : 'Setup Profile'}
                    </Text>
                    {/* Show step info only in setup mode, or edit mode for non-personal accounts */}
                    {(() => {
                        if (isEditMode && accountType === 'personal' && isKycVerified) {
                            return null; // No step info for personal with verified KYC in edit mode
                        }
                        if (isEditMode) {
                            return null; // No step info in edit mode
                        }
                        // Setup mode: show step counts
                        const totalSteps = accountType === 'personal' && isKycVerified ? 1 : 2;
                        return <Text style={localStyles.smallText}>Step 1 of {totalSteps}</Text>;
                    })()}
                </View>
                <View style={localStyles.headerRight}>
                    <TouchableOpacity onPress={submit} style={localStyles.headerSaveBtn}><Text style={localStyles.saveText}>{saving ? 'Saving...' : 'Save'}</Text></TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={localStyles.scrollContent}>
                <View style={localStyles.avatarRow}>
                    <TouchableOpacity onPress={pickAvatar} disabled={uploadingAvatar || saving}>
                        <View style={localStyles.avatarPlaceholder}>
                            {(pendingAvatarUri || avatarUrl) ? (
                                <Image
                                    source={{ uri: pendingAvatarUri || avatarUrl || '' }}
                                    style={localStyles.avatarImage}
                                />
                            ) : (
                                <Text style={localStyles.avatarText}>📷</Text>
                            )}
                            {uploadingAvatar && (
                                <View style={[localStyles.avatarUploadOverlay, avatarUploadCenterOverlay]}>
                                    <ActivityIndicator size="small" color="#fff" />
                                </View>
                            )}
                            <View style={localStyles.avatarUploadOverlay}>
                                <Text style={localStyles.avatarUploadText}>
                                    {uploadingAvatar ? 'Uploading...' : 'Edit'}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                    <Text style={localStyles.avatarLabel}>Profile Photo</Text>
                </View>
                <Text style={[localStyles.label, themePlaceholderStyle]}>Username</Text>
                <TextInput placeholder="Username" value={username} onChangeText={setUsername} style={localStyles.input} placeholderTextColor={theme.placeholder} />

                <Text style={[localStyles.label, themePlaceholderStyle]}>Full Name</Text>
                <TextInput placeholder="Enter your full name" value={displayName} onChangeText={setDisplayName} style={localStyles.input} placeholderTextColor={theme.placeholder} />

                <Text style={[localStyles.label, { color: theme.placeholder }]}>Quick Bio</Text>
                <TextInput placeholder="Tell us about yourself" value={bio} onChangeText={setBio} multiline numberOfLines={3} style={localStyles.textarea} placeholderTextColor={theme.placeholder} />

                {/* Button Logic:
                    - Personal + Edit mode -> No button (just Save)
                    - Personal + Setup mode -> Next to KYC
                    - Investor/Startup + Edit mode -> Update to Portfolio directly
                    - Investor/Startup + Setup mode -> Next to Verification page
                */}
                {(() => {
                    // Personal accounts - no second page in edit mode, go to KYC in setup
                    if (accountType === 'personal') {
                        if (isEditMode) {
                            return null; // No second page for personal in edit mode
                        }
                        // Setup mode - go to verification/KYC
                        return (
                            <TouchableOpacity
                                onPress={() => setRoleStep('personal')}
                                style={primaryButtonStyle as any}
                            >
                                <Text style={primaryButtonTextStyle}>Next</Text>
                            </TouchableOpacity>
                        );
                    }

                    // Investor/Startup - only show Next button in setup mode (not edit mode)
                    // In edit mode, users access portfolio settings via Settings overlay
                    if (isEditMode) {
                        return null; // No Next button in edit mode - use Settings instead
                    }
                    const targetStep = accountType;
                    return (
                        <TouchableOpacity
                            onPress={() => setRoleStep(targetStep as any)}
                            style={primaryButtonStyle as any}
                        >
                            <Text style={primaryButtonTextStyle}>Next</Text>
                        </TouchableOpacity>
                    );
                })()}

            </ScrollView>

            {roleStep && (
                <View style={[localStyles.fullPage, roleOverlayStyle as any]}>
                    {/* Setup mode - full verification flow */}
                    {roleStep === 'startup' && (
                        <StartupVerifyStep onBack={() => setRoleStep(null)} onDone={() => { setRoleStep(null); onDone(); if (onClose) onClose(); }} />
                    )}
                    {roleStep === 'investor' && (
                        <StartupVerifyStep onBack={() => setRoleStep(null)} onDone={() => { setRoleStep(null); onDone(); if (onClose) onClose(); }} />
                    )}
                    {roleStep === 'personal' && (
                        <StartupVerifyStep onBack={() => setRoleStep(null)} onDone={() => { setRoleStep(null); onDone(); if (onClose) onClose(); }} />
                    )}

                    {/* Edit mode - direct to portfolio */}
                    {roleStep === 'portfolio_investor' && (
                        <InvestorPortfolioStep onBack={() => setRoleStep(null)} onDone={() => { setRoleStep(null); if (onClose) onClose(); }} />
                    )}
                    {roleStep === 'portfolio_startup' && (
                        <StartupPortfolioStep onBack={() => setRoleStep(null)} onDone={() => { setRoleStep(null); if (onClose) onClose(); }} />
                    )}
                </View>
            )}
        </View>
    );
}
