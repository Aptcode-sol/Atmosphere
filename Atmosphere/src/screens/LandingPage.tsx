import React, { useState, useContext } from 'react';
import { View, StyleSheet } from 'react-native';
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
import CreatePost from './CreatePost';
import CreateReel from './CreateReel';
import SavedPosts from './SavedPosts';
import CreateMenu from '../components/CreateMenu';
import VideoCall from './VideoCall';
import MyTeam from './MyTeam';
import StartupDetail from './StartupDetail';

type RouteKey = 'home' | 'search' | 'notifications' | 'chats' | 'reels' | 'profile' | 'topstartups' | 'trade' | 'jobs' | 'meetings' | 'setup' | 'chatDetail' | 'createPost' | 'createReel' | 'saved' | 'videoCall' | 'myTeam' | 'startupDetail' | 'tradeDetail';

const LandingPage = () => {
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
                return <Home onNavigate={(r) => setRoute(r)} onChatSelect={handleChatSelect} onOpenProfile={(id: string) => { setSelectedProfileId(id); setRoute('profile'); }} />;
            case 'search':
                return <Search onPostPress={handlePostPress} />;
            case 'notifications':
                return <Notifications />;
            case 'chats':
                return <Chats onChatSelect={handleChatSelect} />;
            case 'reels':
                return <Reels userId={reelContext.userId} initialReelId={reelContext.initialReelId} />;
            case 'profile':
                return <Profile
                    onNavigate={(r: RouteKey) => setRoute(r)}
                    onCreatePost={() => setShowCreateMenu(true)}
                    onPostPress={handlePostPress}
                    onReelSelect={(reelId, userId) => {
                        setReelContext({ userId, initialReelId: reelId });
                        setRoute('reels');
                    }}
                />;
            case 'setup':
                return <SetupProfile onDone={() => setRoute('profile')} onClose={() => setRoute('profile')} />;
            case 'topstartups':
                return <TopStartups />;
            case 'trade':
                return <TradingSection />;
            case 'jobs':
                return <Opportunities onNavigate={(r: string) => setRoute(r as RouteKey)} />;
            case 'myTeam':
                return <MyTeam onBack={() => setRoute('jobs')} />;
            case 'meetings':
                return <Meetings onJoinMeeting={(meetingId: string) => {
                    setSelectedMeetingId(meetingId);
                    setRoute('videoCall');
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
                if (r !== 'reels') setReelContext({}); // Clear reel context if navigating away
                setRoute(mapBottomToRoute(r));
            }} />}

            {/* Create Menu Modal */}
            <CreateMenu
                visible={showCreateMenu}
                onClose={() => setShowCreateMenu(false)}
                onSelectPost={() => setRoute('createPost')}
                onSelectReel={() => setRoute('createReel')}
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