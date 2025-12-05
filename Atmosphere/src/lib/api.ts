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

export async function register({ email, username, password, displayName }: { email: string; username: string; password: string; displayName?: string }) {
    return request('/api/auth/register', { email, username, password, displayName, accountType: 'personal' });
}


export async function fetchStartupPosts() {
    // The backend route is registered under `/api/startup-details`
    const data = await request('/api/startup-details', {}, { method: 'GET' });
    // The service returns { startups, count }
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
    const data = await request('/api/posts/mine', {}, { method: 'GET' });
    return data.posts ?? [];
}