import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonItem from './SkeletonItem';

const SetupSkeleton = () => {
    return (
        <View style={styles.container}>
            {/* Header: Title + Subtitle */}
            <View style={styles.header}>
                <SkeletonItem width="60%" height={24} style={{ marginBottom: 12 }} />
                <SkeletonItem width="80%" height={16} />
            </View>

            {/* Form Fields */}
            <View style={styles.form}>
                <SkeletonItem width="100%" height={50} borderRadius={12} style={{ marginBottom: 20 }} />
                <SkeletonItem width="100%" height={50} borderRadius={12} style={{ marginBottom: 20 }} />

                {/* Large Text Area */}
                <SkeletonItem width="100%" height={120} borderRadius={12} style={{ marginBottom: 20 }} />

                <SkeletonItem width="100%" height={50} borderRadius={12} style={{ marginBottom: 20 }} />
            </View>

            {/* Next Button */}
            <View style={styles.footer}>
                <SkeletonItem width="100%" height={56} borderRadius={28} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        backgroundColor: '#000',
    },
    header: {
        marginTop: 40,
        marginBottom: 40,
    },
    form: {
        flex: 1,
    },
    footer: {
        marginBottom: 20,
    }
});

export default SetupSkeleton;
