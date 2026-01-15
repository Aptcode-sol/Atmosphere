import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Modal,
    TouchableWithoutFeedback,
} from 'react-native';
import { ThemeContext } from '../../contexts/ThemeContext';
import { ChevronLeft, ChevronRight, Eye, Users, ChevronDown } from 'lucide-react-native';
import { request } from '../../lib/api/core';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface InsightsData {
    views: number;
    profileVisits: number;
}

interface FollowerGrowthData {
    totalFollowers: number;
    percentChange: number;
    comparisonDate: string;
    growth: {
        overall: number;
        follows: number;
        unfollows: number;
    };
}

interface ProfessionalDashboardProps {
    onBack: () => void;
}

const TIME_PERIODS = [
    { label: 'Last 7 days', value: 7 },
    { label: 'Last 30 days', value: 30 },
    { label: 'Last 90 days', value: 90 },
];

const ProfessionalDashboard: React.FC<ProfessionalDashboardProps> = ({ onBack }) => {
    const { theme } = useContext(ThemeContext) as any;
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState(TIME_PERIODS[1]);
    const [showPeriodPicker, setShowPeriodPicker] = useState(false);
    const [insights, setInsights] = useState<InsightsData | null>(null);
    const [followerGrowth, setFollowerGrowth] = useState<FollowerGrowthData | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [insightsData, followerData] = await Promise.all([
                request('/api/analytics/insights', { days: selectedPeriod.value }, { method: 'GET' }),
                request('/api/analytics/followers', { days: selectedPeriod.value }, { method: 'GET' }),
            ]);
            setInsights(insightsData);
            setFollowerGrowth(followerData);
        } catch (err) {
            console.warn('Failed to fetch analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedPeriod]);

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <ChevronLeft size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Professional dashboard</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Time Period Selector */}
                <TouchableOpacity
                    style={styles.periodSelector}
                    onPress={() => setShowPeriodPicker(true)}
                >
                    <Text style={styles.periodText}>{selectedPeriod.label}</Text>
                    <ChevronDown size={18} color="#888" />
                </TouchableOpacity>

                {loading ? (
                    <ActivityIndicator style={styles.loader} color={theme.primary} />
                ) : (
                    <>
                        {/* Insights Section */}
                        <Text style={styles.sectionTitle}>Insights</Text>
                        <View style={styles.card}>
                            <TouchableOpacity style={styles.insightRow}>
                                <View style={styles.insightLeft}>
                                    <Eye size={20} color="#3B82F6" />
                                    <Text style={styles.insightLabel}>Views</Text>
                                </View>
                                <View style={styles.insightRight}>
                                    <Text style={styles.insightValue}>{insights?.views || 0}</Text>
                                    <ChevronRight size={18} color="#666" />
                                </View>
                            </TouchableOpacity>
                            <View style={styles.divider} />
                            <TouchableOpacity style={styles.insightRow}>
                                <View style={styles.insightLeft}>
                                    <Users size={20} color="#22C55E" />
                                    <Text style={styles.insightLabel}>Profile visits</Text>
                                </View>
                                <View style={styles.insightRight}>
                                    <Text style={styles.insightValue}>{insights?.profileVisits || 0}</Text>
                                    <ChevronRight size={18} color="#666" />
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Followers Card */}
                        <View style={[styles.card, { marginTop: 16 }]}>
                            <Text style={styles.followerCount}>{formatNumber(followerGrowth?.totalFollowers || 0)}</Text>
                            <Text style={styles.followerLabel}>Followers</Text>
                            <Text style={[
                                styles.percentChange,
                                { color: (followerGrowth?.percentChange || 0) >= 0 ? '#22C55E' : '#EF4444' }
                            ]}>
                                {(followerGrowth?.percentChange || 0) >= 0 ? '+' : ''}{followerGrowth?.percentChange || 0}% vs {followerGrowth?.comparisonDate || 'last period'}
                            </Text>

                            <View style={styles.growthDivider} />

                            <Text style={styles.growthTitle}>Growth</Text>
                            <View style={styles.growthRow}>
                                <Text style={styles.growthLabel}>Overall</Text>
                                <Text style={[styles.growthValue, { color: '#888' }]}>
                                    {(followerGrowth?.growth?.overall || 0) >= 0 ? '' : ''}{followerGrowth?.growth?.overall || 0}
                                </Text>
                            </View>
                            <View style={styles.growthRow}>
                                <Text style={styles.growthLabel}>Follows</Text>
                                <Text style={[styles.growthValue, { color: '#22C55E' }]}>
                                    {followerGrowth?.growth?.follows || 0}
                                </Text>
                            </View>
                            <View style={styles.growthRow}>
                                <Text style={styles.growthLabel}>Unfollows</Text>
                                <Text style={[styles.growthValue, { color: '#EF4444' }]}>
                                    {followerGrowth?.growth?.unfollows || 0}
                                </Text>
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Period Picker Overlay - Replaced Modal with Absolute View for better reliability */}
            {showPeriodPicker && (
                <TouchableWithoutFeedback onPress={() => setShowPeriodPicker(false)}>
                    <View style={styles.absoluteOverlay}>
                        <TouchableWithoutFeedback onPress={() => { }}>
                            <View style={styles.pickerContainer}>
                                {TIME_PERIODS.map((period) => (
                                    <TouchableOpacity
                                        key={period.value}
                                        style={[
                                            styles.pickerOption,
                                            selectedPeriod.value === period.value && styles.pickerOptionSelected
                                        ]}
                                        onPress={() => {
                                            setSelectedPeriod(period);
                                            setShowPeriodPicker(false);
                                        }}
                                    >
                                        <Text style={[
                                            styles.pickerOptionText,
                                            selectedPeriod.value === period.value && styles.pickerOptionTextSelected
                                        ]}>
                                            {period.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingBottom: 16, // removed internal paddingTop, set inline with insets
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    periodSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2a2a2a',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginBottom: 20,
    },
    periodText: {
        color: '#fff',
        fontSize: 14,
        marginRight: 6,
    },
    loader: {
        marginTop: 40,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 12,
    },
    card: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#2a2a2a',
    },
    insightRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    insightLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    insightLabel: {
        fontSize: 15,
        color: '#fff',
    },
    insightRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    insightValue: {
        fontSize: 15,
        color: '#888',
    },
    divider: {
        height: 1,
        backgroundColor: '#2a2a2a',
    },
    followerCount: {
        fontSize: 42,
        fontWeight: '700',
        color: '#fff',
    },
    followerLabel: {
        fontSize: 14,
        color: '#3B82F6',
        marginTop: 2,
    },
    percentChange: {
        fontSize: 13,
        marginTop: 4,
    },
    growthDivider: {
        height: 1,
        backgroundColor: '#2a2a2a',
        marginVertical: 16,
    },
    growthTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 12,
    },
    growthRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    growthLabel: {
        fontSize: 14,
        color: '#888',
    },
    growthValue: {
        fontSize: 14,
        fontWeight: '500',
    },
    absoluteOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    pickerContainer: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 8,
        minWidth: 200,
    },
    pickerOption: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    pickerOptionSelected: {
        backgroundColor: '#2a2a2a',
    },
    pickerOptionText: {
        fontSize: 15,
        color: '#888',
        textAlign: 'center',
    },
    pickerOptionTextSelected: {
        color: '#fff',
        fontWeight: '600',
    },
});

export default ProfessionalDashboard;
