import React from 'react';
import { View, Text } from 'react-native';
import styles from './Profile.styles';

type Props = {
    item: any;
    theme: any;
};

export default function PostCard({ item, theme }: Props) {
    return (
        <View style={styles.postCard}>
            <Text style={{ color: theme.text, fontWeight: '700' }}>{item.title || item.name || item.companyName || 'Post'}</Text>
            {item.content ? <Text style={{ color: theme.placeholder, marginTop: 6 }}>{item.content}</Text> : null}
        </View>
    );
}
