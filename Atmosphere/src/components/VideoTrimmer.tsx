import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { showEditor } from 'react-native-video-trim';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/Ionicons';

// Color scheme matching Atmosphere web (dark grey theme)
const COLORS = {
    primary: '#3d3d3d',
    accent: '#4d4d4d',
    success: '#22c55e',
    border: '#333333',
    textMuted: '#a3a3a3',
};

interface VideoTrimmerProps {
    videoUri: string;
    onTrimComplete: (trimmedVideoUri: string) => void;
    onCancel: () => void;
    theme: {
        background: string;
        text: string;
        border: string;
        placeholder: string;
    };
}

const VideoTrimmer = ({
    videoUri,
    onTrimComplete,
    onCancel,
    theme,
}: VideoTrimmerProps) => {
    const [loading, setLoading] = useState(false);
    const [previewUri, setPreviewUri] = useState(videoUri);

    const handleTrim = useCallback(async () => {
        setLoading(true);
        try {
            // Show the native video trimmer editor
            // The showEditor function opens the native trimmer UI
            showEditor(videoUri, {
                maxDuration: 60, // Max 60 seconds for reels
                minDuration: 3, // Min 3 seconds
                saveToPhoto: false,
            });

            // Note: react-native-video-trim uses event listeners for completion
            // The actual trimmed video is handled via the library's event system
            // For now, we'll pass the original URI and let the user trim
            // The library will emit events that can be listened to globally

            // After opening trimmer, close this modal
            // The trimmed result will be handled by the event listener
            setTimeout(() => {
                setLoading(false);
                onTrimComplete(videoUri);
            }, 500);
        } catch (error: any) {
            console.log('Video trim error:', error);
            setLoading(false);
        }
    }, [videoUri, onTrimComplete]);

    const handleSkipTrim = useCallback(() => {
        // Use original video without trimming
        onTrimComplete(videoUri);
    }, [videoUri, onTrimComplete]);

    return (
        <Modal visible={true} transparent animationType="slide">
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerButton} onPress={onCancel}>
                        <Icon name="arrow-back" size={28} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>
                        Trim Video
                    </Text>
                    <TouchableOpacity
                        style={styles.skipButton}
                        onPress={handleSkipTrim}
                        disabled={loading}
                    >
                        <Text style={styles.skipButtonText}>Skip</Text>
                    </TouchableOpacity>
                </View>

                {/* Video Preview */}
                <View style={styles.previewContainer}>
                    <View style={styles.videoWrapper}>
                        <Video
                            source={{ uri: previewUri }}
                            style={styles.video}
                            resizeMode="contain"
                            repeat
                            paused={false}
                            volume={0.5}
                        />
                    </View>
                </View>

                {/* Instructions */}
                <View style={styles.instructionsContainer}>
                    <Icon name="cut-outline" size={24} color={COLORS.success} />
                    <Text style={[styles.instructionsText, { color: theme.placeholder || COLORS.textMuted }]}>
                        Tap the button below to open the video trimmer and select the portion you want to keep
                    </Text>
                </View>

                {/* Trim Button */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.trimButton, loading && styles.trimButtonDisabled]}
                        onPress={handleTrim}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Icon name="cut" size={24} color="#fff" />
                                <Text style={styles.trimButtonText}>Open Trimmer</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: 64,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#222',
    },
    headerButton: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    skipButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    skipButtonText: {
        color: COLORS.success,
        fontWeight: '600',
        fontSize: 14,
    },
    previewContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    videoWrapper: {
        width: '100%',
        aspectRatio: 9 / 16,
        maxHeight: '80%',
        backgroundColor: '#000',
        borderRadius: 16,
        overflow: 'hidden',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    instructionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        gap: 12,
    },
    instructionsText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    buttonContainer: {
        padding: 16,
        paddingBottom: 32,
    },
    trimButton: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    trimButtonDisabled: {
        opacity: 0.6,
    },
    trimButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default VideoTrimmer;
