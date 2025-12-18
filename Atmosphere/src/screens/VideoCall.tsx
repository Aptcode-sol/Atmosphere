import React, { useState, useEffect, useRef, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Dimensions,
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
import { ThemeContext } from '../contexts/ThemeContext';
import { getBaseUrl } from '../lib/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

type VideoCallProps = {
    meetingId: string;
    onLeave: () => void;
};

type RemoteUser = {
    uid: number;
};

const VideoCall: React.FC<VideoCallProps> = ({ meetingId, onLeave }) => {
    const context = useContext(ThemeContext);
    const theme = context?.theme || {
        background: '#000',
        text: '#fff',
        primary: '#2C2C2C',
    };

    const [loading, setLoading] = useState(true);
    const [joined, setJoined] = useState(false);
    const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
    const [micMuted, setMicMuted] = useState(false);
    const [videoMuted, setVideoMuted] = useState(false);
    const [frontCamera, setFrontCamera] = useState(true);
    const [localUid, setLocalUid] = useState<number>(0); // Track local UID
    const [agoraConfig, setAgoraConfig] = useState<{
        appId: string;
        token: string;
        channelName: string;
        uid: number;
    } | null>(null);

    const engineRef = useRef<IRtcEngine | null>(null);

    useEffect(() => {
        initializeAgora();
        return () => {
            cleanup();
        };
    }, []);

    const requestPermissions = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                ]);

                const cameraGranted = granted['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED;
                const audioGranted = granted['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED;

                if (!cameraGranted || !audioGranted) {
                    Alert.alert('Permissions Required', 'Camera and microphone permissions are required for video calls');
                    return false;
                }
                return true;
            } catch (err) {
                console.error('Permission error:', err);
                return false;
            }
        }
        return true;
    };

    const fetchAgoraCredentials = async () => {
        try {
            const baseUrl = await getBaseUrl();
            const token = await AsyncStorage.getItem('token');

            const response = await fetch(`${baseUrl}/api/meetings/${meetingId}/agora-token`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch Agora credentials');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching Agora credentials:', error);
            throw error;
        }
    };

    const initializeAgora = async () => {
        try {
            setLoading(true);

            // Request permissions
            const hasPermissions = await requestPermissions();
            if (!hasPermissions) {
                setLoading(false);
                return;
            }

            // Fetch Agora credentials from backend
            const credentials = await fetchAgoraCredentials();
            setAgoraConfig(credentials);

            if (!credentials.appId) {
                Alert.alert('Error', 'Agora App ID not configured');
                setLoading(false);
                return;
            }

            // Create RTC engine
            const engine = createAgoraRtcEngine();
            engineRef.current = engine;

            // Initialize the engine
            engine.initialize({
                appId: credentials.appId,
            });

            // Enable video
            engine.enableVideo();

            // Enable audio
            engine.enableAudio();

            // Set audio profile for communication
            engine.setAudioProfile(
                AudioProfileType.AudioProfileDefault,
                AudioScenarioType.AudioScenarioChatroom
            );

            // Enable receiving remote streams
            engine.muteAllRemoteAudioStreams(false);
            engine.muteAllRemoteVideoStreams(false);

            // Start local video preview
            engine.startPreview();

            // Set video encoder configuration
            engine.setVideoEncoderConfiguration({
                dimensions: { width: 640, height: 480 },
                frameRate: 15,
                bitrate: 0, // Standard bitrate
            });

            // Set channel profile to communication
            engine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);

            // Set client role to broadcaster
            engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);

            // Register event handlers
            engine.registerEventHandler({
                onUserJoined: (connection, remoteUid) => {
                    console.log('UserJoined', remoteUid);

                    setRemoteUsers(prev => {
                        if (prev.find(u => u.uid === remoteUid)) return prev;
                        const updated = [...prev, { uid: remoteUid }];
                        console.log('Remote users updated:', updated);
                        return updated;
                    });
                },
                onUserOffline: (connection, remoteUid) => {
                    console.log('UserOffline', remoteUid);
                    setRemoteUsers(prev => prev.filter(u => u.uid !== remoteUid));
                },
                onRemoteVideoStateChanged: (connection, remoteUid, state, reason) => {
                    console.log('Remote video state changed:', {
                        uid: remoteUid,
                        state,
                        reason,
                    });
                },
                onJoinChannelSuccess: (connection, elapsed) => {
                    console.log('JoinChannelSuccess', connection.channelId, 'localUid:', connection.localUid, elapsed);
                    if (connection.localUid !== undefined) {
                        setLocalUid(connection.localUid); // Store the actual local UID
                    }
                    setJoined(true);
                    setLoading(false);

                    // Force speakerphone
                    engine.setEnableSpeakerphone(true);
                },
                onError: (err, msg) => {
                    console.error('Agora Error:', err, msg);
                },
            });

            // Join channel
            engine.joinChannel(
                credentials.token || '',
                credentials.channelName,
                credentials.uid || 0,
                {}
            );

        } catch (error) {
            console.error('Error initializing Agora:', error);
            Alert.alert('Error', 'Failed to initialize video call');
            setLoading(false);
        }
    };

    const cleanup = async () => {
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
    };

    const toggleMic = async () => {
        try {
            if (engineRef.current) {
                engineRef.current.muteLocalAudioStream(!micMuted);
                setMicMuted(!micMuted);
            }
        } catch (error) {
            console.error('Error toggling mic:', error);
        }
    };

    const toggleVideo = async () => {
        try {
            if (engineRef.current) {
                engineRef.current.muteLocalVideoStream(!videoMuted);
                setVideoMuted(!videoMuted);
            }
        } catch (error) {
            console.error('Error toggling video:', error);
        }
    };

    const switchCamera = async () => {
        try {
            if (engineRef.current) {
                await engineRef.current.switchCamera();
                setFrontCamera(!frontCamera);
            }
        } catch (error) {
            console.error('Error switching camera:', error);
        }
    };

    const handleLeave = async () => {
        Alert.alert(
            'Leave Meeting',
            'Are you sure you want to leave this meeting?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Leave',
                    style: 'destructive',
                    onPress: async () => {
                        await cleanup();
                        onLeave();
                    },
                },
            ]
        );
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

        // Local video is an overlay (on top) only if there are remote users
        const isOverlay = remoteUsers.length > 0;

        return (
            <RtcSurfaceView
                style={styles.localVideo}
                canvas={{
                    sourceType: VideoSourceType.VideoSourceCamera,
                    renderMode: RenderModeType.RenderModeHidden,
                }}
                zOrderMediaOverlay={isOverlay}
            />
        );
    };

    const renderRemoteVideo = ({ item }: { item: RemoteUser }) => {
        const totalParticipants = remoteUsers.length;
        const numColumns = getGridColumns(totalParticipants);
        const videoHeight = getVideoHeight(totalParticipants);

        return (
            <View style={[styles.remoteVideoContainer, {
                width: numColumns === 1 ? width : (width - 24) / numColumns,
                height: videoHeight,
            }]}>
                <RtcSurfaceView
                    style={styles.remoteVideo}
                    canvas={{
                        sourceType: VideoSourceType.VideoSourceRemote,
                        uid: item.uid,
                        renderMode: RenderModeType.RenderModeHidden,
                    }}
                    zOrderMediaOverlay={false}
                />
                <View style={styles.remoteUserInfo}>
                    <Text style={styles.remoteUserText}>User {item.uid}</Text>
                </View>
            </View>
        );
    };

    const getGridColumns = (participantCount: number) => {
        if (participantCount === 1) return 1;
        if (participantCount === 2) return 2;
        if (participantCount <= 4) return 2;
        return 3;
    };

    const getVideoHeight = (participantCount: number) => {
        if (participantCount === 1) return height * 0.8;
        if (participantCount === 2) return height * 0.5;
        if (participantCount <= 4) return height * 0.4;
        return 200;
    };

    const renderParticipantGrid = () => {
        // If no remote users, we render the 'waiting' state in the main return
        if (remoteUsers.length === 0) return null;

        const numColumns = getGridColumns(remoteUsers.length);

        return (
            <FlatList
                data={remoteUsers}
                renderItem={renderRemoteVideo}
                keyExtractor={(item) => item.uid.toString()}
                numColumns={numColumns}
                key={numColumns}
                contentContainerStyle={styles.participantGrid}
                showsVerticalScrollIndicator={false}
            />
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
        <View style={[styles.container, { backgroundColor: '#000' }]}>
            {remoteUsers.length === 0 ? (
                // No remote users - show local video large in center
                <View style={styles.mainVideoArea}>
                    <View style={styles.largeLocalVideoContainer}>
                        {renderLocalVideo()}
                        <View style={styles.largeLocalUserInfo}>
                            <Text style={styles.largeLocalUserText}>You</Text>
                        </View>
                    </View>
                    <View style={styles.noParticipants}>
                        <MaterialIcons name="people-outline" size={64} color="#999" />
                        <Text style={styles.noParticipantsText}>Waiting for others to join...</Text>
                        <Text style={[styles.noParticipantsText, { fontSize: 14, marginTop: 8 }]}>
                            Share the meeting link to invite participants
                        </Text>
                    </View>
                </View>
            ) : (
                // Has remote users - show them in grid
                <View style={styles.remoteContainer}>
                    {renderParticipantGrid()}
                </View>
            )}

            {/* Small local video preview - ALWAYS render when participants present */}
            {remoteUsers.length > 0 && (
                <View style={styles.smallLocalVideoWrapper}>
                    {renderLocalVideo()}
                    <View style={styles.localUserInfo}>
                        <Text style={styles.localUserText}>You</Text>
                    </View>
                </View>
            )}

            {/* Meeting info */}
            <View style={styles.infoContainer}>
                <Text style={styles.infoText}>
                    {remoteUsers.length + 1} participant{remoteUsers.length !== 0 ? 's' : ''}
                </Text>
            </View>

            {/* Controls */}
            <View style={styles.controlsContainer}>
                <TouchableOpacity
                    style={[styles.controlButton, micMuted && styles.controlButtonActive]}
                    onPress={toggleMic}
                >
                    <MaterialIcons name={micMuted ? 'mic-off' : 'mic'} size={28} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.controlButton, videoMuted && styles.controlButtonActive]}
                    onPress={toggleVideo}
                >
                    <MaterialIcons name={videoMuted ? 'videocam-off' : 'videocam'} size={28} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlButton} onPress={switchCamera}>
                    <MaterialIcons name="flip-camera-android" size={28} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.controlButton, styles.leaveButton]} onPress={handleLeave}>
                    <MaterialIcons name="call-end" size={28} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    mainVideoArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    largeLocalVideoContainer: {
        width: width * 0.9,
        height: height * 0.6,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#2a2a2a',
        elevation: 8,
    },
    largeLocalUserInfo: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
    },
    largeLocalUserText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    noParticipants: {
        marginTop: 40,
        alignItems: 'center',
        padding: 20,
    },
    noParticipantsText: {
        color: '#999',
        fontSize: 16,
        marginTop: 12,
        textAlign: 'center',
    },
    remoteContainer: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    participantGrid: {
        padding: 8,
        alignItems: 'center',
    },
    remoteVideoContainer: {
        margin: 4,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#2a2a2a',
        elevation: 2,
    },
    remoteVideo: {
        width: '100%',
        height: '100%',
    },
    remoteUserInfo: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    remoteUserText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    smallLocalVideoWrapper: {
        position: 'absolute',
        top: 60,
        right: 16,
        width: 120,
        height: 160,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#fff',
        backgroundColor: '#2a2a2a',
        elevation: 10,
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    localVideo: {
        width: '100%',
        height: '100%',
    },
    localUserInfo: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    localUserText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
    videoPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: '#fff',
        fontSize: 12,
        marginTop: 8,
    },
    controlsContainer: {
        position: 'absolute',
        bottom: 80,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
    controlButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 8,
    },
    controlButtonActive: {
        backgroundColor: '#e74c3c',
    },
    leaveButton: {
        backgroundColor: '#e74c3c',
    },
    infoContainer: {
        position: 'absolute',
        top: 12,
        left: 16,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        zIndex: 20,
    },
    infoText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default VideoCall;
