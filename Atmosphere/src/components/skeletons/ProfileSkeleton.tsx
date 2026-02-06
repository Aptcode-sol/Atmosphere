import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import SkeletonItem from './SkeletonItem';

const { width } = Dimensions.get('window');
const ITEM_SPACING = 1;
const ITEM_WIDTH = (width - (ITEM_SPACING * 2)) / 3;

const ProfileSkeleton = () => {
    const gridItems = Array.from({ length: 9 });

    return (
        <View style={styles.container}>
            {/* Header: Avatar and Basic Info */}
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <SkeletonItem width={80} height={80} borderRadius={40} />
                </View>

                <View style={styles.infoContainer}>
                    <SkeletonItem width={150} height={20} style={{ marginBottom: 10 }} />
                    <SkeletonItem width={100} height={14} style={{ marginBottom: 6 }} />
                    <SkeletonItem width={200} height={14} />

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <SkeletonItem width={60} height={14} />
                        <SkeletonItem width={60} height={14} />
                        <SkeletonItem width={60} height={14} />
                    </View>
                </View>
            </View>

            {/* Bio/Description Lines */}
            <View style={styles.bioSection}>
                <SkeletonItem width="90%" height={14} style={{ marginBottom: 6 }} />
                <SkeletonItem width="80%" height={14} style={{ marginBottom: 6 }} />
                <SkeletonItem width="40%" height={14} />
            </View>

            {/* Buttons Row */}
            <View style={styles.buttonsRow}>
                <SkeletonItem width="45%" height={40} borderRadius={8} />
                <SkeletonItem width="45%" height={40} borderRadius={8} />
            </View>

            {/* Tab Bar Placeholder */}
            <View style={styles.tabsRow}>
                <SkeletonItem width={width / 3} height={40} borderRadius={0} />
                <SkeletonItem width={width / 3} height={40} borderRadius={0} />
                <SkeletonItem width={width / 3} height={40} borderRadius={0} />
            </View>

            {/* Grid Content Below Tabs */}
            <View style={styles.gridContainer}>
                {gridItems.map((_, index) => (
                    <View key={index} style={styles.gridItem}>
                        <SkeletonItem width="100%" height="100%" borderRadius={2} />
                        {/* Add internal lines for better visual */}
                        <View style={styles.internalLines}>
                            <SkeletonItem width="70%" height={6} borderRadius={2} style={{ marginBottom: 3 }} />
                            <SkeletonItem width="50%" height={6} borderRadius={2} />
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: 20,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    avatarContainer: {
        marginRight: 20,
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        width: '90%'
    },
    bioSection: {
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    buttonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    tabsRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        paddingTop: 12,
    },
    gridItem: {
        width: ITEM_WIDTH,
        height: ITEM_WIDTH * 1.33,
        marginBottom: ITEM_SPACING,
        marginRight: ITEM_SPACING,
        backgroundColor: '#111',
    }
});

export default ProfileSkeleton;
