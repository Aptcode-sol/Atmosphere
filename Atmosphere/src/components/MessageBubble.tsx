import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { ThemeContext } from '../contexts/ThemeContext';
import { getImageSource } from '../lib/image';

interface Message {
    _id: string;
    body: string;
    sender: {
        _id: string;
        displayName: string;
        username: string;
        avatarUrl?: string;
    };
    createdAt?: string;
    status?: 'sent' | 'delivered' | 'read';
    replyTo?: {
        _id: string;
        body: string;
        sender?: { displayName: string };
    };
}

interface MessageBubbleProps {
    message: Message;
    isMe: boolean;
    showSenderName?: boolean;
    onLongPress?: (message: Message) => void;
    onReplyPress?: (message: Message) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
    message,
    isMe,
    showSenderName = false,
    onLongPress,
    onReplyPress
}) => {
    const { theme } = useContext(ThemeContext);

    const timestamp = message.createdAt
        ? new Date(message.createdAt).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
        : '';

    // Status indicators with Material Icons
    const renderStatus = () => {
        if (!isMe) return null;

        switch (message.status) {
            case 'read':
                return <MaterialIcons name="done-all" size={14} color="#4FC3F7" />;
            case 'delivered':
                return <MaterialIcons name="done-all" size={14} color="rgba(255,255,255,0.7)" />;
            case 'sent':
            default:
                return <MaterialIcons name="done" size={14} color="rgba(255,255,255,0.6)" />;
        }
    };

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onLongPress={() => onLongPress?.(message)}
            style={[
                styles.messageRow,
                isMe ? styles.messageRowMe : styles.messageRowThem
            ]}
        >
            {/* Avatar for other users */}
            {!isMe && (
                <Image
                    source={getImageSource(message.sender.avatarUrl || 'https://via.placeholder.com/32')}
                    style={styles.senderAvatar}
                />
            )}

            <View style={[
                styles.messageBubble,
                isMe
                    ? [styles.myMessage, { backgroundColor: theme.primary }]
                    : [styles.theirMessage, { backgroundColor: theme.cardBackground || '#3B3B3B' }]
            ]}>
                {/* Reply preview */}
                {message.replyTo && (
                    <TouchableOpacity
                        style={[styles.replyPreview, { borderLeftColor: isMe ? 'rgba(255,255,255,0.5)' : theme.primary }]}
                        onPress={() => onReplyPress?.(message)}
                    >
                        <Text style={styles.replyName} numberOfLines={1}>
                            {message.replyTo.sender?.displayName || 'User'}
                        </Text>
                        <Text style={styles.replyText} numberOfLines={1}>
                            {message.replyTo.body}
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Sender name for groups */}
                {showSenderName && !isMe && (
                    <Text style={[styles.senderName, { color: theme.primary }]}>
                        {message.sender.displayName || message.sender.username}
                    </Text>
                )}

                {/* Message content */}
                <View style={styles.messageContent}>
                    <Text style={styles.messageText}>{message.body}</Text>
                    <View style={styles.metaRow}>
                        <Text style={styles.timestamp}>{timestamp}</Text>
                        {renderStatus()}
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    messageRow: {
        flexDirection: 'row',
        marginVertical: 4,
        alignItems: 'flex-end',
        gap: 8,
        paddingHorizontal: 8
    },
    messageRowMe: {
        justifyContent: 'flex-end'
    },
    messageRowThem: {
        justifyContent: 'flex-start'
    },
    senderAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#444'
    },
    messageBubble: {
        maxWidth: '75%',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        elevation: 1,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2
    },
    myMessage: {
        borderBottomRightRadius: 6
    },
    theirMessage: {
        borderBottomLeftRadius: 6
    },
    replyPreview: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderLeftWidth: 3,
        borderRadius: 4,
        paddingLeft: 10,
        paddingVertical: 6,
        marginBottom: 8
    },
    replyName: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 12,
        fontWeight: '600'
    },
    replyText: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: 13
    },
    senderName: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 4
    },
    messageContent: {
        flexDirection: 'column',
        gap: 4
    },
    messageText: {
        color: '#fff',
        fontSize: 15,
        lineHeight: 21
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 4,
        marginTop: 2
    },
    timestamp: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.55)'
    }
});

export default MessageBubble;
