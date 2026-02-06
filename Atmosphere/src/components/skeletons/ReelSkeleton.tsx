import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import SkeletonItem from './SkeletonItem';

const { width, height } = Dimensions.get('window');

const ReelSkeleton = () => {
    return (
        <View style={styles.container}>
            {/* Video placeholder - full screen */}
            <SkeletonItem width="100%" height="100%" borderRadius={0} />

            {/* Right side actions */}
            <View style={styles.actionsContainer}>
                <SkeletonItem width={40} height={40} borderRadius={20} style={styles.actionItem} />
                <SkeletonItem width={40} height={40} borderRadius={20} style={styles.actionItem} />
                <SkeletonItem width={40} height={40} borderRadius={20} style={styles.actionItem} />
                <SkeletonItem width={40} height={40} borderRadius={20} style={styles.actionItem} />
            </View>

            {/* Bottom info */}
            <View style={styles.infoContainer}>
                {/* User info */}
                <View style={styles.userRow}>
                    <SkeletonItem width={32} height={32} borderRadius={16} style={{ marginRight: 8 }} />
                    <SkeletonItem width={120} height={14} />
                </View>
                {/* Caption lines */}
                <SkeletonItem width="80%" height={14} style={{ marginTop: 8 }} />
                <SkeletonItem width="60%" height={14} style={{ marginTop: 4 }} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width,
        height,
        backgroundColor: '#000',
        position: 'relative',
    },
    actionsContainer: {
        position: 'absolute',
        right: 12,
        bottom: 100,
        alignItems: 'center',
    },
    actionItem: {
        marginBottom: 20,
    },
    infoContainer: {
        position: 'absolute',
        bottom: 80,
        left: 12,
        right: 80,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});

export default ReelSkeleton;
