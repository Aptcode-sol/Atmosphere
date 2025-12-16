import React, { useEffect, useState, useContext } from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet, ScrollView, TouchableOpacity, FlatList, Dimensions, SafeAreaView, Alert } from 'react-native';
import { ArrowLeft, Heart, MessageCircle, Share2, Bookmark } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../contexts/ThemeContext';
import { getBaseUrl, DEFAULT_BASE_URL } from '../lib/config';
import { getImageSource } from '../lib/image';
import { BOTTOM_NAV_HEIGHT } from '../lib/layout';
import CommentsOverlay from '../components/CommentsOverlay';
import ShareModal from '../components/ShareModal';
import { likePost, unlikePost, savePost, unsavePost, checkPostShared } from '../lib/api';

type PostDetailProps = {
  route: { params: { postId: string } };
  navigation?: { goBack?: () => void };
};

const PostDetail: React.FC<PostDetailProps & { onBackPress?: () => void }> = ({ route, navigation, onBackPress }) => {
  const { theme } = useContext(ThemeContext);
  const { postId } = route.params;
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Interaction states
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  const [saved, setSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const [shared, setShared] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const [activeImage, setActiveImage] = useState(0);
  const [showComments, setShowComments] = useState(false);

  // Computed images
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
    const checkSaved = async () => {
      try {
        const base = await getBaseUrl().catch(() => DEFAULT_BASE_URL);
        const token = await AsyncStorage.getItem('token');
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(`${base}/api/saved/check/post/${postId}`, { headers });
        const data = await res.json();
        setSaved(data.saved || false);
        if (data.savedId) setSavedId(data.savedId);
      } catch {
        setSaved(false);
      }
    };
    checkSaved();
  }, [postId]);

  useEffect(() => {
    const checkSharedStatus = async () => {
      try {
        const data = await checkPostShared(postId);
        setShared(data.shared || false);
      } catch {
        setShared(false);
      }
    };
    checkSharedStatus();
  }, [postId]);

  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    const prevLiked = liked;
    setLiked(!prevLiked);
    setPost((prev: any) => ({ ...prev, likesCount: !prevLiked ? (prev.likesCount || 0) + 1 : Math.max(0, (prev.likesCount || 0) - 1) }));

    try {
      if (!prevLiked) {
        await likePost(postId);
      } else {
        await unlikePost(postId);
      }
    } catch {
      // Revert if failed
      setLiked(prevLiked);
      setPost((prev: any) => ({ ...prev, likesCount: prevLiked ? (prev.likesCount || 0) + 1 : Math.max(0, (prev.likesCount || 0) - 1) }));
    }
    setLikeLoading(false);
  };

  const handleSave = async () => {
    if (saveLoading) return;
    setSaveLoading(true);
    const prevSaved = saved;
    const prevSavedId = savedId;
    setSaved(!prevSaved);

    try {
      if (!prevSaved) {
        const result = await savePost(postId);
        if (result?._id) setSavedId(result._id);
      } else {
        if (prevSavedId) {
          await unsavePost(prevSavedId);
        } else {
          await fetch(`${await getBaseUrl()}/api/saved/${postId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${await AsyncStorage.getItem('token')}` } });
        }
        setSavedId(null);
      }
    } catch (err) {
      setSaved(prevSaved);
      setSavedId(prevSavedId);
    }
    setSaveLoading(false);
  };

  const handleShareClick = () => {
    setShowShareModal(true);
  };

  const handleShareComplete = (sharesCount: number) => {
    setPost((prev: any) => ({ ...prev, sharesCount, shares: { ...prev.shares, sharedByCurrentUser: true } }));
    setShared(true);
  };

  const goBack = () => {
    if (navigation && navigation.goBack) navigation.goBack();
    else if (onBackPress) onBackPress();
  };

  const handleCommentUpdate = (newCount?: number) => {
    setPost((prev: any) => ({
      ...prev,
      commentsCount: typeof newCount === 'number' ? newCount : ((prev.commentsCount || 0) + 1)
    }));
  };

  const handleCommentDelete = (newCount?: number) => {
    setPost((prev: any) => ({
      ...prev,
      commentsCount: typeof newCount === 'number' ? newCount : Math.max(0, (prev.commentsCount || 0) - 1)
    }));
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
            <ArrowLeft size={24} color={theme.text} />
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
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Post</Text>
        <View style={styles.headerRight} />
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
          {/* Like */}
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike} disabled={likeLoading}>
            <Heart size={26} color={liked ? '#FF3B5C' : theme.text} fill={liked ? '#FF3B5C' : 'none'} />
            <Text style={[styles.actionCount, { color: theme.text }]}>{post.likesCount || 0}</Text>
          </TouchableOpacity>

          {/* Comment */}
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowComments(true)}>
            <MessageCircle size={26} color={theme.text} />
            <Text style={[styles.actionCount, { color: theme.text }]}>{post.commentsCount || 0}</Text>
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity style={styles.actionBtn} onPress={handleShareClick}>
            <Share2 size={26} color={shared ? theme.primary : theme.text} />
            <Text style={[styles.actionCount, { color: theme.text }]}>{post.sharesCount || 0}</Text>
          </TouchableOpacity>

          {/* Save */}
          <TouchableOpacity style={styles.actionBtn} onPress={handleSave} disabled={saveLoading}>
            <Bookmark size={26} color={saved ? theme.primary : theme.text} fill={saved ? theme.primary : 'none'} />
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
      </ScrollView>

      {/* Comments Overlay */}
      <CommentsOverlay
        startupId={postId}
        type="post"
        visible={showComments}
        onClose={() => setShowComments(false)}
        onCommentAdded={handleCommentUpdate}
        onCommentDeleted={handleCommentDelete}
      />

      {/* Share Modal */}
      <ShareModal
        contentId={postId}
        type="post"
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        onShareComplete={handleShareComplete}
        alreadyShared={shared}
      />
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
  }
});

export default PostDetail;
