import React, { useEffect, useState, useContext } from "react";
import { View, TouchableOpacity, StyleSheet, DeviceEventEmitter, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Home,
  Search,
  Film,
  User,
  Rocket,
  TrendingUp,
  Briefcase,
  Calendar,
  SquarePlay,
} from "lucide-react-native";
import ReelsIcon from './icons/ReelsIcon';
import ReelsOutline from './icons/ReelsOutline';
import HomeFilled from './icons/HomeFilled';
import HomeOutline from './icons/HomeOutline';


import { NavigationContext, NavigationRouteContext } from "@react-navigation/native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type AppMode = "left" | "right";

const NAV_MODE_KEY = "navMode";

const leftModeTabs = [
  { id: "home", Icon: Home, label: "Home", route: "Home" },
  { id: "search", Icon: Search, label: "Search", route: "Search" },
  { id: "reels", Icon: SquarePlay, label: "Reels", route: "Reels" },
  { id: "profile", Icon: User, label: "Profile", route: "Profile" },
];

const rightModeTabs = [
  { id: "launch", Icon: Rocket, label: "Launch", route: "Launch" },
  { id: "trade", Icon: TrendingUp, label: "Trade", route: "Trade" },
  { id: "opportunities", Icon: Briefcase, label: "Opportunities", route: "Opportunities" },
  { id: "meetings", Icon: Calendar, label: "Meetings", route: "Meetings" },
];

type BottomNavProps = {
  onRouteChange?: (routeName: string) => void;
  activeRoute?: string;
};

const BottomNav: React.FC<BottomNavProps> = ({ onRouteChange, activeRoute }) => {
  const navigation = useContext(NavigationContext) as any | undefined;
  const route = useContext(NavigationRouteContext) as any | undefined;
  const insets = useSafeAreaInsets();

  const [appMode, setAppMode] = useState<AppMode>("left");
  const [lastLeftPage, setLastLeftPage] = useState<string>(leftModeTabs[0].route);
  const [lastRightPage, setLastRightPage] = useState<string>(rightModeTabs[0].route);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(NAV_MODE_KEY);
        if (stored === "left" || stored === "right") {
          setAppMode(stored);
        }
        // Load user avatar
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) {
          const user = JSON.parse(userJson);
          setUserAvatarUrl(user.avatarUrl || null);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(NAV_MODE_KEY, appMode);
      } catch {
        // ignore
      }
    })();
  }, [appMode]);

  useEffect(() => {
    const name = route?.name as string | undefined;
    if (!name) return;
    if (leftModeTabs.some((t) => t.route === name)) setLastLeftPage(name);
    if (rightModeTabs.some((t) => t.route === name)) setLastRightPage(name);
  }, [route?.name]);

  const tabs = appMode === "left" ? leftModeTabs : rightModeTabs;

  const handleTabPress = (tabRoute: string) => {
    if (isTabActive(tabRoute)) {
      DeviceEventEmitter.emit(`scrollToTop_${tabRoute}`);
      return;
    }
    if (onRouteChange) {
      onRouteChange(tabRoute);
      return;
    }
    if (navigation && typeof navigation.navigate === 'function') {
      navigation.navigate(tabRoute);
    }
  };

  const toggleMode = () => {
    if (appMode === "left") {
      setAppMode("right");
      handleTabPress(lastRightPage);
    } else {
      setAppMode("left");
      handleTabPress(lastLeftPage);
    }
  };

  const shouldHideMobileNav = false;

  const isTabActive = (tabRoute: string) => {
    const current = activeRoute || (route?.name as string | undefined);
    if (!current) return false;
    return current === tabRoute;
  };

  if (shouldHideMobileNav) return null;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.row}>
        {tabs.slice(0, 2).map((tab) => {
          const active = isTabActive(tab.route);
          const IconComponent = tab.Icon;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => handleTabPress(tab.route)}
              style={[styles.tab]}
              activeOpacity={0.8}
            >
              <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: active && tab.id === 'home' ? '#111' : 'transparent' }}>
                {tab.id === 'home' ? (
                  active ? (
                    <HomeFilled color="#fff" size={24} />
                  ) : (
                    <HomeOutline color="#fff" size={24} />
                  )
                ) : (
                  <IconComponent
                    color="#fff"
                    size={26}
                    strokeWidth={active ? 2.5 : 1.4}
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity onPress={toggleMode} style={styles.toggle} activeOpacity={0.8}>
          <View style={[styles.toggleTrack]}>
            <View style={[styles.toggleThumb, appMode === "left" ? styles.thumbLeft : styles.thumbRight]} />
          </View>
        </TouchableOpacity>

        {tabs.slice(2, 4).map((tab) => {
          const active = isTabActive(tab.route);

          // Render profile as avatar with border, or user icon with border
          if (tab.id === 'profile') {
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => handleTabPress(tab.route)}
                style={[styles.tab]}
                activeOpacity={0.8}
              >
                {userAvatarUrl ? (
                  <Image
                    source={{ uri: userAvatarUrl }}
                    style={[styles.avatarIcon, active && styles.avatarIconActive]}
                  />
                ) : (
                  <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? '#111' : 'transparent' }}>
                    <User
                      color="#fff"
                      size={22}
                      strokeWidth={active ? 2.5 : 1.2}
                    />
                  </View>
                )}
              </TouchableOpacity>
            );
          }

          // Render reels with filled/outline icons
          const IconComponent = tab.Icon;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => handleTabPress(tab.route)}
              style={[styles.tab]}
              activeOpacity={0.8}
            >
              <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? '#111' : 'transparent' }}>
                {tab.id === 'reels' ? (
                  active ? (
                    <ReelsIcon color="#fff" size={24} />
                  ) : (
                    <ReelsOutline color="#fff" size={24} />
                  )
                ) : (
                  <IconComponent
                    color="#fff"
                    size={26}
                    strokeWidth={active ? 2.5 : 1.2}
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}}
      </View>
    </View>
  );
};

const NAV_HEIGHT = 50; // Fixed nav bar content height

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000",
    // paddingBottom is applied dynamically via insets
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginHorizontal: 12,
    height: NAV_HEIGHT,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: NAV_HEIGHT,
    borderRadius: 18,
    marginHorizontal: 4,
  },
  avatarIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarIconActive: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  toggle: {
    width: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleTrack: {
    width: 54,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgb(46, 46, 46)",
    padding: 3,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgb(46, 46, 46)",
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#404040",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  thumbLeft: {
    alignSelf: "flex-start",
    marginLeft: 1,
  },
  thumbRight: {
    alignSelf: "flex-end",
    marginRight: 1,
  },
});


export default BottomNav;
