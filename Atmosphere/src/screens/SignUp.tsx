import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, ScrollView } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Logo from '../components/Logo';
import { register } from '../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AccountType = 'personal' | 'startup' | 'investor';

const ACCOUNT_TYPES: { value: AccountType; label: string; description: string }[] = [
    { value: 'personal', label: 'Personal', description: 'For individual users and founders' },
    { value: 'startup', label: 'Startup', description: 'For startups and companies' },
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

    const handleSignUp = async () => {
        if (!email || !username || !password) {
            Alert.alert('Missing fields', 'Please fill all required fields');
            return;
        }
        setLoading(true);
        try {
            const data = await register({ email, username, password, displayName: username || email, accountType });
            if (data && data.token) {
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

    const handleRequestVerify = async () => {
        if (!email) {
            setVerifyStatus('error');
            setVerifyMessage('Please enter your email first');
            return;
        }
        setVerifyStatus('sending');
        setVerifyMessage('Sending verification code...');

        try {
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
            await api.verifyEmail(otp, email);
            setVerifyStatus('verified');
            setVerifyMessage('Email verified successfully! ✓');

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
                <View style={styles.logoSection}>
                    <Logo size={48} />
                </View>

                <View style={styles.formCard}>
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#8e8e8e"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Username"
                        placeholderTextColor="#8e8e8e"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#8e8e8e"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

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

                    {showOtpInput && (
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

                    {verifyMessage ? (
                        <View style={styles.statusContainer}>
                            <Text style={[styles.statusMessage, { color: getStatusColor() }]}>
                                {verifyMessage}
                            </Text>
                        </View>
                    ) : null}

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

                    {/* {!showOtpInput && (
                        <View style={styles.dividerRow}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>OR</Text>
                            <View style={styles.dividerLine} />
                        </View>
                    )}

                    {!showOtpInput && (
                        <TouchableOpacity style={styles.googleButton} onPress={() => Alert.alert('Google signup coming soon')}>
                            <MaterialCommunityIcons name="google" size={18} color="#8e8e8e" />
                            <Text style={styles.googleText}>Sign up with Google</Text>
                        </TouchableOpacity>
                    )} */}

                    <Text style={styles.termsText}>
                        By signing up, you agree to our Terms, Privacy Policy and Cookies Policy.
                    </Text>
                </View>

                <View style={styles.signinCard}>
                    <Text style={styles.signinText}>
                        Have an account?{' '}
                        <Text style={styles.signinLink} onPress={() => { if (onSignIn) onSignIn(); }}>
                            Log in
                        </Text>
                    </Text>
                </View>
            </ScrollView>

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
        paddingHorizontal: 20,
        paddingVertical: 40,
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    formCard: {
        backgroundColor: '#0d0d0d',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#262626',
        paddingHorizontal: 30,
        paddingVertical: 40,
    },
    input: {
        height: 50,
        backgroundColor: '#000',
        borderRadius: 10,
        paddingHorizontal: 14,
        marginBottom: 8,
        fontSize: 14,
        color: '#fff',
        borderWidth: 1,
        borderColor: '#363636',
    },
    dropdownButton: {
        height: 56,
        backgroundColor: '#000',
        borderRadius: 10,
        paddingHorizontal: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#363636',
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
        fontSize: 14,
        fontWeight: '500',
    },
    dropdownArrow: {
        color: '#8e8e8e',
        fontSize: 12,
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
        borderRadius: 10,
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
        backgroundColor: '#404040',
        height: 50,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 15,
    },
    signupButtonDisabled: {
        backgroundColor: '#333333',
        opacity: 0.6,
    },
    signupButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#363636',
    },
    dividerText: {
        marginHorizontal: 16,
        color: '#8e8e8e',
        fontSize: 12,
        fontWeight: '600',
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    googleText: {
        color: '#8e8e8e',
        fontWeight: '600',
        fontSize: 14,
        marginLeft: 8,
    },
    termsText: {
        color: '#8e8e8e',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 18,
    },
    signinCard: {
        borderWidth: 1,
        borderColor: '#262626',
        borderRadius: 10,
        backgroundColor: '#0d0d0d',
        paddingVertical: 20,
        marginTop: 16,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#0d0d0d',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#262626',
        width: '100%',
        maxWidth: 340,
        padding: 24,
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
        paddingHorizontal: 14,
        borderRadius: 10,
        marginBottom: 8,
        backgroundColor: '#000',
        borderWidth: 1,
        borderColor: '#363636',
    },
    modalOptionActive: {
        backgroundColor: '#1a1a1a',
        borderColor: '#404040',
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
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    modalCancel: {
        marginTop: 12,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: '#000',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#363636',
    },
    modalCancelText: {
        color: '#8e8e8e',
        fontSize: 15,
        fontWeight: '600',
    },
});

export default SignUp;
