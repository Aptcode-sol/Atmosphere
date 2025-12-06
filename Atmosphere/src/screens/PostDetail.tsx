import React, { useEffect, useState, useContext } from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet, ScrollView, TouchableOpacity, FlatList, Dimensions, TextInput, SafeAreaView } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../contexts/ThemeContext';
import { getBaseUrl, DEFAULT_BASE_URL } from '../lib/config';




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
  const [shared, setShared] = useState(false);
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
        // Set liked state if available from backend (e.g., postData.likedByUser)
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
        setShared(data.shared || false);
      } catch {
        setShared(false);
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
        updatedLikesCount = data.likesCount;
      } else {
        const res = await fetch(`${base}/api/posts/${postId}/like`, { method: 'DELETE', headers });
        const data = await res.json();
        updatedLiked = false;
        updatedLikesCount = data.likesCount;
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
      // Instantly show new comment at top
      setComments((prev) => [data.comment, ...prev]);
      setPost((prev: any) => ({ ...prev, commentsCount: (prev.commentsCount || 0) + 1 }));
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
        setShared(true);
      }
    } catch {}
    setShareLoading(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.flex1, { backgroundColor: theme.background }]}>
        <ActivityIndicator style={styles.flex1} color={theme.primary} />
      </SafeAreaView>
    );
  }
  if (!post) {
    return (
      <SafeAreaView style={[styles.flex1, { backgroundColor: theme.background }]}>
        <View style={styles.center}><Text style={{ color: theme.text }}>Post not found.</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.flex1, { backgroundColor: theme.background }]}>
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}> 
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          if (navigation && navigation.goBack) navigation.goBack();
          else if (onBackPress) onBackPress();
        }}
      >
        <Text style={[styles.backText, { color: theme.primary }]}>← Back</Text>
      </TouchableOpacity>

      {/* Author Row */}
      {post.author && (
        <View style={styles.authorRow}>
          <Image source={{ uri: post.author.profileImage || 'https://via.placeholder.com/100x100.png?text=User' }} style={styles.authorAvatar} />
          <View>
            <Text style={[styles.authorName, { color: theme.text }]}>{post.author.displayName || post.author.username}</Text>
            {post.createdAt && (
              <Text style={[styles.timestamp, { color: theme.placeholder }]}>Posted {new Date(post.createdAt).toLocaleString()}</Text>
            )}
          </View>
        </View>
      )}

      {/* Image Slider */}
      <FlatList
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, idx) => `img-${idx}`}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={[styles.image, { width: windowWidth }, styles.imageFixedHeight]} resizeMode="cover" />
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

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike} disabled={likeLoading}>
          <MaterialCommunityIcons name={liked ? "heart" : "heart-outline"} size={28} color={liked ? 'red' : theme.text} />
        </TouchableOpacity>
        <Text style={styles.actionCount}>{post.likesCount || 0}</Text>

        <TouchableOpacity style={styles.actionBtn} onPress={() => setShowComments((v) => !v)}>
          <MaterialCommunityIcons name="comment-outline" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.actionCount}>{post.commentsCount || 0}</Text>

        <TouchableOpacity style={styles.actionBtn} onPress={handleShare} disabled={shareLoading}>
          <MaterialCommunityIcons name="share-outline" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.actionCount}>{post.sharesCount || 0}</Text>

        <View style={styles.flex1} />
        <TouchableOpacity style={styles.actionBtn} onPress={handleSave}>
          <MaterialCommunityIcons name={saved ? "bookmark" : "bookmark-outline"} size={28} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Content/Caption */}
      {post.content && <Text style={[styles.content, { color: theme.text }]}>{post.content}</Text>}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {post.tags.map((tag: string, idx: number) => (
            <Text key={idx} style={[styles.tag, { color: theme.primary }]}>#{tag} </Text>
          ))}
        </View>
      )}

      {/* Comments Section (toggle) */}
      {showComments && (
        <View style={styles.commentsSection}>
          <Text style={[styles.commentsTitle, { color: theme.text }]}>Comments</Text>
          <View style={styles.commentInputRow}>
            <TextInput
              style={[styles.commentInput, { color: theme.text, borderColor: theme.border }]}
              placeholder="Add a comment..."
              placeholderTextColor={theme.placeholder}
              value={commentText}
              onChangeText={setCommentText}
              editable={!commentSubmitting}
            />
            <TouchableOpacity onPress={handleCommentSubmit} disabled={commentSubmitting || !commentText.trim()}>
              <MaterialCommunityIcons name="send" size={24} color={theme.primary} />
            </TouchableOpacity>
          </View>
          {commentsLoading ? (
            <ActivityIndicator color={theme.primary} />
          ) : (
            comments.length === 0 ? (
              <Text style={[{ color: theme.placeholder }, styles.margin8]}>No comments yet.</Text>
            ) : (
              comments.map((c, idx) => (
                <View key={c._id || idx} style={styles.commentRow}>
                  <Image source={{ uri: c.author?.avatarUrl || 'https://via.placeholder.com/40x40.png?text=U' }} style={styles.commentAvatar} />
                  <View style={styles.flex1}>
                    <Text style={[styles.commentAuthor, { color: theme.text }]}>{c.author?.displayName || c.author?.username || 'User'}</Text>
                    <Text style={[styles.commentText, { color: theme.text }]}>{c.text}</Text>
                    <Text style={[styles.commentTimestamp, { color: theme.placeholder }]}>{new Date(c.createdAt).toLocaleString()}</Text>
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
  container: { flex: 1 },
  image: { width: '100%', height: 400, backgroundColor: '#e0e0e0' },
  content: { fontSize: 16, marginHorizontal: 16, marginBottom: 16 },
  likes: { fontWeight: 'bold', marginHorizontal: 16, marginBottom: 8, fontSize: 15},
  authorRow: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  authorAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: '#ccc' },
  authorName: { fontWeight: 'bold', fontSize: 16 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginVertical: 8, elevation: 2 },
  actionBtn: { marginRight: 8, alignItems: 'center', justifyContent: 'center' },
  actionCount: { fontSize: 13, fontWeight: '500', marginRight: 12, minWidth: 24, textAlign: 'center', color: '#fff' },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#bbb', marginHorizontal: 3 },
  dotActive: { backgroundColor: '#333' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backButton: { marginTop: 16, marginLeft: 16, marginBottom: 8, alignSelf: 'flex-start' },
  backText: { fontSize: 16, fontWeight: '500' },
  countsRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 16, marginBottom: 8 },
  countText: { fontSize: 14, fontWeight: '500' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 16, marginBottom: 4 },
  tag: { fontSize: 13, fontWeight: '500', marginRight: 8 },
  timestamp: { fontSize: 12, marginHorizontal: 16, marginBottom: 8 },
  commentsSection: { marginTop: 16, marginHorizontal: 16, marginBottom: 32 },
  commentsTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  commentInput: { flex: 1, borderWidth: 1, borderRadius: 20, padding: 8, fontSize: 14, marginRight: 8 },
  commentRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8, backgroundColor: '#ccc' },
  commentAuthor: { fontWeight: 'bold', fontSize: 13 },
  commentText: { fontSize: 14 },
  commentTimestamp: { fontSize: 11, color: '#888' },
  flex1: { flex: 1 },
  imageFixedHeight: { height: 400 },
  margin8: { margin: 8 },
});

export default PostDetail;
