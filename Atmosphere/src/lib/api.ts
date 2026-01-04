/**
 * Fetch user role and store in AsyncStorage
 */
export async function fetchAndStoreUserRole() {
    const data = await request('/api/profile', {}, { method: 'GET' });
    let role = '';
    if (Array.isArray(data?.user?.roles)) {
        role = data.user.roles[0] || '';
    } else if (Array.isArray(data?.roles)) {
        role = data.roles[0] || '';
    } else {
        role = data?.user?.roles || data?.roles || '';
    }
    if (role) {
        await AsyncStorage.setItem('role', role);
    }
    return role;
}

export async function fetchChats(type?: 'group' | 'private') {
    const query = type ? `?type=${type}` : '';
    const data = await request(`/api/chats${query}`, {}, { method: 'GET' });
    return data.chats || [];
}

export async function createGroup(payload: { name: string; description?: string; participants: string[]; type?: string; image?: string }) {
    return request('/api/chats/create-group', payload, { method: 'POST' });
}

/**
 * Simple API client for auth endpoints.
 * Adjust BASE_URL if you run the backend on a different host or device.
 * For Android emulator use: 10.0.2.2:4000 (default here)
 * For physical device use your machine LAN IP, e.g. http://192.168.1.12:4000
 */
import { getBaseUrl, DEFAULT_BASE_URL } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_BASE = DEFAULT_BASE_URL;

async function request(path: string, body: any = {}, options: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE' } = {}) {
    const method = options.method || 'POST';
    const base = await getBaseUrl().catch(() => DEFAULT_BASE);

    let url = `${base}${path}`;

    const token = await AsyncStorage.getItem('token');
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    // Prevent cached conditional responses from returning 304 with empty body
    if (method === 'GET') {
        headers['Cache-Control'] = 'no-cache';
        headers.Pragma = 'no-cache';
    }
    const fetchOptions: any = { method, headers };

    if (method === 'GET') {
        const query = Object.keys(body || {}).map(k => `${encodeURIComponent(k)}=${encodeURIComponent((body as any)[k])}`).join('&');
        if (query) url += (url.includes('?') ? '&' : '?') + query;
    } else {
        fetchOptions.body = JSON.stringify(body);
    }

    const res = await fetch(url, fetchOptions);
    // Treat 304 Not Modified as an OK with empty body (caller can use cached data)
    if (res.status === 304) return {};
    const text = await res.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }

    if (!res.ok) {
        const message = data && data.error ? data.error : res.statusText || 'Unknown error';
        throw new Error(message);
    }

    return data;
}

export async function login(email: string, password: string) {
    return request('/api/auth/login', { email, password });
}

export async function register({ email, username, password, displayName, accountType = 'personal' }: { email: string; username: string; password: string; displayName?: string; accountType?: string }) {
    return request('/api/auth/register', { email, username, password, displayName, accountType });
}

export async function forgotPassword(email: string) {
    return request('/api/auth/forgot-password', { email }, { method: 'POST' });
}

export async function verifyOtpCheck(email: string, code: string) {
    return request('/api/auth/verify-otp', { email, code }, { method: 'POST' });
}

export async function resetPassword(email: string, code: string, newPassword: string) {
    return request('/api/auth/reset-password', { email, code, newPassword }, { method: 'POST' });
}


export async function fetchStartupPosts(limit = 20, skip = 0) {
    const data = await request('/api/startup-details', { limit, skip }, { method: 'GET' });
    return data.startups ?? [];
}

export async function fetchHottestStartups(limit = 10) {
    const data = await request('/api/startup-details/hottest', { limit }, { method: 'GET' });
    return data.startups ?? [];
}

export async function getProfile() {
    let data = await request('/api/profile', {}, { method: 'GET' });
    // If server returned 304 -> request() returns {}. Retry with cache-bust to get fresh profile.
    if (data && Object.keys(data).length === 0) {
        console.debug('[api] getProfile empty response, retrying with cache-bust');
        data = await request('/api/profile', { _cb: Date.now() }, { method: 'GET' });
        console.debug('[api] getProfile retry response:', data);
    }
    return data;
}

export async function updateProfile(payload: any) {
    return request('/api/profile', payload, { method: 'PUT' });
}

/**
 * Upload profile picture to S3 and update user's avatarUrl
 */
