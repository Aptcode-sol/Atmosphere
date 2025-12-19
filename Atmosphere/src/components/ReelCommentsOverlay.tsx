import React, { useEffect, useState, useContext, useRef } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Animated, Easing, Dimensions } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { getReelComments, addReelComment, deleteReelComment, getProfile, getReelCommentReplies } from '../lib/api';
import Icon from 'react-native-vector-icons/Feather';
import { Send } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = Math.round(SCREEN_HEIGHT * 0.6);

type Comment = any;

interface ReplyingTo {
    id: string;
    username: string;
    parentCommentId: string; // Always the top-level comment ID
}

const ReelCommentsOverlay = ({ reelId, visible, onClose, onCommentAdded, onCommentDeleted }: { reelId: string; visible: boolean; onClose: () => void; onCommentAdded?: (newCount?: number) => void; onCommentDeleted?: (newCount?: number) => void }) => {
    const { theme } = useContext(ThemeContext) as any;
    const anim = useRef(new Animated.Value(0)).current;
    const inputRef = useRef<TextInput>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [text, setText] = useState('');
    const [meId, setMeId] = useState<string | null>(null);
    const [showDeleteFor, setShowDeleteFor] = useState<string | null>(null);
    const [replyingTo, setReplyingTo] = useState<ReplyingTo | null>(null);
    const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
    const [repliesLoading, setRepliesLoading] = useState<Set<string>>(new Set());
    const [repliesData, setRepliesData] = useState<{ [key: string]: Comment[] }>({});

    useEffect(() => {
        let mounted = true;
        const fetch = async () => {
            if (!visible) return;
            setLoading(true);
            try {
                const data = await getReelComments(String(reelId));
                if (mounted) setComments(data || []);
                try {
                    const profile = await getProfile();
                    const id = profile?.user?._id || profile?.user?.id || profile?.id || null;
                    if (mounted && id) setMeId(String(id));
                } catch {
                    // ignore
                }
            } catch (err) {
                console.warn('ReelCommentsOverlay: failed to load comments', err);
                if (mounted) setComments([]);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetch();
        return () => { mounted = false; };
    }, [visible, reelId]);

    useEffect(() => {
        if (visible) {
            Animated.timing(anim, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
        } else {
            Animated.timing(anim, { toValue: 0, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start();
        }
    }, [visible, anim]);

    const loadReplies = async (commentId: string) => {
        if (repliesLoading.has(commentId)) return;
        setRepliesLoading(prev => new Set(prev).add(commentId));
        try {
            const replies = await getReelCommentReplies(commentId);
            setRepliesData(prev => ({ ...prev, [commentId]: replies }));
            setExpandedReplies(prev => new Set(prev).add(commentId));
        } catch (err) {
            console.warn('Failed to load replies:', err);
        } finally {
            setRepliesLoading(prev => {
                const next = new Set(prev);
                next.delete(commentId);
                return next;
            });
        }
    };

    const toggleReplies = (commentId: string) => {
        if (expandedReplies.has(commentId)) {
            setExpandedReplies(prev => {
                const next = new Set(prev);
                next.delete(commentId);
                return next;
            });
        } else {
            loadReplies(commentId);
        }
    };

    const handleReply = (comment: Comment, parentCommentId?: string) => {
        const username = comment.author?.displayName || comment.author?.username || 'User';
        const topLevelParentId = parentCommentId || String(comment._id || comment.id);
        setReplyingTo({
            id: String(comment._id || comment.id),
            username,
            parentCommentId: topLevelParentId,
        });
        inputRef.current?.focus();
    };

    const cancelReply = () => {
        setReplyingTo(null);
    };

    const submit = async () => {
        if (!text.trim() || submitting) return;
        setSubmitting(true);
        try {
            const parentId = replyingTo?.parentCommentId || undefined;
            const newComment = await addReelComment(String(reelId), text.trim(), parentId);
            const commentObj = newComment?.comment || newComment || { text: text.trim(), createdAt: new Date().toISOString() };

            if (replyingTo?.username) {
                commentObj.replyToUsername = replyingTo.username;
            }

            if (parentId) {
                setRepliesData(prev => ({
                    ...prev,
                    [parentId]: [...(prev[parentId] || []), commentObj]
                }));
                setExpandedReplies(prev => new Set(prev).add(parentId));
            } else {
                setComments(prev => [commentObj, ...prev]);
            }

            setText('');
            setReplyingTo(null);

            const newCount = (newComment && (newComment.commentsCount ?? newComment.count ?? newComment.totalComments)) || undefined;
            if (typeof onCommentAdded === 'function') {
                try { onCommentAdded(typeof newCount === 'number' ? newCount : undefined); } catch { onCommentAdded(); }
            }
        } catch (err) {
            console.warn('ReelCommentsOverlay: failed to submit comment', err);
        } finally {
            setSubmitting(false);
        }
    };

    const timeAgo = (dateLike: any) => {
        try {
            const d = new Date(dateLike);
            if (Number.isNaN(d.getTime())) return '';
            const sec = Math.floor((Date.now() - d.getTime()) / 1000);
            if (sec < 10) return 'just now';
            if (sec < 60) return `${sec}s`;
            const min = Math.floor(sec / 60);
            if (min < 60) return `${min}m`;
            const hr = Math.floor(min / 60);
            if (hr < 24) return `${hr}h`;
            const day = Math.floor(hr / 24);
            if (day < 7) return `${day}d`;
            return d.toLocaleDateString();
        } catch {
            return '';
        }
    };

    const closeModal = () => {
        Animated.timing(anim, { toValue: 0, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => onClose && onClose());
    };

    const handleDelete = async (item: Comment) => {
        try {
            setDeletingId(item._id || item.id || item.createdAt);
            await deleteReelComment(String(item._id || item.id));
            setComments(prev => prev.filter(c => String(c._id || c.id || c.createdAt) !== String(item._id || item.id || item.createdAt)));
            setShowDeleteFor(null);
            if (typeof onCommentDeleted === 'function') {
                try { onCommentDeleted(); } catch { }
            }
        } catch (err) {
            console.warn('ReelCommentsOverlay: failed to delete comment', err);
        } finally {
            setDeletingId(null);
        }
    };

    const renderComment = (item: Comment, isReply = false, parentAuthor?: string, parentCommentId?: string) => {
        const commentId = String(item._id || item.id || item.createdAt);
        const authorId = item.author?._id || item.author?.id || item.author;
        const isOwner = authorId && meId && String(authorId) === String(meId);
        const replies = repliesData[commentId] || [];
        const hasReplies = replies.length > 0 || (item.repliesCount && item.repliesCount > 0);
        const isExpanded = expandedReplies.has(commentId);
        const isLoadingReplies = repliesLoading.has(commentId);
        const authorUsername = item.author?.displayName || item.author?.username || 'User';
        const displayReplyTag = item.replyToUsername || parentAuthor;

        return (
            <View key={commentId}>
                <TouchableOpacity
                    onLongPress={() => {
                        if (!isOwner) return;
                        setShowDeleteFor(prev => (String(prev) === commentId ? null : commentId));
                    }}
                    activeOpacity={0.8}
                    style={[styles.commentRow, isReply && styles.replyRow]}
                >
                    <View style={styles.commentAvatar}>
                        <Text style={styles.avatarLetter}>
                            {(item.author && (item.author.displayName || item.author.username) ? (item.author.displayName || item.author.username).charAt(0).toUpperCase() : 'U')}
                        </Text>
                    </View>
                    <View style={styles.commentBody}>
                        <View style={styles.commentHeaderRow}>
                            <Text style={styles.commentAuthor}>
                                {item.author?.displayName || item.author?.username || 'User'}
                            </Text>
                            <Text style={styles.commentTimestamp}>{timeAgo(item.createdAt)}</Text>
                        </View>
                        <Text style={styles.commentText}>
                            {isReply && displayReplyTag && (
                                <Text style={styles.replyTag}>@{displayReplyTag} </Text>
                            )}
                            {item.text}
                        </Text>
                        <View style={styles.commentActions}>
                            <TouchableOpacity onPress={() => handleReply(item, isReply ? parentCommentId : undefined)} style={styles.replyBtn}>
                                <Text style={styles.replyBtnText}>Reply</Text>
                            </TouchableOpacity>
                            {String(deletingId) === commentId && <ActivityIndicator size="small" color="#888" />}
                            {String(showDeleteFor) === commentId && (
                                <TouchableOpacity style={styles.smallDeleteBtn} onPress={() => handleDelete(item)}>
                                    <Text style={styles.smallDeleteText}>Delete</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>

                {!isReply && hasReplies && !isExpanded && (
                    <TouchableOpacity onPress={() => toggleReplies(commentId)} style={styles.viewRepliesBtn}>
                        {isLoadingReplies ? (
                            <ActivityIndicator size="small" color="#888" />
                        ) : (
                            <Text style={styles.viewRepliesText}>
                                ── View {item.repliesCount || replies.length || ''} replies
                            </Text>
                        )}
                    </TouchableOpacity>
                )}

                {!isReply && isExpanded && replies.length > 0 && (
                    <View style={styles.repliesContainer}>
                        {replies.map((reply: Comment) => renderComment(reply, true, authorUsername, commentId))}
                        <TouchableOpacity onPress={() => toggleReplies(commentId)} style={styles.hideRepliesBtn}>
                            <Text style={styles.viewRepliesText}>── Hide replies</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <Modal visible={visible} transparent onRequestClose={closeModal}>
            <TouchableWithoutFeedback onPress={closeModal}>
                <Animated.View style={[styles.backdrop, { opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.6] }) }]} />
            </TouchableWithoutFeedback>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
                <Animated.View
                    style={[
                        styles.sheet,
                        { width: Math.min(640, SCREEN_WIDTH), height: SHEET_HEIGHT },
                        { transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [SHEET_HEIGHT, 0] }) }] },
                        { opacity: anim }
                    ]}
                >
                    <View style={styles.handleRow}>
                        <View style={styles.handle} />
                        <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
                            <Icon name="x" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.title}>Comments</Text>

                    <View style={styles.contentWrap}>
                        {loading ? (
                            <ActivityIndicator size="large" color="#666" />
                        ) : (
                            <>
                                {comments.length === 0 ? (
                                    <View style={styles.emptyWrap}>
                                        <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
                                    </View>
                                ) : (
                                    <FlatList
                                        data={comments}
                                        keyExtractor={(i) => String(i._id || i.id || i.createdAt || Math.random())}
                                        renderItem={({ item }) => renderComment(item)}
                                        showsVerticalScrollIndicator={false}
                                    />
                                )}
                            </>
                        )}
                    </View>

                    {replyingTo && (
                        <View style={styles.replyIndicator}>
                            <Text style={styles.replyIndicatorText}>
                                Replying to <Text style={styles.replyIndicatorUsername}>@{replyingTo.username}</Text>
                            </Text>
                            <TouchableOpacity onPress={cancelReply}>
                                <Icon name="x" size={16} color="#888" />
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.inputContainer}>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                ref={inputRef}
                                value={text}
                                onChangeText={setText}
                                placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Add a comment..."}
                                placeholderTextColor="#666"
                                style={styles.input}
                                editable={!submitting}
                                multiline
                            />
                            <TouchableOpacity
                                onPress={submit}
                                disabled={submitting || !text.trim()}
                                style={styles.sendBtn}
                            >
                                {submitting ? (
                                    <ActivityIndicator size="small" color="#666" />
                                ) : (
                                    <Send size={20} color={text.trim() ? '#888' : '#444'} />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: '#000'
    },
    container: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    sheet: {
        backgroundColor: '#0a0a0a',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 12,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#222',
    },
    handleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#333'
    },
    closeBtn: {
        position: 'absolute',
        right: 0,
        top: -4,
        padding: 8
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
        marginTop: 12,
        marginBottom: 16,
        color: '#fff'
    },
    contentWrap: {
        flex: 1
    },
    emptyWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40
    },
    emptyText: {
        color: '#666',
        fontSize: 14
    },
    commentRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16
    },
    replyRow: {
        marginLeft: 0,
        marginBottom: 12,
    },
    commentAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#333',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    avatarLetter: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14
    },
    commentBody: {
        flex: 1
    },
    commentHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    commentAuthor: {
        fontWeight: '600',
        color: '#fff',
        fontSize: 14
    },
    commentText: {
        marginTop: 4,
        color: '#e0e0e0',
        fontSize: 14,
        lineHeight: 20
    },
    commentTimestamp: {
        fontSize: 12,
        color: '#666'
    },
    commentActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 12,
    },
    replyBtn: {
        paddingVertical: 2,
    },
    replyBtnText: {
        color: '#888',
        fontSize: 13,
        fontWeight: '500',
    },
    smallDeleteBtn: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6
    },
    smallDeleteText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600'
    },
    viewRepliesBtn: {
        marginLeft: 48,
        marginBottom: 12,
    },
    hideRepliesBtn: {
        marginTop: 4,
    },
    viewRepliesText: {
        color: '#666',
        fontSize: 13,
    },
    repliesContainer: {
        marginLeft: 48,
        borderLeftWidth: 1,
        borderLeftColor: '#222',
        paddingLeft: 12,
        marginBottom: 8,
    },
    replyTag: {
        color: '#3b82f6',
        fontWeight: '600',
    },
    replyIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1a1a1a',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        marginBottom: 8,
    },
    replyIndicatorText: {
        color: '#888',
        fontSize: 13,
    },
    replyIndicatorUsername: {
        color: '#fff',
        fontWeight: '600',
    },
    inputContainer: {
        paddingVertical: 12,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#333',
        paddingHorizontal: 16,
        paddingVertical: 4,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 15,
        paddingVertical: 10,
        maxHeight: 100,
    },
    sendBtn: {
        padding: 8,
        marginLeft: 8,
    },
});

export default ReelCommentsOverlay;
