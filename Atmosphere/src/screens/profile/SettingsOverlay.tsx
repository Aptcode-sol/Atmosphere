/* eslint-disable react-native/no-inline-styles */
import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, Dimensions, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from './Profile.styles';
import { clearToken } from '../../lib/auth';
import { getSettings, updateSettings, changePassword } from '../../lib/api';

const SETTINGS_CACHE_KEY = 'ATMOSPHERE_SETTINGS_CACHE';

type Props = {
    src: any;
    theme: any;
    onClose: () => void;
};

type Settings = {
    displayName: string;
    username: string;
    email: string;
    phone: string;
};

export default function SettingsOverlay({ src, theme, onClose }: Props) {
    const slideAnim = useRef(new Animated.Value(-Dimensions.get('window').width)).current;
    const width = Dimensions.get('window').width;

    // Settings state
    const [settings, setSettings] = useState<Settings>({
        displayName: src?.name || '',
        username: src?.username?.replace('@', '') || '',
        email: '',
        phone: '',
    });
    const [loading, setLoading] = useState(true);

    // Modal states
    const [editModal, setEditModal] = useState<{ visible: boolean; field: string; value: string }>({
        visible: false,
        field: '',
        value: '',
    });
    const [passwordModal, setPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);

    // Fetch settings on mount with caching
    useEffect(() => {
        (async () => {
            try {
                // Load from cache first for instant display
                const cached = await AsyncStorage.getItem(SETTINGS_CACHE_KEY);
                if (cached) {
                    const cachedData = JSON.parse(cached);
                    setSettings(cachedData);
                    setLoading(false);
                }

                // Fetch fresh data from API
                const data = await getSettings();
                const newSettings = {
                    displayName: data.displayName || src?.name || '',
                    username: data.username || src?.username?.replace('@', '') || '',
                    email: data.email || '',
                    phone: data.phone || '',
                };
                setSettings(newSettings);
                // Update cache
                await AsyncStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(newSettings));
            } catch (err) {
                console.warn('Failed to fetch settings:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, [src]);

    const handleClose = () => {
        Animated.timing(slideAnim, {
            toValue: -width,
            duration: 200,
            useNativeDriver: true,
        }).start(({ finished }) => {
            if (finished) onClose();
        });
    };

    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [slideAnim]);

    const _openEditModal = (field: string, value: string) => {
        setEditModal({ visible: true, field, value });
    };

    const saveField = async () => {
        if (!editModal.field) return;
        setSaving(true);
        try {
            const payload: any = {};
            if (editModal.field === 'Name') payload.displayName = editModal.value;
            if (editModal.field === 'Username') payload.username = editModal.value;
            if (editModal.field === 'Phone') payload.phone = editModal.value;

            const result = await updateSettings(payload);
            if (result?.settings) {
                setSettings(prev => ({
                    ...prev,
                    displayName: result.settings.displayName || prev.displayName,
                    username: result.settings.username || prev.username,
                    phone: result.settings.phone || prev.phone,
                }));
            }
            setEditModal({ visible: false, field: '', value: '' });
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to update');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setSaving(true);
        try {
            await changePassword(currentPassword, newPassword);
            Alert.alert('Success', 'Password changed successfully');
            setPasswordModal(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to change password');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Animated.View style={[styles.fullPage, { backgroundColor: theme.background, transform: [{ translateX: slideAnim }] }]}>
            <View style={styles.settingsHeader}>
                <TouchableOpacity onPress={handleClose} style={styles.headerBack}>
                    <Text style={{ color: theme.text }}>{'←'}</Text>
                </TouchableOpacity>
                <Text style={[styles.settingsTitle, { color: theme.text }]}>Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={[styles.settingsContent, { paddingBottom: 48 }]}>
                {loading ? (
                    <View style={{ padding: 40, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                ) : (
                    <>


                        <Text style={[styles.sectionLabel, { color: theme.placeholder }]}>CONTENT</Text>
                        <View style={[styles.sectionCard, { borderColor: theme.border }]}>
                            <TouchableOpacity style={styles.settingRow} onPress={() => { }}>
                                <View style={styles.settingLeft}>
                                    <Text style={[styles.settingTitle, { color: theme.text }]}>Professional Dashboard</Text>
                                    <Text style={[styles.settingSubtitle, { color: theme.placeholder }]}>View analytics and insights</Text>
                                </View>
                                <Text style={[styles.chev, { color: theme.placeholder }]}>{'›'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.settingRow} onPress={() => { }}>
                                <View style={styles.settingLeft}>
                                    <Text style={[styles.settingTitle, { color: theme.text }]}>Saved Content</Text>
                                    <Text style={[styles.settingSubtitle, { color: theme.placeholder }]}>Access your saved posts and startups</Text>
                                </View>
                                <Text style={[styles.chev, { color: theme.placeholder }]}>{'›'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.settingRow} onPress={() => { }}>
                                <View style={styles.settingLeft}>
                                    <Text style={[styles.settingTitle, { color: theme.text }]}>Content Preference</Text>
                                    <Text style={[styles.settingSubtitle, { color: theme.placeholder }]}>Customize your feed</Text>
                                </View>
                                <Text style={[styles.chev, { color: theme.placeholder }]}>{'›'}</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.sectionLabel, { color: theme.placeholder }]}>PRIVACY</Text>
                        <View style={[styles.sectionCard, { borderColor: theme.border }]}>
                            <TouchableOpacity style={styles.settingRow} onPress={() => { }}>
                                <View style={styles.settingLeft}>
                                    <Text style={[styles.settingTitle, { color: theme.text }]}>Comments</Text>
                                    <Text style={[styles.settingSubtitle, { color: theme.placeholder }]}>Control who can comment on your posts</Text>
                                </View>
                                <Text style={[styles.chev, { color: theme.placeholder }]}>{'›'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.settingRow} onPress={() => { }}>
                                <View style={styles.settingLeft}>
                                    <Text style={[styles.settingTitle, { color: theme.text }]}>Connect</Text>
                                    <Text style={[styles.settingSubtitle, { color: theme.placeholder }]}>Manage direct message permissions</Text>
                                </View>
                                <Text style={[styles.chev, { color: theme.placeholder }]}>{'›'}</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.sectionLabel, { color: theme.placeholder }]}>HELP</Text>
                        <View style={[styles.sectionCard, { borderColor: theme.border }]}>
                            <TouchableOpacity style={styles.settingRow} onPress={() => { }}>
                                <View style={styles.settingLeft}>
                                    <Text style={[styles.settingTitle, { color: theme.text }]}>Support</Text>
                                    <Text style={[styles.settingSubtitle, { color: theme.placeholder }]}>Get help or contact us</Text>
                                </View>
                                <Text style={[styles.chev, { color: theme.placeholder }]}>{'›'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.settingRow} onPress={() => { }}>
                                <View style={styles.settingLeft}>
                                    <Text style={[styles.settingTitle, { color: theme.text }]}>About</Text>
                                    <Text style={[styles.settingSubtitle, { color: theme.placeholder }]}>Version 1.0.0</Text>
                                </View>
                                <Text style={[styles.chev, { color: theme.placeholder }]}>{'›'}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ height: 24 }} />
                        <TouchableOpacity
                            style={[styles.logoutBtn]}
                            onPress={async () => {
                                await clearToken();
                                // Clear settings cache on logout
                                await AsyncStorage.removeItem(SETTINGS_CACHE_KEY);
                                onClose();
                                try {
                                    const { DevSettings } = require('react-native');
                                    if (DevSettings && typeof DevSettings.reload === 'function') DevSettings.reload();
                                } catch {
                                    // ignore
                                }
                            }}
                        >
                            <Text style={styles.logoutText}>Log Out</Text>
                        </TouchableOpacity>
                        <View style={{ height: 48 }} />
                    </>
                )}
            </ScrollView>

            {/* Edit Field Modal */}
            <Modal visible={editModal.visible} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: theme.cardBackground || '#222', borderRadius: 12, padding: 20 }}>
                        <Text style={{ color: theme.text, fontSize: 18, fontWeight: '600', marginBottom: 16 }}>
                            Edit {editModal.field}
                        </Text>
                        <TextInput
                            style={{
                                backgroundColor: theme.background,
                                color: theme.text,
                                borderRadius: 8,
                                padding: 12,
                                fontSize: 16,
                                borderWidth: 1,
                                borderColor: theme.border,
                            }}
                            value={editModal.value}
                            onChangeText={(text) => setEditModal(prev => ({ ...prev, value: text }))}
                            placeholder={`Enter ${editModal.field.toLowerCase()}`}
                            placeholderTextColor={theme.placeholder}
                            autoFocus
                        />
                        <View style={{ flexDirection: 'row', marginTop: 20, gap: 12 }}>
                            <TouchableOpacity
                                style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: theme.border, alignItems: 'center' }}
                                onPress={() => setEditModal({ visible: false, field: '', value: '' })}
                            >
                                <Text style={{ color: theme.text }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: theme.primary || '#1FADFF', alignItems: 'center' }}
                                onPress={saveField}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Change Password Modal */}
            <Modal visible={passwordModal} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: theme.cardBackground || '#222', borderRadius: 12, padding: 20 }}>
                        <Text style={{ color: theme.text, fontSize: 18, fontWeight: '600', marginBottom: 16 }}>
                            Change Password
                        </Text>
                        <TextInput
                            style={{
                                backgroundColor: theme.background,
                                color: theme.text,
                                borderRadius: 8,
                                padding: 12,
                                fontSize: 16,
                                borderWidth: 1,
                                borderColor: theme.border,
                                marginBottom: 12,
                            }}
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            placeholder="Current password"
                            placeholderTextColor={theme.placeholder}
                            secureTextEntry
                        />
                        <TextInput
                            style={{
                                backgroundColor: theme.background,
                                color: theme.text,
                                borderRadius: 8,
                                padding: 12,
                                fontSize: 16,
                                borderWidth: 1,
                                borderColor: theme.border,
                                marginBottom: 12,
                            }}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholder="New password"
                            placeholderTextColor={theme.placeholder}
                            secureTextEntry
                        />
                        <TextInput
                            style={{
                                backgroundColor: theme.background,
                                color: theme.text,
                                borderRadius: 8,
                                padding: 12,
                                fontSize: 16,
                                borderWidth: 1,
                                borderColor: theme.border,
                            }}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Confirm new password"
                            placeholderTextColor={theme.placeholder}
                            secureTextEntry
                        />
                        <View style={{ flexDirection: 'row', marginTop: 20, gap: 12 }}>
                            <TouchableOpacity
                                style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: theme.border, alignItems: 'center' }}
                                onPress={() => {
                                    setPasswordModal(false);
                                    setCurrentPassword('');
                                    setNewPassword('');
                                    setConfirmPassword('');
                                }}
                            >
                                <Text style={{ color: theme.text }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: theme.primary || '#1FADFF', alignItems: 'center' }}
                                onPress={handleChangePassword}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={{ color: '#fff', fontWeight: '600' }}>Change</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </Animated.View>
    );
}
