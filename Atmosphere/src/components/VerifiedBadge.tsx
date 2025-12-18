import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VerifiedBadgeProps {
    size?: number;
    color?: string;
    style?: object;
}

/**
 * Verified Badge Component
 * Shows a blue checkmark badge for verified users (startups/investors)
 */
const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
    size = 16,
    color = '#3b82f6',
    style
}) => {
    return (
        <View style={[styles.container, style]}>
            <Ionicons name="checkmark-circle" size={size} color={color} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginLeft: 4,
    },
});

export default VerifiedBadge;
