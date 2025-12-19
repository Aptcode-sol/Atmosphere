import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { ThemeContext } from '../contexts/ThemeContext';
import { getImageSource } from '../lib/image';

interface Message {
    _id: string;
    body: string;
    type?: 'text' | 'image' | 'file' | 'video' | 'audio' | 'share';
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
    meta?: {
        sharedContent?: {
            id: string;
            type: 'post' | 'reel' | 'startup';
            title?: string;
            image?: string;
            owner?: string;
        };
    };
}

interface MessageBubbleProps {
    message: Message;
    isMe: boolean;
    showSenderName?: boolean;
    onLongPress?: (message: Message) => void;
    onReplyPress?: (message: Message) => void;
    onContentPress?: (content: any) => void; // Handler for shared content click
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
    message,
    isMe,
    showSenderName = false,
    onLongPress,
    onReplyPress,
    onContentPress
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

    const renderSharedContent = () => {
        if (message.type !== 'share' || !message.meta?.sharedContent) return null;

        const content = message.meta.sharedContent;
        const isStartup = content.type === 'startup';
        const isReel = content.type === 'reel';

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.sharedCard, { backgroundColor: theme.background || '#222' }]}
                onPress={() => onContentPress?.(content)}
            >
                {/* Header / Owner info */}
                <View style={styles.sharedHeader}>
                    <Image
                        source={getImageSource(isStartup ? (content.image || '') : (content.owner || ''))} // Use logo for startup, avatar for others usually
                        style={styles.sharedAvatar}
                    />
                    <Text style={[styles.sharedOwner, { color: theme.text }]} numberOfLines={1}>
                        {content.title || (isReel ? 'Reel' : 'Post')}
                    </Text>
                    <MaterialIcons name="chevron-right" size={20} color={theme.placeholder} />
                </View>

                {/* Main Media Preview */}
                {content.image ? (
                    <Image
                        source={getImageSource(content.image)}
                        style={[styles.sharedImage, isReel ? { aspectRatio: 9 / 16 } : { aspectRatio: 16 / 9 }]}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.sharedImage, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
                        <MaterialIcons name={isReel ? "videocam" : isStartup ? "business" : "article"} size={32} color="#666" />
                    </View>
                )}

                {/* Footer / Type badge */}
                <View style={[styles.sharedFooter, { borderTopColor: theme.border }]}>
                    <Text style={[styles.sharedType, { color: theme.primary }]}>
                        {isReel ? 'Watch Reel' : isStartup ? 'View Startup' : 'View Post'}
                    </Text>
                </View>
            </TouchableOpacity>
        );
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
                    : [styles.theirMessage, { backgroundColor: theme.cardBackground || '#3B3B3B' }],
                message.type === 'share' && styles.sharedBubble // Special style for shared content
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
                    {message.type === 'share' ? (
                        renderSharedContent()
                    ) : (
                        <Text style={styles.messageText}>{message.body}</Text>
                    )}

                    <View style={[styles.metaRow, message.type === 'share' && { marginTop: 4 }]}>
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
    sharedBubble: {
        paddingHorizontal: 4, // Less padding for card
        paddingTop: 4,
        maxWidth: '80%',
        backgroundColor: 'transparent' // Let card handle bg
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
    },
    // Shared content styles
    sharedCard: {
        borderRadius: 16,
        overflow: 'hidden',
        minWidth: 200,
    },
    sharedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        gap: 8
    },
    sharedAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#444'
    },
    sharedOwner: {
        fontSize: 13,
        fontWeight: '600',
        flex: 1
    },
    sharedImage: {
        width: '100%',
        height: undefined, // Controlled by aspect ratio
        backgroundColor: '#000'
    },
    sharedFooter: {
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.2)',
        alignItems: 'center'
    },
    sharedType: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase'
    }
});

export default MessageBubble;
