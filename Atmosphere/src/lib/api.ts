/**
 * Simple API client for auth endpoints.
 * Adjust BASE_URL if you run the backend on a different host or device.
 * For Android emulator use: 10.0.2.2:4000 (default here)
 * For physical device use your machine LAN IP, e.g. http://192.168.1.12:4000
 */
const BASE_URL = 'http://10.0.2.2:4000';

async function post(path: string, body: any) {
    const res = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

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
    return post('/api/auth/login', { email, password });
}

export async function register({ email, username, password, displayName }: { email: string; username: string; password: string; displayName?: string }) {
    return post('/api/auth/register', { email, username, password, displayName, accountType: 'personal' });
}

export { BASE_URL };
