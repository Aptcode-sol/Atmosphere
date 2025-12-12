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
import Jobs from './Jobs';
import Meetings from './Meetings';
import SetupProfile from './SetupProfile';
import CreatePost from './CreatePost';

type RouteKey = 'home' | 'search' | 'notifications' | 'chats' | 'reels' | 'profile' | 'topstartups' | 'trade' | 'jobs' | 'meetings' | 'setup' | 'chatDetail' | 'createPost';

const LandingPage = () => {
    const [route, setRoute] = useState<RouteKey>('home');
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
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

    const renderContent = () => {
        if (selectedPostId) {
            return <PostDetail route={{ params: { postId: selectedPostId } }} onBackPress={handleBackFromPost} />;
        }
        if (selectedChatId) {
            // @ts-ignore
            return <ChatDetail chatId={selectedChatId} onBackPress={handleBackFromChat} />;
        }
        if (selectedProfileId) {
            return <Profile onNavigate={(r: RouteKey) => setRoute(r)} userId={selectedProfileId} onClose={() => { setSelectedProfileId(null); setRoute('home'); }} />;
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
                return <Reels />;
            case 'profile':
                return <Profile onNavigate={(r: RouteKey) => setRoute(r)} onCreatePost={() => setRoute('createPost')} onPostPress={handlePostPress} />;
            case 'setup':
                return <SetupProfile onDone={() => setRoute('profile')} onClose={() => setRoute('profile')} />;
            case 'topstartups':
                return <TopStartups />;
            case 'trade':
                return <TradingSection />;
            case 'jobs':
                return <Jobs />;
            case 'meetings':
                return <Meetings />;
            case 'chatDetail':
                return selectedChatId ? (
                    <ChatDetail
                        chatId={selectedChatId}
                        onBackPress={handleBackFromChat}
                        onProfileOpen={(userId: string) => {
                            setSelectedProfileId(userId);
                            setRoute('profile');
                        }}
                    />
                ) : null;
            case 'createPost':
                return <CreatePost onClose={() => setRoute('profile')} onSuccess={() => setRoute('profile')} />;
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
        };
        return rev[r] || 'Home';
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {renderContent()}
            {!selectedPostId && !selectedChatId && <BottomNav activeRoute={mapRouteToBottom(route)} onRouteChange={(r) => setRoute(mapBottomToRoute(r))} />}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, flexDirection: 'column' },
    content: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
    // header and headerTitle removed, now handled by TopNavbar
    text: { fontSize: 16 },
});

export default LandingPage;