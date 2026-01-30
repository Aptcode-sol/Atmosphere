import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import styles from './Profile.styles';

type Props = {
    name: string;
    onOpenSettings?: () => void;
    onBack?: () => void;
    onCreate?: () => void;
    theme: any;
};

const HamburgerIcon = ({ color = '#fff', size = 18 }: { color?: string; size?: number }) => (
    <View style={[hambStyles.container, { width: size, height: size }]}>
        <View style={[hambStyles.bar, hambStyles.barSpacing, { width: size * 1.05, backgroundColor: color }]} />
        <View style={[hambStyles.bar, hambStyles.barSpacing, { width: size * 1.05, backgroundColor: color }]} />
        <View style={[hambStyles.bar, { width: size * 1.05, backgroundColor: color }]} />
    </View>
);

export default function ProfileHeader({ name, onOpenSettings, onCreate, onBack, theme }: Props) {
    return (
        <View style={styles.topBar}>
            <TouchableOpacity style={styles.iconButton} onPress={onCreate} accessibilityLabel="Create new">
                <Text style={[styles.iconText, { color: theme.text }]}>＋</Text>
            </TouchableOpacity>

            <Text style={[styles.topTitle, { color: theme.text }]}>{name}</Text>

            {onBack ? (
                <TouchableOpacity style={styles.iconButton} onPress={onBack} accessibilityLabel="Back">
                    <Text style={[styles.iconText, { color: theme.text }]}>{'‹'}</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity style={styles.iconButton} onPress={onOpenSettings} accessibilityLabel="Open settings">
                    <HamburgerIcon color={theme.text} size={20} />
                </TouchableOpacity>
            )}
        </View>
    );
}

const hambStyles = StyleSheet.create({
    container: { justifyContent: 'center', alignItems: 'center' },
    bar: { height: 2, borderRadius: 2 },
    barSpacing: { marginBottom: 6 },
});
