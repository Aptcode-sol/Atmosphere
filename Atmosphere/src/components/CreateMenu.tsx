/* eslint-disable react-native/no-inline-styles */
import React, { useContext } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Dimensions,
} from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

type CreateMenuProps = {
    visible: boolean;
    onClose: () => void;
    onSelectPost: () => void;
    onSelectReel: () => void;
};

const CreateMenu = ({ visible, onClose, onSelectPost, onSelectReel }: CreateMenuProps) => {
    const { theme } = useContext(ThemeContext) as any;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={[styles.menuContainer, { backgroundColor: theme.cardBackground || '#1a1a1a' }]}>
                    <View style={styles.handle} />
                    <Text style={[styles.title, { color: theme.text }]}>Create</Text>

                    <View style={styles.optionsContainer}>
                        {/* Post Option */}
                        <TouchableOpacity
                            style={styles.option}
                            onPress={() => {
                                onClose();
                                onSelectPost();
                            }}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: '#3b82f6' }]}>
                                <Icon name="image" size={28} color="#fff" />
                            </View>
                            <View style={styles.optionText}>
                                <Text style={[styles.optionTitle, { color: theme.text }]}>Post</Text>
                                <Text style={[styles.optionSubtitle, { color: theme.placeholder }]}>
                                    Share a photo or video
                                </Text>
                            </View>
                            <Icon name="chevron-forward" size={20} color={theme.placeholder} />
                        </TouchableOpacity>

                        {/* Reel Option */}
                        <TouchableOpacity
                            style={styles.option}
                            onPress={() => {
                                onClose();
                                onSelectReel();
                            }}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: '#ec4899' }]}>
                                <Icon name="videocam" size={28} color="#fff" />
                            </View>
                            <View style={styles.optionText}>
                                <Text style={[styles.optionTitle, { color: theme.text }]}>Reel</Text>
                                <Text style={[styles.optionSubtitle, { color: theme.placeholder }]}>
                                    Create a short video
                                </Text>
                            </View>
                            <Icon name="chevron-forward" size={20} color={theme.placeholder} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                        <Text style={[styles.cancelText, { color: theme.text }]}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    menuContainer: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#666',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 24,
    },
    optionsContainer: {
        gap: 12,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionText: {
        flex: 1,
        marginLeft: 16,
    },
    optionTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    optionSubtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    cancelButton: {
        marginTop: 20,
        padding: 16,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default CreateMenu;
