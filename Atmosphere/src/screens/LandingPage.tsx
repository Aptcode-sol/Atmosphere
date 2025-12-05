import React, { useState, useContext } from 'react';
import { View, StyleSheet } from 'react-native';
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

type RouteKey = 'home' | 'search' | 'notifications' | 'chats' | 'reels' | 'profile' | 'topstartups' | 'trade' | 'jobs' | 'meetings';


const LandingPage = () => {
    const [route, setRoute] = useState<RouteKey>('home');
    const { theme } = useContext(ThemeContext);

    const renderContent = () => {
        switch (route) {
            case 'home':
                return <Home />;
            case 'search':
                return <Search />;
            case 'notifications':
                return <Notifications />;
            case 'chats':
                return <Chats />;
            case 'reels':
                return <Reels />;
            case 'profile':
                return <Profile />;
            case 'topstartups':
                return <TopStartups />;
            case 'trade':
                return <TradingSection />;
            case 'jobs':
                return <Jobs />;
            case 'meetings':
                return <Meetings />;
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
            topstartups: 'Launch',
            trade: 'Trade',
            jobs: 'Opportunities',
            meetings: 'Meetings',
        };
        return rev[r] || 'Home';
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Atmosphere</Text>
            </View> */}

            {renderContent()}

            <BottomNav activeRoute={mapRouteToBottom(route)} onRouteChange={(r) => setRoute(mapBottomToRoute(r))} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
    header: { height: 64, paddingHorizontal: 16, paddingTop: 12, justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#00000010' },
    headerTitle: { fontSize: 20, fontWeight: '700' },
    text: { fontSize: 16 },
});

export default LandingPage;