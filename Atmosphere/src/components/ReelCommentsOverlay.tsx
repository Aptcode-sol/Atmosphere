import React, { useEffect, useState, useContext, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Animated, Easing, Dimensions, PanResponder } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { getReelComments, addReelComment, deleteReelComment, getProfile, getReelCommentReplies } from '../lib/api';
import Icon from 'react-native-vector-icons/Feather';

// Import shared components and utilities
import { Comment, ReplyingTo, commentStyles as styles, timeAgo, getAvatarLetter, getDisplayName } from './comments';
import CommentInput from './comments/CommentInput';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const FULL_HEIGHT = SCREEN_HEIGHT * 0.9;
const DEFAULT_HEIGHT = SCREEN_HEIGHT * 0.55;

interface ReelCommentsOverlayProps {
    reelId: string;
    visible: boolean;
    onClose: () => void;
    onCommentAdded?: (newCount?: number) => void;
    onCommentDeleted?: (newCount?: number) => void;
}

const ReelCommentsOverlay = ({ reelId, visible, onClose, onCommentAdded, onCommentDeleted }: ReelCommentsOverlayProps) => {
    const { theme } = useContext(ThemeContext) as any;
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

    // Animation state
    const translateY = useRef(new Animated.Value(FULL_HEIGHT)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;

    // Track the offset when drag starts
    const dragStartY = useRef(FULL_HEIGHT - DEFAULT_HEIGHT);

    // Track if FlatList is at top (for pull-to-close from content area)
    const isAtScrollTop = useRef(true);
    const flatListRef = useRef<FlatList>(null);

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

    // Animate in/out when `visible` changes
    useEffect(() => {
        if (visible) {
            dragStartY.current = FULL_HEIGHT - DEFAULT_HEIGHT;
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: FULL_HEIGHT - DEFAULT_HEIGHT,
                    useNativeDriver: true,
                    damping: 20,
                    mass: 0.8,
                    stiffness: 100
                }),
                Animated.timing(backdropOpacity, {
                    toValue: 0.6,
                    duration: 300,
                    useNativeDriver: true
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: FULL_HEIGHT,
                    duration: 250,
                    useNativeDriver: true
                }),
                Animated.timing(backdropOpacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true
                })
            ]).start();
        }
    }, [visible, translateY, backdropOpacity]);

    const closeModal = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: FULL_HEIGHT,
                duration: 200,
                useNativeDriver: true,
                easing: Easing.out(Easing.ease)
            }),
            Animated.timing(backdropOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
            })
        ]).start(() => onClose && onClose());
    };

    const expandModal = () => {
        dragStartY.current = 0;
        Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            mass: 0.8,
            stiffness: 100
        }).start();
    };

    const collapseToDefault = () => {
        dragStartY.current = FULL_HEIGHT - DEFAULT_HEIGHT;
        Animated.spring(translateY, {
            toValue: FULL_HEIGHT - DEFAULT_HEIGHT,
            useNativeDriver: true,
            damping: 20,
            mass: 0.8,
            stiffness: 100
        }).start();
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
            onPanResponderGrant: () => {
                translateY.stopAnimation((value) => {
                    dragStartY.current = value;
                });
            },
            onPanResponderMove: (_, gestureState) => {
                let newY = dragStartY.current + gestureState.dy;
                newY = Math.max(0, Math.min(FULL_HEIGHT, newY));
                translateY.setValue(newY);
                const progress = 1 - (newY / FULL_HEIGHT);
                backdropOpacity.setValue(progress * 0.6);
            },
            onPanResponderRelease: (_, gestureState) => {
                // Directly animate based on direction - no stopAnimation delay
                if (gestureState.dy < 0) {
                    expandModal();
                } else {
                    closeModal();
                }
            }
        })
    ).current;

    const contentPanResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return isAtScrollTop.current && gestureState.dy > 10;
            },
            onPanResponderGrant: () => {
                translateY.stopAnimation((value) => {
                    dragStartY.current = value;
                });
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    let newY = dragStartY.current + gestureState.dy;
                    newY = Math.max(0, Math.min(FULL_HEIGHT, newY));
                    translateY.setValue(newY);
                    const progress = 1 - (newY / FULL_HEIGHT);
                    backdropOpacity.setValue(progress * 0.6);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    closeModal();
                } else {
                    expandModal();
                }
            }
        })
    ).current;

    const handleScroll = (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        isAtScrollTop.current = offsetY <= 0;
    };

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
        const username = getDisplayName(comment.author);
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
        const authorUsername = getDisplayName(item.author);
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
                            {getAvatarLetter(item.author)}
                        </Text>
                    </View>
                    <View style={styles.commentBody}>
                        <View style={styles.commentHeaderRow}>
                            <Text style={styles.commentAuthor}>{authorUsername}</Text>
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
    const INPUT_HEIGHT = 70;

    return (
        <Modal visible={visible} transparent onRequestClose={closeModal}>
            <TouchableWithoutFeedback onPress={closeModal}>
                <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
            </TouchableWithoutFeedback>

            <View style={{ flex: 1 }}>
                {/* Animated sheet - ends above the input area */}
                <Animated.View
                    style={[
                        styles.sheet,
                        {
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            bottom: INPUT_HEIGHT,
                            height: FULL_HEIGHT - INPUT_HEIGHT,
                            width: Math.min(640, SCREEN_WIDTH),
                            alignSelf: 'center',
                        },
                        { transform: [{ translateY: translateY }] }
                    ]}
                >
                    {/* Handle bar at top */}
                    <View style={styles.handleRow} {...panResponder.panHandlers}>
                        <View style={styles.handle} />
                    </View>

                    {/* Comments title */}
                    <Text style={styles.title}>Comments</Text>

                    {/* Scrollable comments list - takes remaining space */}
                    <View style={{ flex: 1, overflow: 'hidden' }} {...contentPanResponder.panHandlers}>
                        {loading ? (
                            <ActivityIndicator size="large" color="#666" style={{ flex: 1 }} />
                        ) : comments.length === 0 ? (
                            <View style={styles.emptyWrap}>
                                <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
                            </View>
                        ) : (
                            <FlatList
                                ref={flatListRef}
                                data={comments}
                                keyExtractor={(i) => String(i._id || i.id || i.createdAt || Math.random())}
                                renderItem={({ item }) => renderComment(item)}
                                showsVerticalScrollIndicator={true}
                                onScroll={handleScroll}
                                scrollEventThrottle={16}
                                style={{ flex: 1 }}
                                contentContainerStyle={{ paddingBottom: 10 }}
                            />
                        )}
                    </View>
                </Animated.View>

                {/* Fixed input bar at screen bottom - ALWAYS visible */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
                >
                    <View style={{ backgroundColor: '#0a0a0a', borderTopWidth: 1, borderTopColor: '#222' }}>
                        <CommentInput
                            ref={inputRef}
                            text={text}
                            setText={setText}
                            submitting={submitting}
                            replyingTo={replyingTo}
                            onSubmit={submit}
                            onCancelReply={cancelReply}
                        />
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

export default ReelCommentsOverlay;
