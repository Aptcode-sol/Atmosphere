import React, { useState, useContext, useEffect, useCallback } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import Search from './Search';
import PostDetail from './PostDetail';
import Notifications from './Notifications';
import Chats from './Chats';
import ChatDetail from './ChatDetail';
import Reels from './Reels';
import Profile from './Profile';
import Home from './Home';
import BottomNav from '../components/BottomNav';
import TopStartups from './TopStartups';
import TradingSection from './TradingSection';
import Opportunities from './Opportunities';
import Meetings from './Meetings';
import SetupProfile from './SetupProfile';
import StartupPortfolioStep from './setup-steps/StartupPortfolioStep';
import InvestorPortfolioStep from './setup-steps/InvestorPortfolioStep';
import CreatePost from './CreatePost';
import CreateReel from './CreateReel';
import SavedPosts from './SavedPosts';
import CreateMenu from '../components/CreateMenu';
import VideoCall from './VideoCall';
import MyTeam from './MyTeam';
import StartupDetail from './StartupDetail';
import KycScreen from './KycScreen';
import StartupVerifyStep from './setup-steps/StartupVerifyStep';

type RouteKey = 'home' | 'search' | 'notifications' | 'chats' | 'reels' | 'profile' | 'topstartups' | 'trade' | 'jobs' | 'meetings' | 'setup' | 'verify' | 'chatDetail' | 'createPost' | 'createReel' | 'saved' | 'videoCall' | 'myTeam' | 'startupDetail' | 'tradeDetail' | 'portfolio';

interface LandingPageProps {
    initialDeepLink?: string | null;
    onDeepLinkHandled?: () => void;
}

