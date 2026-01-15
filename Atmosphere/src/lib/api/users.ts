/**
 * Users & Profile API functions
 */
import { request, getBaseUrl } from './core';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getProfile() {
    let data = await request('/api/profile', {}, { method: 'GET' });
    if (data && Object.keys(data).length === 0) {
        data = await request('/api/profile', { _cb: Date.now() }, { method: 'GET' });
    }
    return data;
}

export async function updateProfile(payload: any) {
    return request('/api/profile', payload, { method: 'PUT' });
}

export async function checkUsernameAvailability(username: string) {
    return request(`/api/users/check/${encodeURIComponent(username)}`, {}, { method: 'GET' });
}

export async function getUserByIdentifier(identifier: string) {
    try {
        const data = await request(`/api/users/${encodeURIComponent(identifier)}`, {}, { method: 'GET' });
        return data?.user || null;
    } catch { return null; }
}

export async function getAnyUserProfile(userId: string) {
    // Record profile visit (fire and forget)
    recordProfileVisit(userId).catch(() => { });

    try {
        const startupProfile = await getStartupProfile(userId);
        if (startupProfile) return startupProfile;
    } catch { }
    const user = await getUserByIdentifier(userId);
    if (user) return { user, details: null };
    throw new Error('User not found');
}

/**
 * Record a profile visit for analytics
 * This calls the /api/profile/:userId endpoint which records the visit on the backend
 */
export async function recordProfileVisit(userId: string) {
    try {
        await request(`/api/profile/${encodeURIComponent(userId)}`, {}, { method: 'GET' });
    } catch {
        // Ignore errors - visit recording is not critical
    }
}

export async function getStartupProfile(userId: string) {
    try {
        let data = await request(`/api/startup-details/${encodeURIComponent(userId)}`, {}, { method: 'GET' });
        if (data?.startupDetails) return { user: data.startupDetails.user, details: data.startupDetails };
        if (data?.user) return { user: data.user, details: data };
        return data;
    } catch (err) {
        try {
            const data2 = await request(`/api/startup-details/by-id/${encodeURIComponent(userId)}`, {}, { method: 'GET' });
            if (data2?.startupDetails) return { user: data2.startupDetails.user, details: data2.startupDetails };
            if (data2?.user) return { user: data2.user, details: data2 };
            return data2;
        } catch { throw err; }
    }
}

export async function uploadProfilePicture(imageUri: string, fileName: string, mimeType: string) {
    const baseUrl = await getBaseUrl();
    const token = await AsyncStorage.getItem('token');
    const formData = new FormData();
    formData.append('image', { uri: imageUri, name: fileName || 'profile.jpg', type: mimeType || 'image/jpeg' } as any);
    const uploadRes = await fetch(`${baseUrl}/api/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
    if (!uploadRes.ok) { const err = await uploadRes.json().catch(() => ({})); throw new Error(err.error || 'Failed to upload image'); }
    const uploadData = await uploadRes.json();
    return uploadData.url;
}

// Follow functions
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
    try {
        const data = await request(`/api/follows/check/${encodeURIComponent(targetId)}`, {}, { method: 'GET' });
        return { isFollowing: Boolean(data?.isFollowing || data?.following || false) };
    } catch { return { isFollowing: false }; }
}

export async function getFollowersList(userId: string, limit = 20, skip = 0) {
    const data = await request(`/api/follows/${encodeURIComponent(userId)}/followers`, { limit, skip }, { method: 'GET' });
    return { followers: data?.followers || [], count: data?.count || 0 };
}

export async function getFollowingList(userId: string, limit = 20, skip = 0) {
    const data = await request(`/api/follows/${encodeURIComponent(userId)}/following`, { limit, skip }, { method: 'GET' });
    return { following: data?.following || [], count: data?.count || 0 };
}

export async function getFollowersCount(userId: string) {
    let data = await request(`/api/follows/${encodeURIComponent(userId)}/followers`, {}, { method: 'GET' });
    if (data && Object.keys(data).length === 0) {
        data = await request(`/api/follows/${encodeURIComponent(userId)}/followers`, { _cb: Date.now() }, { method: 'GET' });
    }
    return data?.count ?? (Array.isArray(data?.followers) ? data.followers.length : 0);
}

export async function getFollowingCount(userId: string) {
    let data = await request(`/api/follows/${encodeURIComponent(userId)}/following`, {}, { method: 'GET' });
    if (data && Object.keys(data).length === 0) {
        data = await request(`/api/follows/${encodeURIComponent(userId)}/following`, { _cb: Date.now() }, { method: 'GET' });
    }
    return data?.count ?? (Array.isArray(data?.following) ? data.following.length : 0);
}

export async function searchUsers(query: string, role?: string, limit = 20, skip = 0) {
    const params: any = { q: query, limit, skip };
    if (role) params.role = role;
    const data = await request('/api/search/users', params, { method: 'GET' });
    return data.users ?? [];
}
