/* eslint-disable react-native/no-inline-styles */
import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    ScrollView,
    ActivityIndicator,
    StyleSheet,
    Alert,
} from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { launchImageLibrary } from 'react-native-image-picker';
import { createReel, uploadVideo } from '../lib/api';
import Icon from 'react-native-vector-icons/Ionicons';

type Props = {
    onClose: () => void;
    onSuccess?: () => void;
};

const CreateReel = ({ onClose, onSuccess }: Props) => {
    const { theme } = useContext(ThemeContext) as any;
    const [selectedVideo, setSelectedVideo] = useState<{
        uri: string;
        type?: string;
        fileName?: string;
        duration?: number;
        thumbnail?: string;
    } | null>(null);
    const [caption, setCaption] = useState('');
    const [tags, setTags] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string>('');

    const handlePickVideo = async () => {
        try {
            const result = await launchImageLibrary({
                mediaType: 'video',
                quality: 0.8,
                videoQuality: 'medium',
            });

            if (result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                setSelectedVideo({
                    uri: asset.uri || '',
                    type: asset.type || 'video/mp4',
                    fileName: asset.fileName || 'video.mp4',
                    duration: asset.duration,
                });
            }
        } catch (error) {
            console.error('Video picker error:', error);
            Alert.alert('Error', 'Failed to pick video');
        }
    };

    const handleShare = async () => {
        if (!selectedVideo) {
            Alert.alert('Error', 'Please select a video');
            return;
        }

        setLoading(true);
        try {
            // Upload video to S3
            setUploadStatus('Uploading video...');
            const uploadResult = await uploadVideo(selectedVideo.uri);

            setUploadStatus('Creating reel...');
            const payload = {
                videoUrl: uploadResult.url,
                thumbnailUrl: uploadResult.thumbnailUrl,
                caption: caption.trim(),
                tags: tags.trim() ? tags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean) : [],
                duration: uploadResult.duration || selectedVideo.duration || 0,
            };

            await createReel(payload);
            Alert.alert('Success', 'Reel created successfully!', [
                { text: 'OK', onPress: () => { onSuccess?.(); onClose(); } }
            ]);
        } catch (error: any) {
            console.error('Create reel error:', error);
            Alert.alert('Error', error.message || 'Failed to create reel');
        } finally {
            setLoading(false);
            setUploadStatus('');
        }
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return '';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={onClose}>
                    <Icon name="close" size={28} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>New Reel</Text>
                <TouchableOpacity
                    style={[styles.shareButton, { opacity: selectedVideo ? 1 : 0.5 }]}
                    onPress={handleShare}
                    disabled={!selectedVideo || loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.shareButtonText}>Post</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Upload Status */}
            {uploadStatus ? (
                <View style={styles.uploadStatus}>
                    <ActivityIndicator size="small" color="#ec4899" />
                    <Text style={[styles.uploadStatusText, { color: theme.text }]}>
                        {uploadStatus}
                    </Text>
                </View>
            ) : null}

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                {/* Video Picker / Preview */}
                <TouchableOpacity style={styles.videoPicker} onPress={handlePickVideo}>
                    {selectedVideo ? (
                        <View style={styles.videoSelectedContainer}>
                            {/* Video Icon Background */}
                            <View style={styles.videoIconBg}>
                                <Icon name="videocam" size={64} color="#ec4899" />
                            </View>

                            {/* Video Info */}
                            <View style={styles.videoInfo}>
                                <Icon name="checkmark-circle" size={32} color="#22c55e" />
                                <Text style={styles.videoSelectedText}>Video Ready</Text>
                                <Text style={styles.videoFileName} numberOfLines={1}>
                                    {selectedVideo.fileName}
                                </Text>
                                {selectedVideo.duration ? (
                                    <Text style={styles.videoDuration}>
                                        Duration: {formatDuration(selectedVideo.duration)}
                                    </Text>
                                ) : null}
                            </View>

                            {/* Change Button */}
                            <View style={styles.changeVideoBtnContainer}>
                                <View style={styles.changeVideoBtn}>
                                    <Icon name="refresh" size={16} color="#fff" />
                                    <Text style={styles.changeVideoText}>Change Video</Text>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View style={[styles.videoPlaceholder, { borderColor: theme.border }]}>
                            <Icon name="videocam" size={56} color={theme.placeholder} />
                            <Text style={[styles.placeholderText, { color: theme.placeholder }]}>
                                Tap to select video
                            </Text>
                            <Text style={[styles.placeholderHint, { color: theme.placeholder }]}>
                                Max 100MB, any format
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Caption Input */}
                <View style={styles.inputSection}>
                    <Text style={[styles.inputLabel, { color: theme.text }]}>Caption</Text>
                    <TextInput
                        style={[styles.textInput, { color: theme.text, borderColor: theme.border }]}
                        placeholder="Add a caption for your reel..."
                        placeholderTextColor={theme.placeholder}
                        multiline
                        numberOfLines={4}
                        value={caption}
                        onChangeText={setCaption}
                        textAlignVertical="top"
                    />
                </View>

                {/* Tags Input */}
                <View style={styles.inputSection}>
                    <Text style={[styles.inputLabel, { color: theme.text }]}>Tags</Text>
                    <TextInput
                        style={[styles.tagInput, { color: theme.text, borderColor: theme.border }]}
                        placeholder="startup, pitch, demo (comma separated)"
                        placeholderTextColor={theme.placeholder}
                        value={tags}
                        onChangeText={setTags}
                    />
                </View>
            </ScrollView>
        </View>
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
    shareButton: {
        backgroundColor: '#ec4899',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        minWidth: 70,
        alignItems: 'center',
    },
    shareButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 100,
    },
    videoPicker: {
        width: '100%',
        aspectRatio: 9 / 14,
        maxHeight: 400,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 24,
    },
    videoPlaceholder: {
        flex: 1,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111',
    },
    videoSelectedContainer: {
        flex: 1,
        backgroundColor: '#1a1a2e',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    videoIconBg: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(236, 72, 153, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    videoInfo: {
        alignItems: 'center',
    },
    videoSelectedText: {
        color: '#22c55e',
        fontSize: 18,
        fontWeight: '700',
        marginTop: 8,
    },
    videoFileName: {
        color: '#888',
        fontSize: 13,
        marginTop: 4,
        maxWidth: 200,
    },
    videoDuration: {
        color: '#ec4899',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 8,
    },
    changeVideoBtnContainer: {
        marginTop: 20,
    },
    changeVideoBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    changeVideoText: {
        color: '#fff',
        marginLeft: 8,
        fontWeight: '500',
    },
    placeholderText: {
        fontSize: 16,
        fontWeight: '500',
        marginTop: 12,
    },
    placeholderHint: {
        fontSize: 12,
        marginTop: 4,
    },
    inputSection: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    textInput: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        minHeight: 100,
        backgroundColor: '#0a0a0a',
    },
    tagInput: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        backgroundColor: '#0a0a0a',
    },
    uploadStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
    },
    uploadStatusText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '500',
    },
});

export default CreateReel;
