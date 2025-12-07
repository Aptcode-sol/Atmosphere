import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { updateProfile, getProfile, verifyEmail } from '../lib/api';
import StartupSetup from './setup-steps/StartupSetup';
import StartupVerifyStep from './setup-steps/StartupVerifyStep';
import InvestorSetup from './setup-steps/InvestorSetup';
import PersonalSetup from './setup-steps/PersonalSetup';

const makeLocalStyles = (theme: any) => StyleSheet.create({
    fullPage: { flex: 1 },
    header: { height: 84, paddingTop: 28, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' },
    headerLeft: { width: 48 },
    headerRight: { width: 48, alignItems: 'flex-end' },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    scrollContent: { padding: 20, paddingBottom: 60 },
    avatarPlaceholder: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center' },
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
});

export default function SetupProfile({ onDone, onClose }: { onDone: () => void; onClose?: () => void }) {
    const { theme } = useContext(ThemeContext);
    const localStyles = makeLocalStyles(theme);
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [email, setEmail] = useState('');
    const [initialEmail, setInitialEmail] = useState('');
    const [emailChanged, setEmailChanged] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [verified, setVerified] = useState(false);
    // accountType removed from setup; will be set during signup
    const [saving, setSaving] = useState(false);
    const [roleStep, setRoleStep] = useState<'startup' | 'investor' | 'personal' | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const profile = await getProfile();
                if (profile?.user) {
                    // profile data fetched (not stored to avoid unused var)
                    setUsername(profile.user.username || '');
                    setDisplayName(profile.user.displayName || profile.user.fullName || '');
                    setBio(profile.user.bio || '');
                    setEmail(profile.user.email || '');
                    setInitialEmail(profile.user.email || '');
                    // accountType handled at signup; we'll use it after save
                }
            } catch {
                // ignore
            }
        })();
    }, []);

    const submit = async () => {
        if (!username || !displayName || !email) {
            Alert.alert('Missing fields', 'Please fill username, full name and email');
            return;
        }
        setSaving(true);
        try {
            await updateProfile({ userData: { username, displayName, fullName: displayName, bio, profileSetupComplete: true, onboardingStep: 4, email } });
            // refresh profile to detect accountType for next steps
            const refreshed = await getProfile();
            const acct = refreshed?.user?.accountType || 'personal';
            if (acct === 'startup') setRoleStep('startup');
            else if (acct === 'investor') setRoleStep('investor');
            else setRoleStep('personal');
        } catch (err: any) {
            const msg = err && err.message ? err.message : 'Unable to save profile';
            Alert.alert('Error', msg);
        } finally { setSaving(false); }
    };

    const checkVerificationCode = async () => {
        if (!verificationCode) {
            Alert.alert('Enter code', 'Please enter the verification code');
            return;
        }
        try {
            const json = await verifyEmail(verificationCode);
            if (json && json.success) {
                setVerified(true);
                setVerifying(false);
                Alert.alert('Verified', 'Email verified (dev stub)');
            } else {
                Alert.alert('Invalid code', json && json.error ? json.error : 'Verification failed');
            }
        } catch {
            Alert.alert('Error', 'Unable to verify code');
        }
    };

    return (
        <View style={[localStyles.fullPage, { backgroundColor: theme.background }]}>
            <View style={localStyles.header}>
                <TouchableOpacity onPress={() => onClose && onClose()} style={localStyles.headerLeft}><Text style={localStyles.headerIcon}>{'←'}</Text></TouchableOpacity>
                <View style={localStyles.headerCenter}>
                    <Text style={[localStyles.headerTitle, localStyles.headerTitleColor]}>Setup Profile</Text>
                    <Text style={localStyles.smallText}>Step 1 of 3</Text>
                </View>
                <View style={localStyles.headerRight}>
                    <TouchableOpacity onPress={submit} style={{ padding: 8 }}><Text style={localStyles.saveText}>{saving ? 'Saving...' : 'Save'}</Text></TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={localStyles.scrollContent}>
                <View style={localStyles.avatarRow}>
                    <View style={localStyles.avatarPlaceholder}>
                        <Text style={localStyles.avatarText}>📷</Text>
                    </View>
                    <Text style={localStyles.avatarLabel}>Profile Photo</Text>
                </View>
                <Text style={[localStyles.label, { color: theme.placeholder }]}>Username</Text>
                <TextInput placeholder="Username" value={username} onChangeText={setUsername} style={localStyles.input} placeholderTextColor={theme.placeholder} />

                <Text style={[localStyles.label, { color: theme.placeholder }]}>Full Name</Text>
                <TextInput placeholder="Enter your full name" value={displayName} onChangeText={setDisplayName} style={localStyles.input} placeholderTextColor={theme.placeholder} />

                <Text style={[localStyles.label, { color: theme.placeholder }]}>Email</Text>
                <View style={localStyles.verificationRow}>
                    <TextInput placeholder="Email" value={email} onChangeText={(v) => { setEmail(v); setEmailChanged(v !== initialEmail); setVerified(false); }} style={localStyles.inputFlex} placeholderTextColor={theme.placeholder} />
                    {emailChanged && !verified && (
                        <TouchableOpacity onPress={() => setVerifying(true)} style={localStyles.verifyButton}><Text style={localStyles.verifyButtonText}>Verify</Text></TouchableOpacity>
                    )}
                    {verified && (
                        <Text style={localStyles.verifiedText}>Verified</Text>
                    )}
                </View>
                {verifying && (
                    <View style={localStyles.verificationBlock}>
                        <Text style={[localStyles.label, { color: theme.placeholder }]}>Verification Code</Text>
                        <View style={localStyles.verificationRowInner}>
                            <TextInput placeholder="Enter code" value={verificationCode} onChangeText={setVerificationCode} style={localStyles.inputFlex} placeholderTextColor={theme.placeholder} />
                            <TouchableOpacity onPress={checkVerificationCode} style={localStyles.verifyButton}><Text style={localStyles.verifyButtonText}>Check</Text></TouchableOpacity>
                        </View>
                    </View>
                )}

                <Text style={[localStyles.label, { color: theme.placeholder }]}>Quick Bio</Text>
                <TextInput placeholder="Tell us about yourself" value={bio} onChangeText={setBio} multiline numberOfLines={3} style={localStyles.textarea} placeholderTextColor={theme.placeholder} />
                {/* Account Type selection removed from setup; handled at signup */}

                <TouchableOpacity onPress={() => setRoleStep('startup')} style={{ marginTop: 12, paddingVertical: 14, borderRadius: 10, backgroundColor: theme.primary, alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: '700' }}>Next</Text>
                </TouchableOpacity>

            </ScrollView>

            {roleStep && (
                <View style={[localStyles.fullPage, { backgroundColor: theme.background, position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 10 }]}>
                    {roleStep === 'startup' && (
                        <StartupVerifyStep onBack={() => setRoleStep(null)} onDone={() => { setRoleStep(null); onDone(); if (onClose) onClose(); }} />
                    )}
                    {roleStep === 'investor' && (
                        <InvestorSetup onDone={() => { setRoleStep(null); onDone(); if (onClose) onClose(); }} />
                    )}
                    {roleStep === 'personal' && (
                        <PersonalSetup onDone={() => { setRoleStep(null); onDone(); if (onClose) onClose(); }} />
                    )}
                </View>
            )}
        </View>
    );
}

// styles generated by makeLocalStyles(theme)
