import React from 'react';
import { Text, StyleSheet } from 'react-native';

const Logo = ({ size = 42 }: { size?: number }) => {
    return <Text style={[styles.logo, { fontSize: size }]}>Atmosphere</Text>;
};

const styles = StyleSheet.create({
    logo: {
        fontFamily: 'Pacifico',
        color: '#f2f2f2',
    },
});

export default Logo;
