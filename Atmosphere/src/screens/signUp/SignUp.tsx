import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Modal,
    ScrollView,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Logo from '../../components/Logo';
import { register, checkUsernameAvailability } from '../../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AccountType, VerifyStatus, UsernameStatus, SignUpProps } from './types';
import { ACCOUNT_TYPES, getStatusColor } from './utils';
import { styles } from './styles';
import { useAlert } from '../../components/CustomAlert';

const SignUp = ({ onSignedUp, onSignIn }: SignUpProps) => {
    const { showAlert } = useAlert();
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
    const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
    const [usernameWarning, setUsernameWarning] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleCheckUsername = async () => {
        if (!username || username.length < 3) {
            showAlert('Invalid username', 'Username must be at least 3 characters');
            return;
        }
        if (username.includes(' ')) {
            showAlert('Invalid username', 'Username cannot contain spaces. Use underscores (_) instead.');
            return;
        }
        setUsernameStatus('checking');
        try {
            const data = await checkUsernameAvailability(username);
            setUsernameStatus(data.available ? 'available' : 'taken');
        } catch {
            setUsernameStatus('idle');
            showAlert('Error', 'Failed to check username availability');
        }
    };

    const handleSignUp = async () => {
        if (!email || !username || !password) {
            showAlert('Missing fields', 'Please fill all required fields');
            return;
        }
        setLoading(true);
        try {
            const data = await register({ email, username, password, displayName: username || email, accountType });
            if (data?.token) {
                setVerifyMessage('Registration successful! Sending OTP...');
                setVerifyStatus('sent');
                setShowOtpInput(true);
            }
        } catch (err: any) {
            showAlert('Sign up failed', err.message || 'Unknown error');
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
            const { resendOtp } = require('../../lib/api');
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
            const api = require('../../lib/api');
            await api.verifyEmail(otp, email);
            setVerifyStatus('verified');
            setVerifyMessage('Email verified successfully! ✓');

            const { login } = require('../../lib/api');
            const loginData = await login(email, password);
            if (loginData?.token) {
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

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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

                    <View style={styles.usernameContainer}>
                        <TextInput
                            style={[styles.input, styles.usernameInput]}
                            placeholder="Username"
                            placeholderTextColor="#8e8e8e"
                            value={username}
                            onChangeText={(text) => {
                                if (text.includes(' ')) {
                                    setUsernameWarning('Spaces not allowed. Use underscores (_) instead.');
                                    // Replace spaces with underscores
                                    text = text.replace(/ /g, '_');
                                } else {
                                    setUsernameWarning('');
                                }
                                setUsername(text);
                                setUsernameStatus('idle');
                            }}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity style={styles.checkButton} onPress={handleCheckUsername} disabled={usernameStatus === 'checking' || !username}>
                            {usernameStatus === 'checking' ? (
                                <ActivityIndicator size="small" color="#8e8e8e" />
                            ) : usernameStatus === 'available' ? (
                                <View style={[styles.statusIcon, styles.statusSuccess]}>
                                    <MaterialCommunityIcons name="check" size={16} color="#4ade80" />
                                </View>
                            ) : usernameStatus === 'taken' ? (
                                <View style={[styles.statusIcon, styles.statusError]}>
                                    <MaterialCommunityIcons name="close" size={16} color="#ef4444" />
                                </View>
                            ) : (
                                <Text style={styles.checkText}>Check</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                    {usernameWarning ? (
                        <Text style={{ color: '#f59e0b', fontSize: 12, marginTop: -8, marginBottom: 8, marginLeft: 4 }}>
                            {usernameWarning}
                        </Text>
                    ) : null}

                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={[styles.input, styles.passwordInput]}
                            placeholder="Password"
                            placeholderTextColor="#8e8e8e"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff size={20} color="#8e8e8e" /> : <Eye size={20} color="#8e8e8e" />}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowDropdown(true)}>
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
                                <Text style={styles.resendText}>{verifyStatus === 'sending' ? 'Sending...' : 'Resend Code'}</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {verifyMessage ? (
                        <View style={styles.statusContainer}>
                            <Text style={[styles.statusMessage, { color: getStatusColor(verifyStatus) }]}>{verifyMessage}</Text>
                        </View>
                    ) : null}

                    {!showOtpInput && (
                        <TouchableOpacity
                            style={[styles.signupButton, (!email || !username || !password) && styles.signupButtonDisabled]}
                            onPress={handleSignUp}
                            disabled={loading || !email || !username || !password}
                        >
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signupButtonText}>Sign up</Text>}
                        </TouchableOpacity>
                    )}

                    <Text style={styles.termsText}>By signing up, you agree to our Terms, Privacy Policy and Cookies Policy.</Text>
                </View>

                <View style={styles.signinCard}>
                    <Text style={styles.signinText}>
                        Have an account?{' '}
                        <Text style={styles.signinLink} onPress={() => { if (onSignIn) onSignIn(); }}>Log in</Text>
                    </Text>
                </View>
            </ScrollView>

            <Modal visible={showDropdown} transparent animationType="fade" onRequestClose={() => setShowDropdown(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDropdown(false)}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Account Type</Text>
                        {ACCOUNT_TYPES.map((type) => (
                            <TouchableOpacity
                                key={type.value}
                                style={[styles.modalOption, accountType === type.value && styles.modalOptionActive]}
                                onPress={() => { setAccountType(type.value); setShowDropdown(false); }}
                            >
                                <View style={styles.modalOptionContent}>
                                    <Text style={[styles.modalOptionLabel, accountType === type.value && styles.modalOptionLabelActive]}>{type.label}</Text>
                                    <Text style={styles.modalOptionDesc}>{type.description}</Text>
                                </View>
                                {accountType === type.value && <Text style={styles.checkmark}>✓</Text>}
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.modalCancel} onPress={() => setShowDropdown(false)}>
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </KeyboardAvoidingView>
    );
};

export default SignUp;
