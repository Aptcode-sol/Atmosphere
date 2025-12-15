import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, SafeAreaView, ActivityIndicator, Dimensions, Animated, ScrollView, Image as RNImage, Alert, FlatList, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createTrade, getMyTrades, getAllTrades, updateTrade, deleteTrade, fetchInvestors } from '../lib/api';
import { BOTTOM_NAV_HEIGHT } from '../lib/layout';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';

// Import modular files
import { categories, Investment, InvestorPortfolio } from './Trading/types';
import { styles } from './Trading/styles';
import { TradingForm } from './Trading/components/TradingForm';
import { TradeCard } from './Trading/components/TradeCard';
// import { FilterBar } from './Trading/components/FilterBar';
// import { getYearsAgo } from './Trading/utils';

const { width: screenW } = Dimensions.get('window');

// Constants and types now imported from Trading/types.ts

// Investment and InvestorPortfolio interfaces now imported from Trading/types.ts

interface ActiveTrade {
    _id?: string;
    id?: number;
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
    externalLinkHeading?: string;
    externalLinkUrl?: string;
}

const Trading = () => {
    // Data State
    const [refreshing, setRefreshing] = useState(false);

    // UI State
    const [activeTab, setActiveTab] = useState<'Data' | 'Buy' | 'Sell' | 'Leaderboard'>('Data');
    const [searchValue, setSearchValue] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    // Buy/Sell specific states
    const [buyTrades, setBuyTrades] = useState<any[]>([]);
    const [buyLoading, setBuyLoading] = useState(false);
    const [investors, setInvestors] = useState<InvestorPortfolio[]>([]);
    const [investorsLoading, setInvestorsLoading] = useState<boolean>(true);
    const [expandedPortfolios, setExpandedPortfolios] = useState<Set<string>>(new Set());
    const pagerRef = useRef<any>(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    // Memoized style objects to avoid inline styles in JSX (reduces eslint warnings)
    const centeredLoaderStyle = useMemo(() => ({ flex: 1, alignItems: 'center', justifyContent: 'center' }), []);
    const flexOneStyle = useMemo(() => ({ flex: 1 }), []);
    const rowCenterStyle = useMemo(() => ({ flexDirection: 'row', alignItems: 'center' }), []);
    const rowCenterGap8 = useMemo(() => ({ flexDirection: 'row', alignItems: 'center', gap: 8 }), []);
    const rightButtonsRow = useMemo(() => ({ flexDirection: 'row', gap: 8 }), []);
    const previewImageFull = useMemo(() => ({ width: '100%', height: '100%' }), []);
    const fullWidthCard = useMemo(() => ({ width: '100%' }), []);
    const statLabelBlue = useMemo(() => ({ color: '#1a73e8' }), []);
    const statValueBlue = useMemo(() => ({ color: '#1a73e8' }), []);
    const footerLoaderStyle = useMemo(() => ({ margin: 20 }), []);
    const videoPlayerTextStyle = useMemo(() => ({ color: '#fff', textAlign: 'center' }), []);
    const activeTradesTopStyle = useMemo(() => ({ marginTop: 24 }), []);
    const pagerPageWidth = useMemo(() => ({ width: screenW }), []);
    const animatedIndicatorStyle = useMemo(() => ([
        styles.tabIndicator,
        {
            width: screenW / 2,
            transform: [{
                translateX: scrollX.interpolate({ inputRange: [0, screenW], outputRange: [0, screenW / 2] })
            }]
        }
    ]), [scrollX]);

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
    const [selectedCompanyName, setSelectedCompanyName] = useState<string>('');
    const [selectedCompanyAge, setSelectedCompanyAge] = useState<string>('');
    const [editingTradeId, setEditingTradeId] = useState<string | null>(null);

    // Active trades
    const [activeTrades, setActiveTrades] = useState<ActiveTrade[]>([]);
    const [expandedTradeId, setExpandedTradeId] = useState<string | number | null>(null);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState<{ [key: string]: number }>({});

    // BUY tab state
    const [showSavedOnly, setShowSavedOnly] = useState(false);
    const [savedItems, setSavedItems] = useState<string[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // BUY TAB Pagination State
    const [buySkip, setBuySkip] = useState(0);
    const [buyHasMore, setBuyHasMore] = useState(true);

    const [buyInitialLoadDone, setBuyInitialLoadDone] = useState(false);
    const [expandedBuyTradeId, setExpandedBuyTradeId] = useState<string | number | null>(null);

    const BUY_LIMIT = 20;

    // Fetch Buy Trades
    const fetchBuyTrades = React.useCallback(async (reset = false) => {
        if (reset) {
            setBuyLoading(true);
            setBuySkip(0);
            // Clear existing data to avoid showing stale cache while loading
            setBuyTrades([]);
        }

        const currentSkip = reset ? 0 : buySkip;

        try {
            const filters: any = {};
            if (searchValue) filters.q = searchValue;
            if (selectedCategories.length > 0) filters.industries = selectedCategories.join(',');

            const data = await getAllTrades(BUY_LIMIT, currentSkip, filters);

            if (reset) {
                setBuyTrades(data);
                // Update Cache only on fresh load 
                AsyncStorage.setItem('ATMOSPHERE_TRADES_BUY_CACHE', JSON.stringify(data)).catch(() => { });
            } else {
                setBuyTrades(prev => [...prev, ...data]);
            }

            setBuyHasMore(data.length >= BUY_LIMIT);
            setBuySkip(currentSkip + BUY_LIMIT);
        } catch (e) {
            console.warn('Failed to load buy trades', e);
        } finally {
            setBuyLoading(false);
        }
    }, [buySkip, searchValue, selectedCategories]);

    // Refresh Logic (Merged)
    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        try {
            if (activeTab === 'Buy') {
                await fetchBuyTrades(true);
            } else {
                // Refresh Sell Tab components
                await Promise.all([
                    getMyTrades().then(t => setActiveTrades(t)).catch(console.warn),
                    fetchInvestors().then(i => setInvestors(i)).catch(console.warn)
                ]);
            }
        } catch (e) {
            console.warn('Refresh error', e);
        } finally {
            setRefreshing(false);
        }
    }, [activeTab, fetchBuyTrades]);



    // ... existing load active trades logic ...

    // BUY TAB: Signal initial load done to trigger fetch
    useEffect(() => {
        setBuyInitialLoadDone(true);
    }, []);

    // Fetch Investors (Sell Tab)
    useEffect(() => {
        let mounted = true;
        const loadInvestors = async () => {
            try {
                const data = await fetchInvestors();
                if (mounted) {
                    setInvestors(data);
                }
            } catch (e) {
                console.warn('Failed to load investors', e);
            } finally {
                if (mounted) setInvestorsLoading(false);
            }
        };
        loadInvestors();
        return () => { mounted = false; };
    }, []);

    // Fetch My Active Trades (Sell Tab)
    useEffect(() => {
        let mounted = true;
        const loadMyTrades = async () => {
            try {
                const trades = await getMyTrades();
                if (mounted) {
                    setActiveTrades(trades);
                }
            } catch (e) {
                console.warn('Failed to load my trades', e);
            }
        };
        loadMyTrades();
        return () => { mounted = false; };
    }, []);



    // Trigger fetch on initial load or filter change
    useEffect(() => {
        if (!buyInitialLoadDone) return;
        // Prevent fetching if already loading
        if (buyLoading) return;

        // Debounce only if searching
        if (searchValue) {
            const timer = setTimeout(() => {
                fetchBuyTrades(true);
            }, 500);
            return () => clearTimeout(timer);
        } else {
            fetchBuyTrades(true);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [buyInitialLoadDone, searchValue, selectedCategories]);

    const handleLoadMoreBuy = () => {
        if (!buyHasMore || buyLoading) return;
        fetchBuyTrades(false);
    };

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

    const handleOpenTrade = async () => {
        if (!expandedCompany) return;

        // Use the company name and age that were stored when the portfolio card was expanded
        const finalCompanyName = selectedCompanyName || 'Company';
        const finalCompanyAge = selectedCompanyAge || companyAge || '';

        const tradeData = {
            companyId: expandedCompany,
            companyName: finalCompanyName,
            companyType,
            companyAge: finalCompanyAge,
            revenueStatus,
            description,
            startupUsername,
            sellingRangeMin,
            sellingRangeMax,
            selectedIndustries,
            isManualEntry,
            externalLinkHeading,
            externalLinkUrl,
            // Note: videoUrl and imageUrls are excluded for now (future implementation)
        };

        try {
            if (editingTradeId) {
                const response = await updateTrade(editingTradeId, tradeData);
                if (response && response.trade) {
                    setActiveTrades(activeTrades.map(t => t._id === editingTradeId ? response.trade : t));
                }
                Alert.alert('Success', 'Trade updated successfully!');
            } else {
                const response = await createTrade(tradeData);
                if (response && response.trade) {
                    setActiveTrades([...activeTrades, response.trade]);
                }
                Alert.alert('Success', 'Trade opened successfully!');
            }

            // Reset form
            setEditingTradeId(null);
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
            setSelectedCompanyName('');
            setSelectedCompanyAge('');
        } catch (error: any) {
            console.error('Failed to save trade:', error);
            Alert.alert('Error', error.message || 'Failed to save trade');
        }
    };

    const handleDeleteTrade = async (tradeId: any) => {
        try {
            await deleteTrade(tradeId);
            setActiveTrades(activeTrades.filter(trade => trade._id !== tradeId));
            Alert.alert('Success', 'Trade deleted successfully!');
        } catch (error: any) {
            console.error('Failed to delete trade:', error);
            Alert.alert('Error', error.message || 'Failed to delete trade');
        }
    };

    const handleUpdateTrade = (tradeId: any) => {
        const trade = activeTrades.find(t => t._id === tradeId);
        if (trade) {
            // Populate form
            setEditingTradeId(tradeId);
            setExpandedCompany(trade.companyId); // Required for handleOpenTrade logic
            setExpandedTradeId(tradeId); // Expand the active trade card to show form

            setSelectedCompanyName(trade.companyName);
            setSellingRangeMin(trade.sellingRangeMin);
            setSellingRangeMax(trade.sellingRangeMax);
            setCompanyAge(trade.companyAge);
            setRevenueStatus(trade.revenueStatus);
            setDescription(trade.description);
            setStartupUsername(trade.startupUsername);
            setIsManualEntry(trade.isManualEntry);
            setVideoUri(trade.videoUrl || '');
            setImageUris(trade.imageUrls || []);
            setSelectedIndustries(trade.selectedIndustries);
            setExternalLinkHeading(trade.externalLinkHeading || '');
            setExternalLinkUrl(trade.externalLinkUrl || '');
        }
    };

    const handleCategoryClick = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const toggleSaveItem = (itemId: string) => {
        setSavedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const renderInvestorPortfolios = () => {
        if (investorsLoading) {
            return (
                <View style={centeredLoaderStyle}>
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
        const getYearsAgo = (date?: Date | string) => {
            if (!date) return '';
            const now = new Date();
            const investmentDate = new Date(date);
            const diffMs = now.getTime() - investmentDate.getTime();
            const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
            return `${years.toFixed(1)} years`;
        };

        return (
            <ScrollView
                style={flexOneStyle}
                contentContainerStyle={{ paddingBottom: BOTTOM_NAV_HEIGHT + 24 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#1a73e8"
                        title="Release to refresh"
                        titleColor="#888"
                    />
                }
            >
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
                                    if (isExpanded) {
                                        setExpandedCompany(null);
                                        setSelectedCompanyName('');
                                        setSelectedCompanyAge('');
                                    } else {
                                        setExpandedCompany(cardKey);
                                        setSelectedCompanyName(item.companyName);
                                        setSelectedCompanyAge(yearsText);
                                    }
                                }}
                            >
                                <View style={flexOneStyle}>
                                    <View style={rowCenterStyle}>
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
                                <TradingForm
                                    sellingRangeMin={sellingRangeMin}
                                    setSellingRangeMin={setSellingRangeMin}
                                    sellingRangeMax={sellingRangeMax}
                                    setSellingRangeMax={setSellingRangeMax}
                                    isManualEntry={isManualEntry}
                                    setIsManualEntry={setIsManualEntry}
                                    startupUsername={startupUsername}
                                    setStartupUsername={setStartupUsername}
                                    externalLinkHeading={externalLinkHeading}
                                    setExternalLinkHeading={setExternalLinkHeading}
                                    externalLinkUrl={externalLinkUrl}
                                    setExternalLinkUrl={setExternalLinkUrl}
                                    description={description}
                                    setDescription={setDescription}
                                    revenueStatus={revenueStatus}
                                    setRevenueStatus={setRevenueStatus}
                                    videoUri={videoUri}
                                    handleVideoUpload={handleVideoUpload}
                                    imageUris={imageUris}
                                    handleImageUpload={handleImageUpload}
                                    removeImage={removeImage}
                                    selectedIndustries={selectedIndustries}
                                    toggleIndustry={toggleIndustry}
                                    onSubmit={handleOpenTrade}
                                    submitText={editingTradeId ? "Update Trade" : "Open Trade"}
                                />
                            )}
                        </View>
                    );
                })}

                {/* Active Trades Section */}
                {activeTrades.length > 0 && (
                    <View style={activeTradesTopStyle}>
                        <Text style={styles.portfolioHeader}>Active Trades</Text>
                        {activeTrades.map((trade) => {
                            const tradeId = trade._id || trade.id;
                            if (!tradeId) return null;
                            const isExpanded = expandedTradeId === tradeId;
                            const photoIndex = currentPhotoIndex[tradeId] || 0;

                            return (
                                <View key={tradeId} style={styles.tradeCard}>
                                    <TouchableOpacity
                                        style={styles.tradeCardHeader}
                                        onPress={() => {
                                            setExpandedTradeId(isExpanded ? null : (tradeId as string | number));
                                            setEditingTradeId(null);
                                        }}
                                    >
                                        <View style={styles.tradeAvatar}>
                                            <Text style={styles.tradeAvatarText}>
                                                {trade.companyName[0]}
                                            </Text>
                                        </View>

                                        <View style={flexOneStyle}>
                                            <View style={rowCenterGap8}>
                                                <Text style={styles.tradeCompanyName}>{trade.companyName}</Text>
                                                <View style={styles.tradeBadge}>
                                                    <Text style={styles.tradeBadgeText}>Trade</Text>
                                                </View>
                                            </View>
                                            {!isExpanded && (
                                                <Text style={styles.tradeUsername} numberOfLines={1}>
                                                    {trade.description}
                                                </Text>
                                            )}
                                            {!isExpanded && (
                                                <Text style={styles.tradeMetaText}>
                                                    {trade.revenueStatus === 'revenue-generating' ? 'Revenue Generating' : 'Pre Revenue'} • {trade.sellingRangeMin}% - {trade.sellingRangeMax}%
                                                </Text>
                                            )}
                                        </View>

                                        <View style={rightButtonsRow}>
                                            <TouchableOpacity
                                                style={styles.tradeActionButton}
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    handleUpdateTrade(tradeId);
                                                }}
                                            >
                                                <MaterialCommunityIcons name="pencil" size={16} color="#999" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.tradeActionButton}
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteTrade(tradeId);
                                                }}
                                            >
                                                <MaterialCommunityIcons name="delete" size={16} color="#ff4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </TouchableOpacity>

                                    {isExpanded && (
                                        editingTradeId === tradeId ? (
                                            <TradingForm
                                                sellingRangeMin={sellingRangeMin}
                                                setSellingRangeMin={setSellingRangeMin}
                                                sellingRangeMax={sellingRangeMax}
                                                setSellingRangeMax={setSellingRangeMax}
                                                isManualEntry={isManualEntry}
                                                setIsManualEntry={setIsManualEntry}
                                                startupUsername={startupUsername}
                                                setStartupUsername={setStartupUsername}
                                                externalLinkHeading={externalLinkHeading}
                                                setExternalLinkHeading={setExternalLinkHeading}
                                                externalLinkUrl={externalLinkUrl}
                                                setExternalLinkUrl={setExternalLinkUrl}
                                                description={description}
                                                setDescription={setDescription}
                                                revenueStatus={revenueStatus}
                                                setRevenueStatus={setRevenueStatus}
                                                videoUri={videoUri}
                                                handleVideoUpload={handleVideoUpload}
                                                imageUris={imageUris}
                                                handleImageUpload={handleImageUpload}
                                                removeImage={removeImage}
                                                selectedIndustries={selectedIndustries}
                                                toggleIndustry={toggleIndustry}
                                                onSubmit={handleOpenTrade}
                                                submitText="Update Trade"
                                                noPadding
                                            />
                                        ) : (
                                            <View style={styles.tradeExpandedContent}>
                                                {trade.description && (
                                                    <Text style={styles.tradeDescription}>"{trade.description}"</Text>
                                                )}

                                                {/* Media */}
                                                {(trade.videoUrl || trade.imageUrls.length > 0) && (
                                                    <View style={styles.tradeMediaContainer}>
                                                        {trade.videoUrl ? (
                                                            <View style={styles.tradeMedia}>
                                                                <Text style={videoPlayerTextStyle}>Video Player</Text>
                                                            </View>
                                                        ) : (
                                                            <View style={styles.tradeMedia}>
                                                                <RNImage
                                                                    source={{ uri: trade.imageUrls[photoIndex] }}
                                                                    style={previewImageFull}
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
                                                    <View style={[styles.statCard, fullWidthCard]}>
                                                        <Text style={[styles.statLabel, statLabelBlue]}>Selling Range</Text>
                                                        <Text style={[styles.statValue, statValueBlue]}>
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
                                        )
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
        // We use buyTrades for data
        const data = buyTrades;

        const ListHeader = () => (
            <>
                {/* Category Filters - Only show when filter is open */}
                {isFilterOpen && (
                    <View style={styles.categoriesContainer}>
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
                    </View>
                )}
                {/* Suggested for you heading */}
                <Text style={styles.suggestedHeading}>Suggested for you</Text>
            </>
        );

        if (buyLoading && data.length === 0) {
            return (
                <View style={centeredLoaderStyle}>
                    <ActivityIndicator size="large" color="#1a73e8" />
                </View>
            );
        }

        return (
            <FlatList
                data={data}

                keyExtractor={(item, index) => `${String(item._id || item.id)}_${index}`}
                contentContainerStyle={{ paddingBottom: BOTTOM_NAV_HEIGHT + 24 }}
                renderItem={({ item }) => {
                    const tradeId = item._id || item.id;
                    if (!tradeId) return null;
                    const isExpanded = expandedBuyTradeId === tradeId;
                    const isSaved = savedItems.includes(String(tradeId));

                    return (
                        <TradeCard
                            trade={item}
                            isExpanded={isExpanded}
                            isSaved={isSaved}
                            currentPhotoIndex={currentPhotoIndex[String(tradeId)] || 0}
                            onToggleExpand={() => setExpandedBuyTradeId(isExpanded ? null : (tradeId as string | number))}
                            onToggleSave={() => toggleSaveItem(String(tradeId))}
                            onPhotoIndexChange={(index) => setCurrentPhotoIndex(prev => ({ ...prev, [tradeId]: index }))}
                        />
                    );
                }}
                ListHeaderComponent={ListHeader}
                onEndReached={handleLoadMoreBuy}
                onEndReachedThreshold={0.5}
                ListFooterComponent={() => buyLoading && data.length > 0 ? <ActivityIndicator size="small" color="#1a73e8" style={footerLoaderStyle} /> : null}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#1a73e8"
                        title="Release to refresh"
                        titleColor="#888"
                    />
                }
            />
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
                            setActiveTab('Buy');
                            pagerRef.current?.scrollTo({ x: 0, animated: true });
                        }}
                    >
                        <Text style={[styles.tabText, activeTab === 'Buy' && styles.tabTextActive]}>
                            BUY
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.tabItem}
                        onPress={() => {
                            setActiveTab('Sell');
                            pagerRef.current?.scrollTo({ x: screenW, animated: true });
                        }}
                    >
                        <Text style={[styles.tabText, activeTab === 'Sell' && styles.tabTextActive]}>
                            SELL
                        </Text>
                    </TouchableOpacity>

                    {/* Animated underline indicator */}
                    <Animated.View style={animatedIndicatorStyle} />
                </View>

                {/* Show search/filters only on Buy tab */}
                {activeTab === 'Buy' && (
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
                ref={r => { pagerRef.current = r; }}
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                    const idx = Math.round(e.nativeEvent.contentOffset.x / screenW);
                    setActiveTab(idx === 0 ? 'Buy' : 'Sell');
                }}
                onScroll={(e) => {
                    const x = e.nativeEvent.contentOffset.x;
                    // Update tab state during scrolling for smoother transitions
                    const newTab = x > screenW / 2 ? 'Sell' : 'Buy';
                    if (newTab !== activeTab) {
                        setActiveTab(newTab);
                    }
                    // Update animated value
                    scrollX.setValue(x);
                }}
                scrollEventThrottle={16}
                style={flexOneStyle}
            >
                {/* Buy tab content */}
                <View style={[styles.pagerPage, pagerPageWidth]}>
                    {renderMarketsList()}
                </View>

                {/* Sell tab content - Investor Portfolios */}
                <View style={[styles.pagerPage, pagerPageWidth]}>
                    {renderInvestorPortfolios()}
                </View>
            </Animated.ScrollView>
        </SafeAreaView>
    );
};

export default Trading;
