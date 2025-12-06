import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { updateProfile } from '../../lib/api';

export default function InvestorSetup({ onDone }: { onDone: () => void }) {
    const [about, setAbout] = useState('');
    const [location, setLocation] = useState('');
    const [investmentFocus, setInvestmentFocus] = useState('');
    const [interestedRounds, setInterestedRounds] = useState('');

    const save = async () => {
        try {
            await updateProfile({ detailsData: { about, location, investmentFocus: investmentFocus.split(',').map(s => s.trim()), interestedRounds: interestedRounds.split(',').map(s => s.trim()) } });
            Alert.alert('Saved', 'Investor details saved');
            onDone();
        } catch {
            Alert.alert('Error', 'Unable to save investor details');
        }
    };

    return (
        <View style={{ padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Investor Setup</Text>
            <TextInput placeholder="About" value={about} onChangeText={setAbout} style={{ borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 8 }} />
            <TextInput placeholder="Location" value={location} onChangeText={setLocation} style={{ borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 8 }} />
            <TextInput placeholder="Investment Focus (comma separated)" value={investmentFocus} onChangeText={setInvestmentFocus} style={{ borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 8 }} />
            <TextInput placeholder="Interested Rounds (comma separated)" value={interestedRounds} onChangeText={setInterestedRounds} style={{ borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 8 }} />
            <TouchableOpacity onPress={save}><Text style={{ color: '#06f' }}>Save Investor Details</Text></TouchableOpacity>
        </View>
    );
}
