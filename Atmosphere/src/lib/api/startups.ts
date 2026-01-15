/**
 * Startups API functions
 */
import { request } from './core';
import { clearStartupCaches } from '../cache';

export async function fetchStartupPosts(limit = 20, skip = 0) {
    const data = await request('/api/startup-details', { limit, skip }, { method: 'GET' });
    return data.startups ?? [];
}

export async function fetchHottestStartups(limit = 10) {
    const data = await request('/api/startup-details/hottest', { limit }, { method: 'GET' });
    return data.startups ?? [];
}

export async function saveStartupProfile(payload: any) {
    const result = await request('/api/startup/profile', payload, { method: 'POST' });
    // Clear feed and saved posts caches so next load fetches fresh data
    clearStartupCaches().catch(e => console.error('[API] Failed to clear caches:', e));
    return result;
}

// Startup likes
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

export async function deleteStartupComment(commentId: string) {
    return request(`/api/startup-comments/comment/${encodeURIComponent(commentId)}`, {}, { method: 'DELETE' });
}
