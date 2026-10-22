export async function fetchCompanions(apiBase, cardId, { fetchImpl = (...args) => fetch(...args), signal } = {}) {
    const res = await fetchImpl(`${apiBase}/cards/${cardId}/companions`, { signal });     
    if (!res.ok) {                                                               
        throw new Error(`Companions lookup failed (HTTP ${res.status})`);             
    }
    return res.json();
}