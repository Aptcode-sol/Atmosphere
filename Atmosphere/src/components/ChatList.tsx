import React, { useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { getImageSource } from '../lib/image';

interface ChatListProps {
    chats: any[];
    currentUserId: string | null;
    onChatPress: (chatId: string) => void;
    emptyMessage?: string;
}

const ChatList: React.FC<ChatListProps> = ({ chats, currentUserId, onChatPress, emptyMessage }) => {
    const { theme } = useContext(ThemeContext);

    const renderChatItem = ({ item }: { item: any }) => {
        // Find the OTHER participant (not the current user)
        // If it's a group, use group info. If it's 1-on-1, use the other user.
        let name = '';
        let image = null;
        let isGroup = item.isGroup;

        if (isGroup) {
            name = item.groupName || 'Unnamed Group';
            image = item.groupImage;
        } else {
            const other = item.participants?.find((p: any) => p._id !== currentUserId) || item.participants?.[0] || {};
            name = other.displayName || other.username || 'User';
            image = other.avatarUrl;
        }

        const unreadCount = item.unreadCounts?.[currentUserId!] || 0;
        const hasUnread = unreadCount > 0;

        return (
            <TouchableOpacity
                style={[
                    styles.chatItem,
                    {
                        backgroundColor: hasUnread ? theme.primary + '15' : theme.cardBackground,
                        borderColor: hasUnread ? theme.primary : theme.border
                    }
                ]}
                onPress={() => onChatPress(item._id)}
            >
                <View style={styles.avatarContainer}>
                    <Image
                        source={getImageSource(image || 'https://via.placeholder.com/50')}
                        style={styles.avatar}
                    />
                    {hasUnread && (
                        <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
                            <Text style={styles.unreadBadgeText}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Text>
                        </View>
                    )}
                </View>
                <View style={styles.chatInfo}>
                    <Text
                        style={[
                            styles.chatName,
                            { color: theme.text },
                            hasUnread ? styles.unreadWeight : styles.readWeight
                        ]}
                        numberOfLines={1}
                    >
                        {name}
                    </Text>
                    <Text style={[styles.lastMessage, { color: theme.placeholder }]} numberOfLines={1}>
                        {item.lastMessage?.content || item.lastMessage?.body || 'No messages yet.'}
                    </Text>
                </View>
                {/* Optional: Add timestamp */}
                <Text style={[styles.timestamp, { color: theme.placeholder }]}>
                    {item.updatedAt ? new Date(item.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <FlatList
            data={chats}
            renderItem={renderChatItem}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={[styles.empty, { color: theme.placeholder }]}>{emptyMessage || 'No chats found.'}</Text>}
        />
    );
};

const styles = StyleSheet.create({
    list: { paddingBottom: 20 },
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginHorizontal: 8,
        marginBottom: 1,
        borderRadius: 0,
        borderBottomWidth: 1
    },
    avatarContainer: { position: 'relative', marginRight: 12 },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#e5e5e5'
    },
    unreadBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        minWidth: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff'
    },
    unreadBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        paddingHorizontal: 6
    },
    chatInfo: { flex: 1, justifyContent: 'center' },
    chatName: {
        fontSize: 15,
        marginBottom: 4
    },
    readWeight: { fontWeight: '600' },
    unreadWeight: { fontWeight: '700' },
    lastMessage: {
        fontSize: 13,
        marginTop: 0,
        opacity: 0.7
    },
    timestamp: {
        fontSize: 12,
        marginLeft: 8
    },
    empty: { textAlign: 'center', marginTop: 40, fontSize: 16 },
});

export default ChatList;