const LandingPage = ({ initialDeepLink, onDeepLinkHandled }: LandingPageProps) => {
    const [route, setRoute] = useState<RouteKey>('home');
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [selectedReelId, setSelectedReelId] = useState<string | null>(null);
    const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
    const [selectedStartupId, setSelectedStartupId] = useState<string | null>(null);
    const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
    const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
    const [reelContext, setReelContext] = useState<{ userId?: string; initialReelId?: string }>({});
    const [showCreateMenu, setShowCreateMenu] = useState(false);
    const { theme } = useContext(ThemeContext);

    // Navigation history stack for back button support
    const [routeHistory, setRouteHistory] = useState<RouteKey[]>([]);
    // Account type for portfolio routing
    const [accountType, setAccountType] = useState<'investor' | 'startup' | 'personal' | null>(null);
    // Initial tab for TradingSection (when coming from Raise a Round)
    const [tradeInitialTab, setTradeInitialTab] = useState<'Buy' | 'Sell' | undefined>(undefined);

    // Fetch user profile to get accountType
    useEffect(() => {
        (async () => {
            try {
                const { getProfile } = await import('../lib/api');
                const profile = await getProfile();
                console.log('LandingPage - profile.user.roles:', profile?.user?.roles);
                // Check roles array for account type (profile returns roles:['investor'] not accountType)
                const roles = profile?.user?.roles || [];
                if (roles.includes('investor')) {
                    setAccountType('investor');
                } else if (roles.includes('startup')) {
                    setAccountType('startup');
                } else if (profile?.user?.accountType) {
                    setAccountType(profile.user.accountType);
                }
            } catch (e) {
                console.warn('Failed to fetch profile:', e);
            }
        })();
    }, []);

    // Handle deep link navigation
    useEffect(() => {
        if (initialDeepLink) {
            try {
                // Parse URL: https://atmosphere.app/{type}/{id} or atmosphere://{type}/{id}
                const url = initialDeepLink
                    .replace('atmosphere://', '')
                    .replace('https://atmosphere.app/', '')
                    .replace('http://atmosphere.app/', '');
                const pathParts = url.split('/').filter(Boolean);

                if (pathParts.length >= 2) {
                    const [type, id] = pathParts;
                    if (type === 'post' && id) {
                        setSelectedPostId(id);
                    } else if (type === 'reel' && id) {
                        setReelContext({ initialReelId: id });
                        setRoute('reels');
                    } else if (type === 'startup' && id) {
                        setSelectedStartupId(id);
                        setRoute('startupDetail');
                    }
                }
            } catch (e) {
                console.warn('Failed to parse deep link:', e);
            }
            onDeepLinkHandled?.();
        }
    }, [initialDeepLink, onDeepLinkHandled]);

    // Navigate to a new route while tracking history
    const navigateTo = useCallback((newRoute: RouteKey, clearOverlays = true) => {
        if (clearOverlays) {
            setSelectedPostId(null);
            setSelectedChatId(null);
            setSelectedProfileId(null);
            setSelectedReelId(null);
            setSelectedStartupId(null);
            setSelectedTradeId(null);
        }
        if (newRoute !== route) {
            setRouteHistory(prev => [...prev, route]);
            setRoute(newRoute);
        }
    }, [route]);

    // Handle hardware back button
    const goBack = useCallback((): boolean => {
        // Priority 1: Close create menu
        if (showCreateMenu) {
            setShowCreateMenu(false);
            return true;
        }
        // Priority 2: Close profile overlay
        if (selectedProfileId) {
            setSelectedProfileId(null);
            return true;
        }
        // Priority 3: Close reel overlay
        if (selectedReelId) {
            setSelectedReelId(null);
            return true;
        }
        // Priority 4: Close post overlay
        if (selectedPostId) {
            setSelectedPostId(null);
            return true;
        }
        // Priority 5: Close chat detail
        if (selectedChatId) {
            setSelectedChatId(null);
            setRoute('chats');
            return true;
        }
        // Priority 6: Close startup detail
        if (route === 'startupDetail' && selectedStartupId) {
            setSelectedStartupId(null);
            if (routeHistory.length > 0) {
                const prev = routeHistory[routeHistory.length - 1];
                setRouteHistory(h => h.slice(0, -1));
                setRoute(prev);
            } else {
                setRoute('home');
            }
            return true;
        }
        // Priority 7: Close trade detail
        if (route === 'tradeDetail' && selectedTradeId) {
            setSelectedTradeId(null);
            if (routeHistory.length > 0) {
                const prev = routeHistory[routeHistory.length - 1];
                setRouteHistory(h => h.slice(0, -1));
                setRoute(prev);
            } else {
                setRoute('trade');
            }
            return true;
        }
        // Priority 8: Video call - go back to meetings
        if (route === 'videoCall') {
            setSelectedMeetingId(null);
            setRoute('meetings');
            setRouteHistory(h => h.slice(0, -1));
            return true;
        }
        // Priority 9: Pop from history stack
        if (routeHistory.length > 0) {
            const prev = routeHistory[routeHistory.length - 1];
            setRouteHistory(h => h.slice(0, -1));
            setRoute(prev);
            return true;
        }
        // At root (home) with no history - allow app to exit
        if (route === 'home') {
            return false; // Let the app exit
        }
        // Fallback: go to home
        setRoute('home');
        return true;
    }, [showCreateMenu, selectedProfileId, selectedReelId, selectedPostId, selectedChatId, route, selectedStartupId, selectedTradeId, routeHistory]);

    // Register back handler
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', goBack);
        return () => backHandler.remove();
    }, [goBack]);

    const handlePostPress = (postId: string) => {
        setSelectedPostId(postId);
    };

    const handleBackFromPost = () => {
        setSelectedPostId(null);
    };

    const handleChatSelect = (chatId: string) => {
        setSelectedChatId(chatId);
        setRoute('chatDetail');
    };

    const handleBackFromChat = () => {
        setSelectedChatId(null);
        setRoute('chats');
    };

    const handleContentPress = (content: any) => {
        // Navigate based on content type
        if (content.type === 'startup') {
            setSelectedStartupId(content.id);
            setRoute('startupDetail');
        } else if (content.type === 'post') {
            setSelectedPostId(content.id);
            // PostDetail is rendered via renderContent condition, so we just set state
        } else if (content.type === 'reel') {
            setSelectedReelId(content.id);
            // We do NOT clear selectedChatId here, so we can go back to it
        } else if (content.type === 'trade') {
            setSelectedTradeId(content.id);
            setRoute('tradeDetail');
        }
    };

    const renderContent = () => {
        if (selectedProfileId) {
            return <Profile
                onNavigate={(r: RouteKey) => setRoute(r)}
                userId={selectedProfileId}
                onClose={() => setSelectedProfileId(null)}
            />;
        }
        if (selectedPostId) {
            return <PostDetail route={{ params: { postId: selectedPostId } }} onBackPress={handleBackFromPost} />;
        }
        if (selectedReelId) {
            return <Reels
                initialReelId={selectedReelId}
                onBack={() => setSelectedReelId(null)}
            />;
        }
        if (route === 'startupDetail' && selectedStartupId) {
            return <StartupDetail route={{ params: { startupId: selectedStartupId } }} navigation={{ goBack: () => setRoute('chats') }} />;
        }
        // Lazy load TradeDetail to avoid circular deps if possible, or just import
        if (route === 'tradeDetail' && selectedTradeId) {
            const TradeDetail = require('./TradeDetail').default;
            return <TradeDetail route={{ params: { tradeId: selectedTradeId } }} navigation={{ goBack: () => setRoute('chats') }} />;
        }

        if (selectedChatId) {
            // @ts-ignore
            return <ChatDetail
                chatId={selectedChatId}
                onBackPress={handleBackFromChat}
                onProfileOpen={(userId: string) => {
                    setSelectedProfileId(userId);
                }}
                onContentPress={handleContentPress}
            />;
        }
        switch (route) {
            case 'home':
                return <Home onNavigate={(r) => navigateTo(r)} onChatSelect={handleChatSelect} onOpenProfile={(id: string) => { setSelectedProfileId(id); navigateTo('profile', false); }} />;
            case 'search':
                return <Search onPostPress={handlePostPress} onUserPress={(userId: string) => setSelectedProfileId(userId)} />;
            case 'notifications':
                return <Notifications />;
            case 'chats':
                return <Chats onChatSelect={handleChatSelect} />;
            case 'reels':
                return <Reels userId={reelContext.userId} initialReelId={reelContext.initialReelId} />;
            case 'profile':
                return <Profile
                    onNavigate={(r: RouteKey) => navigateTo(r)}
                    onCreatePost={() => setShowCreateMenu(true)}
                    onPostPress={handlePostPress}
                    onReelSelect={(reelId, userId) => {
                        setReelContext({ userId, initialReelId: reelId });
                        navigateTo('reels');
                    }}
                />;
            case 'setup':
                return <SetupProfile onDone={() => setRoute('profile')} onClose={() => setRoute('profile')} onNavigateToTrade={() => { setTradeInitialTab('Sell'); setRoute('trade'); }} />;
            case 'verify':
                // Direct navigation to Get Verified (StartupVerifyStep)
                return <StartupVerifyStep onDone={() => setRoute('profile')} onBack={() => setRoute('profile')} onNavigateToTrade={() => { setTradeInitialTab('Sell'); setRoute('trade'); }} />;
            case 'portfolio':
                // Show appropriate portfolio step based on account type
                if (accountType === 'investor') {
                    return <InvestorPortfolioStep onDone={() => setRoute('profile')} onBack={() => setRoute('profile')} />;
                }
                return <StartupPortfolioStep onDone={() => setRoute('profile')} onBack={() => setRoute('profile')} onNavigateToTrade={() => { setTradeInitialTab('Sell'); setRoute('trade'); }} />;
            case 'topstartups':
                return <TopStartups />;
            case 'trade':
                return <TradingSection initialTab={tradeInitialTab} onTabChange={() => setTradeInitialTab(undefined)} />;
            case 'jobs':
                return <Opportunities onNavigate={(r: string) => navigateTo(r as RouteKey)} />;
            case 'myTeam':
                return <MyTeam onBack={() => setRoute('jobs')} />;
            case 'meetings':
                return <Meetings onJoinMeeting={(meetingId: string) => {
                    setSelectedMeetingId(meetingId);
                    navigateTo('videoCall', false);
                }} />;
            case 'videoCall':
                return selectedMeetingId ? (
                    <VideoCall
                        meetingId={selectedMeetingId}
                        onLeave={() => {
                            setSelectedMeetingId(null);
                            setRoute('meetings');
                        }}
                    />
                ) : null;
            case 'chatDetail':
                return selectedChatId ? (
                    <ChatDetail
                        chatId={selectedChatId}
                        onBackPress={handleBackFromChat}
                        onProfileOpen={(userId: string) => {
                            setSelectedProfileId(userId);
                            setRoute('profile');
                        }}
                        onContentPress={handleContentPress}
                    />
                ) : null;
            case 'createPost':
                return <CreatePost onClose={() => setRoute('profile')} onSuccess={() => setRoute('profile')} />;
            case 'createReel':
                return <CreateReel onClose={() => setRoute('profile')} onSuccess={() => setRoute('reels')} />;
            case 'saved':
                return <SavedPosts onClose={() => setRoute('profile')} onPostPress={handlePostPress} />;
            default:
                return null;
        }
    };

    const mapBottomToRoute = (routeName: string): RouteKey => {
        const map: { [k: string]: RouteKey } = {
            Home: 'home',
            Search: 'search',
            Reels: 'reels',
            Profile: 'profile',
            Notifications: 'notifications',
            Messages: 'chats',
            Launch: 'topstartups',
            Trade: 'trade',
            Opportunities: 'jobs',
            Meetings: 'meetings',
        };
        return map[routeName] || 'home';
    };

    const mapRouteToBottom = (r: RouteKey): string => {
        const rev: { [k in RouteKey]: string } = {
            home: 'Home',
            search: 'Search',
            notifications: 'Notifications',
            chats: 'Messages',
            reels: 'Reels',
            profile: 'Profile',
            setup: 'Profile',
            verify: 'Profile',
            topstartups: 'Launch',
            trade: 'Trade',
            jobs: 'Opportunities',
            meetings: 'Meetings',
            chatDetail: 'Messages',
            createPost: 'Profile',
            createReel: 'Profile',
            saved: 'Profile',
            videoCall: 'Meetings',
            myTeam: 'Opportunities',
            startupDetail: 'Launch',
            tradeDetail: 'Trade',
            portfolio: 'Profile',
        };
        return rev[r] || 'Home';
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Content wrapper - takes remaining space above navbar */}
            <View style={styles.contentWrapper}>
                {renderContent()}
            </View>

            {/* Bottom Nav - takes solid space at bottom */}
            {!selectedChatId && <BottomNav activeRoute={mapRouteToBottom(route)} onRouteChange={(r) => {
                // Clear any overlay states for immediate navigation
                setSelectedPostId(null);
                setSelectedChatId(null);
                setSelectedProfileId(null);
                setSelectedReelId(null);
                if (r !== 'reels') setReelContext({}); // Clear reel context if navigating away
                // Don't track history for bottom nav - treat as fresh navigation
                setRouteHistory([]);
                setRoute(mapBottomToRoute(r));
            }} />}

            {/* Create Menu Modal */}
            <CreateMenu
                visible={showCreateMenu}
                onClose={() => setShowCreateMenu(false)}
                onSelectPost={() => { setShowCreateMenu(false); navigateTo('createPost'); }}
                onSelectReel={() => { setShowCreateMenu(false); navigateTo('createReel'); }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, flexDirection: 'column' },
    contentWrapper: { flex: 1 },
    content: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
    // header and headerTitle removed, now handled by TopNavbar
    text: { fontSize: 16 },
});

export default LandingPage;