import { checkService, checkAll, overallStatus, createStatusCache } from '@/lib/systemStatus';

const deck = { id: 'deck-api', name: 'Deck API', envVar: 'STATUS_DECK_API_URL', defaultUrl: 'http://api' };
const analytics = { id: 'analytics', name: 'Analytics worker', envVar: 'STATUS_ANALYTICS_URL', defaultUrl: 'http://analytics', idleWhenUnreachable: true };

const reply = (status, body) => async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => { if (body === undefined) throw new Error('not json'); return body; },
});

describe('checkService', () => {
    it('reads the service report and keeps only the known fields', async () => {
        const result = await checkService(deck, {
            fetchImpl: reply(200, {
                status: 'Degraded',
                checks: [{ name: 'redis', status: 'Degraded', critical: false, description: 'not reachable', secret: 'x' }],
                internal: 'should not leak',
            }),
        });

        expect(result.status).toBe('Degraded');
        expect(result.checks).toEqual([{ name: 'redis', status: 'Degraded', critical: false, description: 'not reachable' }]);
        expect(result).not.toHaveProperty('internal');
    });

    it('treats a 503 with a report as unhealthy', async () => {
        const result = await checkService(deck, { fetchImpl: reply(503, { status: 'Unhealthy', checks: [] }) });
        expect(result.status).toBe('Unhealthy');
    });

    it('falls back to the status code when the body is not JSON', async () => {
        expect((await checkService(deck, { fetchImpl: reply(200) })).status).toBe('Healthy');
        expect((await checkService(deck, { fetchImpl: reply(500) })).status).toBe('Unhealthy');
    });

    it('never passes through a status it does not know', async () => {
        const result = await checkService(deck, { fetchImpl: reply(200, { status: '<script>', checks: [{ status: 'weird' }] }) });
        expect(result.status).toBe('Healthy');
        expect(result.checks[0].status).toBe('Unhealthy');
    });

    it('reports an unreachable service, but an unreachable analytics worker as idle', async () => {
        const fail = async () => { throw new Error('ECONNREFUSED'); };
        expect((await checkService(deck, { fetchImpl: fail })).status).toBe('Unreachable');
        expect((await checkService(analytics, { fetchImpl: fail })).status).toBe('Idle');
    });

    it('calls it a wake-up only when the delay was not spent on the service checks', async () => {
        const slow = (durationMs) => {
            let t = 0;
            return {
                now: () => t,
                fetchImpl: async () => { t = 5000; return reply(200, { status: 'Healthy', durationMs, checks: [] })(); },
            };
        };
        expect((await checkService(deck, slow(10))).wokeUp).toBe(true);      // 5 s, almost none of it checking: woke up
        expect((await checkService(deck, slow(4500))).wokeUp).toBe(false);   // 5 s, 4.5 s of it a slow database check
    });

    it('uses the env override and trims a trailing slash', async () => {
        let called;
        await checkService(deck, {
            env: { STATUS_DECK_API_URL: 'http://localhost:5080/' },
            fetchImpl: async (url) => { called = url; return reply(200, { status: 'Healthy', checks: [] })(); },
        });
        expect(called).toBe('http://localhost:5080/health');
    });
});

describe('overallStatus', () => {
    const s = (...statuses) => statuses.map(status => ({ status }));

    it('is operational when everything is healthy or idle', () => {
        expect(overallStatus(s('Healthy', 'Idle')).level).toBe('operational');
    });

    it('is degraded when something is degraded', () => {
        expect(overallStatus(s('Healthy', 'Degraded')).level).toBe('degraded');
    });

    it('is an outage when something is down, even if others are degraded', () => {
        expect(overallStatus(s('Degraded', 'Unreachable')).level).toBe('outage');
        expect(overallStatus(s('Unhealthy')).level).toBe('outage');
    });
});

describe('checkAll', () => {
    it('checks every service and summarises', async () => {
        const report = await checkAll([deck, analytics], { fetchImpl: reply(200, { status: 'Healthy', checks: [] }), now: () => 0 });
        expect(report.services.map(r => r.id)).toEqual(['deck-api', 'analytics']);
        expect(report.overall.level).toBe('operational');
        expect(report.checkedAt).toBe('1970-01-01T00:00:00.000Z');
    });
});

describe('createStatusCache', () => {
    it('reuses the report until it is older than the ttl', async () => {
        let t = 0;
        let runs = 0;
        const cache = createStatusCache({ ttlMs: 30000, now: () => t });
        const run = async () => ++runs;

        expect(await cache.get(run)).toBe(1);
        t = 29999;
        expect(await cache.get(run)).toBe(1);
        t = 30000;
        expect(await cache.get(run)).toBe(2);
    });

    it('shares one check between callers arriving at the same time', async () => {
        let runs = 0;
        const cache = createStatusCache();
        const run = async () => { runs++; await new Promise(r => setTimeout(r, 10)); return runs; };

        const [a, b] = await Promise.all([cache.get(run), cache.get(run)]);
        expect(runs).toBe(1);
        expect(a).toBe(b);
    });
});
