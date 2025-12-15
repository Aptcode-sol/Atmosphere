import React, { useState, useContext, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Image,
    FlatList,
    ActivityIndicator
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { ThemeContext } from '../contexts/ThemeContext';
import { getFollowersList, getFollowingList } from '../lib/api';
import { getImageSource } from '../lib/image';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NewChatModalProps {
    visible: boolean;
    onClose: () => void;
    onUserSelect: (userId: string, user: any) => void;
}

interface User {
    _id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    verified?: boolean;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ visible, onClose, onUserSelect }) => {
    const { theme } = useContext(ThemeContext);
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'followers' | 'following'>('following');

    useEffect(() => {
        if (visible) {
            fetchUsers();
        } else {
            setSearchQuery('');
        }
    }, [visible, activeTab]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const userJson = await AsyncStorage.getItem('user');
            if (userJson) {
                const user = JSON.parse(userJson);
                const userId = user._id || user.id;

                let list: any[];
                if (activeTab === 'followers') {
                    list = await getFollowersList(userId);
                    list = list.map(item => item.follower || item);
                } else {
                    list = await getFollowingList(userId);
                    list = list.map(item => item.following || item);
                }

                setUsers(list);
                setFilteredUsers(list);
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredUsers(users);
        } else {
            const query = searchQuery.toLowerCase();
            setFilteredUsers(users.filter(user =>
                user.username?.toLowerCase().includes(query) ||
                user.displayName?.toLowerCase().includes(query)
            ));
        }
    }, [searchQuery, users]);

    const handleUserPress = (user: User) => {
        onUserSelect(user._id, user);
        onClose();
        setSearchQuery('');
    };

    const renderUser = ({ item }: { item: User }) => (
        <TouchableOpacity
            style={[styles.userItem, { borderBottomColor: theme.border }]}
            onPress={() => handleUserPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.avatarContainer}>
                <Image
                    source={getImageSource(item.avatarUrl)}
                    style={styles.avatar}
                />
                <View style={[styles.onlineIndicator, { backgroundColor: '#4CAF50', borderColor: theme.background }]} />
            </View>
            <View style={styles.userInfo}>
                <View style={styles.nameRow}>
                    <Text style={[styles.displayName, { color: theme.text }]} numberOfLines={1}>
                        {item.displayName || item.username}
                    </Text>
                    {item.verified && (
                        <MaterialIcons name="verified" size={16} color="#1DA1F2" style={styles.verifiedIcon} />
                    )}
                </View>
                <Text style={[styles.username, { color: theme.placeholder }]} numberOfLines={1}>
                    @{item.username}
                </Text>
            </View>
            <View style={[styles.messageButton, { backgroundColor: theme.primary + '20' }]}>
                <MaterialIcons name="chat-bubble-outline" size={20} color={theme.primary} />
            </View>
        </TouchableOpacity>
    );

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: theme.border }]}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <MaterialIcons name="close" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: theme.text }]}>New Message</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Search Bar */}
                <View style={[styles.searchContainer, { backgroundColor: theme.cardBackground || '#2A2A2A' }]}>
                    <MaterialIcons name="search" size={20} color={theme.placeholder} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.text }]}
                        placeholder="Search by name or username..."
                        placeholderTextColor={theme.placeholder}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <MaterialIcons name="close" size={18} color={theme.placeholder} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Tabs */}
                <View style={[styles.tabContainer, { borderBottomColor: theme.border }]}>
                    <TouchableOpacity
                        style={[
                            styles.tab,
                            activeTab === 'following' && [styles.activeTab, { borderBottomColor: theme.primary }]
                        ]}
                        onPress={() => setActiveTab('following')}
                    >
                        <MaterialIcons
                            name="person-add"
                            size={18}
                            color={activeTab === 'following' ? theme.primary : theme.placeholder}
                        />
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === 'following' ? theme.primary : theme.placeholder }
                        ]}>
                            Following
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.tab,
                            activeTab === 'followers' && [styles.activeTab, { borderBottomColor: theme.primary }]
                        ]}
                        onPress={() => setActiveTab('followers')}
                    >
                        <MaterialIcons
                            name="people"
                            size={18}
                            color={activeTab === 'followers' ? theme.primary : theme.placeholder}
                        />
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === 'followers' ? theme.primary : theme.placeholder }
                        ]}>
                            Followers
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* User List */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.primary} />
                        <Text style={[styles.loadingText, { color: theme.placeholder }]}>
                            Loading...
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredUsers}
                        renderItem={renderUser}
                        keyExtractor={item => item._id}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <MaterialIcons
                                    name={searchQuery ? 'search-off' : 'people-outline'}
                                    size={64}
                                    color={theme.placeholder}
                                />
                                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                                    {searchQuery ? 'No results found' : `No ${activeTab} yet`}
                                </Text>
                                <Text style={[styles.emptySubtitle, { color: theme.placeholder }]}>
                                    {searchQuery
                                        ? 'Try a different search term'
                                        : activeTab === 'following'
                                            ? 'Follow people to start conversations'
                                            : 'People who follow you will appear here'
                                    }
                                </Text>
                            </View>
                        }
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    title: {
        fontSize: 18,
        fontWeight: '700'
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginVertical: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        gap: 12
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        padding: 0
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
        gap: 8
    },
    activeTab: {
        borderBottomWidth: 2
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600'
    },
    list: {
        paddingBottom: 20
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth
    },
    avatarContainer: {
        position: 'relative'
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#333'
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2
    },
    userInfo: {
        flex: 1,
        marginLeft: 14
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    displayName: {
        fontSize: 16,
        fontWeight: '600'
    },
    verifiedIcon: {
        marginLeft: 4
    },
    username: {
        fontSize: 14,
        marginTop: 2
    },
    messageButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12
    },
    loadingText: {
        fontSize: 14
    },
    emptyContainer: {
        paddingTop: 80,
        alignItems: 'center',
        paddingHorizontal: 40
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20
    }
});

export default NewChatModal;
