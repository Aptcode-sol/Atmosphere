import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonItem from './SkeletonItem';

const SettingsSkeleton = () => {
    return (
        <View style={styles.container}>
            {/* Section 1 */}
            <SkeletonItem width={120} height={12} style={styles.sectionLabel} />
            <View style={styles.card}>
                <SkeletonItem width="100%" height={60} style={styles.row} />
                <SkeletonItem width="100%" height={60} style={styles.row} />
                <SkeletonItem width="100%" height={60} style={styles.row} />
            </View>

            {/* Section 2 */}
            <SkeletonItem width={140} height={12} style={styles.sectionLabel} />
            <View style={styles.card}>
                <SkeletonItem width="100%" height={60} style={styles.row} />
                <SkeletonItem width="100%" height={60} style={styles.row} />
            </View>

            {/* Section 3 */}
            <SkeletonItem width={100} height={12} style={styles.sectionLabel} />
            <View style={styles.card}>
                <SkeletonItem width="100%" height={60} style={styles.row} />
                <SkeletonItem width="100%" height={60} style={styles.row} />
                <SkeletonItem width="100%" height={60} style={styles.row} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    sectionLabel: {
        marginTop: 20,
        marginBottom: 12,
    },
    card: {
        backgroundColor: '#0d0d0d',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1a1a1a',
        padding: 4,
    },
    row: {
        marginVertical: 4,
        borderRadius: 8,
    },
});

export default SettingsSkeleton;
