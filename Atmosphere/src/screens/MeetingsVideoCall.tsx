import React, { useState } from 'react';
import { View, Modal, SafeAreaView, Text, TouchableOpacity } from 'react-native';
import { MeetingProvider } from '@videosdk.live/react-native-sdk';
import JoinScreen from '../components/JoinScreen';
import MeetingView from '../components/MeetingView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBaseUrl } from '../lib/config';

// A simple screen that shows JoinScreen and MeetingView inside a Modal
function MeetingsVideoCall({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    const [meetingId, setMeetingId] = useState<string | null>(null);

    const handleGetMeetingId = async (id?: string) => {
        if (id) {
            setMeetingId(id);
            return;
        }
        // For create flow, call server to create meeting and return id (stub)
        try {
            const baseUrl = await getBaseUrl();
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${baseUrl}/api/video/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
            });
            if (!res.ok) throw new Error('Failed to create video meeting');
            const data = await res.json();
            setMeetingId(data.meetingId || data.id);
        } catch (e) {
            console.error('Create meeting failed', e);
        }
    };

    // If we have a meetingId, render MeetingProvider wrapper
    return (
        <Modal visible={visible} animationType="slide">
            <SafeAreaView style={{ flex: 1 }}>
                <View style={{ height: 56, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12 }}>
                    <Text style={{ fontSize: 18, fontWeight: '700' }}>Video Meeting</Text>
                    <View style={{ flexDirection: 'row' }}>
                        <TouchableOpacity onPress={() => { setMeetingId(null); onClose(); }} style={{ marginLeft: 12 }}>
                            <Text style={{ color: '#1178F8' }}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {!meetingId ? (
                    <JoinScreen getMeetingId={handleGetMeetingId} />
                ) : (
                    // MeetingProvider expects props; to avoid requiring full token logic,
                    // we rely on the consumer to configure native SDK tokens. Here we
                    // attempt to provide minimal wrapper — in many setups you need a
                    // meeting token from VideoSDK server.
                    <MeetingProvider meetingId={meetingId as any} joinScreen={false}>
                        <MeetingView />
                    </MeetingProvider>
                )}
            </SafeAreaView>
        </Modal>
    );
}

export default MeetingsVideoCall;
