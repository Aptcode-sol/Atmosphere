import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import SkeletonItem from './SkeletonItem';

const { width } = Dimensions.get('window');
const ITEM_SPACING = 2;
const NUM_COLUMNS = 3;
const ITEM_WIDTH = (width - (ITEM_SPACING * (NUM_COLUMNS - 1))) / NUM_COLUMNS;

const GridSkeleton = () => {
    // Render enough items to fill a screen or two
    const items = Array.from({ length: 18 });

    return (
        <View style={styles.container}>
            {items.map((_, index) => {
                // No right margin on last column of each row
                const isLastColumn = (index + 1) % NUM_COLUMNS === 0;
                return (
                    <View key={index} style={[styles.itemContainer, isLastColumn && { marginRight: 0 }]}>
                        <View style={styles.itemBackground} />
                        <SkeletonItem width="100%" height="100%" borderRadius={2} style={styles.skeletonAbove} />
                        {/* Add internal lines for better visual */}
                        <View style={styles.internalLines} pointerEvents="none">
                            <SkeletonItem width="70%" height={8} borderRadius={2} style={{ marginBottom: 4 }} />
                            <SkeletonItem width="50%" height={8} borderRadius={2} />
                        </View>
                    </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
    },
    itemContainer: {
        width: ITEM_WIDTH,
        height: ITEM_WIDTH * 1.33, // 4:3 Aspect Ratio (typical for posts/reels)
        marginBottom: ITEM_SPACING,
        marginRight: ITEM_SPACING,
        position: 'relative',
    },
    itemBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#111',
        borderRadius: 2,
        zIndex: 0,
    },
    skeletonAbove: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
    },
    internalLines: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        right: 8,
    },
});

export default GridSkeleton;
