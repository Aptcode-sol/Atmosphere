import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonItem from './SkeletonItem';

const ListSkeleton = () => {
    // Render a few list items
    const items = Array.from({ length: 6 });

    return (
        <View style={styles.container}>
            {items.map((_, index) => (
                <View key={index} style={styles.item}>
                    {/* Avatar/Icon Placeholder */}
                    <SkeletonItem width={50} height={50} borderRadius={10} style={{ marginRight: 12 }} />

                    {/* Text Lines */}
                    <View style={styles.textContainer}>
                        <SkeletonItem width="70%" height={16} style={{ marginBottom: 6 }} />
                        <SkeletonItem width="40%" height={14} />
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
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: '#0d0d0d',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1a1a1a',
    },
    textContainer: {
        flex: 1,
    }
});

export default ListSkeleton;
