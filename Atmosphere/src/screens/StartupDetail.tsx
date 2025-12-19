import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { getStartupProfile } from '../lib/api';
import { getImageSource } from '../lib/image';

const { width } = Dimensions.get('window');

import StartupPost from '../components/StartupPost';



const StartupDetail = ({ route, navigation }: any) => {
    const { startupId } = route.params || {}; // startupId can be userId or startupDetailsId
    const { theme } = useContext(ThemeContext);

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        console.log('StartupDetail mounted with id:', startupId);
        const fetch = async () => {
            if (!startupId) return;
            try {
                const result = await getStartupProfile(startupId);
                console.log('StartupDetail fetched result:', result ? 'found' : 'null');
                setData(result);
            } catch (err) {
                console.warn('Failed to load startup details', err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [startupId]);

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (!data) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
                <Text style={{ color: theme.text }}>Startup not found</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
                    <Text style={{ color: theme.primary }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const { user, details } = data;

    // Map API response to StartupCard format expected by StartupPost
    const startupCardData = {
        id: details?._id || user?._id || '',
        userId: user?._id || '',
        name: details?.companyName || user?.displayName || user?.username || 'Startup',
        displayName: user?.displayName || '',
        verified: user?.verified || false,
        profileImage: details?.logo || user?.avatarUrl || details?.profileImage, // Try details logo first
        description: details?.description || details?.about || user?.bio || '',
        stage: details?.stage || '',
        rounds: details?.rounds || 0,
        age: details?.age || 0,
        fundingRaised: details?.fundingRaised || 0,
        fundingNeeded: details?.fundingNeeded || 0,
        stats: {
            likes: details?.likes || 0,
            comments: details?.comments || 0,
            crowns: details?.crowns || 0,
            shares: details?.shares || 0
        },
        likedByCurrentUser: details?.likedByCurrentUser,
        crownedByCurrentUser: details?.crownedByCurrentUser,
        isFollowing: details?.isFollowing,
        isSaved: details?.isSaved
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Startup Details</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Use StartupPost to render the detailed card */}
                <StartupPost
                    company={startupCardData as any}
                    currentUserId={null} // Pass null or fetch if specific user context needed for ownership check
                    onOpenProfile={() => { }} // Already on details, maybe ignore or open profile modal
                />

                {/* Additional Details that might not be in the card */}
                {details?.website && (
                    <View style={[styles.section, { backgroundColor: theme.cardBackground, marginTop: 16 }]}>
                        <View style={styles.row}>
                            <MaterialIcons name="language" size={20} color={theme.placeholder} />
                            <Text style={[styles.link, { color: theme.primary }]}>{details.website}</Text>
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingTop: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)'
    },
    backButton: { marginRight: 16 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    scrollContent: { padding: 0 }, // StartupPost has its own margins/padding
    section: {
        padding: 16,
        marginHorizontal: 16,
        borderRadius: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    link: {
        fontSize: 15,
        textDecorationLine: 'underline'
    }
});

export default StartupDetail;