export async function uploadProfilePicture(imageUri: string, fileName: string, mimeType: string) {
    const baseUrl = await getBaseUrl();
    const token = await AsyncStorage.getItem('token');

    // Create form data
    const formData = new FormData();
    formData.append('image', {
        uri: imageUri,
        name: fileName || 'profile.jpg',
        type: mimeType || 'image/jpeg',
    } as any);

    // Upload to S3
    const uploadRes = await fetch(`${baseUrl}/api/upload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    });

    if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to upload image');
    }

    const uploadData = await uploadRes.json();
    return uploadData.url;
}

/**
 * Upload an image to S3 (general purpose - for trades, posts, etc.)
 */
export async function uploadImage(imageUri: string, fileName?: string, mimeType?: string): Promise<string> {
    const baseUrl = await getBaseUrl();
    const token = await AsyncStorage.getItem('token');

    const formData = new FormData();
    formData.append('image', {
        uri: imageUri,
        name: fileName || 'image.jpg',
        type: mimeType || 'image/jpeg',
    } as any);

    const uploadRes = await fetch(`${baseUrl}/api/upload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    });

    if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to upload image');
    }

    const uploadData = await uploadRes.json();
    return uploadData.url;
}

/**
 * Upload document to S3 (for portfolio verification, holdings, etc.)
 */
export async function uploadDocument(fileUri: string, fileName: string, mimeType: string): Promise<string> {
    const baseUrl = await getBaseUrl();
    const token = await AsyncStorage.getItem('token');

    // Use FormData upload for all file types (more reliable in React Native)
    const formData = new FormData();

    // Determine the field name and endpoint based on file type
    const isImage = mimeType && mimeType.startsWith('image/');
    const fieldName = isImage ? 'image' : 'file';
    const endpoint = isImage ? '/api/upload' : '/api/upload/document';

    formData.append(fieldName, {
        uri: fileUri,
        name: fileName || (isImage ? 'image.jpg' : 'document.pdf'),
        type: mimeType || (isImage ? 'image/jpeg' : 'application/pdf'),
    } as any);

    const uploadRes = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    });

    if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to upload document');
    }

    const uploadData = await uploadRes.json();
    return uploadData.url;
}

export async function fetchMyPosts() {
    // call the authenticated endpoint that returns only posts authored by current user
    const data = await request('/api/posts/me', {}, { method: 'GET' });
    return data.posts ?? [];
}

export async function createPost(payload: { content: string; media?: { url: string; type: string }[]; tags?: string[] }) {
    return request('/api/posts', payload, { method: 'POST' });
}

export async function verifyEmail(code: string, email?: string) {
    // email optional - if provided backend will accept unauthenticated verify for signup dev flow
    return request('/api/auth/verify-email', { code, email }, { method: 'POST' });
}

export async function resendOtp(email: string) {
    return request('/api/auth/resend-otp', { email }, { method: 'POST' });
}

export async function saveStartupProfile(payload: any) {
    return request('/api/startup/profile', payload, { method: 'POST' });
}

export async function getStartupProfile(userId: string) {
    try {
        let data = await request(`/api/startup-details/${encodeURIComponent(userId)}`, {}, { method: 'GET' });
        if (data && data.startupDetails) return { user: data.startupDetails.user, details: data.startupDetails };
        if (data && data.user) return { user: data.user, details: data };
        return data;
    } catch (err) {
        // Try by startup details id (fallback)
        try {
            const data2 = await request(`/api/startup-details/by-id/${encodeURIComponent(userId)}`, {}, { method: 'GET' });
            if (data2 && data2.startupDetails) return { user: data2.startupDetails.user, details: data2.startupDetails };
            if (data2 && data2.user) return { user: data2.user, details: data2 };
            return data2;
        } catch { throw err; }
    }
}

export async function getAnyUserProfile(userId: string) {
    // 1. Try fetching as startup first
    try {
        const startupProfile = await getStartupProfile(userId);
        if (startupProfile) return startupProfile;
    } catch {
        // ignore error and proceed to try as regular user
    }

    // 2. Fetch as regular user
    const user = await getUserByIdentifier(userId);
    if (user) {
        return { user, details: null };
    }
    throw new Error('User not found');
}

export async function getPostsByUser(userId: string) {
    // Preferred backend route: GET /api/posts?userId=<id>
    try {
        const data = await request('/api/posts', { userId }, { method: 'GET' });
        return (data.posts ?? data) || [];
    } catch {
        // Fallback: try legacy route if present
        try {
            const data2 = await request(`/api/posts/user/${encodeURIComponent(userId)}`, {}, { method: 'GET' });
            return (data2.posts ?? data2) || [];
        } catch {
            throw new Error('Failed to fetch posts for user');
        }
    }
}

