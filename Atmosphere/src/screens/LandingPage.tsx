import React, { useState, useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from '../contexts/ThemeContext';
import Search from './Search';
import Notifications from './Notifications';
import Chats from './Chats';
import Reels from './Reels';
import Profile from './Profile';
import Home from './Home';
import BottomNav from '../components/BottomNav';
import TopStartups from './TopStartups';
import TradingSection from './TradingSection';
import Jobs from './Jobs';
import Meetings from './Meetings';
import SetupProfile from './SetupProfile';

type RouteKey = 'home' | 'search' | 'notifications' | 'chats' | 'reels' | 'profile' | 'topstartups' | 'trade' | 'jobs' | 'meetings' | 'setup' | 'chatDetail';

const LandingPage = () => {
    const navigation: any = useNavigation();

    const { theme } = useContext(ThemeContext);
    const [route, setRoute] = useState<RouteKey>('home');

    const handlePostPress = (postId: string) => navigation.navigate('PostDetail', { postId });

    const handleChatSelect = (chatId: string) => navigation.navigate('ChatDetail', { chatId });

    const renderContent = () => {
        switch (route) {
            case 'home':
                return <Home onNavigate={(r) => setRoute(r)} onChatSelect={handleChatSelect} onOpenProfile={(id: string) => { navigation.navigate('Profile', { userId: id }); }} />;
            case 'search':
                return <Search onPostPress={handlePostPress} />;
            case 'notifications':
                return <Notifications />;
            case 'chats':
                return <Chats onChatSelect={handleChatSelect} />;
            case 'reels':
                return <Reels />;
            case 'profile':
                return <Profile onNavigate={(r: RouteKey) => setRoute(r)} />;
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
                return null; // navigation handles chat detail route
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
        };
        return rev[r] || 'Home';
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {renderContent()}
            <BottomNav activeRoute={mapRouteToBottom('home')} onRouteChange={(r) => navigation.navigate(mapBottomToRoute(r) as any)} />
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