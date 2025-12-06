import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import Logo from '../components/Logo';
import { register } from '../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../contexts/ThemeContext';

const SignUp = ({ onSignedUp, onSignIn }: { onSignedUp?: () => void; onSignIn?: () => void }) => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [accountType, setAccountType] = useState<'personal' | 'startup' | 'investor'>('personal');
    const [showAccountPicker, setShowAccountPicker] = useState(false);
    const [otp, setOtp] = useState('');
    const [showOtpInput, setShowOtpInput] = useState(false);

    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        setLoading(true);
        try {
            const data = await register({ email, username, password, displayName: username || email, accountType });
            if (data && data.token) {
                await AsyncStorage.setItem('token', data.token);
                await AsyncStorage.setItem('user', JSON.stringify(data.user || {}));
            }
            if (onSignedUp) onSignedUp();
        } catch (err: any) {
            Alert.alert('Sign up failed', err.message || 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestVerify = async () => {
        // In a real flow we'd send OTP to email. For dev, we just toggle OTP input.
        if (!email) return Alert.alert('Email required', 'Please enter your email to verify');
        setShowOtpInput(true);
        Alert.alert('Verification', 'Enter code 1234 to verify (dev)');
    };

    const handleVerifyCode = async () => {
        if (!otp) return Alert.alert('Code required', 'Enter the verification code');
        try {
            // call verify endpoint with email so backend can locate user in unauthenticated flow
            // dev stub accepts 1234
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const api = require('../lib/api');
            await api.verifyEmail(otp, email);
            Alert.alert('Verified', 'Email verified successfully');
            setShowOtpInput(false);
        } catch (err: any) {
            Alert.alert('Verification failed', err.message || 'Invalid code');
        }
    };

    const { theme } = useContext(ThemeContext);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Logo size={42} />
            <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                <TextInput style={[styles.input, { backgroundColor: theme.cardBackground, color: theme.text, borderColor: theme.border }]} placeholder="Email" placeholderTextColor={theme.placeholder} value={email} onChangeText={setEmail} />
                <View>
                    <TouchableOpacity onPress={() => setShowAccountPicker(s => !s)} style={[styles.input, { justifyContent: 'center', backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                        <Text style={{ color: theme.text }}>{accountType === 'personal' ? 'Personal' : accountType === 'startup' ? 'Startup' : 'Investor'}</Text>
                    </TouchableOpacity>
                    {showAccountPicker ? (
                        <View style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 6, marginTop: 6, overflow: 'hidden' }}>
                            <TouchableOpacity onPress={() => { setAccountType('personal'); setShowAccountPicker(false); }} style={{ padding: 10 }}><Text style={{ color: theme.text }}>Personal</Text></TouchableOpacity>
                            <TouchableOpacity onPress={() => { setAccountType('startup'); setShowAccountPicker(false); }} style={{ padding: 10 }}><Text style={{ color: theme.text }}>Startup</Text></TouchableOpacity>
                            <TouchableOpacity onPress={() => { setAccountType('investor'); setShowAccountPicker(false); }} style={{ padding: 10 }}><Text style={{ color: theme.text }}>Investor</Text></TouchableOpacity>
                        </View>
                    ) : null}
                </View>
                <TextInput style={[styles.input, { backgroundColor: theme.cardBackground, color: theme.text, borderColor: theme.border }]} placeholder="Username" placeholderTextColor={theme.placeholder} value={username} onChangeText={setUsername} />
                <TextInput style={[styles.input, { backgroundColor: theme.cardBackground, color: theme.text, borderColor: theme.border }]} placeholder="Password" placeholderTextColor={theme.placeholder} value={password} secureTextEntry onChangeText={setPassword} />
                <View style={{ flexDirection: 'row', marginTop: 8, gap: 8 }}>
                    <TouchableOpacity style={[styles.button, { backgroundColor: theme.secondary || '#666', flex: 1 }]} onPress={handleRequestVerify}>
                        <Text style={styles.buttonText}>Send Verify</Text>
                    </TouchableOpacity>
                    {showOtpInput ? (
                        <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary, paddingHorizontal: 12 }]} onPress={() => handleVerifyCode()}>
                            <Text style={styles.buttonText}>Verify</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
                {showOtpInput ? (
                    <TextInput style={[styles.input, { backgroundColor: theme.cardBackground, color: theme.text, borderColor: theme.border }]} placeholder="Enter code" placeholderTextColor={theme.placeholder} value={otp} onChangeText={setOtp} keyboardType="numeric" />
                ) : null}
                <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleSignUp} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign up</Text>}
                </TouchableOpacity>

                <View style={styles.signinRow}>
                    <Text style={[styles.signinText, { color: theme.text }]}>Have an account? <Text style={[styles.signinLink, { color: theme.primary }]} onPress={() => { if (onSignIn) onSignIn(); }}>Sign in</Text></Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#050505', alignItems: 'center', justifyContent: 'center', padding: 16 },
    logo: { fontSize: 42, fontFamily: 'Pacifico', color: '#f2f2f2', marginBottom: 12 },
    card: { width: '100%', maxWidth: 360, borderWidth: 1, borderColor: '#262626', padding: 20, borderRadius: 8, backgroundColor: '#0b0b0b' },
    input: { height: 44, borderColor: '#262626', borderWidth: 1, borderRadius: 6, paddingHorizontal: 12, marginTop: 10, fontSize: 14, backgroundColor: '#050505', color: '#f2f2f2' },
    button: { backgroundColor: '#404040', height: 44, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
    buttonText: { color: '#fff', fontWeight: '700' },
    signinRow: { marginTop: 12, alignItems: 'center' },
    signinText: {},
    signinLink: { fontWeight: '700' },
});

export default SignUp;
