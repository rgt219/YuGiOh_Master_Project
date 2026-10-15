// Who is logged in? Reads the same place the profile page does (sessionStorage "user").
// Returns the id as a string, or null when logged out or unavailable.
export function getCurrentUserId() {
    try {
        if (typeof window === 'undefined') return null;       // server render: no browser storage
        const raw = window.sessionStorage.getItem('user');
        const id = raw ? JSON.parse(raw)?.id : null;
        return id != null ? String(id) : null;
    } catch {
        return null;                                          // bad JSON or storage blocked
    }
}