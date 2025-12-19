import React from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AlertAction {
    label: string;
    onPress?: () => void;
    variant?: 'primary' | 'secondary';
}

interface CustomAlertProps {
    visible: boolean;
    type?: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    message?: string;
    onClose: () => void;
    actions?: AlertAction[];
}

const CustomAlert: React.FC<CustomAlertProps> = ({
    visible,
    type = 'info',
    title,
    message,
    onClose,
    actions,
}) => {
    const getIcon = () => {
        const iconProps = { size: 32 };
        switch (type) {
            case 'success':
                return <CheckCircle {...iconProps} color="#22c55e" />;
            case 'error':
                return <XCircle {...iconProps} color="#ef4444" />;
            case 'warning':
                return <AlertTriangle {...iconProps} color="#f59e0b" />;
            default:
                return <Info {...iconProps} color="#3b82f6" />;
        }
    };

    const getIconBgColor = () => {
        switch (type) {
            case 'success':
                return 'rgba(34, 197, 94, 0.15)';
            case 'error':
                return 'rgba(239, 68, 68, 0.15)';
            case 'warning':
                return 'rgba(245, 158, 11, 0.15)';
            default:
                return 'rgba(59, 130, 246, 0.15)';
        }
    };

    const handleAction = (action: AlertAction) => {
        if (action.onPress) {
            action.onPress();
        }
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.alertContainer}>
                    {/* Close button */}
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <X size={18} color="#666" />
                    </TouchableOpacity>

                    {/* Icon */}
                    <View style={[styles.iconContainer, { backgroundColor: getIconBgColor() }]}>
                        {getIcon()}
                    </View>

                    {/* Title */}
                    {title && <Text style={styles.title}>{title}</Text>}

                    {/* Message */}
                    {message && <Text style={styles.message}>{message}</Text>}

                    {/* Actions */}
                    {actions && actions.length > 0 ? (
                        <View style={styles.actionsRow}>
                            {actions.map((action, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.actionBtn,
                                        action.variant === 'secondary'
                                            ? styles.actionBtnSecondary
                                            : styles.actionBtnPrimary,
                                    ]}
                                    onPress={() => handleAction(action)}
                                >
                                    <Text
                                        style={[
                                            styles.actionBtnText,
                                            action.variant === 'secondary'
                                                ? styles.actionBtnTextSecondary
                                                : styles.actionBtnTextPrimary,
                                        ]}
                                    >
                                        {action.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.actionBtnPrimary, styles.singleBtn]}
                            onPress={onClose}
                        >
                            <Text style={[styles.actionBtnText, styles.actionBtnTextPrimary]}>OK</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertContainer: {
        width: SCREEN_WIDTH * 0.85,
        maxWidth: 340,
        backgroundColor: '#111',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    closeBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        padding: 4,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        color: '#888',
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        marginBottom: 20,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    actionBtn: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
    },
    actionBtnPrimary: {
        backgroundColor: '#fff',
    },
    actionBtnSecondary: {
        backgroundColor: '#333',
    },
    actionBtnText: {
        fontSize: 14,
        fontWeight: '600',
    },
    actionBtnTextPrimary: {
        color: '#000',
    },
    actionBtnTextSecondary: {
        color: '#fff',
    },
    singleBtn: {
        marginTop: 4,
    },
});

export default CustomAlert;
