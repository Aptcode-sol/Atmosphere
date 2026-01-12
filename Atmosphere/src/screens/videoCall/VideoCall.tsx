import React, { useState, useEffect, useRef, useContext } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    FlatList,
    PermissionsAndroid,
    Platform,
} from 'react-native';
import {
    createAgoraRtcEngine,
    IRtcEngine,
    ChannelProfileType,
    ClientRoleType,
    RenderModeType,
    VideoSourceType,
    AudioScenarioType,
    AudioProfileType,
} from 'react-native-agora';
import { RtcSurfaceView } from 'react-native-agora';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { ThemeContext } from '../../contexts/ThemeContext';
import { getBaseUrl } from '../../lib/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAlert } from '../../components/CustomAlert';

import { VideoCallProps, RemoteUser, AgoraConfig } from './types';
import { styles, width } from './styles';
import { getGridColumns, getVideoHeight } from './utils';
import CallControls from './CallControls';

const VideoCall: React.FC<VideoCallProps> = ({ meetingId, onLeave }) => {
    const context = useContext(ThemeContext);
    const theme = context?.theme || { background: '#000', text: '#fff', primary: '#2C2C2C' };
    const { showAlert } = useAlert();

    const [loading, setLoading] = useState(true);
    const [joined, setJoined] = useState(false);
    const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
    const [micMuted, setMicMuted] = useState(false);
    const [videoMuted, setVideoMuted] = useState(false);
    const [frontCamera, setFrontCamera] = useState(true);
    const [_localUid, _setLocalUid] = useState<number>(0);
    const [_agoraConfig, _setAgoraConfig] = useState<AgoraConfig | null>(null);

    const engineRef = useRef<IRtcEngine | null>(null);

    const cleanup = React.useCallback(async () => {
        try {
            if (engineRef.current) {
                engineRef.current.stopPreview();
                engineRef.current.leaveChannel();
                engineRef.current.release();
                engineRef.current = null;
            }
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }, []);

    const initializeAgora = React.useCallback(async () => {
        try {
            setLoading(true);
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                ]);
                if (granted['android.permission.CAMERA'] !== PermissionsAndroid.RESULTS.GRANTED ||
                    granted['android.permission.RECORD_AUDIO'] !== PermissionsAndroid.RESULTS.GRANTED) {
                    showAlert('Permissions Required', 'Camera and microphone permissions are required for video calls');
                    setLoading(false);
                    return;
                }
            }

            const baseUrl = await getBaseUrl();
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${baseUrl}/api/meetings/${meetingId}/agora-token`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            });

            if (!response.ok) throw new Error('Failed to fetch Agora credentials');
            const credentials = await response.json();
            _setAgoraConfig(credentials);

            if (!credentials.appId) {
                showAlert('Error', 'Agora App ID not configured');
                setLoading(false);
                return;
            }

            const engine = createAgoraRtcEngine();
            engineRef.current = engine;
            engine.initialize({ appId: credentials.appId });
            engine.enableVideo();
            engine.enableAudio();
            engine.setAudioProfile(AudioProfileType.AudioProfileDefault, AudioScenarioType.AudioScenarioChatroom);
            engine.muteAllRemoteAudioStreams(false);
            engine.muteAllRemoteVideoStreams(false);
            engine.startPreview();
            engine.setVideoEncoderConfiguration({ dimensions: { width: 640, height: 480 }, frameRate: 15, bitrate: 0 });
            engine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
            engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);

            engine.registerEventHandler({
                onUserJoined: (connection, remoteUid) => {
                    setRemoteUsers(prev => prev.find(u => u.uid === remoteUid) ? prev : [...prev, { uid: remoteUid }]);
                },
                onUserOffline: (connection, remoteUid) => {
                    setRemoteUsers(prev => prev.filter(u => u.uid !== remoteUid));
                },
                onJoinChannelSuccess: (connection, elapsed) => {
                    if (connection.localUid !== undefined) _setLocalUid(connection.localUid);
                    setJoined(true);
                    setLoading(false);
                    engine.setEnableSpeakerphone(true);
                },
                onError: (err, msg) => console.error('Agora Error:', err, msg),
            });

            engine.joinChannel(credentials.token || '', credentials.channelName, credentials.uid || 0, {});
        } catch (error) {
            console.error('Error initializing Agora:', error);
            showAlert('Error', 'Failed to initialize video call');
            setLoading(false);
        }
    }, [meetingId]);

    useEffect(() => {
        initializeAgora();
        return () => { cleanup(); };
    }, [initializeAgora, cleanup]);

    const toggleMic = () => { engineRef.current?.muteLocalAudioStream(!micMuted); setMicMuted(!micMuted); };
    const toggleVideo = () => { engineRef.current?.muteLocalVideoStream(!videoMuted); setVideoMuted(!videoMuted); };
    const switchCamera = async () => { await engineRef.current?.switchCamera(); setFrontCamera(!frontCamera); };
    const handleLeave = () => {
        showAlert('Leave Meeting', 'Are you sure you want to leave?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Leave', style: 'destructive', onPress: async () => { await cleanup(); onLeave(); } },
        ]);
    };

    const renderLocalVideo = () => {
        if (!joined || videoMuted) {
            return (
                <View style={[styles.videoPlaceholder, { backgroundColor: theme.primary }]}>
                    <MaterialIcons name="videocam-off" size={48} color="#fff" />
                    <Text style={styles.placeholderText}>Camera Off</Text>
                </View>
            );
        }
        return (
            <RtcSurfaceView
                style={styles.localVideo}
                canvas={{ sourceType: VideoSourceType.VideoSourceCamera, renderMode: RenderModeType.RenderModeHidden }}
                zOrderMediaOverlay={remoteUsers.length > 0}
            />
        );
    };

    const renderRemoteVideo = ({ item }: { item: RemoteUser }) => {
        const numColumns = getGridColumns(remoteUsers.length);
        const videoHeight = getVideoHeight(remoteUsers.length);
        return (
            <View style={[styles.remoteVideoContainer, { width: numColumns === 1 ? width : (width - 24) / numColumns, height: videoHeight }]}>
                <RtcSurfaceView
                    style={styles.remoteVideo}
                    canvas={{ sourceType: VideoSourceType.VideoSourceRemote, uid: item.uid, renderMode: RenderModeType.RenderModeHidden }}
                    zOrderMediaOverlay={false}
                />
                <View style={styles.remoteUserInfo}><Text style={styles.remoteUserText}>User {item.uid}</Text></View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.text }]}>Joining meeting...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, styles.blackBackground]}>
            {remoteUsers.length === 0 ? (
                <View style={styles.mainVideoArea}>
                    <View style={styles.largeLocalVideoContainer}>
                        {renderLocalVideo()}
                        <View style={styles.largeLocalUserInfo}><Text style={styles.largeLocalUserText}>You</Text></View>
                    </View>
                    <View style={styles.noParticipants}>
                        <MaterialIcons name="people-outline" size={64} color="#999" />
                        <Text style={styles.noParticipantsText}>Waiting for others to join...</Text>
                        <Text style={styles.noParticipantsSubtext}>Share the meeting link to invite participants</Text>
                    </View>
                </View>
            ) : (
                <View style={styles.remoteContainer}>
                    <FlatList
                        data={remoteUsers}
                        renderItem={renderRemoteVideo}
                        keyExtractor={item => item.uid.toString()}
                        numColumns={getGridColumns(remoteUsers.length)}
                        key={getGridColumns(remoteUsers.length)}
                        contentContainerStyle={styles.participantGrid}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            )}

            {remoteUsers.length > 0 && (
                <View style={styles.smallLocalVideoWrapper}>
                    {renderLocalVideo()}
                    <View style={styles.localUserInfo}><Text style={styles.localUserText}>You</Text></View>
                </View>
            )}

            <View style={styles.infoContainer}>
                <Text style={styles.infoText}>{remoteUsers.length + 1} participant{remoteUsers.length !== 0 ? 's' : ''}</Text>
            </View>

            <CallControls
                micMuted={micMuted}
                videoMuted={videoMuted}
                onToggleMic={toggleMic}
                onToggleVideo={toggleVideo}
                onSwitchCamera={switchCamera}
                onLeave={handleLeave}
            />
        </View>
    );
};

export default VideoCall;
