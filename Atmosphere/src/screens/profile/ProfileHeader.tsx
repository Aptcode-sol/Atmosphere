import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from './Profile.styles';

type Props = {
    name: string;
    onOpenSettings: () => void;
    onCreate?: () => void;
    theme: any;
};

export default function ProfileHeader({ name, onOpenSettings, onCreate, theme }: Props) {
    return (
        <View style={styles.topBar}>
            <TouchableOpacity style={styles.iconButton} onPress={onOpenSettings} accessibilityLabel="Open settings">
                <Text style={[styles.iconText, { color: theme.text }]}>≡</Text>
            </TouchableOpacity>
            <Text style={[styles.topTitle, { color: theme.text }]}>{name}</Text>
            <TouchableOpacity style={styles.iconButton} onPress={onCreate} accessibilityLabel="Create new">
                <Text style={[styles.iconText, { color: theme.text }]}>＋</Text>
            </TouchableOpacity>
        </View>
    );
}
