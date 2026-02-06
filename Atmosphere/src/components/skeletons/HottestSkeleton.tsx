import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonItem from './SkeletonItem';

const HottestSkeleton = () => {
    const listItems = Array.from({ length: 5 });

    return (
        <View style={styles.container}>
            {/* Podium Placeholder */}
            <View style={styles.podiumContainer}>
                {/* 2nd Place */}
                <View style={[styles.podiumItem, { marginTop: 20 }]}>
                    <SkeletonItem width={80} height={80} borderRadius={16} style={{ marginBottom: 8 }} />
                    <SkeletonItem width={70} height={30} borderRadius={20} />
                </View>

                {/* 1st Place (Center, larger, higher) */}
                <View style={[styles.podiumItem, { marginTop: 0 }]}>
                    <SkeletonItem width={100} height={100} borderRadius={20} style={{ marginBottom: 8 }} />
                    <SkeletonItem width={90} height={40} borderRadius={16} />
                </View>

                {/* 3rd Place */}
                <View style={[styles.podiumItem, { marginTop: 30 }]}>
                    <SkeletonItem width={80} height={80} borderRadius={16} style={{ marginBottom: 8 }} />
                    <SkeletonItem width={70} height={30} borderRadius={20} />
                </View>
            </View>

            {/* List Items */}
            <View style={styles.listContainer}>
                {listItems.map((_, index) => (
                    <View key={index} style={styles.listItem}>
                        <SkeletonItem width={56} height={56} borderRadius={12} style={{ marginRight: 12 }} />
                        <View style={{ flex: 1 }}>
                            <SkeletonItem width="60%" height={16} style={{ marginBottom: 6 }} />
                            <SkeletonItem width="40%" height={14} />
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        padding: 16,
    },
    podiumContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: 16,
        marginBottom: 32,
        marginTop: 20,
    },
    podiumItem: {
        alignItems: 'center',
    },
    listContainer: {
        marginTop: 10,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0A0A0A',
        padding: 16,
        borderRadius: 28,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    }
});

export default HottestSkeleton;
