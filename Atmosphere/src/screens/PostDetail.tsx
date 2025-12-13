import React, { useEffect, useState, useContext } from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet, ScrollView, TouchableOpacity, FlatList, Dimensions, TextInput, SafeAreaView } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../contexts/ThemeContext';
import { getBaseUrl, DEFAULT_BASE_URL } from '../lib/config';
import { getImageSource } from '../lib/image';
import { BOTTOM_NAV_HEIGHT } from '../lib/layout';

type PostDetailProps = {
  route: { params: { postId: string } };
  navigation?: { goBack?: () => void };
};

const PostDetail: React.FC<PostDetailProps & { onBackPress?: () => void }> = ({ route, navigation, onBackPress }) => {
  const { theme } = useContext(ThemeContext);
  const { postId } = route.params;
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [likeLoading, setLikeLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [_shared, _setShared] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const images: string[] = post?.media?.map((m: any) => m.url) || (post?.image ? [post.image] : []);
  const windowWidth = Dimensions.get('window').width;

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const base = await getBaseUrl().catch(() => DEFAULT_BASE_URL);
        const token = await AsyncStorage.getItem('token');
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(`${base}/api/posts/${postId}`, { headers });
        const data = await res.json();
        const postData = data.post || data;
        setPost(postData);
        if (typeof postData.likedByUser === 'boolean') {
          setLiked(postData.likedByUser);
        }
      } catch {
        setPost(null);
      }
      setLoading(false);
    };
    fetchPost();
  }, [postId]);

  useEffect(() => {
    if (!showComments) return;
    const fetchComments = async () => {
      setCommentsLoading(true);
      try {
        const base = await getBaseUrl().catch(() => DEFAULT_BASE_URL);
        const token = await AsyncStorage.getItem('token');
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(`${base}/api/comments/${postId}/comments`, { headers });
        const data = await res.json();
        setComments(data.comments || []);
      } catch {
        setComments([]);
      }
      setCommentsLoading(false);
    };
    fetchComments();
  }, [postId, showComments]);

  useEffect(() => {
    const checkSaved = async () => {
      try {
        const base = await getBaseUrl().catch(() => DEFAULT_BASE_URL);
        const token = await AsyncStorage.getItem('token');
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(`${base}/api/saved/check/post/${postId}`, { headers });
        const data = await res.json();
        setSaved(data.saved || false);
      } catch {
        setSaved(false);
      }
    };
    checkSaved();
  }, [postId]);

  useEffect(() => {
    const checkShared = async () => {
      try {
        const base = await getBaseUrl().catch(() => DEFAULT_BASE_URL);
        const token = await AsyncStorage.getItem('token');
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(`${base}/api/shares/check/${postId}`, { headers });
        const data = await res.json();
        _setShared(data.shared || false);
      } catch {
        _setShared(false);
      }
    };
    checkShared();
  }, [postId]);

  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      const base = await getBaseUrl().catch(() => DEFAULT_BASE_URL);
      const token = await AsyncStorage.getItem('token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      let updatedLiked = liked;
      let updatedLikesCount = post.likesCount || 0;
      if (!liked) {
        const res = await fetch(`${base}/api/posts/${postId}/like`, { method: 'POST', headers });
        const data = await res.json();
        updatedLiked = true;
        updatedLikesCount = data.likes ?? data.likesCount ?? updatedLikesCount;
      } else {
        const res = await fetch(`${base}/api/posts/${postId}/like`, { method: 'DELETE', headers });
        const data = await res.json();
        updatedLiked = false;
        updatedLikesCount = data.likes ?? data.likesCount ?? updatedLikesCount;
      }
      setLiked(updatedLiked);
      setPost((prev: any) => ({ ...prev, likesCount: updatedLikesCount }));
    } catch {
      // Optionally show error
    }
    setLikeLoading(false);
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim() || commentSubmitting) return;
    setCommentSubmitting(true);
    try {
      const base = await getBaseUrl().catch(() => DEFAULT_BASE_URL);
      const token = await AsyncStorage.getItem('token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${base}/api/comments/${postId}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text: commentText })
      });
      const data = await res.json();
      setComments((prev) => [data.comment || data, ...prev]);
      const newCount = data?.commentsCount ?? data?.comments?.length ?? undefined;
      setPost((prev: any) => ({ ...prev, commentsCount: typeof newCount === 'number' ? newCount : ((prev.commentsCount || 0) + 1) }));
      setCommentText('');
    } catch {
      // Optionally show error
    }
    setCommentSubmitting(false);
  };

  const handleSave = async () => {
    try {
      const base = await getBaseUrl().catch(() => DEFAULT_BASE_URL);
      const token = await AsyncStorage.getItem('token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      if (!saved) {
        await fetch(`${base}/api/saved`, { method: 'POST', headers, body: JSON.stringify({ postId }) });
        setSaved(true);
      } else {
        await fetch(`${base}/api/saved/${postId}`, { method: 'DELETE', headers });
        setSaved(false);
      }
    } catch {
      // Optionally handle error
    }
  };

  const handleShare = async () => {
    if (shareLoading) return;
    setShareLoading(true);
    try {
      const base = await getBaseUrl().catch(() => DEFAULT_BASE_URL);
      const token = await AsyncStorage.getItem('token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${base}/api/shares`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ postId })
      });
      const data = await res.json();
      if (data.sharesCount !== undefined) {
        setPost((prev: any) => ({ ...prev, sharesCount: data.sharesCount }));
        _setShared(true);
      }
    } catch { }
    setShareLoading(false);
  };

  const goBack = () => {
    if (navigation && navigation.goBack) navigation.goBack();
    else if (onBackPress) onBackPress();
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Post</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContent}>
          <Text style={{ color: theme.text }}>Post not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const authorName = post.author?.displayName || post.author?.username || 'Unknown';
  const authorImage = post.author?.profileImage || post.author?.avatarUrl || 'https://via.placeholder.com/100x100.png?text=User';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Post</Text>
        <TouchableOpacity onPress={handleSave} style={styles.headerRight}>
          <MaterialCommunityIcons name={saved ? "bookmark" : "bookmark-outline"} size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: BOTTOM_NAV_HEIGHT + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Author Row */}
        <View style={styles.authorRow}>
          <Image source={getImageSource(authorImage)} style={styles.authorAvatar} />
          <View style={styles.authorInfo}>
            <Text style={[styles.authorName, { color: theme.text }]}>{authorName}</Text>
            {post.createdAt && (
              <Text style={[styles.timestamp, { color: theme.placeholder }]}>
                {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            )}
          </View>
          <TouchableOpacity style={[styles.followBtn, { borderColor: theme.primary }]}>
            <Text style={[styles.followBtnText, { color: theme.primary }]}>Follow</Text>
          </TouchableOpacity>
        </View>

        {/* Image Slider */}
        {images.length > 0 && (
          <>
            <FlatList
              data={images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, idx) => `img-${idx}`}
              renderItem={({ item }) => (
                <View style={[styles.imageContainer, { width: windowWidth }]}>
                  <Image
                    source={getImageSource(item)}
                    style={styles.postImage}
                    resizeMode="cover"
                    onError={(e) => { console.warn('PostDetail image error', e.nativeEvent, item); }}
                  />
                </View>
              )}
              onMomentumScrollEnd={e => {
                const index = Math.round(e.nativeEvent.contentOffset.x / windowWidth);
                setActiveImage(index);
              }}
            />
            {/* Image indicators */}
            {images.length > 1 && (
              <View style={styles.dotsRow}>
                {images.map((_, idx) => (
                  <View key={idx} style={[styles.dot, activeImage === idx && styles.dotActive]} />
                ))}
              </View>
            )}
          </>
        )}

        {/* Action Buttons */}
        <View style={[styles.actionsRow, { borderColor: theme.border }]}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike} disabled={likeLoading}>
            <MaterialCommunityIcons name={liked ? "heart" : "heart-outline"} size={26} color={liked ? '#FF3B5C' : theme.text} />
            <Text style={[styles.actionCount, { color: theme.text }]}>{post.likesCount || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowComments((v) => !v)}>
            <MaterialCommunityIcons name="comment-outline" size={26} color={showComments ? theme.primary : theme.text} />
            <Text style={[styles.actionCount, { color: theme.text }]}>{post.commentsCount || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleShare} disabled={shareLoading}>
            <MaterialCommunityIcons name="share-outline" size={26} color={theme.text} />
            <Text style={[styles.actionCount, { color: theme.text }]}>{post.sharesCount || 0}</Text>
          </TouchableOpacity>
        </View>

        {/* Content/Caption */}
        {post.content && (
          <View style={styles.contentContainer}>
            <Text style={[styles.content, { color: theme.text }]}>{post.content}</Text>
          </View>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {post.tags.map((tag: string, idx: number) => (
              <View key={idx} style={[styles.tagChip, { backgroundColor: theme.cardBackground || '#1a1a1a' }]}>
                <Text style={[styles.tagText, { color: theme.primary }]}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Comments Section */}
        {showComments && (
          <View style={[styles.commentsSection, { borderTopColor: theme.border }]}>
            <Text style={[styles.commentsTitle, { color: theme.text }]}>Comments</Text>

            {/* Comment Input */}
            <View style={[styles.commentInputRow, { backgroundColor: theme.cardBackground || '#1a1a1a' }]}>
              <TextInput
                style={[styles.commentInput, { color: theme.text }]}
                placeholder="Add a comment..."
                placeholderTextColor={theme.placeholder}
                value={commentText}
                onChangeText={setCommentText}
                editable={!commentSubmitting}
              />
              <TouchableOpacity
                onPress={handleCommentSubmit}
                disabled={commentSubmitting || !commentText.trim()}
                style={[styles.sendBtn, { backgroundColor: commentText.trim() ? theme.primary : theme.border }]}
              >
                <MaterialCommunityIcons name="send" size={18} color={commentText.trim() ? '#fff' : theme.placeholder} />
              </TouchableOpacity>
            </View>

            {/* Comments List */}
            {commentsLoading ? (
              <ActivityIndicator color={theme.primary} style={{ marginTop: 16 }} />
            ) : (
              comments.length === 0 ? (
                <Text style={[styles.noComments, { color: theme.placeholder }]}>No comments yet. Be the first to comment!</Text>
              ) : (
                comments.map((c, idx) => (
                  <View key={c._id || idx} style={styles.commentRow}>
                    <Image source={getImageSource(c.author?.avatarUrl || 'https://via.placeholder.com/40x40.png?text=U')} style={styles.commentAvatar} />
                    <View style={styles.commentContent}>
                      <View style={styles.commentHeader}>
                        <Text style={[styles.commentAuthor, { color: theme.text }]}>{c.author?.displayName || c.author?.username || 'User'}</Text>
                        <Text style={[styles.commentTime, { color: theme.placeholder }]}>
                          {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                      </View>
                      <Text style={[styles.commentText, { color: theme.text }]}>{c.text}</Text>
                    </View>
                  </View>
                ))
              )
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333',
  },
  authorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 13,
    marginTop: 2,
  },
  followBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  followBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  imageContainer: {
    aspectRatio: 1,
    backgroundColor: '#1a1a1a',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#555',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#1FADFF',
    width: 24,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 24,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
  },
  commentsSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 8,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noComments: {
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
    fontSize: 14,
  },
  commentRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#333',
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentTime: {
    fontSize: 12,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
});

export default PostDetail;