export async function followUser(targetId: string) {
    return request(`/api/follows/${encodeURIComponent(targetId)}`, {}, { method: 'POST' });
}

export async function unfollowUser(targetId: string) {
    return request(`/api/follows/${encodeURIComponent(targetId)}`, {}, { method: 'DELETE' });
}

export async function checkFollowing(targetId: string) {
    return request(`/api/follows/check/${encodeURIComponent(targetId)}`, {}, { method: 'GET' });
}

export async function getFollowStatus(targetId: string) {
    // returns { isFollowing: boolean }
    try {
        const data = await request(`/api/follows/check/${encodeURIComponent(targetId)}`, {}, { method: 'GET' });
        return { isFollowing: Boolean(data?.isFollowing || data?.following || false) };
    } catch {
        return { isFollowing: false };
    }
}

export async function getFollowersList(userId: string) {
    let data = await request(`/api/follows/${encodeURIComponent(userId)}/followers`, {}, { method: 'GET' });
    return data?.followers || [];
}

export async function getFollowingList(userId: string) {
    let data = await request(`/api/follows/${encodeURIComponent(userId)}/following`, {}, { method: 'GET' });
    return data?.following || [];
}

export async function getChatDetails(chatId: string) {
    return request(`/api/chats/${chatId}`, {}, { method: 'GET' });
}

export async function createOrFindChat(participantId: string) {
    return request('/api/chats', { participantId }, { method: 'POST' });
}

export async function getFollowersCount(userId: string) {
    let data = await request(`/api/follows/${encodeURIComponent(userId)}/followers`, {}, { method: 'GET' });
    console.debug('[api] getFollowersCount initial response:', data);
    // if backend returned 304 -> request() returns {}. Retry with cache-bust to ensure fresh counts
    if (data && Object.keys(data).length === 0) {
        console.debug('[api] getFollowersCount empty response, retrying with cache-bust');
        data = await request(`/api/follows/${encodeURIComponent(userId)}/followers`, { _cb: Date.now() }, { method: 'GET' });
        console.debug('[api] getFollowersCount retry response:', data);
    }
    return data?.count ?? (Array.isArray(data?.followers) ? data.followers.length : 0);
}

export async function getFollowingCount(userId: string) {
    let data = await request(`/api/follows/${encodeURIComponent(userId)}/following`, {}, { method: 'GET' });
    console.debug('[api] getFollowingCount initial response:', data);
    if (data && Object.keys(data).length === 0) {
        console.debug('[api] getFollowingCount empty response, retrying with cache-bust');
        data = await request(`/api/follows/${encodeURIComponent(userId)}/following`, { _cb: Date.now() }, { method: 'GET' });
        console.debug('[api] getFollowingCount retry response:', data);
    }
    return data?.count ?? (Array.isArray(data?.following) ? data.following.length : 0);
}

// Likes
export async function likePost(postId: string) {
    return request(`/api/likes/post/${encodeURIComponent(postId)}`, {}, { method: 'POST' });
}

export async function unlikePost(postId: string) {
    return request(`/api/likes/post/${encodeURIComponent(postId)}`, {}, { method: 'DELETE' });
}

export async function getPostLikes(postId: string) {
    const data = await request(`/api/likes/post/${encodeURIComponent(postId)}`, {}, { method: 'GET' });
    return data.likes || [];
}

// Comments
export async function addComment(postId: string, text: string, parent?: string) {
    return request(`/api/comments/${encodeURIComponent(postId)}/comments`, { text, parent }, { method: 'POST' });
}

export async function getComments(postId: string) {
    const data = await request(`/api/comments/${encodeURIComponent(postId)}/comments`, {}, { method: 'GET' });
    return data.comments || [];
}

export async function deleteComment(commentId: string) {
    return request(`/api/comments/${encodeURIComponent(commentId)}`, {}, { method: 'DELETE' });
}

export async function deleteStartupComment(commentId: string) {
    return request(`/api/startup-comments/comment/${encodeURIComponent(commentId)}`, {}, { method: 'DELETE' });
}

// Crowns
export async function crownPost(postId: string) {
    return request(`/api/crowns/post/${encodeURIComponent(postId)}`, {}, { method: 'POST' });
}

