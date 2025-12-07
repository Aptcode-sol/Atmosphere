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
    const data = await request('/api/profile', {}, { method: 'GET' });
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
    return request(`/api/startup/profile/${userId}`, {}, { method: 'GET' });
}