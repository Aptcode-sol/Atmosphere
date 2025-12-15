import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, ScrollView } from 'react-native';
import Logo from '../components/Logo';
import { register } from '../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AccountType = 'personal' | 'startup' | 'investor';

const ACCOUNT_TYPES: { value: AccountType; label: string; description: string }[] = [
    { value: 'personal', label: 'Personal', description: 'For individual users' },
    { value: 'startup', label: 'Startup', description: 'For startups and founders' },
    { value: 'investor', label: 'Investor', description: 'For investors and VCs' },
];

type VerifyStatus = 'idle' | 'sending' | 'sent' | 'verifying' | 'verified' | 'error';

const SignUp = ({ onSignedUp, onSignIn }: { onSignedUp?: () => void; onSignIn?: () => void }) => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [accountType, setAccountType] = useState<AccountType>('personal');
    const [showDropdown, setShowDropdown] = useState(false);
    const [otp, setOtp] = useState('');
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [loading, setLoading] = useState(false);
    const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>('idle');
    const [verifyMessage, setVerifyMessage] = useState('');

    // theme not used here

    const handleSignUp = async () => {
        if (!email || !username || !password) {
            Alert.alert('Missing fields', 'Please fill all required fields');
            return;
        }
        setLoading(true);
        try {
            const data = await register({ email, username, password, displayName: username || email, accountType });
            if (data && data.token) {
                // Do NOT store token yet as verified = false
                // Or store it but don't navigate to home yet.
                // The backend now returns { token, user: { ..., verified: false } }

                setVerifyMessage('Registration successful! Sending OTP...');
                setVerifyStatus('sent');
                setShowOtpInput(true);
            }
        } catch (err: any) {
            Alert.alert('Sign up failed', err.message || 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    // This is now "Resend" effectively if they are already on the OTP screen
    const handleRequestVerify = async () => {
        if (!email) {
            setVerifyStatus('error');
            setVerifyMessage('Please enter your email first');
            return;
        }
        setVerifyStatus('sending');
        setVerifyMessage('Sending verification code...');

        try {
            // Import resendOtp dynamically or use the one we just added
            const { resendOtp } = require('../lib/api');
            await resendOtp(email);

            setShowOtpInput(true);
            setVerifyStatus('sent');
            setVerifyMessage('Code sent! Check your email');
        } catch (err: any) {
            setVerifyStatus('error');
            setVerifyMessage(err.message || 'Failed to send OTP');
        }
    };

    const handleVerifyCode = async () => {
        if (!otp) {
            setVerifyStatus('error');
            setVerifyMessage('Please enter the verification code');
            return;
        }
        setVerifyStatus('verifying');
        setVerifyMessage('Verifying...');

        try {
            const api = require('../lib/api');
            // Backend endpoint needs email if not authenticated.
            await api.verifyEmail(otp, email);

            setVerifyStatus('verified');
            setVerifyMessage('Email verified successfully! ✓');

            // Now log the user in / save token
            // We need to re-login or use the token we got from register if we saved it?
            // Actually, usually we login after verification or just use the token we got from register.
            // But register gave us a token. If we use that token with verifyEmail, backend handles it.
            // If we didn't save the token, we might need to login.
            // Let's assume we need to auto-login.

            const { login } = require('../lib/api');
            const loginData = await login(email, password);
            if (loginData && loginData.token) {
                await AsyncStorage.setItem('token', loginData.token);
                await AsyncStorage.setItem('user', JSON.stringify(loginData.user || {}));
            }

            setTimeout(() => {
                setShowOtpInput(false);
                if (onSignedUp) onSignedUp();
            }, 1000);

        } catch (err: any) {
            setVerifyStatus('error');
            setVerifyMessage(err.message || 'Invalid code. Please try again.');
        }
    };

    const selectedType = ACCOUNT_TYPES.find(t => t.value === accountType);

    const getStatusColor = () => {
        switch (verifyStatus) {
            case 'sending':
            case 'verifying':
                return '#8e8e8e';
            case 'sent':
                return '#4ade80';
            case 'verified':
                return '#22c55e';
            case 'error':
                return '#ef4444';
            default:
                return '#8e8e8e';
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Logo */}
                <View style={styles.logoSection}>
                    <Logo size={44} />
                </View>

                {/* Form Card */}
                <View style={styles.formCard}>
                    {/* Email Input */}
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#8e8e8e"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    {/* Username Input */}
                    <TextInput
                        style={styles.input}
                        placeholder="Username"
                        placeholderTextColor="#8e8e8e"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                    />

                    {/* Password Input */}
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#8e8e8e"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    {/* Account Type Dropdown */}
                    <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => setShowDropdown(true)}
                    >
                        <View>
                            <Text style={styles.dropdownLabel}>Account Type</Text>
                            <Text style={styles.dropdownValue}>{selectedType?.label}</Text>
                        </View>
                        <Text style={styles.dropdownArrow}>▼</Text>
                    </TouchableOpacity>

                    {/* Verification Section */}
                    {!showOtpInput ? (
                        null
                    ) : (
                        <View style={styles.otpSection}>
                            <View style={styles.otpRow}>
                                <TextInput
                                    style={[styles.input, styles.otpInput]}
                                    placeholder="Enter code"
                                    placeholderTextColor="#8e8e8e"
                                    value={otp}
                                    onChangeText={setOtp}
                                    keyboardType="numeric"
                                />
                                <TouchableOpacity
                                    style={[styles.otpVerifyBtn, verifyStatus === 'verified' && styles.otpVerifySuccess]}
                                    onPress={handleVerifyCode}
                                    disabled={verifyStatus === 'verifying' || verifyStatus === 'verified'}
                                >
                                    {verifyStatus === 'verifying' ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : verifyStatus === 'verified' ? (
                                        <Text style={styles.otpVerifyText}>✓</Text>
                                    ) : (
                                        <Text style={styles.otpVerifyText}>Verify</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity onPress={handleRequestVerify} disabled={verifyStatus === 'sending'}>
                                <Text style={styles.resendText}>
                                    {verifyStatus === 'sending' ? 'Sending...' : 'Resend Code'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Status Message */}
                    {verifyMessage ? (
                        <View style={styles.statusContainer}>
                            <Text style={[styles.statusMessage, { color: getStatusColor() }]}>
                                {verifyMessage}
                            </Text>
                        </View>
                    ) : null}

                    {/* Sign Up Button - Hide if OTP sent (user already created) */}
                    {!showOtpInput && (
                        <TouchableOpacity
                            style={[styles.signupButton, (!email || !username || !password) && styles.signupButtonDisabled]}
                            onPress={handleSignUp}
                            disabled={loading || !email || !username || !password}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.signupButtonText}>Sign up</Text>
                            )}
                        </TouchableOpacity>
                    )}

                    {/* Terms */}
                    <Text style={styles.termsText}>
                        By signing up, you agree to our Terms, Privacy Policy and Cookies Policy.
                    </Text>
                </View>

                {/* Sign In Link */}
                <View style={styles.signinCard}>
                    <Text style={styles.signinText}>
                        Have an account?{' '}
                        <Text style={styles.signinLink} onPress={() => { if (onSignIn) onSignIn(); }}>
                            Log in
                        </Text>
                    </Text>
                </View>
            </ScrollView>

            {/* Account Type Modal */}
            <Modal
                visible={showDropdown}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDropdown(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowDropdown(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Account Type</Text>
                        {ACCOUNT_TYPES.map((type) => (
                            <TouchableOpacity
                                key={type.value}
                                style={[
                                    styles.modalOption,
                                    accountType === type.value && styles.modalOptionActive
                                ]}
                                onPress={() => {
                                    setAccountType(type.value);
                                    setShowDropdown(false);
                                }}
                            >
                                <View style={styles.modalOptionContent}>
                                    <Text style={[
                                        styles.modalOptionLabel,
                                        accountType === type.value && styles.modalOptionLabelActive
                                    ]}>
                                        {type.label}
                                    </Text>
                                    <Text style={styles.modalOptionDesc}>{type.description}</Text>
                                </View>
                                {accountType === type.value && (
                                    <Text style={styles.checkmark}>✓</Text>
                                )}
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            style={styles.modalCancel}
                            onPress={() => setShowDropdown(false)}
                        >
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingVertical: 40,
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    subtitle: {
        color: '#8e8e8e',
        fontSize: 15,
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 22,
    },
    formCard: {
        backgroundColor: '#121212',
        borderRadius: 8,
        padding: 30,
        paddingBottom: 50,
        paddingTop: 50,
    },
    input: {
        height: 48,
        backgroundColor: '#1c1c1c',
        borderRadius: 6,
        paddingHorizontal: 16,
        marginBottom: 12,
        fontSize: 15,
        color: '#fff',
        borderWidth: 1,
        borderColor: '#2a2a2a',
    },
    dropdownButton: {
        height: 56,
        backgroundColor: '#1c1c1c',
        borderRadius: 6,
        paddingHorizontal: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#2a2a2a',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dropdownLabel: {
        color: '#8e8e8e',
        fontSize: 12,
        marginBottom: 2,
    },
    dropdownValue: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '500',
    },
    dropdownArrow: {
        color: '#8e8e8e',
        fontSize: 12,
    },
    verifyButton: {
        height: 44,
        backgroundColor: '#2a2a2a',
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    verifyButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    otpRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    otpInput: {
        flex: 1,
        marginBottom: 0,
    },
    otpVerifyBtn: {
        backgroundColor: '#404040',
        paddingHorizontal: 20,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    resendText: {
        color: '#0095f6',
        textAlign: 'center',
        fontSize: 13,
        marginTop: 8,
    },
    otpVerifyText: {
        color: '#fff',
        fontWeight: '600',
    },
    verifyButtonActive: {
        backgroundColor: '#3a3a3a',
    },
    verifyLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    otpSection: {
        marginBottom: 0,
    },
    otpVerifySuccess: {
        backgroundColor: '#22c55e',
    },
    statusContainer: {
        paddingVertical: 8,
        marginBottom: 4,
    },
    statusMessage: {
        fontSize: 13,
        textAlign: 'center',
    },
    signupButton: {
        backgroundColor: '#3a3a3a',
        height: 48,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    signupButtonDisabled: {
        backgroundColor: '#2a2a2a',
        opacity: 0.7,
    },
    signupButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
    termsText: {
        color: '#8e8e8e',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 18,
    },
    signinCard: {
        borderTopWidth: 1,
        borderTopColor: '#262626',
        paddingVertical: 20,
        marginTop: 24,
        alignItems: 'center',
    },
    signinText: {
        color: '#8e8e8e',
        fontSize: 14,
    },
    signinLink: {
        color: '#fff',
        fontWeight: '600',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    modalContent: {
        backgroundColor: '#1c1c1c',
        borderRadius: 12,
        width: '100%',
        maxWidth: 340,
        padding: 20,
    },
    modalTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: '#2a2a2a',
    },
    modalOptionActive: {
        backgroundColor: '#0064a8',
        borderColor: '#0095f6',
        borderWidth: 1,
    },
    modalOptionContent: {
        flex: 1,
    },
    modalOptionLabel: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    modalOptionLabelActive: {
        color: '#fff',
    },
    modalOptionDesc: {
        color: '#8e8e8e',
        fontSize: 13,
        marginTop: 2,
    },
    checkmark: {
        color: '#0095f6',
        fontSize: 18,
        fontWeight: '700',
    },
    modalCancel: {
        marginTop: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    modalCancelText: {
        color: '#8e8e8e',
        fontSize: 15,
        fontWeight: '600',
    },
});

export default SignUp;
