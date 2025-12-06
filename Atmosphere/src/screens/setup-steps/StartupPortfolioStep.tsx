import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { updateProfile } from '../../lib/api';

function Section({ title, children, openDefault = false }: any) {
    const [open, setOpen] = useState(openDefault);
    return (
        <View style={{ marginBottom: 12 }}>
            <TouchableOpacity onPress={() => setOpen(o => !o)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{title}</Text>
                <Text style={{ color: '#fff' }}>{open ? '-' : '+'}</Text>
            </TouchableOpacity>
            {open ? <View style={{ paddingVertical: 8 }}>{children}</View> : null}
        </View>
    );
}

export default function StartupPortfolioStep({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
    const [companyProfile, setCompanyProfile] = useState('');
    const [financialProfile, setFinancialProfile] = useState('');
    const [raiseRound, setRaiseRound] = useState('');
    const [consent, setConsent] = useState(false);
    const [uploadName, setUploadName] = useState('');

    const uploadDoc = async () => {
        // placeholder: in real app open document picker / camera
        setUploadName('sample-document.pdf');
        Alert.alert('Upload', 'Pretend uploaded sample-document.pdf');
    };

    const sendForVerification = async () => {
        if (!consent) return Alert.alert('Consent required', 'Please provide consent to proceed');
        try {
            await updateProfile({ detailsData: { portfolioSubmitted: true } });
            Alert.alert('Sent', 'Documents sent for verification');
            onDone();
        } catch (err) {
            Alert.alert('Error', 'Unable to send for verification');
        }
    };

    return (
        <View style={{ flex: 1, padding: 20, backgroundColor: '#000' }}>
            <View style={{ height: 56, flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={onBack} style={{ padding: 8 }}>
                    <Text style={{ color: '#fff', fontSize: 22 }}>←</Text>
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Portfolio</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <Section title="Company profile">
                <TextInput placeholder="Company details" placeholderTextColor="#999" value={companyProfile} onChangeText={setCompanyProfile} style={{ borderWidth: 1, borderColor: '#222', borderRadius: 8, padding: 10, color: '#fff', marginBottom: 8 }} />
            </Section>

            <Section title="Financial profile">
                <TextInput placeholder="Financial details" placeholderTextColor="#999" value={financialProfile} onChangeText={setFinancialProfile} style={{ borderWidth: 1, borderColor: '#222', borderRadius: 8, padding: 10, color: '#fff', marginBottom: 8 }} />
            </Section>

            <Section title="Raise a round">
                <TextInput placeholder="Round details" placeholderTextColor="#999" value={raiseRound} onChangeText={setRaiseRound} style={{ borderWidth: 1, borderColor: '#222', borderRadius: 8, padding: 10, color: '#fff', marginBottom: 8 }} />
            </Section>

            <View style={{ marginVertical: 12, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#222' }}>
                <TouchableOpacity onPress={() => setConsent(c => !c)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: '#666', marginRight: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: consent ? '#fff' : 'transparent' }}>
                        {consent ? <Text style={{ fontSize: 12, color: '#000' }}>✓</Text> : null}
                    </View>
                    <Text style={{ color: '#fff', flex: 1 }}>I hereby consent to the collection, processing, and verification of the information and documents provided. I understand that all submitted materials will be reviewed for accuracy and compliance purposes.</Text>
                </TouchableOpacity>
            </View>

            <Text style={{ color: '#999', marginBottom: 8 }}>Upload any supporting documents</Text>
            <TouchableOpacity onPress={uploadDoc} style={{ borderWidth: 1, borderColor: '#222', padding: 12, borderRadius: 12, alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ color: '#fff' }}>📤  Upload Document{uploadName ? ` — ${uploadName}` : ''}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={sendForVerification} disabled={!consent} style={{ backgroundColor: consent ? '#444' : '#222', padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 24 }}>
                <Text style={{ color: consent ? '#fff' : '#777', fontWeight: '700' }}>Send for Verification</Text>
            </TouchableOpacity>

            <Text style={{ color: '#999', fontSize: 12 }}>All submitted documents will be reviewed and updated automatically.</Text>
        </View>
    );
}
