import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import StartupPortfolioStep from './StartupPortfolioStep';
import InvestorPortfolioStep from './InvestorPortfolioStep';
import KycScreen from '../KycScreen';
import { getProfile, updateProfile } from '../../lib/api';

export default function StartupVerifyStep({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
    const [showPortfolio, setShowPortfolio] = useState(false);
    const [showKyc, setShowKyc] = useState(false);
    const [kycCompleted, setKycCompleted] = useState(false);
    const [portfolioCompleted, setPortfolioCompleted] = useState(false);
    /* eslint-disable react-native/no-inline-styles */
    const [userRole, setUserRole] = useState<'startup' | 'investor' | 'personal' | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const profile = await getProfile();
                console.log(profile);
                const roles = profile?.user?.roles || ['personal'];
                const acct = roles[0] || 'personal';
                setUserRole(acct);
                // Check existing verification status
                setKycCompleted(profile?.user?.isKycVerified || false);
                setPortfolioCompleted(profile?.user?.portfolioComplete || false);
            } catch {
                setUserRole('personal');
            }
        })();
    }, []);

    // Show KYC screen
    if (showKyc) {
        return (
            <KycScreen
                onBack={() => setShowKyc(false)}
                onComplete={async () => {
                    setKycCompleted(true);
                    setShowKyc(false);
                    // Save KYC status
                    try {
                        await updateProfile({ userData: { isKycVerified: true } });
                    } catch {
                        // ignore
                    }
                }}
            />
        );
    }

    if (showPortfolio) {
        console.log(userRole);
        if (userRole === 'investor') {
            return (
                <InvestorPortfolioStep
                    onBack={() => setShowPortfolio(false)}
                    onDone={async () => {
                        setPortfolioCompleted(true);
                        setShowPortfolio(false);
                        try {
                            await updateProfile({ userData: { portfolioComplete: true } });
                        } catch {
                            // ignore
                        }
                    }}
                />
            );
        }
        if (userRole === 'startup') {
            return (
                <StartupPortfolioStep
                    onBack={() => setShowPortfolio(false)}
                    onDone={async () => {
                        setPortfolioCompleted(true);
                        setShowPortfolio(false);
                        try {
                            await updateProfile({ userData: { portfolioComplete: true } });
                        } catch {
                            // ignore
                        }
                    }}
                />
            );
        }
    }

    // Calculate completion for display
    const totalSteps = userRole === 'personal' ? 1 : 2;
    const completedCount = (kycCompleted ? 1 : 0) + (portfolioCompleted ? 1 : 0);
    const allDone = userRole === 'personal' ? kycCompleted : (kycCompleted && portfolioCompleted);

    // Handle complete setup
    const handleComplete = async () => {
        if (!allDone) {
            Alert.alert('Incomplete', 'Please complete all required steps.');
            return;
        }
        try {
            await updateProfile({
                userData: {
                    isKycVerified: kycCompleted,
                    portfolioComplete: portfolioCompleted,
                    verified: true,
                    profileSetupComplete: true
                }
            });
            onDone();
        } catch {
            Alert.alert('Error', 'Failed to complete setup');
        }
    };

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
                <TouchableOpacity
                    onPress={() => setShowKyc(true)}
                    style={{
                        borderWidth: 1,
                        borderColor: kycCompleted ? '#22c55e' : '#222',
                        padding: 18,
                        borderRadius: 16,
                        marginBottom: 12,
                        backgroundColor: '#070707'
                    }}
                >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                            <Text style={{ color: '#fff', fontWeight: '600' }}>KYC</Text>
                            {kycCompleted && <Text style={{ color: '#22c55e', fontSize: 12, marginTop: 4 }}>Completed ✓</Text>}
                        </View>
                        <Text style={{ color: '#fff' }}>›</Text>
                    </View>
                </TouchableOpacity>

                {userRole !== 'personal' && (
                    <TouchableOpacity
                        onPress={() => setShowPortfolio(true)}
                        style={{
                            borderWidth: 1,
                            borderColor: portfolioCompleted ? '#22c55e' : '#222',
                            padding: 18,
                            borderRadius: 16,
                            marginBottom: 12,
                            backgroundColor: '#070707'
                        }}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View>
                                <Text style={{ color: '#fff', fontWeight: '600' }}>Portfolio</Text>
                                {portfolioCompleted && <Text style={{ color: '#22c55e', fontSize: 12, marginTop: 4 }}>Completed ✓</Text>}
                            </View>
                            <Text style={{ color: '#fff' }}>›</Text>
                        </View>
                    </TouchableOpacity>
                )}
            </View>

            <View style={{ flex: 1 }} />

            <View style={{ alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ color: '#999' }}>{completedCount}/{totalSteps} done</Text>
            </View>

            {/* Complete Setup button - only shows when all steps done */}
            <TouchableOpacity
                onPress={handleComplete}
                disabled={!allDone}
                style={{
                    backgroundColor: allDone ? '#22c55e' : '#333',
                    paddingVertical: 14,
                    borderRadius: 10,
                    alignItems: 'center',
                    marginBottom: 20,
                    opacity: allDone ? 1 : 0.5
                }}
            >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Complete Setup</Text>
            </TouchableOpacity>
        </View>
    );
}
