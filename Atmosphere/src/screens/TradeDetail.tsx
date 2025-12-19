import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, SafeAreaView, TouchableOpacity } from 'react-native';
import { TradeCard } from './Trading/components/TradeCard';
import { getTrade, toggleTradeSave, createOrFindChat, sendMessage, shareContent } from '../lib/api';
import { ActiveTrade } from './Trading/types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface TradeDetailProps {
    route: { params: { tradeId: string } };
    navigation: { goBack: () => void };
}

const TradeDetail: React.FC<TradeDetailProps> = ({ route, navigation }) => {
    const { tradeId } = route.params;
    const [trade, setTrade] = useState<ActiveTrade | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const fetchTrade = async () => {
            try {
                const data = await getTrade(tradeId);
                if (data) {
                    setTrade(data);
                    // Check if saved - backend might return this if we add a check, 
                    // or we check savedByUsers if available in response
                    // For now, assume false or check response structure
                    if (data.savedByUsers && Array.isArray(data.savedByUsers)) {
                        // We need current user ID to check this, skipping for now or defaults to false
                    }
                } else {
                    Alert.alert('Error', 'Trade not found');
                    navigation.goBack();
                }
            } catch (err) {
                console.error(err);
                Alert.alert('Error', 'Failed to load trade details');
                navigation.goBack();
            } finally {
                setLoading(false);
            }
        };
        fetchTrade();
    }, [tradeId, navigation]);

    const handleToggleSave = async () => {
        if (!trade || !trade._id) return;
        const newSaved = !saved;
        setSaved(newSaved);
        try {
            await toggleTradeSave(trade._id, newSaved);
        } catch {
            setSaved(!newSaved); // Revert
        }
    };

    const handleExpressInterest = async () => {
        if (!trade) return;
        try {
            // @ts-ignore
            const ownerId = trade.user?._id || trade.user?.id || trade.user;
            const ownerName = trade.companyName || 'the company';

            if (!ownerId) {
                Alert.alert('Error', 'Contact information not available.');
                return;
            }

            const response = await createOrFindChat(ownerId);
            const chat = response?.chat || response;

            if (chat && (chat._id || chat.id)) {
                const chatId = chat._id || chat.id;

                // 1. Send text message
                await sendMessage(chatId, `Hi, I'm interested in ${ownerName}`);

                // 2. Share the trade card
                await shareContent({
                    userIds: [ownerId],
                    contentId: trade._id!,
                    contentType: 'trade',
                    contentTitle: trade.companyName,
                    contentImage: trade.imageUrls?.[0] || '',
                    contentOwner: trade.startupUsername,
                });

                Alert.alert('Success', 'Interest expressed! Check your messages.');
            }
        } catch (error) {
            console.error('Express interest error:', error);
            Alert.alert('Error', 'Failed to send interest message.');
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#fff" />
            </View>
        );
    }

    if (!trade) return null;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={navigation.goBack} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Trade Details</Text>
                <View style={{ width: 24 }} />
            </View>
            <View style={styles.content}>
                <TradeCard
                    trade={trade}
                    isExpanded={true}
                    isSaved={saved}
                    currentPhotoIndex={currentPhotoIndex}
                    onToggleExpand={() => { }} // No-op, always expanded
                    onToggleSave={handleToggleSave}
                    onPhotoIndexChange={setCurrentPhotoIndex}
                    onExpressInterest={handleExpressInterest}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 16,
    },
});

export default TradeDetail;
