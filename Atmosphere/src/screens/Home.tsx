import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { clearToken } from '../lib/auth';

const Home = ({ onLogout }: { onLogout?: () => void }) => {
    const handleLogout = async () => {
        await clearToken();
        if (onLogout) onLogout();
    };

    return (
        <View style={styles.container}>
            <Text style={styles.text}>Home Page</Text>
            <TouchableOpacity style={styles.logout} onPress={handleLogout}>
                <Text style={styles.logoutText}>Log out</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#050505', alignItems: 'center', justifyContent: 'center' },
    text: { color: '#f2f2f2', fontSize: 20 },
    logout: { marginTop: 16, backgroundColor: '#404040', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
    logoutText: { color: '#fff', fontWeight: '700' },
});

export default Home;
