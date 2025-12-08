import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import StartupPortfolioStep from './StartupPortfolioStep';
import InvestorPortfolioStep from './InvestorPortfolioStep';
import { getProfile } from '../../lib/api';

export default function StartupVerifyStep({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
    const [showPortfolio, setShowPortfolio] = useState(false);
    const [userRole, setUserRole] = useState<'startup' | 'investor' | 'personal' | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const profile = await getProfile();
                console.log(profile)
                const acct = profile?.user?.roles[0] || (Array.isArray(profile?.user?.roles) && profile.user.roles.length > 0 ? profile.user.roles[0] : 'personal');
                setUserRole(acct);
            } catch {
                setUserRole('personal');
            }
        })();
    }, []);

    if (showPortfolio) {
        console.log(userRole)
        if (userRole === 'investor') {
            return <InvestorPortfolioStep onBack={() => setShowPortfolio(false)} onDone={onDone} />;
        }
        if (userRole === 'startup') {
            return <StartupPortfolioStep onBack={() => setShowPortfolio(false)} onDone={onDone} />;
        }
    }

    return (
        <View style={{ flex: 1, padding: 20, backgroundColor: '#000' }}>
            <View style={{ height: 56, flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={onBack} style={{ padding: 8 }}>
                    <Text style={{ color: '#fff', fontSize: 22 }}>←</Text>
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Get verified</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700', marginTop: 20 }}>Start with</Text>

            <View style={{ marginTop: 16 }}>
                <TouchableOpacity onPress={() => { }} style={{ borderWidth: 1, borderColor: '#222', padding: 18, borderRadius: 16, marginBottom: 12, backgroundColor: '#070707' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: '#fff', fontWeight: '600' }}>KYC</Text>
                        <Text style={{ color: '#fff' }}>›</Text>
                    </View>
                </TouchableOpacity>

                { userRole !== 'personel' &&<TouchableOpacity onPress={() => setShowPortfolio(true)} style={{ borderWidth: 1, borderColor: '#222', padding: 18, borderRadius: 16, marginBottom: 12, backgroundColor: '#070707' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: '#fff', fontWeight: '600' }}>Portfolio</Text>
                        <Text style={{ color: '#fff' }}>›</Text>
                    </View>
                </TouchableOpacity>}
            </View>

            <View style={{ flex: 1 }} />

            <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ color: '#999' }}>0/2 done</Text>
            </View>
        </View>
    );
}
