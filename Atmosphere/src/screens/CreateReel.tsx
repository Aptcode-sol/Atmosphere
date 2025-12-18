/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useRef, useContext } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    StyleSheet,
    Alert,
    Image,
    Dimensions,
    Platform,
    Modal,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { createThumbnail } from 'react-native-create-thumbnail';
import { createReel, uploadVideo, uploadDocument } from '../lib/api';
import Icon from 'react-native-vector-icons/Ionicons';
import Video, { VideoRef } from 'react-native-video';
import VideoTrimmer from '../components/VideoTrimmer';
import { ThemeContext } from '../contexts/ThemeContext';
import Slider from '@react-native-community/slider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Color scheme matching Atmosphere web (dark grey theme)
const COLORS = {
    primary: '#3d3d3d',       // Sophisticated grey
    primaryHover: '#4d4d4d',
    accent: '#4d4d4d',
    success: '#22c55e',       // Green for success states
    background: '#0a0a0a',
    card: '#0d0d0d',
    cardHover: '#121212',
    border: '#333333',
    text: '#f5f5f5',
    textMuted: '#a3a3a3',
    textPlaceholder: '#666666',
    error: '#ef4444',
};

type Props = {
    onClose: () => void;
    onSuccess?: () => void;
};

const CreateReel = ({ onClose, onSuccess }: Props) => {
    const { theme } = useContext(ThemeContext) as any;

    // Step state: 'trim' (step 1) or 'details' (step 2)
    const [step, setStep] = useState<'trim' | 'details'>('trim');

    const [selectedVideo, setSelectedVideo] = useState<{
        uri: string;
        type?: string;
        fileName?: string;
        duration?: number;
        thumbnail?: string;
        isTrimmed?: boolean;
    } | null>(null);
    const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [tags, setTags] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string>('');
    const [thumbnails, setThumbnails] = useState<string[]>([]);

    // Trimmer states
    const [showTrimmer, setShowTrimmer] = useState(false);
    const [pendingVideoUri, setPendingVideoUri] = useState<string | null>(null);

    // Helper to sanitize URI
    const getCleanUri = (uri: string) => {
        if (!uri) return '';
        if (Platform.OS === 'android') {
            if (uri.startsWith('content://')) return uri;
            if (!uri.startsWith('file://') && !uri.startsWith('http')) {
                return `file://${uri}`;
            }
        }
        return uri;
    };

    // Helper to get displayable image URI (needs file:// on Android sometimes)
    const getDisplayUri = (path: string) => {
        return Platform.OS === 'android' && !path.startsWith('file://') && !path.startsWith('http') && !path.startsWith('content://')
            ? `file://${path}`
            : path;
    };
    const [seekTime, setSeekTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const videoRef = useRef<VideoRef>(null);

    // Initial load: Open Picker
    useEffect(() => {
        if (!selectedVideo) {
            handlePickVideo();
        }
    }, []);

    const handlePickVideo = async () => {
        try {
            const result = await launchImageLibrary({
                mediaType: 'video',
                quality: 0.8,
                videoQuality: 'medium',
            });

            if (result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                if (!asset.uri) {
                    Alert.alert('Error', 'Selected video has no URI');
                    return;
                }
                const uri = asset.uri;
                // Auto-set as selected for Step 1
                setSelectedVideo({
                    uri: uri,
                    type: asset.type,
                    fileName: asset.fileName,
                    duration: asset.duration,
                });
                setStep('trim');
                setIsPlaying(true);
            } else if (!selectedVideo) {
                // If cancelled and no video, close? Or just stay
                onClose();
            }
        } catch (error) {
            console.error('Video picker error:', error);
            Alert.alert('Error', 'Failed to pick video');
        }
    };

    const generateThumbnails = async (uri: string, duration: number) => {
        if (!uri || !duration) return;
        const numThumbs = 6;
        const interval = duration / numThumbs;
        const newThumbnails: string[] = [];

        try {
            for (let i = 0; i < numThumbs; i++) {
                const time = Math.floor(i * interval * 1000);
                try {
                    const cleanUri = getCleanUri(uri);
                    const thumb = await createThumbnail({
                        url: cleanUri,
                        timeStamp: time,
                        format: 'jpeg',
                        cacheName: `thumb_${i}_${Date.now()}`
                    });
                    newThumbnails.push(getDisplayUri(thumb.path));
                } catch (e) {
                    console.warn(`Thumbnail gen failed frame ${i}`, e);
                }
            }
            console.log(`Generated ${newThumbnails.length} thumbnails`);
            setThumbnails(newThumbnails);
        } catch (error) {
            console.error('Error generating thumbnails:', error);
        }
    };

    const handleTrimComplete = (trimmedVideoUri: string) => {
        if (!trimmedVideoUri) return;
        setSelectedVideo({
            uri: trimmedVideoUri,
            type: 'video/mp4',
            fileName: 'trimmed_video.mp4',
            isTrimmed: true,
        });
        setCoverPhoto(null);
        setSeekTime(0);
        setIsPlaying(true);
        setShowTrimmer(false);
    };

    const handleNext = () => {
        if (!selectedVideo) return;
        setIsPlaying(false); // Pause for next step
        setSeekTime(0); // Reset seek for cover selection start
        setStep('details');

        // Generate thumbnails now if not done or if trimmed
        if (selectedVideo.duration) {
            generateThumbnails(selectedVideo.uri, selectedVideo.duration);
        }
    };

    const handleSliderChange = (value: number) => {
        // Update seek time but DO NOT play
        setSeekTime(value);
        setIsPlaying(false);
        if (videoRef.current) {
            videoRef.current.seek(value);
        }
    };

    const handleShare = async () => {
        if (!selectedVideo) return;
        setLoading(true);
        try {
            setUploadStatus('Uploading video...');
            // 1. Upload Video
            const uploadResult = await uploadVideo(selectedVideo.uri);

            // 2. Prepare Cover Photo
            setUploadStatus('Processing cover...');
            let finalCoverUrl = uploadResult.thumbnailUrl; // Default to backend generated

            let coverUriToUpload = coverPhoto;

            // If no custom cover, generate one from the selected seek time
            if (!coverUriToUpload && selectedVideo.duration) {
                try {
                    const cleanUri = getCleanUri(selectedVideo.uri);
                    console.log('Generating cover from video at', seekTime, 'URI:', cleanUri);
                    const thumb = await createThumbnail({
                        url: cleanUri,
                        timeStamp: Math.floor(seekTime * 1000), // ms
                        format: 'jpeg',
                        cacheName: `cover_${Date.now()}`
                    });
                    coverUriToUpload = getDisplayUri(thumb.path);
                    console.log('Generated Cover URI:', coverUriToUpload);
                } catch (e) {
                    console.warn('Failed to generate cover at seek time, using default', e);
                }
            }

            // Upload the cover image if we have a local URI
            if (coverUriToUpload) {
                try {
                    setUploadStatus('Uploading cover...');
                    console.log('Uploading cover:', coverUriToUpload);
                    const uploadedUrl = await uploadDocument(
                        coverUriToUpload,
                        'cover.jpg',
                        'image/jpeg'
                    );
                    finalCoverUrl = uploadedUrl;
                } catch (e) {
                    console.error('Failed to upload cover photo', e);
                    // Fallback to video thumbnail if upload fails
                }
            }

            setUploadStatus('Creating reel...');
            const payload = {
                videoUrl: uploadResult.url,
                thumbnailUrl: finalCoverUrl,
                caption: caption.trim(),
                tags: tags.trim() ? tags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean) : [],
                duration: uploadResult.duration || selectedVideo.duration || 0,
                // seekTime is less critical now since we are uploading the explicit image
                seekTime: coverPhoto ? undefined : seekTime,
            };
            await createReel(payload);
            Alert.alert('Success', 'Reel created successfully!', [
                { text: 'OK', onPress: () => { onSuccess?.(); onClose(); } }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to create reel');
        } finally {
            setLoading(false);
            setUploadStatus('');
        }
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Render Step 1: Trim / Full Screen Preview
    const renderStep1 = () => (
        <View style={styles.fullScreenContainer}>
            {selectedVideo && (
                <Video
                    ref={videoRef}
                    source={{ uri: getCleanUri(selectedVideo.uri) }}
                    style={styles.fullScreenVideo}
                    resizeMode="contain"
                    repeat={true}
                    muted={false}
                    paused={!isPlaying}
                    onLoad={(data) => {
                        console.log('Step 1 Video Loaded:', data.duration);
                        setSelectedVideo(prev => prev ? ({ ...prev, duration: data.duration }) : null);
                    }}
                    onError={() => Alert.alert('Error', 'Failed to load video')}
                />
            )}

            <View style={styles.step1Header}>
                <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
                    <Icon name="close" size={28} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                    <Text style={styles.nextBtnText}>Next</Text>
                    <Icon name="chevron-forward" size={16} color="#000" />
                </TouchableOpacity>
            </View>

            <View style={styles.step1Footer}>
                <TouchableOpacity style={styles.trimBtn} onPress={() => setShowTrimmer(true)}>
                    <Icon name="cut-outline" size={24} color="#fff" />
                    <Text style={styles.trimBtnText}>Trim Video</Text>
                </TouchableOpacity>
            </View>

            {/* Trimmer Modal (reused) */}
            {showTrimmer && selectedVideo && (
                <VideoTrimmer
                    videoUri={selectedVideo.uri}
                    onTrimComplete={handleTrimComplete}
                    onCancel={() => setShowTrimmer(false)}
                    theme={theme}
                />
            )}
        </View>
    );

    // Render Step 2: Details
    const renderStep2 = () => (
        <View style={[styles.container, { backgroundColor: theme.background || COLORS.background }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => {
                    setStep('trim');
                    setIsPlaying(true);
                }}>
                    <Icon name="chevron-back" size={28} color={theme.text || COLORS.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text || COLORS.text }]}>New Reel</Text>
                <TouchableOpacity
                    style={[styles.shareButton, { opacity: loading ? 0.5 : 1 }]}
                    onPress={handleShare}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.shareButtonText}>Post</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.contentContainer}>
                {/* Top: Video Preview for Cover Selection */}
                {selectedVideo && (
                    <View style={styles.detailsVideoPreview}>
                        <Video
                            ref={videoRef}
                            source={{ uri: getCleanUri(selectedVideo.uri) }}
                            style={styles.previewVideo}
                            resizeMode="cover"
                            paused={true} // ALWAYS PAUSED IN STEP 2
                            onLoad={(data) => {
                                // Failsafe: if duration was lost, capture it here and gen thumbnails
                                if (!selectedVideo.duration || thumbnails.length === 0) {
                                    console.log('Step 2 Video Loaded (Failsafe)', data.duration);
                                    setSelectedVideo(prev => prev ? ({ ...prev, duration: data.duration }) : null);
                                    generateThumbnails(selectedVideo.uri, data.duration);
                                }
                            }}
                        />
                        {/* Filmstrip Overlay */}
                        <View style={styles.coverSelectorContainer}>
                            <Text style={styles.helperText}>Select Cover Frame</Text>
                            <View style={styles.timelineContainer}>
                                <View style={styles.filmstripContainer}>
                                    {thumbnails.map((thumb, index) => (
                                        <View key={`thumb_${index}`} style={styles.filmstripFrameContainer}>
                                            <Image source={{ uri: thumb }} style={styles.filmstripFrame} resizeMode="cover" />
                                        </View>
                                    ))}
                                </View>
                                <Slider
                                    style={styles.sliderOverlay}
                                    minimumValue={0}
                                    maximumValue={selectedVideo.duration || 10}
                                    value={seekTime}
                                    onValueChange={handleSliderChange}
                                    minimumTrackTintColor="transparent"
                                    maximumTrackTintColor="transparent"
                                    thumbTintColor="#fff"
                                />
                            </View>
                        </View>
                    </View>
                )}

                {/* Caption & Details */}
                <View style={styles.detailsForm}>
                    <TextInput
                        style={[styles.captionInput, { color: theme.text || COLORS.text }]}
                        placeholder="Write a caption..."
                        placeholderTextColor={COLORS.textPlaceholder}
                        multiline
                        value={caption}
                        onChangeText={setCaption}
                    />
                    <View style={styles.divider} />
                    <Text style={[styles.inputLabel, { color: theme.text || COLORS.text }]}>Tags</Text>
                    <TextInput
                        style={[styles.tagInput, { color: theme.text || COLORS.text, borderColor: theme.border }]}
                        placeholder="#startup #tech"
                        placeholderTextColor={COLORS.textPlaceholder}
                        value={tags}
                        onChangeText={setTags}
                    />
                </View>
            </ScrollView>
        </View>
    );

    if (step === 'trim') return renderStep1();
    return renderStep2();
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
        borderBottomColor: COLORS.border,
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
        backgroundColor: COLORS.primary,
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
        height: 400, // Force fixed height for debug
        backgroundColor: '#000',
        marginBottom: 16,
    },
    videoPlaceholder: {
        width: '100%',
        height: '100%',
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.card,
    },
    placeholderIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.cardHover,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    videoPreviewContainer: {
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
        // Removed borderRadius and overflow hidden which can cause issues with SurfaceView on Android
    },
    videoPreviewImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
    },
    playIndicator: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    videoOverlay: {
        position: 'absolute',
        top: 12,
        left: 12,
    },
    videoInfoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
    },
    videoInfoText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    changeVideoOverlay: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        zIndex: 10,
    },
    changeVideoBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    changeVideoText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 13,
    },
    placeholderText: {
        fontSize: 16,
        fontWeight: '600',
    },
    placeholderHint: {
        fontSize: 13,
        marginTop: 6,
    },
    uploadStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        backgroundColor: COLORS.cardHover,
    },
    uploadStatusText: {
        marginLeft: 8,
        fontSize: 14,
    },

    // Cover Section Styles
    coverSection: {
        marginBottom: 24,
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    coverSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    timelineContainer: {
        marginBottom: 16,
        height: 80, // Height for filmstrip + labels
        justifyContent: 'center',
        paddingHorizontal: 0,
    },
    filmstripContainer: {
        flexDirection: 'row',
        height: 50,
        backgroundColor: '#000',
        borderRadius: 8,
        overflow: 'hidden',
        width: '100%',
        position: 'absolute',
        top: 0,
    },
    filmstripFrameContainer: {
        width: SCREEN_WIDTH / 6, // Force explicit width based on screen width
        height: 50,
        borderRightWidth: 1,
        borderRightColor: '#000',
        backgroundColor: '#222', // Visible background if image fails
    },
    filmstripFrame: {
        width: '100%',
        height: '100%',
        opacity: 0.8,
        backgroundColor: '#333', // Placeholder color
    },
    slider: {
        width: '100%',
        height: 40,
    },
    sliderOverlay: {
        width: '100%',
        height: 50, // Match filmstrip height
        position: 'absolute',
        top: 0,
        zIndex: 10,
    },
    timelineLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        marginTop: 54, // Push below filmstrip
    },
    timelineTime: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
    timelineHint: {
        color: COLORS.textMuted,
        fontSize: 12,
        textAlign: 'center',
        marginTop: 4,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 16,
    },
    coverOptionsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    galleryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: COLORS.cardHover,
        borderRadius: 8,
        gap: 8,
        width: '100%',
    },
    galleryBtnText: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '500',
    },
    customCoverPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        backgroundColor: COLORS.cardHover,
        padding: 12,
        borderRadius: 8,
        gap: 12,
    },
    customCoverImage: {
        width: 48,
        height: 48,
        borderRadius: 6,
        backgroundColor: '#000',
    },
    customCoverInfo: {
        flex: 1,
    },
    customCoverLabel: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    removeCoverLink: {
        alignSelf: 'flex-start',
    },
    removeCoverText: {
        color: COLORS.error,
        fontSize: 13,
        fontWeight: '500',
    },

    // Inputs
    inputSection: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
    },
    textInput: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 12,
        fontSize: 15,
        borderWidth: 1,
        minHeight: 100,
    },
    tagInput: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 12,
        fontSize: 15,
        borderWidth: 1,
    },

    // Step 1 Styles
    fullScreenContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    fullScreenVideo: {
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
    },
    step1Header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        paddingTop: Platform.OS === 'android' ? 16 : 48,
        zIndex: 10,
    },
    iconBtn: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 22,
    },
    nextBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 24,
        gap: 4,
    },
    nextBtnText: {
        color: '#000',
        fontWeight: '700',
        fontSize: 14,
    },
    step1Footer: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    trimBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(50,50,50,0.8)',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 28,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    trimBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },

    // Step 2 Styles
    detailsVideoPreview: {
        width: '100%',
        height: 400, // Large preview
        backgroundColor: '#111',
        marginBottom: 20,
        position: 'relative',
    },
    previewVideo: {
        width: '100%',
        height: 320, // Leave space for filmstrip below
    },
    coverSelectorContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: 'rgba(0,0,0,0.9)',
        paddingHorizontal: 16,
        justifyContent: 'center',
    },
    helperText: {
        color: '#ccc',
        fontSize: 12,
        marginBottom: 8,
        textAlign: 'center',
        marginTop: 4,
    },
    detailsForm: {
        paddingHorizontal: 16,
    },
    captionInput: {
        fontSize: 16,
        minHeight: 80,
        textAlignVertical: 'top',
    },

    coverOptionsModal: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    coverOptionsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 24,
    },
    coverOption: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        padding: 16,
        backgroundColor: COLORS.background,
        borderRadius: 12,
        marginBottom: 12,
        gap: 16,
    },
    coverOptionTextContainer: {
        flex: 1,
    },
    coverOptionText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    coverOptionHint: {
        fontSize: 13,
        color: COLORS.textMuted,
    },
    coverCancelBtn: {
        marginTop: 12,
        padding: 12,
    },
    coverCancelText: {
        color: COLORS.textMuted,
        fontSize: 15,
        fontWeight: '600',
    },
});

export default CreateReel;
