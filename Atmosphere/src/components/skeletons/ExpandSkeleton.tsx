import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonItem from './SkeletonItem';

const ExpandSkeleton = () => {
    return (
        <View style={styles.container}>
            {/* Video Placeholder */}
            <SkeletonItem width="100%" height={200} borderRadius={12} style={{ marginBottom: 16 }} />

            {/* Interactive Stats Row */}
            <View style={styles.statsRow}>
                <SkeletonItem width={50} height={30} borderRadius={15} />
                <SkeletonItem width={50} height={30} borderRadius={15} />
                <SkeletonItem width={50} height={30} borderRadius={15} />
                <SkeletonItem width={50} height={30} borderRadius={15} />
            </View>

            {/* What's This Startup */}
            <View style={styles.card}>
                <SkeletonItem width={150} height={18} style={{ marginBottom: 12 }} />
                <SkeletonItem width="100%" height={14} style={{ marginBottom: 6 }} />
                <SkeletonItem width="95%" height={14} style={{ marginBottom: 6 }} />
                <SkeletonItem width="90%" height={14} />
            </View>

            {/* Company Details */}
            <View style={styles.card}>
                <SkeletonItem width={120} height={18} style={{ marginBottom: 12 }} />
                <SkeletonItem width={200} height={14} style={{ marginBottom: 8 }} />
                <SkeletonItem width={180} height={14} style={{ marginBottom: 8 }} />
                <SkeletonItem width={160} height={14} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    card: {
        backgroundColor: '#0d0d0d',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#1a1a1a',
    }
});

export default ExpandSkeleton;
