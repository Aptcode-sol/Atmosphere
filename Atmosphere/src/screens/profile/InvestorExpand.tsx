import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Target, TrendingUp, Briefcase, Globe, DollarSign, CheckCircle } from 'lucide-react-native';

type Props = {
    investorDetails: any;
    profileData: any;
    cardContainerWidth: number;
};

export default function InvestorExpand({ investorDetails, profileData, cardContainerWidth }: Props) {
    const details = investorDetails || profileData?.details || {};
    const about = details.about || profileData?.tagline || profileData?.description || '';
    const investmentFocus = details.investmentFocus || [];
    const stage = details.stage || '';
    const interestedRounds = details.interestedRounds || [];
    const geography = Array.isArray(details.geography) ? details.geography.join(', ') : (details.geography || '');
    const checkSize = details.checkSize || {};
    const holdings = details.previousInvestments || [];

    // Mock holdings data for display
    const mockHoldings = [
        { name: 'Airbound.co', sector: 'Logistics', logo: null },
        { name: 'NeuralHealth', sector: 'HealthTech', logo: null },
        { name: 'GreenCharge', sector: 'CleanTech', logo: null },
        { name: 'CodeMentor AI', sector: 'EdTech', logo: null },
    ];

    return (
        <View style={{ width: '100%', padding: 16, paddingBottom: 100, alignItems: 'center' }}>
            <View style={{ width: cardContainerWidth, gap: 16 }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Investor Profile</Text>

                <View style={[cardStyles.card, { width: '100%' }]}> {/* main investor card */}
                    <View style={cardStyles.aboutSection}>
                        <Text style={cardStyles.aboutLabel}>About</Text>
                        <Text style={cardStyles.aboutText}>
                            {about || 'Angel investor | Early stage startup enthusiast'}
                        </Text>
                    </View>

                    <Text style={cardStyles.sectionTitle}>Investment Focus</Text>

                    <View style={cardStyles.firstRow}>
                        <Target size={16} color="#888" />
                        <Text style={cardStyles.rowTitle}>Industries</Text>
                    </View>
                    <View style={cardStyles.chipRow}>
                        {(investmentFocus.length > 0 ? investmentFocus : ['AI & ML', 'SaaS', 'FinTech', 'HealthTech']).map((focus: string, idx: number) => (
                            <View key={idx} style={cardStyles.chip}>
                                <Text style={cardStyles.chipText}>{focus}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={cardStyles.row}>
                        <TrendingUp size={16} color="#888" />
                        <Text style={cardStyles.rowTitle}>Stage</Text>
                    </View>
                    <Text style={cardStyles.rowValue}>{stage || 'Early Stage'}</Text>

                    <View style={cardStyles.row}>
                        <Briefcase size={16} color="#888" />
                        <Text style={cardStyles.rowTitle}>Interested rounds</Text>
                    </View>
                    <Text style={cardStyles.rowValue}>
                        {interestedRounds.length > 0 ? interestedRounds.join(', ') : 'Pre-seed, Seed, Series A'}
                    </Text>

                    <View style={cardStyles.row}>
                        <Globe size={16} color="#888" />
                        <Text style={cardStyles.rowTitle}>Investable Geography</Text>
                    </View>
                    <Text style={cardStyles.rowValue}>{geography || 'North America, Europe'}</Text>

                    <View style={cardStyles.row}>
                        <DollarSign size={16} color="#888" />
                        <Text style={cardStyles.rowTitle}>Check Size</Text>
                    </View>
                    <Text style={cardStyles.rowValue}>
                        {checkSize.min || checkSize.max ? `$${(checkSize.min / 1000 || 0)}K - $${(checkSize.max / 1000 || 0)}K` : '$50K - $500K'}
                    </Text>

                    <View style={cardStyles.row}>
                        <CheckCircle size={16} color="#888" />
                        <Text style={cardStyles.rowTitle}>Verified Investments</Text>
                    </View>
                    <Text style={cardStyles.rowValue}>{holdings.length || 4}</Text>
                </View>

                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 4 }}>Holdings</Text>

                <View style={[holdingsStyles.grid, { width: '100%' }]}>
                    {(holdings.length > 0 ? holdings : mockHoldings).map((holding: any, idx: number) => (
                        <View key={idx} style={holdingsStyles.card}>
                            <View style={holdingsStyles.cardContent}>
                                <View style={holdingsStyles.logoContainer}>
                                    {holding.logo ? (
                                        <Image source={{ uri: holding.logo }} style={holdingsStyles.logo} />
                                    ) : (
                                        <View style={holdingsStyles.logoPlaceholder}>
                                            <Text style={holdingsStyles.logoText}>{(holding.name || holding.companyName || 'C').charAt(0)}</Text>
                                        </View>
                                    )}
                                </View>
                                <View style={holdingsStyles.info}>
                                    <Text style={holdingsStyles.name} numberOfLines={1}>{holding.name || holding.companyName || 'Company'}</Text>
                                    <Text style={holdingsStyles.sector} numberOfLines={1}>{holding.sector || holding.industry || 'Tech'}</Text>
                                </View>
                                <TouchableOpacity style={holdingsStyles.viewBtn}>
                                    <Text style={holdingsStyles.viewBtnText}>View</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
};

const cardStyles = {
    card: {
        backgroundColor: '#0d0d0d',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#1a1a1a',
        padding: 18,
        marginBottom: 16,
    },
    aboutSection: {
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1d1d1d',
    },
    aboutLabel: {
        color: '#666',
        fontSize: 12,
        fontWeight: '600' as const,
        marginBottom: 6,
    },
    aboutText: {
        color: '#e5e5e5',
        fontSize: 14,
        lineHeight: 20,
    },
    sectionTitle: {
        color: '#666',
        fontSize: 12,
        fontWeight: '600' as const,
        marginBottom: 12,
        marginTop: 8, // Reduced from 12
    },
    row: {
        flexDirection: 'row' as const,
        alignItems: 'flex-start' as const,
        gap: 8,
        marginBottom: 4, // Reduced from 8 to keep label and value closer
    },
    firstRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 8,
        marginTop: 0,
        marginBottom: 4,
    },
    rowTitle: {
        color: '#e5e5e5',
        fontSize: 13,
        fontWeight: '600' as const,
    },
    rowValue: {
        color: '#999',
        fontSize: 13,
        marginLeft: 24,
        marginTop: 0,
        marginBottom: 16, // Added spacing between items
    },
    chipRow: {
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
        gap: 6,
        marginTop: 8,
        marginLeft: 24,
        marginBottom: 20, // Added spacing after chips
    },
    chip: {
        backgroundColor: '#1a1a1a',
        borderWidth: 0,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
    },
    chipText: {
        color: '#999',
        fontSize: 12,
    },
};

const holdingsStyles = {
    grid: {
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
        gap: 12,
        width: '100%' as any,
    },
    card: {
        width: '48%' as any,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 12,
        marginBottom: 4,
    },
    cardContent: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
    },
    logoContainer: {
        marginRight: 10,
    },
    logo: {
        width: 40,
        height: 40,
        borderRadius: 8,
    },
    logoPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#333',
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
    },
    logoText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600' as const,
    },
    info: {
        flex: 1,
    },
    name: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500' as const,
    },
    sector: {
        color: '#888',
        fontSize: 12,
        marginTop: 2,
    },
    viewBtn: {
        backgroundColor: '#333',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 6,
    },
    viewBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500' as const,
    },
};
