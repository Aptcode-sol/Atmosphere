import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import SkeletonItem from './SkeletonItem';

const { width } = Dimensions.get('window');

const StartupPostSkeleton = () => {
    return (
        <View style={styles.container}>
            {/* Header: Avatar + Texts */}
            <View style={styles.header}>
                <SkeletonItem width={40} height={40} borderRadius={20} />
                <View style={styles.headerText}>
                    <SkeletonItem width={120} height={14} style={{ marginBottom: 6 }} />
                    <SkeletonItem width={80} height={12} />
                </View>
                {/* Menu dots placeholder */}
                <SkeletonItem width={24} height={24} borderRadius={12} style={{ marginLeft: 'auto' }} />
            </View>

            {/* Content: Image/Video Placeholder */}
            <SkeletonItem width="100%" height={300} borderRadius={12} style={{ marginBottom: 12 }} />

            {/* Title / Description Lines */}
            <SkeletonItem width="80%" height={16} style={{ marginBottom: 8 }} />
            <SkeletonItem width="60%" height={14} style={{ marginBottom: 16 }} />

            {/* Stats Bar */}
            <View style={styles.statsRow}>
                <SkeletonItem width={40} height={20} borderRadius={4} />
                <SkeletonItem width={40} height={20} borderRadius={4} />
                <SkeletonItem width={40} height={20} borderRadius={4} />
                <SkeletonItem width={40} height={20} borderRadius={4} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        marginBottom: 8,
        backgroundColor: '#000', // Match theme background
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerText: {
        marginLeft: 12,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingHorizontal: 12
    },
});

export default StartupPostSkeleton;
