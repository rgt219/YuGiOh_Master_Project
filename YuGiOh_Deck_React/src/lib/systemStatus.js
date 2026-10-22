// Behind the /status page. The site's own server asks each backend service for its /health report
// (see Shared/YuGiOh.ServiceDefaults/ServiceHealth.cs), so the browser never calls the services directly and the
// internal-only ones (Go worker, Analytics worker) can be checked too.
//
// Checks only run when someone opens the page, and the answer is reused for 30 seconds. Nothing polls on a timer:
// the Deck and Forum APIs sleep when nobody is using them (scale to zero), and a timer would keep them awake and billed.

// Inside Azure every app is reachable by its Container App name. Override with the env var to point elsewhere
// (e.g. STATUS_DECK_API_URL=http://localhost:5080 when running the backend with docker compose).
export const SERVICES = [
    { id: 'deck-api', name: 'Deck API', envVar: 'STATUS_DECK_API_URL', defaultUrl: 'http://api' },
    { id: 'identity-api', name: 'Identity API', envVar: 'STATUS_IDENTITY_API_URL', defaultUrl: 'http://identity' },
    { id: 'forum-api', name: 'Forum API', envVar: 'STATUS_FORUM_API_URL', defaultUrl: 'http://forum-api' },
    { id: 'market-api', name: 'Market API', envVar: 'STATUS_MARKET_API_URL', defaultUrl: 'http://market-api' },
    { id: 'go-worker', name: 'Go worker', envVar: 'STATUS_GO_WORKER_URL', defaultUrl: 'http://go-worker' },
    // Starts only when deck updates are waiting in Kafka and stops again afterwards, so no answer usually means asleep.
    { id: 'analytics', name: 'Analytics worker', envVar: 'STATUS_ANALYTICS_URL', defaultUrl: 'http://analytics', idleWhenUnreachable: true },
];

const KNOWN = new Set(['Healthy', 'Degraded', 'Unhealthy']);
const known = (status, fallback) => (KNOWN.has(status) ? status : fallback);

// A sleeping service needs a few seconds to start, so the limit is generous.
export const TIMEOUT_MS = 15000;

// Slower than this before the service even started its checks means it was asleep and had to start up.
export const WOKE_UP_MS = 3000;

export async function checkService(service, { env = {}, fetchImpl = fetch, now = Date.now, timeoutMs = TIMEOUT_MS } = {}) {
    const base = (env[service.envVar] || service.defaultUrl).replace(/\/+$/, '');
    const started = now();

    try {
        const res = await fetchImpl(`${base}/health`, { signal: AbortSignal.timeout(timeoutMs), cache: 'no-store' });
        const responseMs = Math.round(now() - started);

        let body = null;
        try { body = await res.json(); } catch { /* not JSON: judge by the status code alone */ }

        // Only copy fields we know. Whatever else a service sends stays off the public page.
        const checks = Array.isArray(body?.checks)
            ? body.checks.map(c => ({
                name: String(c?.name ?? ''),
                status: known(c?.status, 'Unhealthy'),
                critical: Boolean(c?.critical),
                description: typeof c?.description === 'string' ? c.description : null,
            }))
            : [];

        // Time spent before the service started checking: near zero normally, a few seconds when it had to wake up.
        // (A slow dependency check is not a wake-up, so the service's own check time is taken off.)
        const checkMs = Number.isFinite(body?.durationMs) ? body.durationMs : 0;

        return {
            id: service.id,
            name: service.name,
            status: known(body?.status, res.ok ? 'Healthy' : 'Unhealthy'),
            responseMs,
            wokeUp: responseMs - checkMs >= WOKE_UP_MS,
            checks,
        };
    } catch {
        return {
            id: service.id,
            name: service.name,
            status: service.idleWhenUnreachable ? 'Idle' : 'Unreachable',
            responseMs: null,
            wokeUp: false,
            checks: [],
        };
    }
}

export function overallStatus(services) {
    const statuses = services.map(s => s.status);
    if (statuses.some(s => s === 'Unhealthy' || s === 'Unreachable')) return { level: 'outage', label: 'Some systems are down' };
    if (statuses.includes('Degraded')) return { level: 'degraded', label: 'Some systems are degraded' };
    return { level: 'operational', label: 'All systems operational' };
}

export async function checkAll(services = SERVICES, options = {}) {
    const results = await Promise.all(services.map(s => checkService(s, options)));
    return {
        checkedAt: new Date((options.now ?? Date.now)()).toISOString(),
        overall: overallStatus(results),
        services: results,
    };
}

// Keeps the last report for ttlMs. Visitors arriving at the same time share one check instead of each starting one.
export function createStatusCache({ ttlMs = 30000, now = Date.now } = {}) {
    let report = null;
    let at = 0;
    let inFlight = null;

    return {
        async get(run) {
            if (report && now() - at < ttlMs) return report;
            if (!inFlight) {
                inFlight = Promise.resolve()
                    .then(run)
                    .then(r => { report = r; at = now(); return r; })
                    .finally(() => { inFlight = null; });
            }
            return inFlight;
        },
    };
}
