import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type Props = {
    userRole: 'startup' | 'investor' | 'personal';
    onSelectKyc: () => void;
    onSelectPortfolio: () => void;
    onBack: () => void;
    theme: any;
};

export default function KycPortfolioOptions({ userRole, onSelectKyc, onSelectPortfolio, onBack, theme }: Props) {
    // Restore previous UI: vertical buttons, icons, and spacing
    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Text style={[styles.backText, { color: theme.text }]}>{'←'}</Text>
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Choose Next Step</Text>
                    <Text style={[styles.stepText, { color: theme.placeholder }]}>Step 2 of 3</Text>
                </View>
                <View style={styles.headerRight} />
            </View>

            <View style={styles.content}>
                <TouchableOpacity
                    onPress={onSelectKyc}
                    style={[styles.optionBtn, { borderColor: theme.border, marginBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}
                >
                    <Text style={[styles.optionText, { color: theme.text, marginRight: 12 }]}>🛡️</Text>
                    <View>
                        <Text style={[styles.optionText, { color: theme.text }]}>KYC Verification</Text>
                        <Text style={[styles.optionDesc, { color: theme.placeholder }]}>Verify your identity</Text>
                    </View>
                </TouchableOpacity>

                {/* Show Portfolio option only for startup and investor */}
                {userRole !== 'personal' && (
                    <TouchableOpacity
                        onPress={onSelectPortfolio}
                        style={[styles.optionBtn, { borderColor: theme.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}
                    >
                        <Text style={[styles.optionText, { color: theme.text, marginRight: 12 }]}>📁</Text>
                        <View>
                            <Text style={[styles.optionText, { color: theme.text }]}>Portfolio</Text>
                            <Text style={[styles.optionDesc, { color: theme.placeholder }]}>
                                {userRole === 'startup' ? 'Setup your startup portfolio' : 'Setup your investment portfolio'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    stepText: {
        fontSize: 12,
        marginTop: 2,
    },
    headerRight: {
        width: 48,
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    optionBtn: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
    },
    optionText: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    optionDesc: {
        fontSize: 14,
        textAlign: 'center',
    },
});
