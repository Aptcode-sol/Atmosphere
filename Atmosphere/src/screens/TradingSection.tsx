import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, ActivityIndicator, Dimensions, Animated, ScrollView, Image as RNImage } from 'react-native';
import { fetchMarkets, fetchInvestors } from '../lib/api';
import { BOTTOM_NAV_HEIGHT } from '../lib/layout';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';

const { width: screenW } = Dimensions.get('window');

// Industry/Segment tags
const industryTags = [
    "AI", "ML", "Fintech", "HealthTech", "EV", "SaaS", "E-commerce", "EdTech", "AgriTech",
    "Blockchain", "IoT", "CleanTech", "FoodTech", "PropTech", "InsurTech", "LegalTech",
    "MarTech", "RetailTech", "TravelTech", "Logistics", "Cybersecurity", "Gaming", "Media", "SpaceTech"
];

// Category filters for buy tab
const categories = [
    "AI", "ML", "DeepTech", "Manufacturing", "Cafe", "B2B", "B2C", "B2B2C",
    "Fintech", "SaaS", "HealthTech", "AgriTech", "D2C", "Logistics", "EV",
    "EdTech", "Robotics", "IoT", "Blockchain", "E-commerce", "FoodTech",
    "PropTech", "InsurTech", "LegalTech", "CleanTech", "BioTech", "Cybersecurity",
    "AR/VR", "Gaming", "Media", "Entertainment", "Travel", "Hospitality",
];

interface Investment {
    companyName: string;
    companyId?: string;
    date?: Date;
    amount?: number;
    docs?: string[];
}

interface InvestorPortfolio {
    _id: string;
    user: {
        _id: string;
        username: string;
        displayName?: string;
        avatarUrl?: string;
    };
    previousInvestments: Investment[];
}

interface ActiveTrade {
    id: number;
    companyId: string;
    companyName: string;
    companyType: string[];
    companyAge: string;
    revenueStatus: "revenue-generating" | "pre-revenue";
    description: string;
    startupUsername: string;
    sellingRangeMin: number;
    sellingRangeMax: number;
    videoUrl?: string;
    imageUrls: string[];
    views: number;
    saves: number;
    isEdited: boolean;
    isManualEntry: boolean;
    selectedIndustries: string[];
}

