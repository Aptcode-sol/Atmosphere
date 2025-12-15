import React, { useState, useContext, useEffect, useMemo } from 'react';
import { View, Text, Modal, StyleSheet, TextInput, TouchableOpacity, Image, Alert, FlatList, ActivityIndicator } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { createGroup, getFollowersList } from '../lib/api';
import { getImageSource } from '../lib/image';
import AsyncStorage from '@react-native-async-storage/async-storage';
// You'll need vector icons or simple text for checkmarks
// import Icon from 'react-native-vector-icons/MaterialIcons'; 

interface CreateGroupModalProps {
    visible: boolean;
    onClose: () => void;
    onGroupCreated: () => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ visible, onClose, onGroupCreated }) => {
    const { theme } = useContext(ThemeContext);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type] = useState('Public');
    const [loading, setLoading] = useState(false);
    const [followers, setFollowers] = useState<any[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [fetchingFollowers, setFetchingFollowers] = useState(false);

    // Memoized styles
    const checkboxCheckmarkStyle = useMemo(() => ({ color: '#fff', fontSize: 12 }), []);
    const cancelButtonTextStyle = useMemo(() => ({ color: theme.primary, fontSize: 16 }), [theme.primary]);
    const descriptionInputStyle = useMemo(() => ({ height: 60 }), []);
    const emptyListTextStyle = useMemo(() => ({ textAlign: 'center', color: theme.placeholder, marginTop: 20 }), [theme.placeholder]);
    const createButtonOpacityStyle = useMemo(() => ({ opacity: loading ? 0.7 : 1 }), [loading]);

    useEffect(() => {
        if (visible) {
            fetchFollowers();
        }
    }, [visible]);

    const fetchFollowers = async () => {
        setFetchingFollowers(true);
        try {
            const userJson = await AsyncStorage.getItem('user');
            if (userJson) {
                const user = JSON.parse(userJson);
                const list = await getFollowersList(user._id || user.id);
                setFollowers(list);
            }
        } catch (err) {
            console.warn('Failed to fetch followers', err);
        } finally {
            setFetchingFollowers(false);
        }
    };

    const toggleUser = (userId: string) => {
        const next = new Set(selectedUsers);
        if (next.has(userId)) {
            next.delete(userId);
        } else {
            next.add(userId);
        }
        setSelectedUsers(next);
    };

    const handleCreate = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a group name');
            return;
        }

        if (selectedUsers.size === 0) {
            Alert.alert('Error', 'Please select at least one member');
            return;
        }

        setLoading(true);
        try {
            await createGroup({
                name,
                description,
                type,
                participants: Array.from(selectedUsers)
            });
            onGroupCreated();
            onClose();
            // Reset
            setName('');
            setDescription('');
            setSelectedUsers(new Set());
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to create group');
        } finally {
            setLoading(false);
        }
    };

    const renderFollower = ({ item }: { item: any }) => {
        // item is the Follow object usually, populate logic in backend might return user in 'follower' or 'following'
        // wait, getFollowers returns list of users who follow me? Or my following?
        // Prompt says "add our followers". Usually you add people you follow, but okay.
        // Let's assume the API returns populated user objects directly or inside a wrapper.
        // API: router.get('/:userId/followers', followService.getFollowers); -> { followers: [...] }
        // The service usually populates 'follower'.

        const user = item.follower || item; // Adjust based on actual API response structure
        const isSelected = selectedUsers.has(user._id);

        return (
            <TouchableOpacity
                style={[styles.userItem, { borderBottomColor: theme.border }]}
                onPress={() => toggleUser(user._id)}
            >
                <Image
                    source={getImageSource(user.avatarUrl)}
                    style={styles.avatar}
                />
                <View style={{ flex: 1 }}>
                    <Text style={[styles.userName, { color: theme.text }]}>{user.displayName || user.username}</Text>
                    <Text style={[styles.userHandle, { color: theme.placeholder }]}>@{user.username}</Text>
                </View>
                <View style={[
                    styles.checkbox,
                    { borderColor: theme.primary, backgroundColor: isSelected ? theme.primary : 'transparent' }
                ]}>
                    {isSelected && <Text style={checkboxCheckmarkStyle}>✓</Text>}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text }]}>New Group</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={cancelButtonTextStyle}>Cancel</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.form}>
                    <TextInput
                        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.cardBackground }]}
                        placeholder="Group Name"
                        placeholderTextColor={theme.placeholder}
                        value={name}
                        onChangeText={setName}
                    />
                    <TextInput
                        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.cardBackground, ...descriptionInputStyle }]}
                        placeholder="Description"
                        placeholderTextColor={theme.placeholder}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                    />
                </View>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>Add Members</Text>

                {fetchingFollowers ? (
                    <ActivityIndicator color={theme.primary} />
                ) : (
                    <FlatList
                        data={followers}
                        keyExtractor={(item) => (item.follower?._id || item._id)}
                        renderItem={renderFollower}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={<Text style={emptyListTextStyle}>No followers found</Text>}
                    />
                )}

                <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
                    <TouchableOpacity
                        style={[styles.createButton, { backgroundColor: theme.primary, ...createButtonOpacityStyle }]}
                        onPress={handleCreate}
                        disabled={loading}
                    >
                        <Text style={styles.createButtonText}>{loading ? 'Creating...' : `Create Group(${selectedUsers.size})`}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingTop: 24
    },
    title: {
        fontSize: 20,
        fontWeight: '700'
    },
    form: {
        paddingHorizontal: 16,
        marginBottom: 16
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        fontSize: 16
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 16,
        marginBottom: 8
    },
    list: {
        paddingHorizontal: 16,
        paddingBottom: 100
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#eee',
        marginRight: 12
    },
    userName: {
        fontSize: 15,
        fontWeight: '600'
    },
    userHandle: {
        fontSize: 13
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center'
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        borderTopWidth: 1
    },
    createButton: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center'
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700'
    }
});

export default CreateGroupModal;
