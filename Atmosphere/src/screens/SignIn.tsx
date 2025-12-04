import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import Logo from '../components/Logo';
import { login } from '../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../contexts/ThemeContext';

const SignIn = ({ onSignUp, onSignedIn }: { onSignUp?: () => void; onSignedIn?: () => void }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { theme } = useContext(ThemeContext);

    const handleLogin = async () => {
        setLoading(true);
        try {
            const data = await login(email, password);
            if (data && data.token) {
                await AsyncStorage.setItem('token', data.token);
                await AsyncStorage.setItem('user', JSON.stringify(data.user || {}));
            }
            if (onSignedIn) onSignedIn();
        } catch (err: any) {
            Alert.alert('Login failed', err.message || 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.cardWrap}>
                <Logo size={44} />

                <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Phone number, username, or email"
                        placeholderTextColor={theme.placeholder}
                        style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />

                    <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Password"
                        placeholderTextColor={theme.placeholder}
                        style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                        secureTextEntry
                    />

                    <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleLogin} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log in</Text>}
                    </TouchableOpacity>

                    <View style={styles.dividerRow}>
                        <View style={[styles.separator, { backgroundColor: theme.border }]} />
                        <Text style={[styles.orText, { color: theme.text }]}>Or</Text>
                        <View style={[styles.separator, { backgroundColor: theme.border }]} />
                    </View>

                    <TouchableOpacity style={styles.fbButton} onPress={() => Alert.alert('Facebook login')}>
                        <View style={[styles.fbGlyph, { backgroundColor: theme.accent }]}>
                            <Text style={styles.fbGlyphText}>f</Text>
                        </View>
                        <Text style={[styles.fbTextWithIcon, { color: theme.accent }]}>Log in with Facebook</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => Alert.alert('Forgot password')}>
                        <Text style={[styles.forgot, { color: theme.accent }]}>Forgot password?</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.signupCard, { borderColor: theme.border, backgroundColor: theme.background }]}>
                    <Text style={[styles.signupText, { color: theme.text }]}>
                        Don't have an account?{' '}
                        <Text style={[styles.signupLink, { color: theme.primary }]} onPress={() => { if (onSignUp) onSignUp(); }}>Sign up</Text>
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 16 },
    cardWrap: { width: '100%', maxWidth: 360, alignItems: 'center', gap: 16 },
    logo: { fontSize: 40, fontFamily: 'System', marginBottom: 8 },
    card: { width: '100%', borderWidth: 1, borderColor: '#ddd', padding: 20, borderRadius: 6, backgroundColor: '#fafafa' },
    input: { height: 40, borderColor: '#ccc', borderWidth: 1, borderRadius: 4, paddingHorizontal: 10, marginTop: 8, fontSize: 14, backgroundColor: '#fff' },
    button: { backgroundColor: '#1DA1F2', height: 40, borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
    buttonText: { color: '#fff', fontWeight: '600' },
    dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
    separator: { flex: 1, height: 1, backgroundColor: '#ddd' },
    orText: { marginHorizontal: 8, color: '#777', fontSize: 12, fontWeight: '600' },
    fbButton: { alignItems: 'center', paddingVertical: 10, flexDirection: 'row', justifyContent: 'center' },
    fbTextWithIcon: { color: '#1877F2', fontWeight: '700', marginLeft: 8 },
    fbIcon: { width: 20, height: 20, resizeMode: 'contain' },
    fbGlyph: { width: 20, height: 20, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
    fbGlyphText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    forgot: { textAlign: 'center', color: '#1877F2', marginTop: 8 },
    signupCard: { width: '100%', borderWidth: 1, borderColor: '#ddd', padding: 12, marginTop: 12, borderRadius: 6, backgroundColor: '#fff' },
    signupText: { textAlign: 'center' },
    signupLink: { color: '#1DA1F2', fontWeight: '700' },
    getApp: { marginTop: 12, alignItems: 'center' },
    getAppText: { marginBottom: 8 },
    storeRow: { flexDirection: 'row', gap: 8 },
    storeImage: { width: 140, height: 44, resizeMode: 'contain', marginHorizontal: 6 },
});

export default SignIn;
