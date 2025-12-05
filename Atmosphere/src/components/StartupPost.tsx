import React, { useState, useContext } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';

type StartupCard = {
    id: string;
    name: string;
    displayName: string;
    verified: boolean;
    profileImage: string;
    description: string;
    stage: string;
    rounds: number;
    age: number;
    fundingRaised: number;
    fundingNeeded: number;
    stats?: { likes: number; comments: number; crowns: number; shares: number };
};

const StartupPost = ({ post, company }: { post?: StartupCard; company?: StartupCard }) => {
    const companyData = post || company;
    const { theme } = useContext(ThemeContext);
    const [liked, setLiked] = useState(false);
    const stats = companyData?.stats || { likes: 0, comments: 0, crowns: 0, shares: 0 };
    const [likes, setLikes] = useState<number>(stats.likes || 0);
    const [saved, setSaved] = useState(false);

    if (!companyData) return null;

    const toggleLike = () => {
        setLiked((v) => {
            setLikes((l) => (v ? l - 1 : l + 1));
            return !v;
        });
    };

    const totalFunding = (companyData.fundingRaised || 0) + (companyData.fundingNeeded || 0);
    const fundingPercent = totalFunding > 0 ? ((companyData.fundingRaised || 0) / totalFunding) * 100 : 0;

    const formatCurrency = (num: number) => {
        if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
        return `$${num}`;
    };

    return (
        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            {/* Header with name and verified badge */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={[styles.companyName, { color: theme.text }]}>{companyData.name}</Text>
                    {companyData.verified && <Text style={styles.badge}>✓ Verified startup</Text>}
                </View>
                <TouchableOpacity onPress={() => setSaved(!saved)}>
                    <Text style={{ fontSize: 20 }}>{saved ? '🔖' : '📑'}</Text>
                </TouchableOpacity>
            </View>

            {/* Profile image */}
            <Image source={{ uri: companyData.profileImage }} style={styles.mainImage} />

            {/* Stats row: likes, crowns, comments, shares */}
            <View style={styles.statsRow}>
                <TouchableOpacity style={styles.statItem} onPress={toggleLike}>
                    <Text style={[styles.heart, { color: liked ? '#e74c3c' : theme.placeholder }]}>❤</Text>
                    <Text style={[styles.statCount, { color: theme.text }]}>{likes}</Text>
                </TouchableOpacity>

                <View style={styles.statItem}>
                    <Text style={[styles.statIcon, { color: theme.placeholder }]}>👑</Text>
                    <Text style={[styles.statCount, { color: theme.text }]}>{stats.crowns}</Text>
                </View>

                <View style={styles.statItem}>
                    <Text style={[styles.statIcon, { color: theme.placeholder }]}>💬</Text>
                    <Text style={[styles.statCount, { color: theme.text }]}>{stats.comments}</Text>
                </View>

                <View style={styles.statItem}>
                    <Text style={[styles.statIcon, { color: theme.placeholder }]}>📤</Text>
                    <Text style={[styles.statCount, { color: theme.text }]}>{stats.shares}</Text>
                </View>
            </View>

            {/* Description */}
            <View style={styles.body}>
                <Text style={[styles.label, { color: theme.placeholder }]}>WHAT'S {companyData.name.toUpperCase()}</Text>
                <Text style={[styles.description, { color: theme.text }]} numberOfLines={3}>{companyData.description}</Text>
            </View>

            {/* Stage */}
            <View style={styles.stageSection}>
                <Text style={[styles.stageLabel, { color: theme.text }]}>STAGE: {String(companyData.stage || '').toUpperCase()}</Text>
            </View>

            {/* Info boxes: Revenue, Rounds, Age */}
            <View style={styles.infoBoxesRow}>
                <View style={[styles.infoBox, { borderColor: theme.border }]}>
                    <Text style={[styles.infoBoxLabel, { color: theme.placeholder }]}>Revenue</Text>
                    <Text style={[styles.infoBoxValue, { color: theme.text }]}>generating</Text>
                </View>
                <View style={[styles.infoBox, { borderColor: theme.border }]}>
                    <Text style={[styles.infoBoxLabel, { color: theme.placeholder }]}>Rounds</Text>
                    <Text style={[styles.infoBoxValue, { color: theme.text }]}>: {companyData.rounds ?? 0}</Text>
                </View>
                <View style={[styles.infoBox, { borderColor: theme.border }]}>
                    <Text style={[styles.infoBoxLabel, { color: theme.placeholder }]}>Age</Text>
                    <Text style={[styles.infoBoxValue, { color: theme.text }]}>{companyData.age ?? 0} yr</Text>
                </View>
            </View>

            {/* Funding progress bar */}
            <View style={styles.fundingSection}>
                <View style={styles.fundingBar}>
                    <View
                        style={[
                            styles.fundingFilled,
                            { width: `${fundingPercent}%`, backgroundColor: theme.primary }
                        ]}
                    />
                </View>
                <View style={styles.fundingLabels}>
                    <Text style={[styles.fundingText, { color: theme.text }]}>{formatCurrency(companyData.fundingRaised ?? 0)} Filled</Text>
                    <Text style={[styles.fundingText, { color: theme.placeholder }]}>{formatCurrency(companyData.fundingNeeded ?? 0)}</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderWidth: 1,
        borderRadius: 8,
        marginVertical: 8,
        overflow: 'hidden',
        marginHorizontal: 12
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 8
    },
    headerLeft: { flex: 1 },
    companyName: { fontWeight: '700', fontSize: 16 },
    badge: { fontSize: 11, color: '#27ae60', marginTop: 2 },
    mainImage: { width: '100%', height: 240, backgroundColor: '#222' },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingTop: 12,
        gap: 16
    },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statCount: { fontSize: 12, fontWeight: '600' },
    heart: { fontSize: 16 },
    statIcon: { fontSize: 14 },
    body: { paddingHorizontal: 12, paddingTop: 12 },
    label: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
    description: { fontSize: 13, marginTop: 6, lineHeight: 18 },
    stageSection: { paddingHorizontal: 12, paddingTop: 10 },
    stageLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
    infoBoxesRow: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 12,
        paddingTop: 12,
        marginBottom: 12
    },
    infoBox: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 4,
        paddingVertical: 8,
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center'
    },
    infoBoxLabel: { fontSize: 10, fontWeight: '600' },
    infoBoxValue: { fontSize: 12, fontWeight: '700', marginTop: 2 },
    fundingSection: { paddingHorizontal: 12, paddingBottom: 12 },
    fundingBar: {
        height: 8,
        borderRadius: 4,
        backgroundColor: '#e0e0e0',
        overflow: 'hidden',
        marginBottom: 6
    },
    fundingFilled: { height: '100%', borderRadius: 4 },
    fundingLabels: { flexDirection: 'row', justifyContent: 'space-between' },
    fundingText: { fontSize: 11 }
});

export default StartupPost;
