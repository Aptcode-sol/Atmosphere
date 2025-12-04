import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { clearToken } from '../lib/auth';
import { ThemeContext } from '../contexts/ThemeContext';

type RouteKey = 'home' | 'search' | 'notifications' | 'chats' | 'reels' | 'profile';

const navItems: { key: RouteKey; label: string; glyph: string }[] = [
    { key: 'home', label: 'Home', glyph: '⌂' },
    { key: 'search', label: 'Search', glyph: '🔍' },
    { key: 'notifications', label: 'Notifications', glyph: '❤' },
    { key: 'chats', label: 'Chats', glyph: '💬' },
    { key: 'reels', label: 'Reels', glyph: '🎞' },
    { key: 'profile', label: 'Profile', glyph: '●' },
];

const Home = ({ onLogout }: { onLogout?: () => void }) => {
    const [route, setRoute] = useState<RouteKey>('home');
    const { theme } = useContext(ThemeContext);

    const handleLogout = async () => {
        await clearToken();
        if (onLogout) onLogout();
    };

    const dynamicStyles = React.useMemo(() => ({
        navItemActive: { backgroundColor: theme.primary },
        glyphColor: { color: theme.placeholder },
        glyphActiveColor: { color: '#fff' },
    }), [theme]);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.content}>
                <Text style={[styles.title, { color: theme.text }]}>{navItems.find((n) => n.key === route)?.label}</Text>
                <Text style={[styles.text, { color: theme.text }]}>This is the {route} view.</Text>
                <TouchableOpacity style={[styles.logout, { backgroundColor: theme.primary }]} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Log out</Text>
                </TouchableOpacity>
            </View>

            <View style={[styles.sideNav, styles.sideNavOverlay]}>
                {navItems.map((item) => {
                    const active = route === item.key;
                    return (
                        <TouchableOpacity
                            key={item.key}
                            onPress={() => setRoute(item.key)}
                            style={[styles.navItem, active ? dynamicStyles.navItemActive : null]}
                        >
                            <Text style={[styles.glyph, active ? dynamicStyles.glyphActiveColor : dynamicStyles.glyphColor]}>{item.glyph}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    sideNav: { position: 'absolute', right: 12, bottom: 24, alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6, backgroundColor: 'transparent', flexDirection: 'row' },
    navItem: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginHorizontal: 8 },
    navItemActive: { backgroundColor: '#1f1f1f' },
    glyph: { fontSize: 18 },
    sideNavOverlay: { backgroundColor: 'transparent' },
    content: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
    text: { fontSize: 16 },
    logout: { marginTop: 16, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
    logoutText: { color: '#fff', fontWeight: '700' },
});

export default Home;
