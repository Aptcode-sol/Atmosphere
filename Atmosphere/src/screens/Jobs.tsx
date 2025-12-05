import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';

const Jobs = () => {
    const { theme } = useContext(ThemeContext);
    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Text style={[styles.title, { color: theme.text }]}>Jobs</Text>
            <Text style={[styles.desc, { color: theme.placeholder }]}>Open roles and hiring startups.</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 20, fontWeight: '700' },
    desc: { marginTop: 8 }
});

export default Jobs;
