import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { updateProfile } from '../../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function InvestorSetup({ onDone }: { onDone: () => void }) {
    const [about, setAbout] = useState('');
    const [location, setLocation] = useState('');
    const [investmentFocus, setInvestmentFocus] = useState('');
    const [interestedRounds, setInterestedRounds] = useState('');

    // Load any pending unsaved investor data
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const raw = await AsyncStorage.getItem('pending.investor.details');
                if (!raw) return;
                const parsed = JSON.parse(raw || '{}');
                if (!mounted) return;
                if (parsed.about) setAbout(parsed.about);
                if (parsed.location) setLocation(parsed.location);
                if (parsed.investmentFocus) setInvestmentFocus(Array.isArray(parsed.investmentFocus) ? parsed.investmentFocus.join(', ') : (parsed.investmentFocus || ''));
                if (parsed.interestedRounds) setInterestedRounds(Array.isArray(parsed.interestedRounds) ? parsed.interestedRounds.join(', ') : (parsed.interestedRounds || ''));
            } catch {
                // ignore
            }
        })();
        return () => { mounted = false; };
    }, []);

    // Persist pending investor data locally whenever fields change
    useEffect(() => {
        const savePending = async () => {
            try {
                const payload = {
                    about,
                    location,
                    investmentFocus: investmentFocus ? investmentFocus.split(',').map(s => s.trim()) : [],
                    interestedRounds: interestedRounds ? interestedRounds.split(',').map(s => s.trim()) : [],
                };
                await AsyncStorage.setItem('pending.investor.details', JSON.stringify(payload));
            } catch {
                // ignore
            }
        };
        savePending();
    }, [about, location, investmentFocus, interestedRounds]);

    const save = async () => {
        try {
            await updateProfile({ detailsData: { about, location, investmentFocus: investmentFocus.split(',').map(s => s.trim()), interestedRounds: interestedRounds.split(',').map(s => s.trim()) } });
            Alert.alert('Saved', 'Investor details saved');
            try { await AsyncStorage.removeItem('pending.investor.details'); } catch { }
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
