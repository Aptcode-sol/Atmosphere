/**
 * Reels API functions
 */
import { request, getBaseUrl } from './core';
import { DEFAULT_BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Reel comments
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

export async function getReelCommentReplies(commentId: string) {
    const data = await request(`/api/reels/comments/${encodeURIComponent(commentId)}/replies`, {}, { method: 'GET' });
    return data.replies || [];
}

// Reel sharing
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

// Reel saving
export async function saveReel(reelId: string) {
    return request('/api/saved', { postId: reelId }, { method: 'POST' });
}

export async function unsaveReel(savedId: string) {
    return request(`/api/saved/${encodeURIComponent(savedId)}`, {}, { method: 'DELETE' });
}

export async function checkReelSaved(reelId: string) {
    try {
        const data = await request(`/api/saved/check/${encodeURIComponent(reelId)}?type=reel`, {}, { method: 'GET' });
        return data || { saved: false, savedId: null };
    } catch { return { saved: false, savedId: null }; }
}

// Video upload
export async function uploadVideo(videoUri: string): Promise<{ url: string; thumbnailUrl: string; duration: number }> {
    const base = await getBaseUrl().catch(() => DEFAULT_BASE_URL);
    const token = await AsyncStorage.getItem('token');
    const formData = new FormData();
    formData.append('video', { uri: videoUri, type: 'video/mp4', name: 'reel.mp4' } as any);
    const res = await fetch(`${base}/api/upload/video`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
    if (!res.ok) { const errorText = await res.text(); console.error('Video upload failed:', res.status, errorText); throw new Error('Failed to upload video'); }
    const data = await res.json();
    return { url: data.url, thumbnailUrl: data.thumbnailUrl || data.url, duration: data.duration || 0 };
}
