import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function InvestorPortfolioStep({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Text style={styles.backText}>{'←'}</Text>
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Investor Portfolio</Text>
                    <Text style={styles.stepText}>Step 3 of 3</Text>
                </View>
                <View style={styles.headerRight} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Investor Portfolio Page</Text>
                <Text style={styles.subtitle}>Portfolio fields will be added later</Text>

                <TouchableOpacity onPress={onDone} style={styles.doneBtn}>
                    <Text style={styles.doneBtnText}>Complete Setup</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        height: 84,
        paddingTop: 28,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        width: 48,
    },
    backText: {
        fontSize: 24,
        color: '#000',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
    },
    stepText: {
        fontSize: 12,
        marginTop: 2,
        color: '#666',
    },
    headerRight: {
        width: 48,
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#000',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 32,
        textAlign: 'center',
    },
    doneBtn: {
        marginTop: 32,
        padding: 16,
        backgroundColor: '#222',
        borderRadius: 8,
        minWidth: 200,
        alignItems: 'center',
    },
    doneBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
