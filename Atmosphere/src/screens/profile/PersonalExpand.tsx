/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { MapPin } from 'lucide-react-native';

type Props = {
    profileData: any;
    cardContainerWidth: number;
    isActive: boolean;
};

export default function PersonalExpand({ profileData, cardContainerWidth, isActive }: Props) {
    const bio = profileData?.tagline || profileData?.description || profileData?.bio || '';
    const location = profileData?.location || '';

    return (
        <View style={{ width: '100%', padding: 16, paddingBottom: 100, alignItems: 'center' }}>
            <View style={{ width: cardContainerWidth, gap: 16 }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Profile</Text>

                {/* Main Card */}
                <View style={[cardStyles.card, { width: '100%' }]}>
                    {/* Bio */}
                    {bio ? (
                        <View style={cardStyles.aboutSection}>
                            <Text style={cardStyles.aboutLabel}>About</Text>
                            <Text style={cardStyles.aboutText}>{bio}</Text>
                        </View>
                    ) : (
                        <View style={{ paddingVertical: 12 }}>
                            <Text style={{ color: '#666', fontSize: 14, textAlign: 'center' }}>
                                No bio added yet
                            </Text>
                        </View>
                    )}

                    {/* Location */}
                    {location ? (
                        <>
                            <View style={cardStyles.firstRow}>
                                <MapPin size={16} color="#888" />
                                <Text style={cardStyles.rowTitle}>Location</Text>
                            </View>
                            <Text style={cardStyles.rowValue}>{location}</Text>
                        </>
                    ) : null}
                </View>
            </View>
        </View>
    );
};

const cardStyles = {
    card: {
        backgroundColor: '#0d0d0d',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#1a1a1a',
        padding: 18,
        marginBottom: 16,
    },
    aboutSection: {
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1d1d1d',
    },
    aboutLabel: {
        color: '#666',
        fontSize: 12,
        fontWeight: '600' as const,
        marginBottom: 8,
    },
    aboutText: {
        color: '#e5e5e5',
        fontSize: 14,
        lineHeight: 20,
    },
    sectionTitle: {
        color: '#666',
        fontSize: 12,
        fontWeight: '600' as const,
        marginBottom: 12,
        marginTop: 12,
    },
    firstRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 8,
        marginTop: 0,
        marginBottom: 8,
    },
    rowTitle: {
        color: '#e5e5e5',
        fontSize: 13,
        fontWeight: '600' as const,
    },
    rowValue: {
        color: '#999',
        fontSize: 13,
        marginLeft: 24,
        marginTop: 2,
    },
};
