/* eslint-disable react-native/no-inline-styles */
import React, { useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    TextInput
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { ThemeContext } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchChats, createOrFindChat } from '../lib/api';
import ChatList from '../components/ChatList';
import GroupList from '../components/GroupList';
import CreateGroupModal from '../components/CreateGroupModal';
import NewChatModal from '../components/NewChatModal';
import useSocket from '../hooks/useSocket';

interface ChatsProps {
    onChatSelect?: (chatId: string) => void;
}

const Chats = ({ onChatSelect }: ChatsProps) => {
    const { theme } = useContext(ThemeContext);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'chats' | 'groups'>('chats');

    const [chats, setChats] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateGroupVisible, setCreateGroupVisible] = useState(false);
    const [isNewChatVisible, setNewChatVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Socket for real-time updates
    const { isConnected, onNewMessage } = useSocket();

    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const userJson = await AsyncStorage.getItem('user');
                if (userJson) {
                    const user = JSON.parse(userJson);
                    setCurrentUserId(user._id || user.id);
                }
            } catch (err) {
                console.error('Error fetching current user:', err);
            }
        };
        fetchCurrentUser();
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            if (activeTab === 'chats') {
                const data = await fetchChats('private');
                setChats(data);
            } else {
                const data = await fetchChats('group');
                setGroups(data);
            }
        } catch (err) {
            console.error('Error loading chats:', err);
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Filter chats based on search query
    const filteredChats = useMemo(() => {
        if (!searchQuery.trim()) return chats;
        const query = searchQuery.toLowerCase();
        return chats.filter(chat => {
            const other = chat.participants?.find((p: any) => p._id !== currentUserId) || chat.participants?.[0] || {};
            const name = (other.displayName || other.username || '').toLowerCase();
            return name.includes(query);
        });
    }, [chats, searchQuery, currentUserId]);

    // Filter groups based on search query
    const filteredGroups = useMemo(() => {
        if (!searchQuery.trim()) return groups;
        const query = searchQuery.toLowerCase();
        return groups.filter(group => {
            const name = (group.groupName || '').toLowerCase();
            return name.includes(query);
        });
    }, [groups, searchQuery]);

    // Listen for new messages to update chat list in real-time
    useEffect(() => {
        const unsubscribe = onNewMessage((data) => {
            const { message, chatId } = data;

            // Helper to update and sort a list
            const processList = (list: any[]) => {
                const chatExists = list.some(c => c._id === chatId);
                if (!chatExists) return null; // Chat not in this list

                return list.map(chat => {
                    if (chat._id === chatId) {
                        const newUnreadCount = message.sender._id !== currentUserId
                            ? (chat.unreadCounts?.[currentUserId!] || 0) + 1
                            : chat.unreadCounts?.[currentUserId!] || 0;

                        return {
                            ...chat,
                            lastMessage: message,
                            updatedAt: new Date().toISOString(),
                            unreadCounts: {
                                ...chat.unreadCounts,
                                [currentUserId!]: newUnreadCount
                            }
                        };
                    }
                    return chat;
                }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            };

            // Update chats list
            setChats(prevChats => {
                const updated = processList(prevChats);
                if (updated) return updated;
                // If not in chats, maybe check if it should be added? 
                // For now, if it's a private chat not in list, we might want to reload or add it.
                // But simplest is to respect the current list or reload if missing.
                return prevChats;
            });

            // Update groups list
            setGroups(prevGroups => {
                const updated = processList(prevGroups);
                if (updated) return updated;
                return prevGroups;
            });

            // If chat wasn't found in either (new chat), reload data
            // We can't easily know if it was found inside the setState callbacks here
            // without complex logic. A simple heuristic: checking current state might be stale.
            // But usually for *new* chats, we accept a reload might be needed or we just add it.
            // For robust syncing, let's just trigger a reload if we suspect we missed it,
            // but for now the functional update handles existing chats sorting correctly.
        });

        return unsubscribe;
    }, [onNewMessage, currentUserId]);

    const handleChatPress = (chatId: string) => {
        setChats(prev => prev.map(chat =>
            chat._id === chatId
                ? { ...chat, unreadCounts: { ...chat.unreadCounts, [currentUserId!]: 0 } }
                : chat
        ));
        setGroups(prev => prev.map(group =>
            group._id === chatId
                ? { ...group, unreadCounts: { ...group.unreadCounts, [currentUserId!]: 0 } }
                : group
        ));
        onChatSelect?.(chatId);
    };

    const handleNewChat = async (userId: string, _user: any) => {
        try {
            const result = await createOrFindChat(userId);
            if (result?.chat?._id) {
                loadData();
                onChatSelect?.(result.chat._id);
            }
        } catch (err) {
            console.error('Failed to create chat:', err);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.background }]}>
                <View style={styles.titleRow}>
                    <Text style={[styles.pageTitle, { color: theme.text }]}>Messages</Text>
                    <View style={styles.headerRight}>
                        {isConnected && (
                            <View style={styles.connectionIndicator}>
                                <MaterialIcons name="wifi" size={16} color="#4CAF50" />
                            </View>
                        )}
                    </View>
                </View>

                {/* Search Bar */}
                <View style={[styles.searchContainer, { backgroundColor: theme.cardBackground || '#2A2A2A' }]}>
                    <MaterialIcons name="search" size={20} color={theme.placeholder} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.text }]}
                        placeholder="Search conversations..."
                        placeholderTextColor={theme.placeholder}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                            <MaterialIcons name="close" size={18} color={theme.placeholder} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Tabs */}
                <View style={[styles.tabContainer, { borderBottomColor: theme.border }]}>
                    <TouchableOpacity
                        style={[
                            styles.tab,
                            activeTab === 'chats' && [styles.activeTab, { borderBottomColor: theme.primary }]
                        ]}
                        onPress={() => setActiveTab('chats')}
                    >
                        <MaterialIcons
                            name="chat-bubble-outline"
                            size={18}
                            color={activeTab === 'chats' ? theme.primary : theme.placeholder}
                            style={styles.tabIcon}
                        />
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === 'chats' ? theme.primary : theme.placeholder }
                        ]}>
                            Chats
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.tab,
                            activeTab === 'groups' && [styles.activeTab, { borderBottomColor: theme.primary }]
                        ]}
                        onPress={() => setActiveTab('groups')}
                    >
                        <MaterialIcons
                            name="group"
                            size={18}
                            color={activeTab === 'groups' ? theme.primary : theme.placeholder}
                            style={styles.tabIcon}
                        />
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === 'groups' ? theme.primary : theme.placeholder }
                        ]}>
                            Groups
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                ) : (
                    activeTab === 'chats' ? (
                        <ChatList
                            chats={filteredChats}
                            currentUserId={currentUserId}
                            onChatPress={handleChatPress}
                            emptyMessage={searchQuery ? 'No chats found' : undefined}
                        />
                    ) : (
                        <GroupList
                            groups={filteredGroups}
                            currentUserId={currentUserId}
                            onChatPress={handleChatPress}
                            onCreateGroupPress={() => setCreateGroupVisible(true)}
                        />
                    )
                )}
            </View>

            {/* FAB for New Chat */}
            {activeTab === 'chats' && (
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: theme.primary }]}
                    onPress={() => setNewChatVisible(true)}
                    activeOpacity={0.85}
                >
                    <MaterialIcons name="edit" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            )}

            {/* Modals */}
            <NewChatModal
                visible={isNewChatVisible}
                onClose={() => setNewChatVisible(false)}
                onUserSelect={handleNewChat}
            />

            <CreateGroupModal
                visible={isCreateGroupVisible}
                onClose={() => setCreateGroupVisible(false)}
                onGroupCreated={() => {
                    setCreateGroupVisible(false);
                    loadData();
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    header: {
        paddingTop: 16,
        paddingBottom: 0
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 16
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    connectionIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
        borderRadius: 12
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16
    },
    searchIcon: {
        marginRight: 12
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        padding: 0
    },
    clearButton: {
        padding: 4
    },
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 6
    },
    activeTab: {
        borderBottomWidth: 2
    },
    tabIcon: {
        marginRight: 4
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600'
    },
    content: {
        flex: 1
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    fab: {
        position: 'absolute',
        bottom: 28,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8
    }
});

export default Chats;
