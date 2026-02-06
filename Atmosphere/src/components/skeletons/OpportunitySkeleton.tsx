import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import SkeletonItem from './SkeletonItem';

const { width: screenWidth } = Dimensions.get('window');

const OpportunitySkeleton = () => {
    const items = Array.from({ length: 10 });

    return (
        <View style={styles.container}>
            {items.map((_, index) => (
                <View key={index} style={styles.card}>
                    {/* Title */}
                    <SkeletonItem width="70%" height={18} style={{ marginBottom: 8 }} />

                    {/* Organization/Company */}
                    <SkeletonItem width="50%" height={14} style={{ marginBottom: 12 }} />

                    {/* Description lines */}
                    <SkeletonItem width="100%" height={12} style={{ marginBottom: 4 }} />
                    <SkeletonItem width="90%" height={12} style={{ marginBottom: 12 }} />

                    {/* Tags/Badges Row */}
                    <View style={styles.tagsRow}>
                        <SkeletonItem width={70} height={24} borderRadius={12} style={{ marginRight: 8 }} />
                        <SkeletonItem width={80} height={24} borderRadius={12} style={{ marginRight: 8 }} />
                        <SkeletonItem width={60} height={24} borderRadius={12} />
                    </View>

                    {/* Footer: Date + Action Button */}
                    <View style={styles.footer}>
                        <SkeletonItem width={100} height={12} />
                        <SkeletonItem width={80} height={32} borderRadius={16} />
                    </View>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: screenWidth,
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    card: {
        backgroundColor: '#0d0d0d',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#1a1a1a',
    },
    tagsRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
});

export default OpportunitySkeleton;