export async function uncrownPost(postId: string) {
    return request(`/api/crowns/post/${encodeURIComponent(postId)}`, {}, { method: 'DELETE' });
}

export async function getPostCrowns(postId: string) {
    const data = await request(`/api/crowns/post/${encodeURIComponent(postId)}`, {}, { method: 'GET' });
    return data.crowns || [];
}

// Startup likes (for startup-cards where the backend uses StartupDetails)
export async function likeStartup(startupId: string) {
    return request(`/api/startup-likes/startup/${encodeURIComponent(startupId)}`, {}, { method: 'POST' });
}

export async function unlikeStartup(startupId: string) {
    return request(`/api/startup-likes/startup/${encodeURIComponent(startupId)}`, {}, { method: 'DELETE' });
}

export async function getStartupLikes(startupId: string) {
    const data = await request(`/api/startup-likes/startup/${encodeURIComponent(startupId)}`, {}, { method: 'GET' });
    return data.likes || [];
}

export async function isStartupLiked(startupId: string) {
    try {
        const data = await request(`/api/startup-likes/startup/${encodeURIComponent(startupId)}/check`, {}, { method: 'GET' });
        return Boolean(data?.liked);
    } catch { return false; }
}

// Startup crowns
export async function crownStartup(startupId: string) {
    return request(`/api/startup-crowns/startup/${encodeURIComponent(startupId)}`, {}, { method: 'POST' });
}

export async function uncrownStartup(startupId: string) {
    return request(`/api/startup-crowns/startup/${encodeURIComponent(startupId)}`, {}, { method: 'DELETE' });
}

export async function getStartupCrowns(startupId: string) {
    const data = await request(`/api/startup-crowns/startup/${encodeURIComponent(startupId)}`, {}, { method: 'GET' });
    return data.crowns || [];
}

// Startup comments
export async function addStartupComment(startupId: string, text: string, parent?: string) {
    return request(`/api/startup-comments/${encodeURIComponent(startupId)}/comments`, { text, parent }, { method: 'POST' });
}

export async function getStartupComments(startupId: string) {
    const data = await request(`/api/startup-comments/${encodeURIComponent(startupId)}/comments`, {}, { method: 'GET' });
    return data.comments || [];
}

export async function getStartupCommentReplies(commentId: string) {
    const data = await request(`/api/startup-comments/comment/${encodeURIComponent(commentId)}/replies`, {}, { method: 'GET' });
    return data.replies || [];
}

export async function getCommentReplies(commentId: string) {
    const data = await request(`/api/comments/${encodeURIComponent(commentId)}/replies`, {}, { method: 'GET' });
    return data.replies || [];
}

export async function getReelCommentReplies(commentId: string) {
    const data = await request(`/api/reels/comments/${encodeURIComponent(commentId)}/replies`, {}, { method: 'GET' });
    return data.replies || [];
}

export async function sharePost(postId: string, userIds: string[] = []) {
    return request('/api/shares', { postId, userIds }, { method: 'POST' });
}

export async function checkPostShared(postId: string) {
    return request(`/api/shares/check/${postId}`, {}, { method: 'GET' });
}

export async function getUserByIdentifier(identifier: string) {
    try {
        const data = await request(`/api/users/${encodeURIComponent(identifier)}`, {}, { method: 'GET' });
        return data?.user ? data.user : null;
    } catch { return null; }
}

export async function fetchExplorePosts(limit = 20, skip = 0) {
    const data = await request('/api/posts', { limit, skip }, { method: 'GET' });
    return data.posts ?? [];
}

export async function searchEntities(query: string, type = 'all', limit = 20, skip = 0) {
    const data = await request('/api/search', { q: query, type, limit, skip }, { method: 'GET' });
    return data.results ?? {};
}

export async function searchUsers(query: string, role?: string, limit = 20, skip = 0) {
    const params: any = { q: query, limit, skip };
    if (role) params.role = role;
    const data = await request('/api/search/users', params, { method: 'GET' });
    return data.users ?? [];
}

// Trade APIs
export async function fetchMarkets() {
    const data = await request('/api/trade/markets', {}, { method: 'GET' });
    return data.markets || [];
}

export async function fetchMyPortfolio() {
    const data = await request('/api/trade/portfolio', {}, { method: 'GET' });
    return data.portfolio || { items: [] };
}

export async function placeOrder(assetId: string, side: 'buy' | 'sell', quantity: number) {
    return request('/api/trade/order', { assetId, side, quantity }, { method: 'POST' });
}

