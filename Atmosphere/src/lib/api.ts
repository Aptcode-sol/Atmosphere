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


export async function fetchStartupPosts() {
    const data = await request('/api/startup-details', {}, { method: 'GET' });
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

export async function fetchMyPosts() {
    // call the authenticated endpoint that returns only posts authored by current user
    const data = await request('/api/posts/me', {}, { method: 'GET' });
    return data.posts ?? [];
}

export async function verifyEmail(code: string, email?: string) {
    // email optional - if provided backend will accept unauthenticated verify for signup dev flow
    return request('/api/auth/verify-email', { code, email }, { method: 'POST' });
}

export async function saveStartupProfile(payload: any) {
    return request('/api/startup/profile', payload, { method: 'POST' });
}

export async function getStartupProfile(userId: string) {
    const data = await request(`/api/startup/profile/${userId}`, {}, { method: 'GET' });
    // backend returns { startupDetails } where startupDetails.user is populated
    if (data && data.startupDetails) {
        return { user: data.startupDetails.user, details: data.startupDetails };
    }
    return data;
}

export async function getPostsByUser(userId: string) {
    // Preferred backend route: /api/posts/user/:userId
    try {
        const data = await request(`/api/posts/user/${encodeURIComponent(userId)}`, {}, { method: 'GET' });
        return (data.posts ?? data) || [];
    } catch {
        // If endpoint not available, bubble error to caller to decide fallback
        throw new Error('Failed to fetch posts for user');
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
    } catch (e) { return false; }
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