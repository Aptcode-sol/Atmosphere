import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, SafeAreaView, ActivityIndicator, Dimensions, Animated, ScrollView, Image as RNImage, FlatList, RefreshControl, LayoutAnimation, UIManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createTrade, getMyTrades, getAllTrades, updateTrade, deleteTrade, uploadImage, uploadVideo, getProfile, toggleTradeSave, getSavedTrades, createOrFindChat, sendMessage, shareContent, saveStartupProfile, searchUsers, getStartupProfile } from '../lib/api';
import { BOTTOM_NAV_HEIGHT } from '../lib/layout';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import Video from 'react-native-video';

// Import modular files
import { categories, Investment, InvestorPortfolio } from './Trading/types';
import { styles } from './Trading/styles';
import { TradingForm } from './Trading/components/TradingForm';
import { TradeCard } from './Trading/components/TradeCard';
import { useAlert } from '../components/CustomAlert';
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
    fundingTarget?: number;
}

interface TradingProps {
    initialTab?: 'Buy' | 'Sell';
    onTabChange?: () => void;
}

const Trading = ({ initialTab, onTabChange }: TradingProps) => {
    // Data State
    const [refreshing, setRefreshing] = useState(false);
    const { showAlert } = useAlert();

    // UI State
    const [activeTab, setActiveTab] = useState<'Data' | 'Buy' | 'Sell' | 'Leaderboard'>(initialTab || 'Buy');
    const [searchValue, setSearchValue] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [accountType, setAccountType] = useState<string>('personal'); // Track if user is investor

    // Buy/Sell specific states
    const [buyTrades, setBuyTrades] = useState<any[]>([]);
    const [buyLoading, setBuyLoading] = useState(false);
    const [investors, setInvestors] = useState<InvestorPortfolio[]>([]);
    const [investorsLoading, setInvestorsLoading] = useState<boolean>(true);
    const [expandedPortfolios, setExpandedPortfolios] = useState<Set<string>>(new Set());
    const pagerRef = useRef<any>(null);
    const scrollX = useRef(new Animated.Value(initialTab === 'Sell' ? screenW : 0)).current;

    // Persist active tab
    useEffect(() => {
        const loadLastTab = async () => {
            if (!initialTab) {
                try {
                    const lastTab = await AsyncStorage.getItem('lastTradingTab');
                    if (lastTab === 'Sell') {
                        setActiveTab('Sell');
                        scrollX.setValue(screenW);
                        // Need short timeout for ref to be ready
                        setTimeout(() => pagerRef.current?.scrollTo({ x: screenW, animated: false }), 50);
                    }
                } catch (e) {
                    console.log('Error loading last tab', e);
                }
            }
        };
        loadLastTab();
    }, [initialTab]);

    useEffect(() => {
        if (activeTab === 'Buy' || activeTab === 'Sell') {
            AsyncStorage.setItem('lastTradingTab', activeTab).catch(e => console.log(e));
        }
    }, [activeTab]);

    // Memoized style objects to avoid inline styles in JSX (reduces eslint warnings)
    const centeredLoaderStyle = useMemo(() => ({ flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const }), []);
    const flexOneStyle = useMemo(() => ({ flex: 1 }), []);
    const rowCenterStyle = useMemo(() => ({ flexDirection: 'row', alignItems: 'center' }), []);
    // Removed unused memoized styles to reduce lint noise
    const footerLoaderStyle = useMemo(() => ({ margin: 20 }), []);
    // Removed unused memoized video player style
    const activeTradesTopStyle = useMemo(() => ({ marginTop: 24 }), []);
    const pagerPageWidth = useMemo(() => ({ width: screenW }), []);
    const headerPadding = 16; // Matches headerContainer paddingHorizontal
    const tabsRowWidth = screenW - (headerPadding * 2); // Actual width of tabsRow
    const tabWidth = tabsRowWidth / 2; // Each tab takes half the tabsRow
    const indicatorWidth = tabWidth; // Indicator width (full tab width)
    const indicatorCenterInTab = 0; // Start at 0
    const animatedIndicatorStyle = useMemo(() => ([
        styles.tabIndicator,
        {
            width: indicatorWidth,
            left: 0,
            backgroundColor: '#fff',
            transform: [{
                translateX: scrollX.interpolate({
                    inputRange: [0, screenW],
                    outputRange: [0, tabWidth]
                })
            }]
        }
    ]), [scrollX, tabWidth, indicatorWidth]);

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
    const [_videoS3Url, setVideoS3Url] = useState<string>('');
    const [_videoThumbnailUrl, setVideoThumbnailUrl] = useState<string>('');
    const [_imageS3Urls, setImageS3Urls] = useState<string[]>([]);
    const [uploading, setUploading] = useState<boolean>(false);
    const [externalLinkHeading, setExternalLinkHeading] = useState<string>('');
    const [externalLinkUrl, setExternalLinkUrl] = useState<string>('');
    const [selectedCompanyName, setSelectedCompanyName] = useState<string>('');
    const [selectedCompanyAge, setSelectedCompanyAge] = useState<string>('');
    const [editingTradeId, setEditingTradeId] = useState<string | null>(null);
    const [fundingTarget, setFundingTarget] = useState<string>('');
    const [selectedRound, setSelectedRound] = useState<string>('');
    const [searchResults, setSearchResults] = useState<any[]>([]);

    // Active trades
    const [activeTrades, setActiveTrades] = useState<ActiveTrade[]>([]);
    const [expandedTradeId, setExpandedTradeId] = useState<string | number | null>(null);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState<{ [key: string]: number }>({});

    // BUY tab state
    const [showSavedOnly, setShowSavedOnly] = useState(false);
    const [savedItems, setSavedItems] = useState<string[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filterAnimValue = useRef(new Animated.Value(0)).current;

    // Enable LayoutAnimation for Android - must be in useEffect
    useEffect(() => {
        if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
            UIManager.setLayoutAnimationEnabledExperimental(true);
        }
    }, []);

    // Auto-switch to Sell tab when initialTab is set (coming from Raise a Round)
    useEffect(() => {
        if (initialTab === 'Sell') {
            console.log('[TradingSection] Auto-switching to Sell tab (from Raise a Round)');
            setActiveTab('Sell');
            // Scroll pager to Sell tab position after a brief delay
            setTimeout(() => {
                pagerRef.current?.scrollTo({ x: screenW, animated: false });
            }, 100);

            // Show alert to guide user on filling equity range and funding target
            setTimeout(() => {
                showAlert(
                    'Raise a Round',
                    'Fill in your desired equity range and funding target to open a trade. Your startup details will be auto-populated.',
                );
            }, 300);

            // Clear the initial tab flag so future visits don't auto-switch
            onTabChange?.();
        }
    }, [initialTab, onTabChange, showAlert]);

    // Animated filter toggle with smooth height animation
    const toggleFilterWithAnimation = () => {
        const toValue = isFilterOpen ? 0 : 1;
        setIsFilterOpen(!isFilterOpen);
        Animated.timing(filterAnimValue, {
            toValue,
            duration: 250,
            useNativeDriver: false, // height animation can't use native driver
        }).start();
    };

    // Filter container animated style
    const filterContainerStyle = {
        maxHeight: filterAnimValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 200], // enough height for filters
        }),
        opacity: filterAnimValue,
        overflow: 'hidden' as const,
    };

    // BUY TAB Pagination State
    const [buySkip, setBuySkip] = useState(0);
    const [buyHasMore, setBuyHasMore] = useState(true);

    const [buyInitialLoadDone, setBuyInitialLoadDone] = useState(false);
    const [isFirstLoad, setIsFirstLoad] = useState(true); // Track if this is the very first load
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
                setIsFirstLoad(false); // Mark first load complete so subsequent filter changes don't show full loader
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
                // Refresh Sell Tab components - get current user's holdings
                const [, profileData] = await Promise.all([
                    getMyTrades().then(t => setActiveTrades(t)).catch(console.warn),
                    getProfile().catch(() => null)
                ]);

                if (profileData) {
                    const investorDetails = profileData.investorDetails || profileData.details;
                    const holdings = investorDetails?.previousInvestments || [];
                    const userId = profileData.user?._id || profileData._id;
                    const displayName = profileData.user?.displayName || profileData.displayName || 'You';

                    if (holdings.length > 0) {
                        setInvestors([{
                            _id: userId,
                            user: { _id: userId, displayName, username: profileData.user?.username || '' },
                            previousInvestments: holdings,
                        } as InvestorPortfolio]);
                    } else {
                        setInvestors([]);
                    }
                }
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

    // Fetch Current User's Holdings (Sell Tab)
    useEffect(() => {
        let mounted = true;
        const loadMyHoldings = async () => {
            try {
                const profileData = await getProfile();
                if (mounted && profileData) {
                    // Set account type - roles[0] is the primary source (User model uses roles array)
                    const userAccountType = profileData.user?.roles?.[0]
                        || profileData.user?.accountType
                        || profileData.accountType
                        || 'personal';
                    console.log('[TradingSection] User roles:', profileData.user?.roles);
                    console.log('[TradingSection] Detected accountType:', userAccountType);
                    setAccountType(userAccountType);

                    // Only load holdings for investor accounts
                    if (userAccountType === 'investor') {
                        // Extract current user's holdings from their investor details
                        const investorDetails = profileData.investorDetails || profileData.details;
                        const holdings = investorDetails?.previousInvestments || [];
                        const userId = profileData.user?._id || profileData._id;
                        const displayName = profileData.user?.displayName || profileData.displayName || 'You';

                        // Create a single investor entry for the current user
                        if (holdings.length > 0) {
                            setInvestors([{
                                _id: userId,
                                user: { _id: userId, displayName, username: profileData.user?.username || '' },
                                previousInvestments: holdings,
                            } as InvestorPortfolio]);
                        } else {
                            setInvestors([]);
                        }
                    } else if (userAccountType === 'startup') {
                        // For startups, create a virtual portfolio entry from their startup profile
                        const startupDetails = profileData.startupDetails || profileData.details || {};
                        const userId = profileData.user?._id || profileData._id;
                        const displayName = profileData.user?.displayName || profileData.displayName || startupDetails.companyName || 'Your Startup';

                        // Use startup's own company as the "holding" they're selling equity in
                        if (startupDetails.companyName) {
                            const startupAsHolding = {
                                companyName: startupDetails.companyName,
                                date: startupDetails.establishedOn || new Date().toISOString(),
                            };
                            setInvestors([{
                                _id: userId,
                                user: { _id: userId, displayName, username: profileData.user?.username || '' },
                                previousInvestments: [startupAsHolding],
                                // Store startup details for auto-population
                                startupDetails: startupDetails,
                            } as any]);

                            // Auto-expand the startup's company card for the Sell form
                            const cardKey = `${userId}-${startupDetails.companyName}`;
                            setExpandedCompany(cardKey);

                            // Auto-populate form fields from startup profile data
                            console.log('[TradingSection] startupDetails for auto-populate:', JSON.stringify(startupDetails, null, 2));

                            // Description from 'about' field
                            if (startupDetails.about) {
                                setDescription(startupDetails.about);
                            }

                            // Industries from 'companyType' (single string, convert to array)
                            if (startupDetails.companyType) {
                                setSelectedIndustries([startupDetails.companyType]);
                            }

                            // Video from 'video' field
                            if (startupDetails.video) {
                                setVideoUri(startupDetails.video);
                            }

                            // Profile image from 'profileImage' field (convert to array)
                            if (startupDetails.profileImage) {
                                setImageUris([startupDetails.profileImage]);
                            }

                            // Revenue status from nested 'financialProfile.revenueType'
                            if (startupDetails.financialProfile?.revenueType) {
                                const revenueType = startupDetails.financialProfile.revenueType.toLowerCase();
                                setRevenueStatus(revenueType.includes('revenue') && !revenueType.includes('pre') ? 'revenue-generating' : 'pre-revenue');
                            }

                            // Username
                            if (profileData.user?.username) {
                                setStartupUsername(`@${profileData.user.username}`);
                            }

                            console.log('[TradingSection] Auto-populated form fields from startup profile');
                        } else {
                            setInvestors([]);
                        }
                    }
                }
            } catch (e) {
                console.warn('Failed to load my holdings', e);
            } finally {
                if (mounted) setInvestorsLoading(false);
            }
        };
        // Load holdings on mount and whenever switching to Sell tab
        loadMyHoldings();
        return () => { mounted = false; };
    }, [activeTab]);

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

    // Load saved trade IDs on mount
    useEffect(() => {
        const loadSavedItems = async () => {
            try {
                const { savedTradeIds } = await getSavedTrades();
                setSavedItems(savedTradeIds);
            } catch (e) {
                console.warn('Failed to load saved trades', e);
            }
        };
        loadSavedItems();
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
        // Custom smooth animation config
        LayoutAnimation.configureNext({
            duration: 200,
            update: { type: LayoutAnimation.Types.easeInEaseOut },
            create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
            delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
        });
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
                const localUri = result.assets[0].uri || '';
                setVideoUri(localUri);
                // Clear any previous S3 URLs since we have a new local file
                setVideoS3Url('');
                setVideoThumbnailUrl('');
            }
        } catch (error) {
            console.warn('Video selection error:', error);
        }
    };

    const handleImageUpload = async () => {
        try {
            const result = await launchImageLibrary({
                mediaType: 'photo',
                quality: 0.8,
                selectionLimit: 10, // Allow selecting multiple images at once
            });

            if (!result.didCancel && result.assets && result.assets.length > 0) {
                // Store local URIs and asset metadata for later upload
                const newAssets = result.assets.map(asset => ({
                    uri: asset.uri || '',
                    fileName: asset.fileName || 'image.jpg',
                    mimeType: asset.type || 'image/jpeg',
                }));
                const newLocalUris = newAssets.map(a => a.uri);
                setImageUris(prev => [...prev, ...newLocalUris]);
                // Clear S3 URLs - will be populated on submit
                // Note: We store assets metadata in a ref or recalculate from imageUris on submit
            }
        } catch (error) {
            console.warn('Image selection error:', error);
        }
    };

    const removeImage = (index: number) => {
        setImageUris(imageUris.filter((_, i) => i !== index));
        setImageS3Urls(prev => prev.filter((_, i) => i !== index));
    };

    // Investor Autofill: Search for users when username is entered
    useEffect(() => {
        const fetchSearchResults = async () => {
            // Clear results if input is too short or manual entry is on
            if (isManualEntry || !startupUsername || startupUsername.length <= 2) {
                setSearchResults([]);
                return;
            }

            // Perform search for all account types
            try {
                // Search for user (strip @ if present)
                const cleanUsername = startupUsername.replace(/^@/, '');
                console.log('[Autofill] Searching for:', cleanUsername);
                const users = await searchUsers(cleanUsername, undefined, 5); // Fetch top 5 results
                console.log('[Autofill] Results found:', users?.length);
                setSearchResults(users || []);
            } catch (err) {
                console.log('Autofill error:', err);
                setSearchResults([]);
            }
        };

        const timer = setTimeout(fetchSearchResults, 500); // 500ms debounce
        return () => clearTimeout(timer);
    }, [startupUsername, accountType, isManualEntry]);

    const handleSelectStartup = async (targetUser: any) => {
        try {
            // Update username display
            setStartupUsername(`@${targetUser.username}`);
            setSearchResults([]); // Clear results

            // Fetch details
            const profileData = await getStartupProfile(targetUser._id);
            if (profileData && profileData.details) {
                const details = profileData.details;

                // Autofill Company Name
                if (details.companyName || targetUser.displayName) {
                    setSelectedCompanyName(details.companyName || targetUser.displayName || '');
                }

                // Autofill Description (about -> description)
                if (details.about) setDescription(details.about);
                else if (targetUser.bio) setDescription(targetUser.bio);

                // Autofill Video
                if (details.video) setVideoUri(details.video);

                // Autofill Image (profileImage -> imageUris)
                if (details.profileImage) {
                    setImageUris([details.profileImage]);
                } else if (targetUser.avatarUrl) {
                    setImageUris([targetUser.avatarUrl]);
                }

                // Autofill Stage
                if (details.stage) setSelectedRound(details.stage);

                // Autofill Age (establishedOn -> companyAge)
                if (details.establishedOn) {
                    const calcAge = (dateStr: string | Date) => {
                        const d = new Date(dateStr);
                        const years = (new Date().getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
                        return `${years.toFixed(1)} years`;
                    };
                    setCompanyAge(calcAge(details.establishedOn));
                }

                // Autofill Industry (companyType -> selectedIndustries)
                if (details.companyType) {
                    setSelectedIndustries([details.companyType]);
                }

                // Autofill Revenue Status
                if (details.financialProfile?.revenueType) {
                    const rType = details.financialProfile.revenueType;
                    if (rType === 'Revenue generating') setRevenueStatus('revenue-generating');
                    else setRevenueStatus('pre-revenue');
                }

                // Autofill Funding Target
                if (details.fundingNeeded) {
                    setFundingTarget(details.fundingNeeded.toString());
                }

                console.log('[TradingSection] Auto-populated form fields from selection');
            }
        } catch (err) {
            console.log('Selection autofill error:', err);
        }
    };

    const handleOpenTrade = async () => {
        if (!expandedCompany) return;

        // Use the company name and age that were stored when the portfolio card was expanded
        const finalCompanyName = selectedCompanyName || 'Company';
        const finalCompanyAge = selectedCompanyAge || companyAge || '';

        setUploading(true);

        try {
            // Upload media to S3 only when submitting
            let uploadedVideoUrl = '';
            let uploadedThumbnailUrl = '';
            let uploadedImageUrls: string[] = [];

            // Upload video if selected (skip if already a remote URL)
            if (videoUri && typeof videoUri === 'string' && videoUri.trim()) {
                if (videoUri.startsWith('http') || videoUri.startsWith('https')) {
                    uploadedVideoUrl = videoUri;
                    // Keep existing thumbnail or handle auto-fill logic
                } else {
                    try {
                        const s3Result = await uploadVideo(videoUri);
                        uploadedVideoUrl = s3Result.url;
                        uploadedThumbnailUrl = s3Result.thumbnailUrl || s3Result.url;
                    } catch (videoError: any) {
                        console.error('Video upload error:', videoError);
                        showAlert('Upload Error', 'Failed to upload video. Please try again.');
                        setUploading(false);
                        return;
                    }
                }
            }

            // Upload images if selected
            if (imageUris.length > 0) {
                // Filter valid strings only
                const validUris = imageUris.filter(u => typeof u === 'string' && u.trim());

                const urisToUpload = validUris.filter(uri => !(uri.startsWith('http') || uri.startsWith('https')));
                const existingUrls = validUris.filter(uri => (uri.startsWith('http') || uri.startsWith('https')));
                let newlyUploadedUrls: string[] = [];

                if (urisToUpload.length > 0) {
                    try {
                        const uploadPromises = urisToUpload.map(async (uri) => {
                            const fileName = uri.split('/').pop() || 'image.jpg';
                            return uploadImage(uri, fileName, 'image/jpeg');
                        });
                        newlyUploadedUrls = await Promise.all(uploadPromises);
                    } catch (imageError: any) {
                        console.error('Image upload error:', imageError);
                        showAlert('Upload Error', 'Failed to upload images. Please try again.');
                        setUploading(false);
                        return;
                    }
                }
                uploadedImageUrls = [...existingUrls, ...newlyUploadedUrls];
            }

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
                videoUrl: uploadedVideoUrl || undefined,
                videoThumbnailUrl: uploadedThumbnailUrl || undefined,
                imageUrls: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
                fundingTarget: Number(fundingTarget) || 0,
            };

            try {
                if (editingTradeId) {
                    const response = await updateTrade(editingTradeId, tradeData);
                    if (response && response.trade) {
                        setActiveTrades(activeTrades.map(t => t._id === editingTradeId ? response.trade : t));
                    }
                    if (response && response.trade) {
                        setActiveTrades(activeTrades.map(t => t._id === editingTradeId ? response.trade : t));
                    }
                    showAlert('Success', 'Trade updated successfully!');
                } else {
                    const response = await createTrade(tradeData);
                    if (response && response.trade) {
                        setActiveTrades([...activeTrades, response.trade]);
                    }

                    // For startups: Update startup profile with fundingNeeded and roundType
                    if (accountType === 'startup' && (fundingTarget || selectedRound)) {
                        try {
                            const profileUpdate: any = {
                                // Reset fundingRaised to 0 when starting a new round
                                fundingRaised: 0
                            };
                            if (fundingTarget) {
                                // Parse funding target (remove currency symbols and commas)
                                const numericTarget = parseFloat(fundingTarget.replace(/[^0-9.]/g, '')) || 0;
                                profileUpdate.fundingNeeded = numericTarget;
                                profileUpdate.requiredCapital = numericTarget;
                            }
                            if (selectedRound) {
                                profileUpdate.roundType = selectedRound;
                                profileUpdate.stage = selectedRound;
                            }
                            await saveStartupProfile(profileUpdate);
                            console.log('[TradingSection] Updated startup profile with funding info:', profileUpdate);
                        } catch (profileError) {
                            console.warn('Failed to update startup profile with funding info:', profileError);
                            // Don't show alert - trade was still created successfully
                        }
                    }

                    showAlert('Success', 'Trade opened successfully!');
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
                setVideoS3Url('');
                setVideoThumbnailUrl('');
                setImageS3Urls([]);
                setExternalLinkHeading('');
                setExternalLinkUrl('');
                setSelectedCompanyName('');
                setSelectedCompanyAge('');
            } catch (error: any) {
                console.error('Failed to save trade:', error);
                showAlert('Error', error.message || 'Failed to save trade');
            } finally {
                setUploading(false);
            }
        } catch (outerError: any) {
            console.error('Trade submission failed:', outerError);
            showAlert('Error', outerError.message || 'Failed to submit trade');
            setUploading(false);
        }
    };

    const handleDeleteTrade = async (tradeId: any) => {
        try {
            await deleteTrade(tradeId);
            setActiveTrades(activeTrades.filter(trade => trade._id !== tradeId));
            showAlert('Success', 'Trade deleted successfully!');
        } catch (error: any) {
            console.error('Failed to delete trade:', error);
            showAlert('Error', error.message || 'Failed to delete trade');
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
            setFundingTarget(trade.fundingTarget ? String(trade.fundingTarget) : '');
            setSelectedRound(trade.selectedRound || '');
        }
    };

    const handleCategoryClick = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const toggleSaveItem = async (itemId: string) => {
        const isCurrentlySaved = savedItems.includes(itemId);
        const newSavedState = !isCurrentlySaved;

        // Optimistically update UI
        setSavedItems(prev =>
            isCurrentlySaved
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );

        // Persist to backend
        try {
            await toggleTradeSave(itemId, newSavedState);
        } catch (error) {
            console.warn('Failed to save trade:', error);
            // Revert on failure
            setSavedItems(prev =>
                isCurrentlySaved
                    ? [...prev, itemId]
                    : prev.filter(id => id !== itemId)
            );
        }
    };

    const handleExpressInterest = async (trade: ActiveTrade) => {
        try {
            // @ts-ignore - Assuming trade.user or trade.startupUsername is available
            const ownerId = trade.user?._id || trade.user;
            const ownerName = trade.companyName || 'the company';

            if (!ownerId) {
                showAlert('Error', 'Contact information not available for this trade.');
                return;
            }

            const response = await createOrFindChat(ownerId);
            const chat = response?.chat || response; // Handle both { chat: ... } and direct chat object if API changes

            if (chat && (chat._id || chat.id)) {
                const chatId = chat._id || chat.id;
                await sendMessage(chatId, `Hi, I'm interested in ${ownerName}`);

                // Share the trade card as well
                await shareContent({
                    userIds: [ownerId],
                    contentId: trade._id!,
                    contentType: 'trade',
                    contentTitle: trade.companyName,
                    contentImage: trade.imageUrls?.[0] || '',
                    contentOwner: trade.startupUsername,
                });

                showAlert('Success', 'Interest expressed! A message and trade card have been sent to the owner.');
            } else {
                console.warn('Chat creation response mismatch:', response);
                showAlert('Error', 'Failed to start chat with the owner.');
            }
        } catch (error) {
            console.error('Express interest error:', error);
            showAlert('Error', 'Failed to send interest message.');
        }
    };

    const renderInvestorPortfolios = () => {
        if (investorsLoading) {
            return (
                <View style={centeredLoaderStyle as any}>
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
                style={[flexOneStyle, { backgroundColor: '#070707' }] as any}
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
                        <View key={index} style={[styles.portfolioCard, isExpanded && { zIndex: 1000 }]}>
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
                                <View style={flexOneStyle as any}>
                                    <View style={rowCenterStyle as any}>
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
                                    isStartup={accountType === 'startup'}
                                    fundingTarget={fundingTarget}
                                    setFundingTarget={setFundingTarget}
                                    selectedRound={selectedRound}
                                    setSelectedRound={setSelectedRound}
                                    isSubmitting={uploading}
                                    searchResults={searchResults}
                                    onSelectResult={handleSelectStartup}
                                />
                            )}
                        </View>
                    );
                })}

                {/* Active Trades Section */}
                {activeTrades.length > 0 && (
                    <View style={activeTradesTopStyle as any}>
                        <Text style={styles.portfolioHeader}>Active Trades</Text>
                        {activeTrades.map((trade) => {
                            const tradeId = trade._id || trade.id;
                            if (!tradeId) return null;
                            const isExpanded = expandedTradeId === tradeId;
                            const photoIndex = currentPhotoIndex[tradeId] || 0;
                            const imageCount = trade.imageUrls?.length || 0;
                            const hasVideo = !!trade.videoUrl;
                            const totalMediaCount = imageCount + (hasVideo ? 1 : 0);
                            const isCurrentItemVideo = hasVideo && photoIndex === imageCount;

                            return (
                                <View key={tradeId} style={styles.professionalTradeCard}>
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        style={[styles.collapsedCardRow, isExpanded && styles.expandedCardHeader]}
                                        onPress={() => {
                                            // Custom smooth animation config
                                            LayoutAnimation.configureNext({
                                                duration: 200,
                                                update: { type: LayoutAnimation.Types.easeInEaseOut },
                                                create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
                                                delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
                                            });
                                            setExpandedTradeId(isExpanded ? null : (tradeId as string | number));
                                            setEditingTradeId(null);
                                        }}
                                    >
                                        {/* Avatar */}
                                        {trade.imageUrls && trade.imageUrls.length > 0 && trade.imageUrls[0] ? (
                                            <RNImage
                                                source={{ uri: trade.imageUrls[0] }}
                                                style={styles.collapsedAvatar}
                                            />
                                        ) : (
                                            <View style={styles.collapsedAvatar}>
                                                <Text style={styles.collapsedAvatarText}>
                                                    {trade.companyName[0]}
                                                </Text>
                                            </View>
                                        )}

                                        {/* Company Info */}
                                        <View style={styles.collapsedCompanyInfo}>
                                            <Text style={styles.collapsedCompanyName}>{trade.companyName}</Text>
                                            {!isExpanded && (
                                                <Text style={styles.collapsedDescription} numberOfLines={1}>
                                                    {trade.description || 'No description provided'}
                                                </Text>
                                            )}
                                        </View>

                                        {/* Edit/Delete Actions */}
                                        <View style={styles.collapsedActions}>
                                            <TouchableOpacity
                                                style={styles.collapsedActionBtn}
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    handleUpdateTrade(tradeId);
                                                }}
                                            >
                                                <MaterialCommunityIcons name="pencil" size={16} color="#999" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.collapsedActionBtn}
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
                                                isStartup={accountType === 'startup'}
                                                fundingTarget={fundingTarget}
                                                setFundingTarget={setFundingTarget}
                                                selectedRound={selectedRound}
                                                setSelectedRound={setSelectedRound}
                                                isSubmitting={uploading}
                                                searchResults={searchResults}
                                                onSelectResult={handleSelectStartup}
                                            />
                                        ) : (
                                            <>
                                                {/* Description */}
                                                <Text style={styles.expandedDescription}>
                                                    {trade.description || 'No description provided'}
                                                </Text>

                                                {/* Media Carousel */}
                                                {totalMediaCount > 0 && (
                                                    <View style={styles.professionalImageContainer}>
                                                        {isCurrentItemVideo ? (
                                                            <Video
                                                                source={{ uri: trade.videoUrl }}
                                                                style={styles.professionalImage}
                                                                controls={true}
                                                                resizeMode="contain"
                                                                repeat={true}
                                                            />
                                                        ) : (
                                                            <RNImage
                                                                source={{ uri: trade.imageUrls?.[photoIndex] }}
                                                                style={styles.professionalImage}
                                                            />
                                                        )}

                                                        {/* Navigation Arrows */}
                                                        {totalMediaCount > 1 && (
                                                            <>
                                                                {photoIndex > 0 && (
                                                                    <TouchableOpacity
                                                                        style={[styles.professionalArrow, styles.professionalArrowLeft]}
                                                                        onPress={() => setCurrentPhotoIndex(prev => ({ ...prev, [tradeId]: photoIndex - 1 }))}
                                                                    >
                                                                        <MaterialCommunityIcons name="chevron-left" size={22} color="#fff" />
                                                                    </TouchableOpacity>
                                                                )}
                                                                {photoIndex < totalMediaCount - 1 && (
                                                                    <TouchableOpacity
                                                                        style={[styles.professionalArrow, styles.professionalArrowRight]}
                                                                        onPress={() => setCurrentPhotoIndex(prev => ({ ...prev, [tradeId]: photoIndex + 1 }))}
                                                                    >
                                                                        <MaterialCommunityIcons name="chevron-right" size={22} color="#fff" />
                                                                    </TouchableOpacity>
                                                                )}

                                                                {/* Media Indicators */}
                                                                <View style={styles.professionalIndicators}>
                                                                    {Array.from({ length: totalMediaCount }).map((_, idx) => (
                                                                        <View
                                                                            key={idx}
                                                                            style={[
                                                                                styles.professionalDot,
                                                                                idx === photoIndex && styles.professionalDotActive
                                                                            ]}
                                                                        />
                                                                    ))}
                                                                </View>
                                                            </>
                                                        )}
                                                    </View>
                                                )}

                                                {/* Info Grid */}
                                                <View style={styles.professionalInfoGrid}>
                                                    <View style={styles.professionalInfoItem}>
                                                        <Text style={styles.professionalInfoLabel}>Revenue</Text>
                                                        <Text style={styles.professionalInfoValue}>
                                                            {trade.revenueStatus === 'revenue-generating' ? 'Revenue Generating' : 'Pre Revenue'}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.professionalInfoItem}>
                                                        <Text style={styles.professionalInfoLabel}>Age</Text>
                                                        <Text style={styles.professionalInfoValue}>{trade.companyAge || 'N/A'}</Text>
                                                    </View>
                                                    <View style={styles.professionalInfoItem}>
                                                        <Text style={styles.professionalInfoLabel}>Range</Text>
                                                        <Text style={styles.professionalInfoValue}>
                                                            {trade.sellingRangeMin}% - {trade.sellingRangeMax}%
                                                        </Text>
                                                    </View>
                                                </View>

                                                {/* Industry Tags */}
                                                {trade.selectedIndustries && trade.selectedIndustries.length > 0 && (
                                                    <View style={styles.professionalTags}>
                                                        {trade.selectedIndustries.map((industry, idx) => (
                                                            <View key={idx} style={styles.professionalTag}>
                                                                <Text style={styles.professionalTagText}>{industry}</Text>
                                                            </View>
                                                        ))}
                                                    </View>
                                                )}

                                                {/* Views & Saves */}
                                                <View style={styles.tradeStats}>
                                                    <Text style={styles.tradeStatText}>Views: {trade.views}</Text>
                                                    <Text style={styles.tradeStatText}>Saves: {trade.saves}</Text>
                                                </View>
                                            </>
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
        // Filter to show only saved items if showSavedOnly is true
        let data = buyTrades;
        if (showSavedOnly) {
            data = buyTrades.filter(trade => {
                const tradeId = trade._id || trade.id;
                return savedItems.includes(String(tradeId));
            });
        }

        const ListHeader = () => (
            <>
                {/* Search and Filter - now inside scrollable content */}
                <View style={styles.searchRow}>
                    <View style={styles.searchBox}>
                        <MaterialCommunityIcons name="magnify" size={20} color="#bfbfbf" />
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
                            size={24}
                            color={showSavedOnly ? "#fff" : "#bfbfbf"}
                        />
                    </TouchableOpacity>
                </View>

                {/* Filter Button */}
                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={toggleFilterWithAnimation}
                >
                    <MaterialCommunityIcons name="tune" size={20} color="#fff" />
                    <Text style={styles.filterButtonText}>Filters</Text>
                    <MaterialCommunityIcons
                        name={isFilterOpen ? "chevron-up" : "chevron-down"}
                        size={22}
                        color="#bfbfbf"
                    />
                </TouchableOpacity>

                {/* Category Filters - Animated container */}
                <Animated.View style={filterContainerStyle}>
                    <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 100 }}>
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
                    </ScrollView>
                </Animated.View>
                {/* Suggested for you heading */}
                <Text style={styles.suggestedHeading}>Suggested for you</Text>
                {/* Inline loading indicator for filter changes (after first load) */}
                {!isFirstLoad && buyLoading && (
                    <View style={{ paddingVertical: 16, alignItems: 'center' as const }}>
                        <ActivityIndicator size="small" color="#1a73e8" />
                    </View>
                )}
            </>
        );

        // Only show full page loader on first load, not on filter changes
        if (isFirstLoad && buyLoading && data.length === 0) {
            return (
                <View style={centeredLoaderStyle}>
                    <ActivityIndicator size="large" color="#1a73e8" />
                </View>
            );
        }

        return (
            <FlatList
                data={data}
                style={{ backgroundColor: '#070707' }}
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
                            onToggleExpand={() => {
                                setExpandedBuyTradeId(isExpanded ? null : (tradeId as string | number));
                            }}
                            onToggleSave={() => toggleSaveItem(String(tradeId))}
                            onPhotoIndexChange={(index) => setCurrentPhotoIndex(prev => ({ ...prev, [tradeId]: index }))}
                            onExpressInterest={() => handleExpressInterest(item)}
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
                {/* Swipeable tabs with underline indicator - Show for investors and startups */}
                {(accountType === 'investor' || accountType === 'startup') && (
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
                    const newTab = idx === 0 ? 'Buy' : 'Sell';
                    if (newTab !== activeTab) {
                        setActiveTab(newTab);
                    }
                }}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
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