// New Trade APIs for trading section
export async function createTrade(tradeData: any) {
    return request('/api/trade/trades', tradeData, { method: 'POST' });
}

export async function getMyTrades() {
    const data = await request('/api/trade/trades/my', {}, { method: 'GET' });
    return data.trades || [];
}

export async function getAllTrades(limit = 20, skip = 0, filters = {}) {
    const data = await request('/api/trade/trades', { limit, skip, ...filters }, { method: 'GET' });
    return data.trades || [];
}

export async function getTrade(tradeId: string) {
    const data = await request(`/api/trade/trades/${encodeURIComponent(tradeId)}`, {}, { method: 'GET' });
    return data.trade || null;
}

export async function updateTrade(id: string, tradeData: any) {
    return request(`/api/trade/trades/${id}`, tradeData, { method: 'PUT' });
}

export async function deleteTrade(id: string) {
    return request(`/api/trade/trades/${id}`, {}, { method: 'DELETE' });
}

export async function incrementTradeViews(id: string) {
    return request(`/api/trade/trades/${id}/view`, {}, { method: 'POST' });
}

export async function toggleTradeSave(id: string, saved: boolean) {
    return request(`/api/trade/trades/${id}/save`, { saved }, { method: 'POST' });
}

export async function getSavedTrades(): Promise<{ savedTradeIds: string[]; trades: any[] }> {
    const data = await request('/api/trade/trades/saved', {}, { method: 'GET' });
    return { savedTradeIds: data.savedTradeIds || [], trades: data.trades || [] };
}

// Investor APIs
export async function fetchInvestors(params?: { limit?: number; skip?: number }) {
    const data = await request('/api/investor-details', params || {}, { method: 'GET' });
    return data.investors || [];
}

export async function getInvestorDetails(userId: string) {
    try {
        const data = await request(`/api/investor-details/${encodeURIComponent(userId)}`, {}, { method: 'GET' });
        return data?.investorDetails || null;
    } catch {
        return null;
    }
}

// Jobs, Grants, Events
export async function fetchJobs(limit = 20, skip = 0) {
    const data = await request('/api/jobs', { limit, skip }, { method: 'GET' });
    return data.jobs || [];
}

export async function fetchGrants(limit = 20, skip = 0) {
    const data = await request('/api/grants', { limit, skip }, { method: 'GET' });
    return data || []; // backend returns array directly
}

export async function fetchEvents(limit = 20, skip = 0) {
    const data = await request('/api/events', { limit, skip }, { method: 'GET' });
    return data || []; // backend returns array directly
}

// Notifications
export async function fetchNotifications(limit = 50, skip = 0) {
    const data = await request('/api/notifications', { limit, skip }, { method: 'GET' });
    return {
        notifications: data.notifications || [],
        unreadCount: data.unreadCount || 0
    };
}

export async function markNotificationRead(notificationId: string) {
    return request(`/api/notifications/${encodeURIComponent(notificationId)}/read`, {}, { method: 'PUT' });
}

export async function markAllNotificationsRead() {
    return request('/api/notifications/read-all', {}, { method: 'PUT' });
}

// Saved Posts
export async function savePost(postId: string) {
    return request('/api/saved', { postId }, { method: 'POST' });
}

export async function fetchSavedPosts() {
    const data = await request('/api/saved', {}, { method: 'GET' });
    return data || [];
}

export async function unsavePost(savedId: string) {
    return request(`/api/saved/${encodeURIComponent(savedId)}`, {}, { method: 'DELETE' });
}

// Get single post by ID
export async function getPostById(postId: string) {
    const data = await request(`/api/posts/${encodeURIComponent(postId)}`, {}, { method: 'GET' });
    return data.post || data || null;
}

// Reels API
export async function fetchReels(limit = 20, skip = 0) {
    const data = await request('/api/reels', { limit, skip }, { method: 'GET' });
    return data.reels || [];
}

export async function createReel(payload: { videoUrl: string; thumbnailUrl?: string; caption?: string; tags?: string[]; duration?: number }) {
    return request('/api/reels', payload, { method: 'POST' });
}

export async function getReel(reelId: string) {
    const data = await request(`/api/reels/${encodeURIComponent(reelId)}`, {}, { method: 'GET' });
    return data.reel || null;
}

export async function getUserReels(userId: string, limit = 20, skip = 0) {
    const data = await request(`/api/reels/user/${encodeURIComponent(userId)}`, { limit, skip }, { method: 'GET' });
    return data.reels || [];
}