const Trading = () => {
    const [markets, setMarkets] = useState<any[]>([]);
    const [investors, setInvestors] = useState<InvestorPortfolio[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [investorsLoading, setInvestorsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
    const [expandedPortfolios, setExpandedPortfolios] = useState<Set<string>>(new Set());
    const pagerRef = useRef<any>(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    // SELL tab - Portfolio form state
    const [expandedCompany, setExpandedCompany] = useState<string | null>(null);
    const [sellingRangeMin, setSellingRangeMin] = useState<number>(10);
    const [sellingRangeMax, setSellingRangeMax] = useState<number>(40);
    const [companyAge, setCompanyAge] = useState<string>('');
    const [revenueStatus, setRevenueStatus] = useState<"revenue-generating" | "pre-revenue">("pre-revenue");
    const [description, setDescription] = useState<string>('');
    const [startupUsername, setStartupUsername] = useState<string>('');
    const [isManualEntry, setIsManualEntry] = useState<boolean>(false);
    const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
    const [companyType] = useState<string[]>([]);
    const [videoUri, setVideoUri] = useState<string>('');
    const [imageUris, setImageUris] = useState<string[]>([]);
    const [externalLinkHeading, setExternalLinkHeading] = useState<string>('');
    const [externalLinkUrl, setExternalLinkUrl] = useState<string>('');

    // Active trades
    const [activeTrades, setActiveTrades] = useState<ActiveTrade[]>([]);
    const [expandedTradeId, setExpandedTradeId] = useState<number | null>(null);
    const [currentPhotoIndex] = useState<{ [key: number]: number }>({});

    // BUY tab state
    const [searchValue, setSearchValue] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [showSavedOnly, setShowSavedOnly] = useState(false);
    const [savedItems, setSavedItems] = useState<number[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const m = await fetchMarkets();
                setMarkets(Array.isArray(m) ? m : []);
            } catch (e: any) {
                console.warn('Failed to load markets', e);
                setError(e?.message || 'Failed to load markets');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            setInvestorsLoading(true);
            try {
                const inv = await fetchInvestors({ limit: 50 });
                setInvestors(Array.isArray(inv) ? inv : []);
            } catch (e: any) {
                console.warn('Failed to load investors', e);
            } finally {
                setInvestorsLoading(false);
            }
        })();
    }, []);

    const togglePortfolio = (cardKey: string) => {
        setExpandedPortfolios(prev => {
            const newSet = new Set(prev);
            if (newSet.has(cardKey)) {
                newSet.delete(cardKey);
            } else {
                newSet.add(cardKey);
            }
            return newSet;
        });
    };

    const toggleIndustry = (industry: string) => {
        setSelectedIndustries(prev =>
            prev.includes(industry)
                ? prev.filter(i => i !== industry)
                : prev.length < 3 ? [...prev, industry] : prev
        );
    };

    const handleVideoUpload = async () => {
        try {
            const result = await launchImageLibrary({
                mediaType: 'video',
                quality: 0.8,
            });

            if (!result.didCancel && result.assets && result.assets.length > 0) {
                setVideoUri(result.assets[0].uri || '');
            }
        } catch (error) {
            console.warn('Video upload error:', error);
        }
    };

    const handleImageUpload = async () => {
        try {
            const result = await launchImageLibrary({
                mediaType: 'photo',
                quality: 0.8,
            });

            if (!result.didCancel && result.assets && result.assets.length > 0) {
                setImageUris([...imageUris, result.assets[0].uri || '']);
            }
        } catch (error) {
            console.warn('Image upload error:', error);
        }
    };

    const removeImage = (index: number) => {
        setImageUris(imageUris.filter((_, i) => i !== index));
    };

    const handleOpenTrade = () => {
        if (!expandedCompany) return;

        const newTrade: ActiveTrade = {
            id: Date.now(),
            companyId: expandedCompany,
            companyName: investors.find(inv =>
                inv.previousInvestments.some(inv => `${inv.companyName}-${inv._id}` === expandedCompany)
            )?.previousInvestments.find(inv => `${inv.companyName}-${inv._id}` === expandedCompany)?.companyName || 'Company',
            companyType,
            companyAge,
            revenueStatus,
            description,
            startupUsername,
            sellingRangeMin,
            sellingRangeMax,
            videoUrl: videoUri,
            imageUrls: imageUris,
            views: 0,
            saves: 0,
            isEdited: false,
            isManualEntry,
            selectedIndustries,
        };

        setActiveTrades([...activeTrades, newTrade]);

        // Reset form
        setExpandedCompany(null);
        setSellingRangeMin(10);
        setSellingRangeMax(40);
        setCompanyAge('');
        setRevenueStatus('pre-revenue');
        setDescription('');
        setStartupUsername('');
        setIsManualEntry(false);
        setSelectedIndustries([]);
        setVideoUri('');
        setImageUris([]);
        setExternalLinkHeading('');
        setExternalLinkUrl('');
    };

    const handleDeleteTrade = (tradeId: number) => {
        setActiveTrades(activeTrades.filter(trade => trade.id !== tradeId));
    };

    const handleUpdateTrade = (tradeId: number) => {
        const trade = activeTrades.find(t => t.id === tradeId);
        if (trade) {
            setExpandedCompany(trade.companyId);
            setSellingRangeMin(trade.sellingRangeMin);
            setSellingRangeMax(trade.sellingRangeMax);
            setCompanyAge(trade.companyAge);
            setRevenueStatus(trade.revenueStatus);
            setDescription(trade.description);
            setStartupUsername(trade.startupUsername);
            setIsManualEntry(trade.isManualEntry);
            setVideoUri(trade.videoUrl || '');
            setImageUris(trade.imageUrls);
            setSelectedIndustries(trade.selectedIndustries);
            handleDeleteTrade(tradeId);
        }
    };

    const handleCategoryClick = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const toggleSaveItem = (itemId: number) => {
        setSavedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const renderInvestorPortfolios = () => {
        if (investorsLoading) {
            return (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color="#1a73e8" />
                </View>
            );
        }

        // Flatten all investments from all investors into a single list
        const allInvestments: Array<Investment & { investorId: string; investorName: string }> = [];
        investors.forEach(investor => {
            if (investor.previousInvestments && investor.previousInvestments.length > 0) {
                investor.previousInvestments.forEach(investment => {
                    allInvestments.push({
                        ...investment,
                        investorId: investor._id,
                        investorName: investor.user?.displayName || investor.user?.username || 'Investor'
                    });
                });
            }
        });

        if (allInvestments.length === 0) {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>No Portfolios Available</Text>
                    <Text style={styles.emptyText}>
                        No investors have listed their portfolios yet
                    </Text>
                </View>
            );
        }

        // Calculate years ago for each investment
        const getYearsAgo = (date?: Date) => {
            if (!date) return '';
            const now = new Date();
            const investmentDate = new Date(date);
            const diffMs = now.getTime() - investmentDate.getTime();
            const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
            return `${years.toFixed(1)} years`;
        };

        return (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: BOTTOM_NAV_HEIGHT + 24 }}>
                <Text style={styles.portfolioHeader}>Portfolio</Text>
                {allInvestments.map((item, index) => {
                    const cardKey = `${item.companyName}-${item.investorId}`;
                    const isExpanded = expandedPortfolios.has(cardKey);
                    const yearsText = getYearsAgo(item.date);

                    return (
                        <View key={index} style={styles.portfolioCard}>
                            <TouchableOpacity
                                style={styles.portfolioCardHeader}
                                onPress={() => {
                                    togglePortfolio(cardKey);
                                    setExpandedCompany(isExpanded ? null : cardKey);
                                }}
                            >
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={styles.portfolioCompanyName}>
                                            {item.companyName}
                                        </Text>
                                        {yearsText ? (
                                            <View style={styles.yearsBadge}>
                                                <Text style={styles.yearsBadgeText}>{yearsText}</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                </View>
                                <MaterialCommunityIcons
                                    name={isExpanded ? "chevron-up" : "chevron-down"}
                                    size={24}
                                    color="#bfbfbf"
                                />
                            </TouchableOpacity>

                            {isExpanded && expandedCompany === cardKey && (
                                <View style={styles.portfolioExpanded}>
                                    {/* Selling Range */}
                                    <Text style={styles.formLabel}>Selling Range (%)</Text>
                                    <View style={styles.rangeRow}>
                                        <TextInput
                                            style={styles.rangeInput}
                                            placeholder="10"
                                            placeholderTextColor="#666"
                                            keyboardType="numeric"
                                            value={String(sellingRangeMin)}
                                            onChangeText={(text) => setSellingRangeMin(parseFloat(text) || 0)}
                                        />
                                        <Text style={styles.rangeToText}>to</Text>
                                        <TextInput
                                            style={styles.rangeInput}
                                            placeholder="40"
                                            placeholderTextColor="#666"
                                            keyboardType="numeric"
                                            value={String(sellingRangeMax)}
                                            onChangeText={(text) => setSellingRangeMax(parseFloat(text) || 0)}
                                        />
                                    </View>

                                    {/* Startup Details */}
                                    <Text style={styles.formLabel}>Startup Details</Text>
                                    <View style={styles.toggleRow}>
                                        <TouchableOpacity
                                            style={[styles.toggleButton, !isManualEntry && styles.toggleButtonActive]}
                                            onPress={() => setIsManualEntry(false)}
                                        >
                                            <Text style={!isManualEntry ? styles.toggleTextActive : styles.toggleText}>
                                                Auto Entry
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.toggleButton, isManualEntry && styles.toggleButtonActive]}
                                            onPress={() => setIsManualEntry(true)}
                                        >
                                            <Text style={isManualEntry ? styles.toggleTextActive : styles.toggleText}>
                                                Manual Entry
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    {!isManualEntry ? (
                                        // AUTO ENTRY
                                        <View>
                                            <TextInput
                                                style={styles.usernameInput}
                                                placeholder="@username"
                                                placeholderTextColor="#666"
                                                value={startupUsername}
                                                onChangeText={setStartupUsername}
                                            />

                                            <Text style={styles.formLabel}>Add external link</Text>
                                            <View style={styles.linkRow}>
                                                <TextInput
                                                    style={[styles.linkInput, { flex: 1, marginRight: 8 }]}
                                                    placeholder="Heading"
                                                    placeholderTextColor="#666"
                                                    value={externalLinkHeading}
                                                    onChangeText={setExternalLinkHeading}
                                                />
                                                <TextInput
                                                    style={[styles.linkInput, { flex: 1 }]}
                                                    placeholder="Link"
                                                    placeholderTextColor="#666"
                                                    value={externalLinkUrl}
                                                    onChangeText={setExternalLinkUrl}
                                                />
                                            </View>
                                        </View>
                                    ) : (
                                        // MANUAL ENTRY
                                        <View>
                                            <TextInput
                                                style={styles.usernameInput}
                                                placeholder="@username (optional)"
                                                placeholderTextColor="#666"
                                                value={startupUsername}
                                                onChangeText={setStartupUsername}
                                            />

                                            <Text style={styles.formLabel}>Add external link</Text>
                                            <View style={styles.linkRow}>
                                                <TextInput
                                                    style={[styles.linkInput, { flex: 1, marginRight: 8 }]}
                                                    placeholder="Heading"
                                                    placeholderTextColor="#666"
                                                    value={externalLinkHeading}
                                                    onChangeText={setExternalLinkHeading}
                                                />
                                                <TextInput
                                                    style={[styles.linkInput, { flex: 1 }]}
                                                    placeholder="Link"
                                                    placeholderTextColor="#666"
                                                    value={externalLinkUrl}
                                                    onChangeText={setExternalLinkUrl}
                                                />
                                            </View>

                                            {/* Segment Tags */}
                                            <Text style={styles.formLabel}>Segment (max 3)</Text>
                                            <ScrollView
                                                horizontal
                                                showsHorizontalScrollIndicator={false}
                                                style={styles.tagsScroll}
                                                contentContainerStyle={styles.tagsContent}
                                            >
                                                {industryTags.map(tag => (
                                                    <TouchableOpacity
                                                        key={tag}
                                                        onPress={() => toggleIndustry(tag)}
                                                        disabled={!selectedIndustries.includes(tag) && selectedIndustries.length >= 3}
                                                        style={[
                                                            styles.tagChip,
                                                            selectedIndustries.includes(tag) && styles.tagChipActive
                                                        ]}
                                                    >
                                                        <Text style={[
                                                            styles.tagChipText,
                                                            selectedIndustries.includes(tag) && styles.tagChipTextActive
                                                        ]}>
                                                            {tag}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>

                                            {/* Description */}
                                            <Text style={styles.formLabel}>Description</Text>
                                            <TextInput
                                                style={styles.descriptionInput}
                                                placeholder="Description..."
                                                placeholderTextColor="#666"
                                                multiline
                                                numberOfLines={3}
                                                value={description}
                                                onChangeText={setDescription}
                                            />

                                            {/* Revenue Status */}
                                            <View style={styles.toggleRow}>
                                                <TouchableOpacity
                                                    style={[styles.toggleButton, revenueStatus === 'revenue-generating' && styles.toggleButtonActive]}
                                                    onPress={() => setRevenueStatus('revenue-generating')}
                                                >
                                                    <Text style={revenueStatus === 'revenue-generating' ? styles.toggleTextActive : styles.toggleText}>
                                                        Revenue Generating
                                                    </Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.toggleButton, revenueStatus === 'pre-revenue' && styles.toggleButtonActive]}
                                                    onPress={() => setRevenueStatus('pre-revenue')}
                                                >
                                                    <Text style={revenueStatus === 'pre-revenue' ? styles.toggleTextActive : styles.toggleText}>
                                                        Pre Revenue
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>

                                            {/* Video Upload */}
                                            <TouchableOpacity style={styles.uploadButton} onPress={handleVideoUpload}>
                                                <MaterialCommunityIcons name="video" size={16} color="#fff" />
                                                <Text style={styles.uploadButtonText}>
                                                    {videoUri ? 'Video Selected' : 'Upload Video'}
                                                </Text>
                                            </TouchableOpacity>

                                            {/* Image Upload */}
                                            <TouchableOpacity style={styles.uploadButton} onPress={handleImageUpload}>
                                                <MaterialCommunityIcons name="image" size={16} color="#fff" />
                                                <Text style={styles.uploadButtonText}>Upload Images</Text>
                                            </TouchableOpacity>

                                            {imageUris.length > 0 && (
                                                <View style={styles.imagePreviewContainer}>
                                                    {imageUris.map((uri, idx) => (
                                                        <View key={idx} style={styles.imagePreview}>
                                                            <RNImage source={{ uri }} style={styles.previewImage} />
                                                            <TouchableOpacity
                                                                style={styles.removeImageButton}
                                                                onPress={() => removeImage(idx)}
                                                            >
                                                                <MaterialCommunityIcons name="close" size={16} color="#fff" />
                                                            </TouchableOpacity>
                                                        </View>
                                                    ))}
                                                </View>
                                            )}
                                        </View>
                                    )}

                                    <TouchableOpacity
                                        style={styles.openTradeButton}
                                        onPress={handleOpenTrade}
                                    >
                                        <Text style={styles.openTradeButtonText}>Open Trade</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    );
                })}

                {/* Active Trades Section */}
                {activeTrades.length > 0 && (
                    <View style={{ marginTop: 24 }}>
                        <Text style={styles.portfolioHeader}>Active Trades</Text>
                        {activeTrades.map((trade) => {
                            const isExpanded = expandedTradeId === trade.id;
                            const photoIndex = currentPhotoIndex[trade.id] || 0;

                            return (
                                <View key={trade.id} style={styles.tradeCard}>
                                    <TouchableOpacity
                                        style={styles.tradeCardHeader}
                                        onPress={() => setExpandedTradeId(isExpanded ? null : trade.id)}
                                    >
                                        <View style={styles.tradeAvatar}>
                                            <Text style={styles.tradeAvatarText}>
                                                {trade.companyName[0]}
                                            </Text>
                                        </View>

                                        <View style={{ flex: 1 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                <Text style={styles.tradeCompanyName}>{trade.companyName}</Text>
                                                <View style={styles.tradeBadge}>
                                                    <Text style={styles.tradeBadgeText}>Trade</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.tradeUsername}>@{trade.startupUsername}</Text>
                                            {!isExpanded && (
                                                <Text style={styles.tradeMetaText}>
                                                    {trade.revenueStatus === 'revenue-generating' ? 'Revenue Generating' : 'Pre Revenue'} • {trade.sellingRangeMin}% - {trade.sellingRangeMax}%
                                                </Text>
                                            )}
                                        </View>

                                        <View style={{ flexDirection: 'row', gap: 8 }}>
                                            <TouchableOpacity
                                                style={styles.tradeActionButton}
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    handleUpdateTrade(trade.id);
                                                }}
                                            >
                                                <MaterialCommunityIcons name="pencil" size={16} color="#999" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.tradeActionButton}
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteTrade(trade.id);
                                                }}
                                            >
                                                <MaterialCommunityIcons name="delete" size={16} color="#ff4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </TouchableOpacity>

                                    {isExpanded && (
                                        <View style={styles.tradeExpandedContent}>
                                            {trade.description && (
                                                <Text style={styles.tradeDescription}>"{trade.description}"</Text>
                                            )}

                                            {/* Media */}
                                            {(trade.videoUrl || trade.imageUrls.length > 0) && (
                                                <View style={styles.tradeMediaContainer}>
                                                    {trade.videoUrl ? (
                                                        <View style={styles.tradeMedia}>
                                                            <Text style={{ color: '#fff', textAlign: 'center' }}>Video Player</Text>
                                                        </View>
                                                    ) : (
                                                        <View style={styles.tradeMedia}>
                                                            <RNImage
                                                                source={{ uri: trade.imageUrls[photoIndex] }}
                                                                style={{ width: '100%', height: '100%' }}
                                                                resizeMode="cover"
                                                            />
                                                        </View>
                                                    )}
                                                </View>
                                            )}

                                            {/* Stats Grid */}
                                            <View style={styles.statsGrid}>
                                                <View style={styles.statCard}>
                                                    <Text style={styles.statLabel}>Revenue Status</Text>
                                                    <Text style={styles.statValue}>
                                                        {trade.revenueStatus === 'revenue-generating' ? 'Revenue Generating' : 'Pre Revenue'}
                                                    </Text>
                                                </View>
                                                <View style={styles.statCard}>
                                                    <Text style={styles.statLabel}>Company Age</Text>
                                                    <Text style={styles.statValue}>{trade.companyAge || 'N/A'}</Text>
                                                </View>
                                                <View style={[styles.statCard, { gridColumn: 'span 2' }]}>
                                                    <Text style={[styles.statLabel, { color: '#1a73e8' }]}>Selling Range</Text>
                                                    <Text style={[styles.statValue, { color: '#1a73e8' }]}>
                                                        {trade.sellingRangeMin}% - {trade.sellingRangeMax}%
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Views & Saves */}
                                            <View style={styles.tradeStats}>
                                                <Text style={styles.tradeStatText}>Views: {trade.views}</Text>
                                                <Text style={styles.tradeStatText}>Saves: {trade.saves}</Text>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>
        );
    };

    const renderMarketsList = () => {
        if (loading) {
            return (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color="#1a73e8" />
                </View>
            );
        }

        if (error) {
            return (
                <View style={{ padding: 20 }}>
                    <Text style={{ color: '#fff' }}>Error: {error}</Text>
                </View>
            );
        }

        return (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: BOTTOM_NAV_HEIGHT + 24 }}>
                {/* Category Filters - Only show when filter is open */}
                {isFilterOpen && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.categoriesScroll}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
                    >
                        {categories.map(category => (
                            <TouchableOpacity
                                key={category}
                                onPress={() => handleCategoryClick(category)}
                                style={[
                                    styles.categoryChip,
                                    selectedCategories.includes(category) && styles.categoryChipActive
                                ]}
                            >
                                <Text style={[
                                    styles.categoryChipText,
                                    selectedCategories.includes(category) && styles.categoryChipTextActive
                                ]}>
                                    {category}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                {/* Market Cards */}
                {markets.map((item, index) => (
                    <View key={index} style={styles.card}>
                        <View style={styles.avatarWrap}>
                            <View style={styles.avatarCircle} />
                        </View>
                        <View style={styles.cardBody}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.companyName}>{item.title || item.name}</Text>
                                <TouchableOpacity
                                    style={styles.iconBtn}
                                    onPress={() => toggleSaveItem(item._id || item.id)}
                                >
                                    <MaterialCommunityIcons
                                        name={savedItems.includes(item._id || item.id) ? "bookmark" : "bookmark-outline"}
                                        size={18}
                                        color={savedItems.includes(item._id || item.id) ? "#1a73e8" : "#bfbfbf"}
                                    />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.personName}>{item.owner || item.person || ''}</Text>
                            <Text style={styles.tagline}>{item.description || item.tagline || ''}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Fixed header */}
            <View style={styles.headerContainer}>
                {/* Swipeable tabs with underline indicator */}
                <View style={styles.tabsRow}>
                    <TouchableOpacity
                        style={styles.tabItem}
                        onPress={() => {
                            setActiveTab('buy');
                            pagerRef.current?.scrollTo({ x: 0, animated: true });
                        }}
                    >
                        <Text style={[styles.tabText, activeTab === 'buy' && styles.tabTextActive]}>
                            BUY
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.tabItem}
                        onPress={() => {
                            setActiveTab('sell');
                            pagerRef.current?.scrollTo({ x: screenW, animated: true });
                        }}
                    >
                        <Text style={[styles.tabText, activeTab === 'sell' && styles.tabTextActive]}>
                            SELL
                        </Text>
                    </TouchableOpacity>

                    {/* Animated underline indicator */}
                    <Animated.View
                        style={[
                            styles.tabIndicator,
                            {
                                width: screenW / 2,
                                transform: [{
                                    translateX: scrollX.interpolate({
                                        inputRange: [0, screenW],
                                        outputRange: [0, screenW / 2]
                                    })
                                }]
                            }
                        ]}
                    />
                </View>

                {/* Show search/filters only on Buy tab */}
                {activeTab === 'buy' && (
                    <>
                        <View style={styles.searchRow}>
                            <View style={styles.searchBox}>
                                <MaterialCommunityIcons name="magnify" size={18} color="#bfbfbf" />
                                <TextInput
                                    placeholder="Search companies..."
                                    placeholderTextColor="#bfbfbf"
                                    style={styles.searchInput}
                                    value={searchValue}
                                    onChangeText={setSearchValue}
                                />
                                {searchValue !== '' && (
                                    <TouchableOpacity onPress={() => setSearchValue('')}>
                                        <MaterialCommunityIcons name="close" size={18} color="#bfbfbf" />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <TouchableOpacity
                                style={[styles.bookmarkBtn, showSavedOnly && styles.bookmarkBtnActive]}
                                onPress={() => setShowSavedOnly(!showSavedOnly)}
                            >
                                <MaterialCommunityIcons
                                    name={showSavedOnly ? "bookmark" : "bookmark-outline"}
                                    size={20}
                                    color={showSavedOnly ? "#fff" : "#bfbfbf"}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Filter Button */}
                        <TouchableOpacity
                            style={styles.filterButton}
                            onPress={() => setIsFilterOpen(!isFilterOpen)}
                        >
                            <MaterialCommunityIcons name="tune" size={18} color="#fff" />
                            <Text style={styles.filterButtonText}>Filters</Text>
                            <MaterialCommunityIcons
                                name={isFilterOpen ? "chevron-up" : "chevron-down"}
                                size={20}
                                color="#bfbfbf"
                            />
                        </TouchableOpacity>
                    </>
                )}
            </View>

            {/* Swipeable content */}
            <Animated.ScrollView
                horizontal
                pagingEnabled
                ref={r => (pagerRef.current = r)}
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                    const idx = Math.round(e.nativeEvent.contentOffset.x / screenW);
                    setActiveTab(idx === 0 ? 'buy' : 'sell');
                }}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
                style={{ flex: 1 }}
            >
                {/* Buy tab content */}
                <View style={[styles.pagerPage, { width: screenW }]}>
                    {renderMarketsList()}
                </View>

                {/* Sell tab content - Investor Portfolios */}
                <View style={[styles.pagerPage, { width: screenW }]}>
                    {renderInvestorPortfolios()}
                </View>
            </Animated.ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#070707' },
    headerContainer: { paddingHorizontal: 12, paddingTop: 12 },
    tabsRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
        position: 'relative',
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
    },
    tabText: {
        color: '#999',
        fontSize: 14,
    },
    tabTextActive: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    tabIndicator: {
        position: 'absolute',
        bottom: 0,
        height: 3,
        backgroundColor: '#fff',
    },
    searchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
    searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f0f0f', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 24, gap: 8 },
    searchInput: { flex: 1, color: '#fff' },
    bookmarkBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f0f0f' },
    bookmarkBtnActive: { backgroundColor: '#1a73e8' },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f0f0f',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginTop: 12,
        gap: 8,
    },
    filterButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    pagerPage: { flex: 1 },

    // Portfolio styles
    portfolioHeader: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    portfolioCard: {
        backgroundColor: '#0f0f0f',
        marginHorizontal: 16,
        marginVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
        overflow: 'hidden',
    },
    portfolioCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    portfolioCompanyName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    yearsBadge: {
        backgroundColor: '#2a2a2a',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 12,
    },
    yearsBadgeText: {
        color: '#999',
        fontSize: 12,
        fontWeight: '500',
    },
    portfolioExpanded: {
        borderTopWidth: 1,
        borderTopColor: '#222',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    formLabel: {
        color: '#999',
        fontSize: 13,
        marginBottom: 8,
        marginTop: 12,
    },
    rangeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 12,
    },
    rangeInput: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        color: '#fff',
        fontSize: 14,
    },
    rangeToText: {
        color: '#666',
        fontSize: 14,
    },
    toggleRow: {
        flexDirection: 'row',
        marginBottom: 12,
        gap: 8,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#333',
    },
    toggleButtonActive: {
        backgroundColor: '#2a2a2a',
        borderColor: '#444',
    },
    toggleText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '500',
    },
    toggleTextActive: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    usernameInput: {
        backgroundColor: '#0a0a0a',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        color: '#fff',
        fontSize: 14,
        marginBottom: 8,
    },
    linkRow: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 8,
    },
    linkInput: {
        backgroundColor: '#0a0a0a',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        color: '#fff',
        fontSize: 14,
    },
    tagsScroll: {
        maxHeight: 80,
        marginBottom: 12,
    },
    tagsContent: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tagChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#1a1a1a',
        marginRight: 8,
        marginBottom: 8,
    },
    tagChipActive: {
        backgroundColor: '#fff',
    },
    tagChipText: {
        color: '#999',
        fontSize: 12,
    },
    tagChipTextActive: {
        color: '#000',
        fontWeight: '600',
    },
    descriptionInput: {
        backgroundColor: '#0a0a0a',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        color: '#fff',
        fontSize: 14,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2a2a2a',
        borderRadius: 8,
        paddingVertical: 12,
        marginTop: 8,
        gap: 8,
    },
    uploadButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    imagePreviewContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    imagePreview: {
        width: 64,
        height: 64,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    removeImageButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 12,
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    openTradeButton: {
        backgroundColor: '#3a3a3a',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 16,
    },
    openTradeButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },

    // Active Trades styles
    tradeCard: {
        backgroundColor: '#0f0f0f',
        marginHorizontal: 16,
        marginVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
        padding: 16,
    },
    tradeCardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    tradeAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#2a2a2a',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tradeAvatarText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    tradeCompanyName: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    tradeBadge: {
        backgroundColor: '#2a2a2a',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    tradeBadgeText: {
        color: '#999',
        fontSize: 10,
    },
    tradeUsername: {
        color: '#999',
        fontSize: 12,
        marginTop: 2,
    },
    tradeMetaText: {
        color: '#666',
        fontSize: 11,
        marginTop: 4,
    },
    tradeActionButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#1a1a1a',
    },
    tradeExpandedContent: {
        marginTop: 16,
        gap: 12,
    },
    tradeDescription: {
        color: '#ccc',
        fontSize: 13,
        lineHeight: 18,
    },
    tradeMediaContainer: {
        marginHorizontal: -16,
    },
    tradeMedia: {
        aspectRatio: 16 / 9,
        backgroundColor: '#1a1a1a',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    statCard: {
        flex: 1,
        minWidth: '48%',
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#2a2a2a',
    },
    statLabel: {
        color: '#999',
        fontSize: 11,
        marginBottom: 4,
    },
    statValue: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    tradeStats: {
        flexDirection: 'row',
        gap: 16,
    },
    tradeStatText: {
        color: '#999',
        fontSize: 12,
    },

    // Buy tab styles
    categoriesScroll: {
        // No height restriction - let it wrap naturally
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#1a1a1a',
        marginRight: 8,
    },
    categoryChipActive: {
        backgroundColor: '#1a73e8',
    },
    categoryChipText: {
        color: '#999',
        fontSize: 13,
    },
    categoryChipTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    cardsList: { flex: 1 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f0f0f', marginVertical: 8, marginHorizontal: 12, padding: 12, borderRadius: 18, borderWidth: 1, borderColor: '#333333' },
    avatarWrap: { marginRight: 12 },
    avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#222' },
    cardBody: { flex: 1 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    companyName: { color: '#fff', fontWeight: '700' },
    personName: { color: '#bfbfbf', fontSize: 12, marginTop: 4 },
    tagline: { color: '#bfbfbf', fontSize: 12, marginTop: 6 },
    iconBtn: { padding: 6 },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    emptyTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    emptyText: {
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
    },
});

export default Trading;
