import React, { useEffect, useState, useContext } from "react";
import { View, TouchableOpacity, StyleSheet, DeviceEventEmitter } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "@react-native-community/blur";
import {
  Home,
  Search,
  Film,
  User,
  Rocket,
  TrendingUp,
  Briefcase,
  Calendar
} from "lucide-react-native";
import { NavigationContext, NavigationRouteContext } from "@react-navigation/native";
import { BOTTOM_NAV_HEIGHT } from '../lib/layout';

type AppMode = "left" | "right";

const NAV_MODE_KEY = "navMode";

const leftModeTabs = [
  { id: "home", Icon: Home, label: "Home", route: "Home" },
  { id: "search", Icon: Search, label: "Search", route: "Search" },
  { id: "reels", Icon: Film, label: "Reels", route: "Reels" },
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

  const [appMode, setAppMode] = useState<AppMode>("left");
  const [lastLeftPage, setLastLeftPage] = useState<string>(leftModeTabs[0].route);
  const [lastRightPage, setLastRightPage] = useState<string>(rightModeTabs[0].route);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(NAV_MODE_KEY);
        if (stored === "left" || stored === "right") {
          setAppMode(stored);
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
    <View style={styles.container}>
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType="dark"
        blurAmount={20}
        overlayColor="transparent"
      />
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
              <IconComponent
                color={active ? "#fff" : "#9aa0a6"}
                size={26}
                strokeWidth={active ? 2.5 : 1.5}
              />
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
          const IconComponent = tab.Icon;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => handleTabPress(tab.route)}
              style={[styles.tab]}
              activeOpacity={0.8}
            >
              <IconComponent
                color={active ? "#fff" : "#9aa0a6"}
                size={26}
                strokeWidth={active ? 2.5 : 1.5}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.15)",
    height: BOTTOM_NAV_HEIGHT + 50,
    paddingVertical: 0,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    overflow: 'hidden', // Ensure blur stays within bounds if rounded
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginHorizontal: 12,
    height: BOTTOM_NAV_HEIGHT + 40,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: BOTTOM_NAV_HEIGHT + 20,
    borderRadius: 18,
    marginHorizontal: 4,
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
