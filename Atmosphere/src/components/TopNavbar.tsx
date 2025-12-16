import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { Heart, Send } from 'lucide-react-native';

interface TopNavbarProps {
  title?: string;
  notificationsCount?: number;
  messagesCount?: number;
  onNotificationsPress?: () => void;
  onChatsPress?: () => void;
}

const TopNavbar: React.FC<TopNavbarProps> = ({
  title = 'Atmosphere',
  notificationsCount = 0,
  messagesCount = 3,
  onNotificationsPress,
  onChatsPress,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: visible ? 0 : -56 }] }]}>
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType="dark"
        blurAmount={15}
        overlayColor="rgba(0,0,0,0.7)"
      />
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

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    height: 56,
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 60,
    height: 56,
  },
  center: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 56,
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
    height: 56,
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
