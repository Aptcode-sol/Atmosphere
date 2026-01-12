import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
    cancelable?: boolean;
    onDismiss?: () => void;
}

interface AlertContextType {
    showAlert: (title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
    const [visible, setVisible] = useState(false);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState<string | undefined>('');
    const [buttons, setButtons] = useState<AlertButton[]>([]);
    const [options, setOptions] = useState<AlertOptions>({});

    const showAlert = (newTitle: string, newMessage?: string, newButtons?: AlertButton[], newOptions?: AlertOptions) => {
        setTitle(newTitle);
        setMessage(newMessage);
        setButtons(newButtons || [{ text: 'OK', onPress: () => setVisible(false) }]);
        setOptions(newOptions || {});
        setVisible(true);
    };

    const handleButtonPress = (onPress?: () => void) => {
        setVisible(false);
        if (onPress) {
            onPress();
        }
    };

    return (
        <AlertContext.Provider value={{ showAlert }}>
            {children}
            <Modal
                transparent={true}
                visible={visible}
                animationType="fade"
                onRequestClose={() => {
                    if (options.cancelable !== false) {
                        setVisible(false);
                        options.onDismiss?.();
                    }
                }}
            >
                <View style={styles.overlay}>
                    <View style={styles.alertContainer}>
                        <Text style={styles.title}>{title}</Text>
                        {message ? <Text style={styles.message}>{message}</Text> : null}
                        <View style={styles.buttonContainer}>
                            {buttons.map((btn, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.button,
                                        buttons.length > 2 ? styles.buttonVertical : styles.buttonHorizontal,
                                        index > 0 && buttons.length <= 2 ? styles.buttonBorderLeft : null,
                                        btn.style === 'cancel' ? styles.cancelButton : null
                                    ]}
                                    onPress={() => handleButtonPress(btn.onPress)}
                                >
                                    <Text style={[
                                        styles.buttonText,
                                        btn.style === 'destructive' ? styles.destructiveText : null,
                                        btn.style === 'cancel' ? styles.cancelText : null
                                    ]}>
                                        {btn.text}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </Modal>
        </AlertContext.Provider>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    alertContainer: {
        backgroundColor: '#1E1E1E',
        borderRadius: 14,
        width: '100%',
        maxWidth: 320,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#333',
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 8,
        paddingHorizontal: 16,
    },
    message: {
        fontSize: 13,
        color: '#ccc',
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 16,
        lineHeight: 18,
    },
    buttonContainer: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonHorizontal: {

    },
    buttonVertical: {
        // If we implemented vertical stacking for >2 buttons, we'd need column layout
        // For simplicity, keeping row but this might overflow with many buttons
    },
    buttonBorderLeft: {
        borderLeftWidth: 1,
        borderLeftColor: '#333',
    },
    buttonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
    destructiveText: {
        color: '#ff4444',
    },
    cancelButton: {

    },
    cancelText: {
        fontWeight: '400',
    }
});

export default AlertProvider;
