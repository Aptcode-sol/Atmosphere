import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonItem from './SkeletonItem';

const MeetingSkeleton = () => {
    const items = Array.from({ length: 4 });

    return (
        <View style={styles.container}>
            {items.map((_, index) => (
                <View key={index} style={styles.card}>
                    {/* Title */}
                    <SkeletonItem width="60%" height={18} style={{ marginBottom: 8 }} />

                    {/* Host info */}
                    <View style={styles.hostRow}>
                        <SkeletonItem width={32} height={32} borderRadius={16} style={{ marginRight: 8 }} />
                        <SkeletonItem width={100} height={14} />
                    </View>

                    {/* Date/Time */}
                    <SkeletonItem width="40%" height={12} style={{ marginTop: 12, marginBottom: 8 }} />

                    {/* Description lines */}
                    <SkeletonItem width="100%" height={12} style={{ marginBottom: 4 }} />
                    <SkeletonItem width="80%" height={12} style={{ marginBottom: 12 }} />

                    {/* Stats/Participants */}
                    <View style={styles.footer}>
                        <SkeletonItem width={80} height={12} />
                        <SkeletonItem width={80} height={32} borderRadius={16} />
                    </View>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    card: {
        backgroundColor: '#0d0d0d',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#1a1a1a',
    },
    hostRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
});

export default MeetingSkeleton;
