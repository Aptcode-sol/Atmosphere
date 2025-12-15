import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import Logo from '../components/Logo';
import { login } from '../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SignIn = ({ onSignUp, onSignedIn }: { onSignUp?: () => void; onSignedIn?: () => void }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

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
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Top section with Logo */}
            <View style={styles.topSection}>
                <Logo size={48} />
            </View>

            {/* Middle section with form */}
            <View style={styles.formSection}>
                <View style={styles.formCard}>
                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Phone number, username, or email"
                        placeholderTextColor="#8e8e8e"
                        style={styles.input}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />

                    <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Password"
                        placeholderTextColor="#8e8e8e"
                        style={styles.input}
                        secureTextEntry
                    />

                    <TouchableOpacity
                        style={[styles.loginButton, (!email || !password) && styles.loginButtonDisabled]}
                        onPress={handleLogin}
                        disabled={loading || !email || !password}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.loginButtonText}>Log in</Text>
                        )}
                    </TouchableOpacity>

                    {/* OR Divider */}
                    <View style={styles.dividerRow}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Facebook Login */}
                    <TouchableOpacity style={styles.fbButton} onPress={() => Alert.alert('Facebook login coming soon')}>
                        <Text style={styles.fbIcon}>f</Text>
                        <Text style={styles.fbText}>Log in with Facebook</Text>
                    </TouchableOpacity>

                    {/* Forgot Password */}
                    <TouchableOpacity onPress={() => Alert.alert('Forgot password')}>
                        <Text style={styles.forgotText}>Forgot password?</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Bottom section with Sign up */}
            <View style={styles.bottomSection}>
                <View style={styles.signupCard}>
                    <Text style={styles.signupText}>
                        Don't have an account?{' '}
                        <Text style={styles.signupLink} onPress={() => { if (onSignUp) onSignUp(); }}>
                            Sign up
                        </Text>
                    </Text>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    topSection: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 40,
    },
    formSection: {
        paddingHorizontal: 32,
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
    loginButton: {
        backgroundColor: '#404040',
        height: 48,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    loginButtonDisabled: {
        backgroundColor: '#333333',
        opacity: 0.6,
    },
    loginButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
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
        fontSize: 13,
        fontWeight: '600',
    },
    fbButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    fbIcon: {
        color: '#8e8e8e',
        fontSize: 18,
        fontWeight: '700',
        marginRight: 8,
    },
    fbText: {
        color: '#8e8e8e',
        fontWeight: '600',
        fontSize: 14,
    },
    forgotText: {
        textAlign: 'center',
        color: '#8e8e8e',
        fontSize: 13,
        marginTop: 16,
    },
    bottomSection: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: 40,
    },
    signupCard: {
        borderTopWidth: 1,
        borderTopColor: '#262626',
        paddingVertical: 20,
        alignItems: 'center',
    },
    signupText: {
        color: '#8e8e8e',
        fontSize: 14,
    },
    signupLink: {
        color: '#fff',
        fontWeight: '600',
    },
});

export default SignIn;
