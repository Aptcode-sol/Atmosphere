import React from 'react';
import { Text, StyleSheet } from 'react-native';

const Logo = ({ size = 42 }: { size?: number }) => {
    return <Text style={[styles.logo, { fontSize: size }]}>Atmosphere </Text>;
};

const styles = StyleSheet.create({
    logo: {
        fontFamily: 'Pacifico-Regular',
        color: '#f2f2f2',
        includeFontPadding: true,
        textAlignVertical: 'center',
        paddingBottom: 4,
    },
});

export default Logo;
