import AsyncStorage from '@react-native-async-storage/async-storage';

export async function setToken(token: string) {
    await AsyncStorage.setItem('token', token);
}

export async function getToken() {
    return AsyncStorage.getItem('token');
}

export async function clearToken() {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
}

// Simple refresh token flow skeleton. Your backend must implement refresh tokens.
export async function refreshTokenIfNeeded() {
    // Placeholder: Check expiry and call /api/auth/refresh
    // Example:
    // const refresh = await AsyncStorage.getItem('refreshToken');
    // if (!refresh) return null;
    // const res = await fetch(`${BASE_URL}/api/auth/refresh`, { method: 'POST', body: JSON.stringify({ refresh }) });
    return null;
}
