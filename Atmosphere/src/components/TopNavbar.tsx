import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Heart, Send } from 'lucide-react-native';

interface TopNavbarProps {
  title?: string;
  notificationsCount?: number;
  messagesCount?: number;
  onNotificationsPress?: () => void;
  onChatsPress?: () => void;
  scrollY?: Animated.Value;
}

const NAVBAR_HEIGHT = 56;

const TopNavbar: React.FC<TopNavbarProps> = ({
  title = 'Atmosphere ',
  notificationsCount = 0,
  messagesCount = 3,
  onNotificationsPress,
  onChatsPress,
  scrollY,
}) => {
  // If scrollY is provided, use it for animation
  const translateY = scrollY ? scrollY.interpolate({
    inputRange: [0, NAVBAR_HEIGHT, NAVBAR_HEIGHT * 2],
    outputRange: [0, 0, -NAVBAR_HEIGHT],
    extrapolate: 'clamp',
  }) : 0;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <View style={styles.inner}>
        {/* LEFT SIDE */}
        <View style={styles.left}>
          <TouchableOpacity onPress={onNotificationsPress} style={styles.iconButton}>
            <Heart size={26} color="#fff" />
            {notificationsCount > 0 && <View style={styles.badge} />}
          </TouchableOpacity>
        </View>

        {/* CENTER LOGO */}
        <View style={styles.center}>
          <Text style={styles.title}>{title}</Text>
        </View>

        {/* RIGHT SIDE */}
        <View style={styles.right}>
          <TouchableOpacity onPress={onChatsPress} style={styles.iconButton}>
            <Send size={26} color="#fff" />
            {messagesCount > 0 && (
              <View style={styles.msgBadge}>
                <Text style={styles.msgBadgeText}>{messagesCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

// Static method to create scroll handler
export const createScrollHandler = (
  scrollY: Animated.Value,
  lastScrollY: React.MutableRefObject<number>,
  navbarVisible: Animated.Value
) => {
  return (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const diff = currentY - lastScrollY.current;

    if (currentY <= 0) {
      // At top, always show
      Animated.spring(navbarVisible, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
    } else if (diff > 10) {
      // Scrolling down, hide
      Animated.spring(navbarVisible, {
        toValue: -NAVBAR_HEIGHT,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
    } else if (diff < -10) {
      // Scrolling up, show
      Animated.spring(navbarVisible, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
    }

    lastScrollY.current = currentY;
  };
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    height: NAVBAR_HEIGHT,
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: '#000',
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: NAVBAR_HEIGHT,
    paddingHorizontal: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 60,
    height: NAVBAR_HEIGHT,
  },
  center: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: NAVBAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  title: {
    fontSize: 26,
    fontFamily: 'Pacifico-Regular',
    color: '#fff',
    textAlign: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 60,
    height: NAVBAR_HEIGHT,
    justifyContent: 'flex-end',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e74c3c',
    borderWidth: 1,
    borderColor: '#fff',
  },
  msgBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#e67e22',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    borderWidth: 1,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
  },
  msgBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default TopNavbar;
