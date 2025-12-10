/* eslint-disable react-native/no-inline-styles */
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { updateProfile } from '../../lib/api';

export default function PersonalSetup({ onDone }: { onDone: () => void }) {
    const [about, setAbout] = useState('');

    const save = async () => {
        try {
            await updateProfile({ userData: { bio: about } });
            Alert.alert('Saved', 'Personal details saved');
            onDone();
        } catch {
            Alert.alert('Error', 'Unable to save personal details');
        }
    };

    return (
        <View style={{ padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Personal Account Setup</Text>
            <TextInput placeholder="About you" value={about} onChangeText={setAbout} style={{ borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 8 }} />
            <TouchableOpacity onPress={save}><Text style={{ color: '#06f' }}>Save Personal Details</Text></TouchableOpacity>
        </View>
    );
}
