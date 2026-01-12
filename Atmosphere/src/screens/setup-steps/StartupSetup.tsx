/* eslint-disable react-native/no-inline-styles */
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { updateProfile } from '../../lib/api';
import { useAlert } from '../../components/CustomAlert';
import StartupVerifyStep from './StartupVerifyStep';

export default function StartupSetup({ onDone }: { onDone: () => void }) {
    const { showAlert } = useAlert();
    const [companyName, setCompanyName] = useState('');
    const [about, setAbout] = useState('');
    const [location, setLocation] = useState('');
    const [companyType, setCompanyType] = useState('');
    const [step, setStep] = useState<1 | 2>(1);

    const save = async () => {
        try {
            await updateProfile({ detailsData: { companyName, about, location, companyType } });
            showAlert('Saved', 'Startup details saved');
            onDone();
        } catch {
            showAlert('Error', 'Unable to save startup details');
        }
    };

    if (step === 2) {
        return <StartupVerifyStep onBack={() => setStep(1)} onDone={onDone} />;
    }

    return (
        <View style={{ padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Startup Setup</Text>
            <TextInput placeholder="Company Name" value={companyName} onChangeText={setCompanyName} style={{ borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 8 }} />
            <TextInput placeholder="About" value={about} onChangeText={setAbout} style={{ borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 8 }} />
            <TextInput placeholder="Location" value={location} onChangeText={setLocation} style={{ borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 8 }} />
            <TextInput placeholder="Company Type" value={companyType} onChangeText={setCompanyType} style={{ borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 8 }} />

            <TouchableOpacity onPress={save} style={{ paddingVertical: 12, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#06f', marginBottom: 12 }}>
                <Text style={{ color: '#06f', fontWeight: '700' }}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep(2)} style={{ paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: '#111', borderWidth: 1, borderColor: '#222' }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Next</Text>
            </TouchableOpacity>
        </View>
    );
}
