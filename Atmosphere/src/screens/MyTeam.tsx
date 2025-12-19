import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    Image,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { searchUsers, fetchMyTeam, addToMyTeam, removeFromMyTeam } from '../lib/api';
import { getImageSource } from '../lib/image';

interface User {
    _id: string;
    id?: string;
    displayName?: string;
    username?: string;
    avatarUrl?: string;
    avatar?: string;
    profileImage?: string;
    accountType?: string;
    roles?: string[];
}

interface MyTeamProps {
    onBack: () => void;
}

const MyTeam: React.FC<MyTeamProps> = ({ onBack }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [teamMembers, setTeamMembers] = useState<User[]>([]);
    const [loadingInfo, setLoadingInfo] = useState({ search: false, team: true });

    // Search timeout ref for debounce
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const loadTeam = useCallback(async () => {
        try {
            const members = await fetchMyTeam();
            setTeamMembers(members);
        } catch (err) {
            console.error('Failed to load team', err);
        } finally {
            setLoadingInfo(prev => ({ ...prev, team: false }));
        }
    }, []);

    useEffect(() => {
        loadTeam();
    }, [loadTeam]);

    const handleSearch = (text: string) => {
        setSearchQuery(text);

        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        if (!text.trim()) {
            setSearchResults([]);
            return;
        }

        setLoadingInfo(prev => ({ ...prev, search: true }));
        searchTimeout.current = setTimeout(async () => {
            try {
                // Filter for 'personal' accounts only
                const results = await searchUsers(text, 'personal');
                // Filter out current team members from search results to avoid duplicate 'Add' actions visual clutter?
                // Or just show them with "Added" status.
                setSearchResults(results);
            } catch (err) {
                console.error('Search failed', err);
            } finally {
                setLoadingInfo(prev => ({ ...prev, search: false }));
            }
        }, 500);
    };

    const handleAdd = async (user: User) => {
        try {
            const addedMember = await addToMyTeam(user._id || user.id!);
            setTeamMembers(prev => [addedMember, ...prev]);
            Alert.alert('Success', 'Team member added');
            // Clear search to focus on team? Or keep it open.
            setSearchQuery('');
            setSearchResults([]);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to add member');
        }
    };

    const handleRemove = async (userId: string) => {
        Alert.alert(
            'Remove Member',
            'Are you sure you want to remove this member?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await removeFromMyTeam(userId);
                            setTeamMembers(prev => prev.filter(m => (m._id || m.id) !== userId));
                        } catch (err: any) {
                            Alert.alert('Error', err.message || 'Failed to remove member');
                        }
                    }
                }
            ]
        );
    };

    const renderSearchResult = ({ item }: { item: User }) => {
        const isAdded = teamMembers.some(m => (m._id || m.id) === (item._id || item.id));
        return (
            <View style={styles.resultItem}>
                <Image
                    source={getImageSource(item.avatarUrl || item.avatar || item.profileImage)}
                    style={styles.avatar}
                />
                <View style={styles.info}>
                    <Text style={styles.name}>{item.displayName || item.username}</Text>
                    <Text style={styles.subtext}>Personal Account</Text>
                </View>
                {!isAdded ? (
                    <TouchableOpacity style={styles.addBtn} onPress={() => handleAdd(item)}>
                        <Text style={styles.addBtnText}>Add</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.addedBadge}>
                        <Text style={styles.addedText}>Added</Text>
                    </View>
                )}
            </View>
        );
    };

    const renderTeamMember = ({ item }: { item: User }) => {
        return (
            <View style={styles.memberItem}>
                <Image
                    source={getImageSource(item.avatarUrl || item.avatar || item.profileImage)}
                    style={styles.avatarLarge}
                />
                <View style={styles.info}>
                    <Text style={styles.nameLarge}>{item.displayName || item.username}</Text>
                    <Text style={styles.roleText}>{item.roles && item.roles.length > 0 ? item.roles[0] : 'Team Member'}</Text>
                </View>
                <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item._id || item.id!)}>
                    <MaterialIcons name="close" size={20} color="#ff4444" />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>
                <View style={styles.searchBar}>
                    <MaterialIcons name="search" size={20} color="#888" style={styles.searchIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Search Personal Accounts..."
                        placeholderTextColor="#666"
                        value={searchQuery}
                        onChangeText={handleSearch}
                        autoFocus={false}
                    />
                    {loadingInfo.search && <ActivityIndicator size="small" color="#fff" />}
                </View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <View style={styles.content}>
                    {searchQuery.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Search Results</Text>
                            {searchResults.length === 0 && !loadingInfo.search ? (
                                <Text style={styles.emptyText}>No personal accounts found.</Text>
                            ) : (
                                <FlatList
                                    data={searchResults}
                                    keyExtractor={item => item._id || item.id || Math.random().toString()}
                                    renderItem={renderSearchResult}
                                    style={styles.list}
                                />
                            )}
                        </View>
                    )}

                    <View style={[styles.section, { flex: 1, marginTop: searchQuery.length > 0 ? 16 : 0 }]}>
                        <Text style={styles.sectionTitle}>My Team Members ({teamMembers.length})</Text>
                        {loadingInfo.team ? (
                            <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
                        ) : teamMembers.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No team members yet.</Text>
                                <Text style={styles.emptySubtext}>Search above to add people to your team.</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={teamMembers}
                                keyExtractor={item => item._id || item.id || Math.random().toString()}
                                renderItem={renderTeamMember}
                                style={styles.list}
                            />
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#111',
    },
    backBtn: {
        marginRight: 12,
        padding: 4,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        paddingHorizontal: 12,
        height: 40,
    },
    searchIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 15,
        paddingVertical: 0,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        // marginBottom: 20,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    list: {
        flexGrow: 0,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#111',
        borderRadius: 12,
        marginBottom: 8,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#111',
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#222',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#333',
        marginRight: 12,
    },
    avatarLarge: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#333',
        marginRight: 16,
    },
    info: {
        flex: 1,
    },
    name: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    nameLarge: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    subtext: {
        color: '#888',
        fontSize: 12,
    },
    roleText: {
        color: '#aaa',
        fontSize: 13,
    },
    addBtn: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
    },
    addBtnText: {
        color: '#000',
        fontWeight: '600',
        fontSize: 12,
    },
    addedBadge: {
        backgroundColor: '#222',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    addedText: {
        color: '#888',
        fontSize: 12,
    },
    removeBtn: {
        padding: 8,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        color: '#888',
        fontSize: 16,
        fontStyle: 'italic',
    },
    emptySubtext: {
        color: '#555',
        fontSize: 14,
        marginTop: 8,
    }
});

export default MyTeam;
