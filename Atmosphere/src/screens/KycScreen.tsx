/* eslint-disable react-native/no-inline-styles */
import React, { useState, useContext, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, Platform, PermissionsAndroid } from 'react-native';
import { WebView } from 'react-native-webview';
import { ThemeContext } from '../contexts/ThemeContext';
import { markKycComplete } from '../lib/api';

type Props = {
    onBack: () => void;
    onComplete: () => void;
};

const DIDIT_VERIFICATION_URL = 'https://verify.didit.me/verify/hHM7CFgRIxzJqnUeyVhBNg';

export default function KycScreen({ onBack, onComplete }: Props) {
    const { theme } = useContext(ThemeContext);
    const [error, setError] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const [_permissionGranted, setPermissionGranted] = useState(false);
    const webViewRef = useRef<WebView>(null);

    // Request camera permission on mount
    useEffect(() => {
        const requestPermissions = async () => {
            if (Platform.OS === 'android') {
                try {
                    const granted = await PermissionsAndroid.requestMultiple([
                        PermissionsAndroid.PERMISSIONS.CAMERA,
                        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    ]);
                    const cameraGranted = granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
                    const audioGranted = granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
                    setPermissionGranted(cameraGranted && audioGranted);
                    if (!cameraGranted) {
                        Alert.alert('Permission Required', 'Camera permission is needed for identity verification.');
                    }
                } catch (err) {
                    console.warn('Permission request error:', err);
                    setPermissionGranted(true); // Try anyway
                }
            } else {
                setPermissionGranted(true); // iOS handles permissions differently
            }
        };
        requestPermissions();
    }, []);

    const handleNavigationChange = async (navState: any) => {
        const { url, loading } = navState;

        // Hide initial loading once first page loads
        if (!loading && initialLoad) {
            setInitialLoad(false);
        }

        // Detect completion - Didit typically redirects to a success URL
        if (url.includes('success') || url.includes('completed') || url.includes('done') || url.includes('callback')) {
            // Mark KYC complete in backend
            try {
                await markKycComplete();
            } catch (err) {
                console.warn('Failed to update KYC status on server:', err);
            }

            Alert.alert(
                'KYC Complete',
                'Your identity verification has been submitted successfully!',
                [{ text: 'Continue', onPress: onComplete }]
            );
        }
    };

    const handleError = () => {
        setError(true);
        setInitialLoad(false);
    };

    const handleRetry = () => {
        setError(false);
        setInitialLoad(true);
        if (webViewRef.current) {
            webViewRef.current.reload();
        }
    };

    const renderLoading = () => (
        <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>Loading verification...</Text>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Text style={[styles.backText, { color: theme.text }]}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>KYC Verification</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.placeholder }]}>Powered by Didit</Text>
                </View>
                <View style={styles.headerRight} />
            </View>

            {/* WebView */}
            <View style={styles.webViewContainer}>
                {error ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorIcon}>⚠️</Text>
                        <Text style={[styles.errorText, { color: theme.text }]}>Failed to load verification</Text>
                        <Text style={[styles.errorDesc, { color: theme.placeholder }]}>
                            Please check your internet connection and try again.
                        </Text>
                        <TouchableOpacity
                            onPress={handleRetry}
                            style={[styles.retryBtn, { backgroundColor: theme.primary }]}
                        >
                            <Text style={styles.retryBtnText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <WebView
                        ref={webViewRef}
                        source={{ uri: DIDIT_VERIFICATION_URL }}
                        style={[styles.webView, { opacity: initialLoad ? 0 : 1 }]}
                        onNavigationStateChange={handleNavigationChange}
                        onError={handleError}
                        onHttpError={handleError}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        startInLoadingState={true}
                        renderLoading={renderLoading}
                        allowsInlineMediaPlayback={true}
                        mediaPlaybackRequiresUserAction={false}
                        allowsFullscreenVideo={true}
                        cacheEnabled={true}
                        // Android WebView settings
                        androidLayerType="hardware"
                        allowFileAccess={true}
                        geolocationEnabled={true}
                        // Grant all media capture permissions automatically
                        mediaCapturePermissionGrantType="grant"
                        // User agent to appear as mobile browser
                        userAgent="Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36"
                    />
                )}
            </View>

            {/* Footer info */}
            <View style={[styles.footer, { borderTopColor: theme.border }]}>
                <Text style={[styles.footerText, { color: theme.placeholder }]}>
                    Your data is encrypted and securely processed by Didit
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: 48,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backText: {
        fontSize: 24,
        fontWeight: '600',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    headerSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    headerRight: {
        width: 40,
    },
    webViewContainer: {
        flex: 1,
        position: 'relative',
    },
    webView: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 14,
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    errorIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    errorText: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    errorDesc: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    retryBtn: {
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 24,
    },
    retryBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    footer: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    footerText: {
        fontSize: 12,
        textAlign: 'center',
    },
});
