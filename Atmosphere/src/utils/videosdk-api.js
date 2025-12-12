// Minimal helper for VideoSDK integration
// This file can hold API calls to create meetings, fetch tokens, etc.
// For now provide a stub function used by the Join flow in case you want to create meetings server-side.

export async function createMeetingOnServer(baseUrl, token, opts = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${baseUrl}/api/meetings/create-video`, {
        method: 'POST',
        headers,
        body: JSON.stringify(opts),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Failed to create meeting: ${res.status} ${text}`);
    }
    return res.json();
}
