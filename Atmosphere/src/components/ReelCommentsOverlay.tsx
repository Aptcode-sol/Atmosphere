import React, { useEffect, useState, useContext, useRef } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Animated, Easing, Dimensions } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { getReelComments, addReelComment, deleteReelComment, getProfile } from '../lib/api';
import Icon from 'react-native-vector-icons/Feather';

type Comment = any;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = Math.round(SCREEN_HEIGHT * 0.5);

const ReelCommentsOverlay = ({ reelId, visible, onClose, onCommentAdded, onCommentDeleted }: { reelId: string; visible: boolean; onClose: () => void; onCommentAdded?: (newCount?: number) => void; onCommentDeleted?: (newCount?: number) => void }) => {
    const { theme } = useContext(ThemeContext) as any;
    const anim = useRef(new Animated.Value(0)).current;
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [text, setText] = useState('');
    const [meId, setMeId] = useState<string | null>(null);
    const [showDeleteFor, setShowDeleteFor] = useState<string | null>(null);

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

    const submit = async () => {
        if (!text.trim() || submitting) return;
        setSubmitting(true);
        try {
            const newComment = await addReelComment(String(reelId), text.trim());
            const commentObj = newComment?.comment || newComment || { text: text.trim(), createdAt: new Date().toISOString() };
            setComments(prev => [commentObj, ...prev]);
            setText('');
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
            if (sec < 60) return `${sec} sec${sec === 1 ? '' : 's'}`;
            const min = Math.floor(sec / 60);
            if (min < 60) return `${min} min${min === 1 ? '' : 's'}`;
            const hr = Math.floor(min / 60);
            if (hr < 24) return `${hr} hr${hr === 1 ? '' : 's'}`;
            const day = Math.floor(hr / 24);
            if (day < 7) return `${day} day${day === 1 ? '' : 's'}`;
            return d.toLocaleDateString();
        } catch {
            return '';
        }
    };

    const closeModal = () => {
        Animated.timing(anim, { toValue: 0, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => onClose && onClose());
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
                        styles.sheetAbsolute,
                        styles.sheetBorders,
                        { backgroundColor: theme?.background || '#121212', width: Math.min(640, SCREEN_WIDTH - 40), height: SHEET_HEIGHT },
                        { transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [SHEET_HEIGHT, 0] }) }] },
                        { opacity: anim }
                    ]}
                >
                    <View style={styles.handleRow}>
                        <View style={[styles.handle, styles.handleWide, styles.handleColor]} />
                        <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
                            <Icon name="x" size={20} color={theme?.placeholder || '#999'} />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.title, { color: theme?.text }]}>Comments</Text>
                    <View style={styles.contentWrap}>
                        {loading ? (
                            <ActivityIndicator size="large" color="#ec4899" />
                        ) : (
                            <>
                                {comments.length === 0 ? (
                                    <View style={styles.emptyWrap}><Text style={[styles.emptyText, { color: theme?.placeholder }]}>No comments yet. Be the first!</Text></View>
                                ) : (
                                    <FlatList
                                        data={comments}
                                        keyExtractor={(i) => String(i._id || i.id || i.createdAt || Math.random())}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity
                                                onLongPress={() => {
                                                    const authorId = item.author?._id || item.author?.id || item.author;
                                                    if (!authorId || !meId || String(authorId) !== String(meId)) return;
                                                    const idKey = String(item._id || item.id || item.createdAt);
                                                    setShowDeleteFor(prev => (String(prev) === idKey ? null : idKey));
                                                }}
                                                activeOpacity={0.8}
                                                style={styles.commentRow}
                                            >
                                                <View style={styles.commentAvatar}><Text style={styles.avatarLetter}>{(item.author && (item.author.displayName || item.author.username) ? (item.author.displayName || item.author.username).charAt(0).toUpperCase() : 'U')}</Text></View>
                                                <View style={styles.commentBody}>
                                                    <View style={styles.commentHeaderRow}>
                                                        <View style={styles.commentHeaderLeft}>
                                                            <Text style={[styles.commentAuthor, { color: theme?.text }]}>{item.author?.displayName || item.author?.username || 'User'}</Text>
                                                        </View>
                                                        <View style={styles.commentHeaderRight}>
                                                            {String(deletingId) === String(item._id || item.id || item.createdAt) ? <ActivityIndicator size="small" /> : null}
                                                            {String(showDeleteFor) === String(item._id || item.id || item.createdAt) ? (
                                                                <TouchableOpacity
                                                                    style={styles.smallDeleteBtn}
                                                                    onPress={async () => {
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
                                                                    }}
                                                                >
                                                                    <Text style={styles.smallDeleteText}>Delete</Text>
                                                                </TouchableOpacity>
                                                            ) : null}
                                                        </View>
                                                    </View>
                                                    <Text style={[styles.commentText, { color: theme?.text }]}>{item.text}</Text>
                                                    <Text style={[styles.commentTimestamp, { color: theme?.placeholder }]}>{timeAgo(item.createdAt)}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        )}
                                    />
                                )}
                            </>
                        )}
                    </View>

                    <View style={styles.inputSeparator} />
                    <View style={styles.inputRow}>
                        <TextInput
                            value={text}
                            onChangeText={setText}
                            placeholder="Add a comment..."
                            placeholderTextColor={theme?.placeholder || '#888'}
                            style={[styles.input, { color: theme?.text, borderColor: theme?.border || '#333' }]}
                            editable={!submitting}
                            multiline
                        />
                        <TouchableOpacity onPress={submit} disabled={submitting || !text.trim()} style={styles.sendBtn}>
                            <Text style={styles.sendText}>{submitting ? '...' : 'Send'}</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#000' },
    container: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
    sheet: { borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: 12, minHeight: 200, overflow: 'hidden' },
    sheetAbsolute: { position: 'absolute', bottom: 0 },
    sheetBorders: { borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#333333' },
    handleWide: { width: 96 },
    handleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    handle: { width: 48, height: 6, borderRadius: 4 },
    handleColor: { backgroundColor: '#333333' },
    commentHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    commentHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    commentHeaderRight: { flexDirection: 'row', alignItems: 'center' },
    smallDeleteBtn: { backgroundColor: '#ff4d4f', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 8 },
    smallDeleteText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    closeBtn: { position: 'absolute', right: 6, top: -6, padding: 8 },
    title: { fontSize: 16, fontWeight: '700', textAlign: 'center', marginTop: 8 },
    commentRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
    commentAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#666', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
    avatarLetter: { color: '#fff', fontWeight: '700' },
    commentBody: { flex: 1 },
    contentWrap: { flex: 1, marginTop: 8 },
    emptyText: {},
    commentAuthor: { fontWeight: '700' },
    commentText: { marginTop: 4 },
    commentTimestamp: { marginTop: 4, fontSize: 11 },
    emptyWrap: { alignItems: 'center', justifyContent: 'center', padding: 20 },
    inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    inputSeparator: { height: 1, backgroundColor: '#333333', alignSelf: 'stretch', marginBottom: 8, marginLeft: -12, marginRight: -12 },
    input: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, maxHeight: 100 },
    sendBtn: { backgroundColor: '#ec4899', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 20 },
    sendText: { color: '#fff', fontWeight: '700' }
});

export default ReelCommentsOverlay;
