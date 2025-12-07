import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, Dimensions } from 'react-native';
import styles from './Profile.styles';
import { clearToken } from '../../lib/auth';

type Props = {
    src: any;
    theme: any;
    onClose: () => void;
};

export default function SettingsOverlay({ src, theme, onClose }: Props) {
    const slideAnim = useRef(new Animated.Value(-Dimensions.get('window').width)).current;
    const width = Dimensions.get('window').width;

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
            duration: 200, // Faster animation
            useNativeDriver: true,
        }).start();
    }, [slideAnim]);

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
                <Text style={[styles.sectionLabel, { color: theme.placeholder }]}>ACCOUNT INFORMATION</Text>
                <View style={[styles.sectionCard, { borderColor: theme.border }]}>
                    <TouchableOpacity style={styles.settingRow} onPress={() => { }}>
                        <View style={styles.settingLeft}>
                            <Text style={[styles.settingTitle, { color: theme.text }]}>Name</Text>
                            <Text style={[styles.settingSubtitle, { color: theme.placeholder }]} numberOfLines={2}>{src.name}</Text>
                        </View>
                        <Text style={[styles.chev, { color: theme.placeholder }]}>{'›'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.settingRow} onPress={() => { }}>
                        <View style={styles.settingLeft}>
                            <Text style={[styles.settingTitle, { color: theme.text }]}>Username</Text>
                            <Text style={[styles.settingSubtitle, { color: theme.placeholder }]}>{src.username}</Text>
                        </View>
                        <Text style={[styles.chev, { color: theme.placeholder }]}>{'›'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.settingRow} onPress={() => { }}>
                        <View style={styles.settingLeft}>
                            <Text style={[styles.settingTitle, { color: theme.text }]}>Password</Text>
                            <Text style={[styles.settingSubtitle, { color: theme.placeholder }]}>Change your password</Text>
                        </View>
                        <Text style={[styles.chev, { color: theme.placeholder }]}>{'›'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.settingRow} onPress={() => { }}>
                        <View style={styles.settingLeft}>
                            <Text style={[styles.settingTitle, { color: theme.text }]}>Email</Text>
                            <Text style={[styles.settingSubtitle, { color: theme.placeholder }]}>{'john.doe@example.com'}</Text>
                        </View>
                        <Text style={[styles.chev, { color: theme.placeholder }]}>{'›'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.settingRow} onPress={() => { }}>
                        <View style={styles.settingLeft}>
                            <Text style={[styles.settingTitle, { color: theme.text }]}>Phone</Text>
                            <Text style={[styles.settingSubtitle, { color: theme.placeholder }]}>{'+1234567890'}</Text>
                        </View>
                        <Text style={[styles.chev, { color: theme.placeholder }]}>{'›'}</Text>
                    </TouchableOpacity>
                </View>

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
                        onClose();
                        try {
                            // fallback: reload the JS bundle (works without navigation)
                            // eslint-disable-next-line @typescript-eslint/no-var-requires
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
            </ScrollView>
        </Animated.View>
    );
}
