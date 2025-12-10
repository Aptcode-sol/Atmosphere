import React from 'react';
/* eslint-disable react-native/no-inline-styles */
import { View, Text, TouchableOpacity } from 'react-native';

export default function InvestorPortfolio({ theme, onBack }: { theme: any; onBack: () => void }) {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
            <TouchableOpacity onPress={onBack} style={{ position: 'absolute', top: 40, left: 20 }}>
                <Text style={{ color: theme.text, fontSize: 18 }}>{'< Back'}</Text>
            </TouchableOpacity>
            <Text style={{ color: theme.text, fontSize: 24, fontWeight: 'bold' }}>Investor Portfolio Page</Text>
            {/* Fields to be added later */}
        </View>
    );
}
