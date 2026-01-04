import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Logo from '../components/Logo';
import { login } from '../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SignIn = ({ onSignUp, onSignedIn, onForgotPassword }: { onSignUp?: () => void; onSignedIn?: () => void; onForgotPassword?: () => void }) => {
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

                    {/* Google Login */}
                    <TouchableOpacity style={styles.googleButton} onPress={() => Alert.alert('Google login coming soon')}>
                        <MaterialCommunityIcons name="google" size={18} color="#8e8e8e" />
                        <Text style={styles.googleText}>Log in with Google</Text>
                    </TouchableOpacity>

                    {/* Forgot Password */}
                    <TouchableOpacity onPress={() => { if (onForgotPassword) onForgotPassword(); }}>
                        <Text style={styles.forgotText}>Forgot password?</Text>
                    </TouchableOpacity>
                </View>

                {/* Sign up link - directly below form */}
                <View style={styles.signupCard}>
                    <Text style={styles.signupText}>
                        Don't have an account?{' '}
                        <Text style={styles.signupLink} onPress={() => { if (onSignUp) onSignUp(); }}>
                            Sign up
                        </Text>
                    </Text>
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
    loginButton: {
        backgroundColor: '#404040',
        height: 50,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 15,
    },
    loginButtonDisabled: {
        backgroundColor: '#333333',
        opacity: 0.6,
    },
    loginButtonText: {
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
    forgotText: {
        textAlign: 'center',
        color: '#8e8e8e',
        fontSize: 12,
        marginTop: 16,
    },
    signupCard: {
        borderWidth: 1,
        borderColor: '#262626',
        borderRadius: 10,
        backgroundColor: '#0d0d0d',
        paddingVertical: 20,
        marginTop: 16,
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
