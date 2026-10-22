import { checkAll, createStatusCache } from '@/lib/systemStatus';

// Runs on the site's server for every request (never prerendered at build time), and reuses its answer for 30 seconds.
export const dynamic = 'force-dynamic';

const cache = createStatusCache({ ttlMs: 30000 });

export async function GET() {
    const report = await cache.get(() => checkAll(undefined, { env: process.env }));
    return Response.json(report, { headers: { 'Cache-Control': 'no-store' } });
}
