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

    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        setLoading(true);
        try {
            const data = await register({ email, username, password, displayName: username || email });
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

    const { theme } = useContext(ThemeContext);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Logo size={42} />
            <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                <TextInput style={[styles.input, { backgroundColor: theme.cardBackground, color: theme.text, borderColor: theme.border }]} placeholder="Email" placeholderTextColor={theme.placeholder} value={email} onChangeText={setEmail} />
                <TextInput style={[styles.input, { backgroundColor: theme.cardBackground, color: theme.text, borderColor: theme.border }]} placeholder="Username" placeholderTextColor={theme.placeholder} value={username} onChangeText={setUsername} />
                <TextInput style={[styles.input, { backgroundColor: theme.cardBackground, color: theme.text, borderColor: theme.border }]} placeholder="Password" placeholderTextColor={theme.placeholder} value={password} secureTextEntry onChangeText={setPassword} />
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