export async function deleteReel(reelId: string) {
    return request(`/api/reels/${encodeURIComponent(reelId)}`, {}, { method: 'DELETE' });
}

export async function likeReel(reelId: string) {
    return request(`/api/reels/${encodeURIComponent(reelId)}/like`, {}, { method: 'POST' });
}

export async function unlikeReel(reelId: string) {
    return request(`/api/reels/${encodeURIComponent(reelId)}/like`, {}, { method: 'DELETE' });
}

export async function getReelComments(reelId: string, limit = 50, skip = 0) {
    const data = await request(`/api/reels/${encodeURIComponent(reelId)}/comments`, { limit, skip }, { method: 'GET' });
    return data.comments || [];
}

export async function addReelComment(reelId: string, text: string, parent?: string) {
    return request(`/api/reels/${encodeURIComponent(reelId)}/comments`, { text, parent }, { method: 'POST' });
}

export async function deleteReelComment(commentId: string) {
    return request(`/api/reels/comments/${encodeURIComponent(commentId)}`, {}, { method: 'DELETE' });
}

// Share reel with followers
export async function shareReel(reelId: string, followerIds: string[] = []) {
    return request(`/api/reels/${encodeURIComponent(reelId)}/share`, { followerIds }, { method: 'POST' });
}

export async function updateReelShare(reelId: string, followerIds: string[]) {
    return request(`/api/reels/${encodeURIComponent(reelId)}/share`, { followerIds }, { method: 'PUT' });
}

export async function checkReelShared(reelId: string) {
    const data = await request(`/api/reels/${encodeURIComponent(reelId)}/share/check`, {}, { method: 'GET' });
    return data || { shared: false, shareId: null, sharedWith: [] };
}

// Unified Share API
export async function shareContent(payload: {
    userIds: string[];
    contentId: string;
    contentType: 'post' | 'reel' | 'startup' | 'trade';
    contentTitle?: string;
    contentImage?: string;
    contentOwner?: string;
}) {
    return request('/api/shares/send', payload, { method: 'POST' });
}

// Upload video for reels
export async function uploadVideo(videoUri: string): Promise<{ url: string; thumbnailUrl: string; duration: number }> {
    const base = await getBaseUrl().catch(() => DEFAULT_BASE_URL);
    const token = await AsyncStorage.getItem('token');

    const formData = new FormData();
    formData.append('video', {
        uri: videoUri,
        type: 'video/mp4',
        name: 'reel.mp4',
    } as any);

    const res = await fetch(`${base}/api/upload/video`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            // Don't set Content-Type - let fetch set it automatically with boundary for FormData
        },
        body: formData,
    });

    if (!res.ok) {
        const errorText = await res.text();
        console.error('Video upload failed:', res.status, errorText);
        throw new Error('Failed to upload video');
    }

    const data = await res.json();
    return {
        url: data.url,
        thumbnailUrl: data.thumbnailUrl || data.url,
        duration: data.duration || 0,
    };
}

// Settings APIs
export async function getSettings() {
    const data = await request('/api/settings', {}, { method: 'GET' });
    return data.settings || {};
}

export async function updateSettings(payload: { displayName?: string; username?: string; phone?: string }) {
    return request('/api/settings', payload, { method: 'PUT' });
}

export async function changePassword(currentPassword: string, newPassword: string) {
    return request('/api/settings/password', { currentPassword, newPassword }, { method: 'PUT' });
}

export async function getSavedPosts() {
    const data = await request('/api/saved', {}, { method: 'GET' });
    return data || [];
}

// KYC APIs
export async function getKycStatus() {
    const data = await request('/api/settings/kyc', {}, { method: 'GET' });
    return data || { kycCompleted: false };
}

export async function markKycComplete() {
    return request('/api/settings/kyc', {}, { method: 'PUT' });
}

// My Teams APIs
export async function fetchMyTeam() {
    const data = await request('/api/my-team', {}, { method: 'GET' });
    return data || [];
}

export async function addToMyTeam(memberId: string) {
    return request('/api/my-team', { memberId }, { method: 'POST' });
}

export async function removeFromMyTeam(memberId: string) {
    return request(`/api/my-team/${encodeURIComponent(memberId)}`, {}, { method: 'DELETE' });
}

export async function sendMessage(chatId: string, content: string) {
    return request(`/api/messages/${chatId}`, { content }, { method: 'POST' });
}