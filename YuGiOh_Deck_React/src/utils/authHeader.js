export function authHeader() {
    try {
        const token = typeof window !== 'undefined' ? window.sessionStorage.getItem('token') : null;
        return token ? { Authorization: `Bearer ${token}` } : {};
    } catch { return {}; }
}