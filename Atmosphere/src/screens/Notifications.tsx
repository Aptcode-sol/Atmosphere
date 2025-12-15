import React, { useState, useContext, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../lib/api';
import Icon from 'react-native-vector-icons/Ionicons';

interface NotificationItem {
    _id: string;
    type: 'like' | 'comment' | 'follow' | 'investment' | 'meeting' | 'milestone' | 'share' | 'crown';
    fromUser?: {
        _id: string;
        username: string;
        displayName?: string;
        avatarUrl?: string;
    };
    message?: string;
    target?: string;
    targetId?: string;
    read: boolean;
    createdAt: string;
}

const getNotificationIcon = (type: string): { name: string; color: string } => {
    switch (type) {
        case 'like':
            return { name: 'heart', color: '#ef4444' };
        case 'comment':
            return { name: 'chatbubble', color: '#22c55e' };
        case 'follow':
            return { name: 'person-add', color: '#3b82f6' };
        case 'investment':
            return { name: 'trending-up', color: '#10b981' };
        case 'meeting':
            return { name: 'calendar', color: '#f97316' };
        case 'milestone':
            return { name: 'trophy', color: '#eab308' };
        case 'share':
            return { name: 'share-social', color: '#a855f7' };
        case 'crown':
            return { name: 'ribbon', color: '#f59e0b' };
        default:
            return { name: 'notifications', color: '#6b7280' };
    }
};

const formatTimestamp = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
};

const getActionText = (type: string): string => {
    switch (type) {
        case 'like':
            return 'liked your post';
        case 'comment':
            return 'commented on your post';
        case 'follow':
            return 'started following you';
        case 'investment':
            return 'invested in your startup';
        case 'meeting':
            return 'invited you to a meeting';
        case 'milestone':
            return 'celebrated your milestone';
        case 'share':
            return 'shared your post';
        case 'crown':
            return 'crowned your post';
        default:
            return 'interacted with you';
    }
};

const Notifications = () => {
    const { theme } = useContext(ThemeContext) as any;
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const loadNotifications = useCallback(async (isRefreshing = false) => {
        if (!isRefreshing) setLoading(true);
        try {
            const data = await fetchNotifications(50, 0);
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
        } catch (err) {
            console.warn('Failed to load notifications:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    const onRefresh = () => {
        setRefreshing(true);
        loadNotifications(true);
    };

    const handleNotificationPress = async (notification: NotificationItem) => {
        if (!notification.read) {
            try {
                await markNotificationRead(notification._id);
                setNotifications(prev =>
                    prev.map(n => n._id === notification._id ? { ...n, read: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (err) {
                console.warn('Failed to mark notification as read:', err);
            }
        }
        // TODO: Navigate to relevant screen based on notification type
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.warn('Failed to mark all as read:', err);
        }
    };

    const renderNotification = ({ item }: { item: NotificationItem }) => {
        const iconInfo = getNotificationIcon(item.type);
        // Backend returns 'actor' (populated), fallback to 'fromUser' for compatibility
        const actorData = (item as any).actor || item.fromUser;
        const userName = actorData?.displayName || actorData?.username || 'Someone';
        const avatarUrl = actorData?.avatarUrl;

        return (
            <TouchableOpacity
                style={[
                    styles.notificationItem,
                    !item.read && styles.unreadItem,
                    { borderBottomColor: theme.border }
                ]}
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.7}
            >
                {/* Avatar with Icon Badge */}
                <View style={styles.avatarContainer}>
                    {avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarText}>
                                {userName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                    <View style={[styles.iconBadge, { backgroundColor: iconInfo.color }]}>
                        <Icon name={iconInfo.name} size={10} color="#fff" />
                    </View>
                </View>

                {/* Content */}
                <View style={styles.contentContainer}>
                    <Text style={[styles.notificationText, { color: theme.text }]}>
                        <Text style={styles.userName}>{userName}</Text>
                        {' '}
                        <Text style={{ color: theme.placeholder }}>{item.message || getActionText(item.type)}</Text>
                        {item.target && (
                            <Text style={{ color: theme.text }}> "{item.target}"</Text>
                        )}
                    </Text>
                    <Text style={[styles.timestamp, { color: theme.placeholder }]}>
                        {formatTimestamp(item.createdAt)}
                    </Text>
                </View>

                {/* Unread Indicator */}
                {!item.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Icon name="notifications-outline" size={64} color={theme.placeholder} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No notifications yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.placeholder }]}>
                When you get notifications, they'll show up here
            </Text>
        </View>
    );

    const renderHeader = () => (
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Notifications</Text>
            {unreadCount > 0 && (
                <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
                    <Text style={[styles.markAllText, { color: theme.primary }]}>Mark all read</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {renderHeader()}
            <FlatList
                data={notifications}
                keyExtractor={(item) => item._id}
                renderItem={renderNotification}
                contentContainerStyle={notifications.length === 0 ? styles.emptyList : undefined}
                ListEmptyComponent={renderEmptyState}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.primary}
                        title="Pull to refresh"
                        titleColor={theme.text}
                    />
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    markAllBtn: {
        padding: 4,
    },
    markAllText: {
        fontSize: 14,
        fontWeight: '600',
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    unreadItem: {
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    avatarPlaceholder: {
        backgroundColor: '#374151',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    iconBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#000',
    },
    contentContainer: {
        flex: 1,
    },
    notificationText: {
        fontSize: 14,
        lineHeight: 20,
    },
    userName: {
        fontWeight: '600',
    },
    timestamp: {
        fontSize: 12,
        marginTop: 4,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#3b82f6',
        marginLeft: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyList: {
        flex: 1,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
    },
});

export default Notifications;
