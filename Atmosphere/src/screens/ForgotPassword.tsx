import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Logo from '../components/Logo';
import { forgotPassword, verifyOtpCheck, resetPassword } from '../lib/api';

const ForgotPassword = ({ onBack, onResetSuccess }: { onBack: () => void; onResetSuccess: () => void }) => {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleRequestOtp = async () => {
        setErrorMessage('');
        if (!email) { setErrorMessage('Please enter your email'); return; }
        setLoading(true);
        try {
            await forgotPassword(email);
            setStep(2);
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to send OTP');
        } finally { setLoading(false); }
    };

    const handleVerifyOtp = async () => {
        if (!otp) { Alert.alert('Error', 'Please enter the code'); return; }
        setLoading(true);
        try {
            await verifyOtpCheck(email, otp);
            setStep(3);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Invalid code');
        } finally { setLoading(false); }
    };

    const handleResetPassword = async () => {
        if (!password || !confirmPassword) { Alert.alert('Error', 'Please fill all fields'); return; }
        if (password !== confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return; }
        if (password.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return; }

        setLoading(true);
        try {
            await resetPassword(email, otp, password);
            Alert.alert('Success', 'Password reset successfully', [
                { text: 'OK', onPress: onResetSuccess }
            ]);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to reset password');
        } finally { setLoading(false); }
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
                    <Logo size={48} />
                </View>

                {/* Form Card */}
                <View style={styles.formCard}>
                    <Text style={styles.title}>
                        {step === 1 ? 'Reset Password' : step === 2 ? 'Verify Email' : 'New Password'}
                    </Text>
                    <Text style={styles.subtitle}>
                        {step === 1 ? 'Enter your email to receive a verification code.' : step === 2 ? `Enter the code sent to ${email}` : 'Create a new secure password.'}
                    </Text>

                    {step === 1 && (
                        <>
                            <TextInput
                                value={email}
                                onChangeText={(text) => { setEmail(text); setErrorMessage(''); }}
                                placeholder="Email address"
                                placeholderTextColor="#8e8e8e"
                                style={[styles.input, errorMessage ? styles.inputError : null]}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <Text style={styles.successText}>OTP is sent to your mail</Text>
                            <TextInput
                                value={otp}
                                onChangeText={setOtp}
                                placeholder="Verification Code"
                                placeholderTextColor="#8e8e8e"
                                style={styles.input}
                                keyboardType="number-pad"
                            />
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <TextInput
                                value={password}
                                onChangeText={setPassword}
                                placeholder="New Password"
                                placeholderTextColor="#8e8e8e"
                                style={styles.input}
                                secureTextEntry
                            />
                            <TextInput
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Confirm New Password"
                                placeholderTextColor="#8e8e8e"
                                style={styles.input}
                                secureTextEntry
                            />
                        </>
                    )}

                    <TouchableOpacity
                        style={[styles.primaryButton, loading && styles.buttonDisabled]}
                        onPress={step === 1 ? handleRequestOtp : step === 2 ? handleVerifyOtp : handleResetPassword}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>
                                {step === 1 ? 'Send Code' : step === 2 ? 'Verify' : 'Reset Password'}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <Text style={styles.backText}>Back to Login</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#8e8e8e',
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 20,
    },
    input: {
        height: 50,
        backgroundColor: '#000',
        borderRadius: 10,
        paddingHorizontal: 14,
        marginBottom: 12,
        fontSize: 14,
        color: '#fff',
        borderWidth: 1,
        borderColor: '#363636',
    },
    inputError: {
        borderColor: '#cf6679',
    },
    errorText: {
        color: '#cf6679',
        fontSize: 12,
        marginBottom: 12,
        marginTop: -8,
        marginLeft: 4,
    },
    successText: {
        color: '#4caf50',
        fontSize: 14,
        marginBottom: 16,
        textAlign: 'center',
        fontWeight: '500',
    },
    primaryButton: {
        backgroundColor: '#404040',
        height: 50,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 15,
    },
    buttonDisabled: {
        backgroundColor: '#333333',
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    backButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    backText: {
        color: '#8e8e8e',
        fontSize: 14,
    },
});

export default ForgotPassword;
