'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import "../../mdstyles.css"

const COLORS = {
  Healthy: '#28c76f',
  Degraded: '#ffcc00',
  Unhealthy: '#ff4d4d',
  Unreachable: '#ff4d4d',
  Idle: '#8a9ba8',
};

const LABELS = {
  Healthy: 'healthy',
  Degraded: 'degraded',
  Unhealthy: 'down',
  Unreachable: 'not responding',
  Idle: 'idle',
};

const OVERALL_COLORS = { operational: '#28c76f', degraded: '#ffcc00', outage: '#ff4d4d' };

const CHECK_NAMES = { mongodb: 'MongoDB', redis: 'Redis', kafka: 'Kafka', 'go-worker': 'Go worker' };

function secondsAgo(iso, now) {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  return s < 5 ? 'just now' : `${s}s ago`;
}

export default function StatusBoard() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  // Checks run only when the page is opened or Refresh is pressed. No timer: see src/lib/systemStatus.js.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/status', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setReport(await res.json());
    } catch {
      setError('Could not load the status report.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Only the "checked 12s ago" text ticks. It doesn't call anything.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.inner}>
        <header style={styles.header}>
          <div>
            <span style={styles.subtitle}>SYSTEM STATUS</span>
            <h1 style={styles.title}>
              {report
                ? <span style={{ color: OVERALL_COLORS[report.overall.level] }}>{report.overall.label}</span>
                : 'Checking services…'}
            </h1>
          </div>
          <div style={styles.headerRight}>
            {report && <span style={styles.muted}>checked {secondsAgo(report.checkedAt, now)}</span>}
            <button onClick={load} disabled={loading} style={styles.refreshBtn}>
              {loading ? <Spinner animation="border" size="sm" /> : 'Refresh'}
            </button>
          </div>
        </header>

        {error && <div style={styles.error}>{error}</div>}

        {!report && loading && (
          <div style={styles.muted}>Some services sleep when idle, so the first check can take a few seconds.</div>
        )}

        {report && (
          <div style={styles.list}>
            {report.services.map(service => (
              <div key={service.id} style={styles.row}>
                <div style={styles.rowTop}>
                  <span style={{ ...styles.dot, backgroundColor: COLORS[service.status] }} />
                  <span style={styles.serviceName}>{service.name}</span>
                  <span style={{ ...styles.statusText, color: COLORS[service.status] }}>{LABELS[service.status]}</span>
                  <span style={styles.ms}>
                    {service.responseMs != null && (
                      service.responseMs >= 1000 ? `${(service.responseMs / 1000).toFixed(1)} s` : `${service.responseMs} ms`
                    )}
                  </span>
                </div>

                {/* A service that was asleep takes a few seconds to answer. Say so, so a slow time doesn't look like a problem. */}
                {service.wokeUp && (
                  <div style={styles.note}>was asleep and woke up for this check</div>
                )}
                {service.status === 'Idle' && (
                  <div style={styles.note}>asleep until new deck updates arrive. This is normal.</div>
                )}

                {service.checks.length > 0 && (
                  <div style={styles.checks}>
                    {service.checks.map(check => (
                      <span key={check.name} style={styles.check} title={check.description ?? ''}>
                        <span style={{ color: COLORS[check.status] }}>{check.status === 'Healthy' ? '✓' : '✗'}</span>
                        {' '}{CHECK_NAMES[check.name] ?? check.name}
                        {check.status !== 'Healthy' && check.description && (
                          <span style={styles.checkDetail}> ({check.description})</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <p style={styles.footnote}>
          Each service reports on itself and the databases, cache and message queue it depends on.
          Checks run only when this page is opened, and results are reused for 30 seconds.
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { backgroundColor: '#0a0d14', color: '#ffffff', minHeight: '100vh', fontFamily: "'Cascadia Mono', monospace", padding: '100px 20px 40px 20px' },
  inner: { maxWidth: '900px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #1e2638', paddingBottom: '20px', marginBottom: '25px', flexWrap: 'wrap', gap: '20px' },
  subtitle: { color: '#00d2ff', fontSize: '12px', letterSpacing: '3px', fontWeight: 'bold' },
  title: { margin: '5px 0 0 0', fontSize: '28px', fontWeight: '800', letterSpacing: '1px' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '15px' },
  refreshBtn: { backgroundColor: '#121824', border: '1px solid #232d42', color: '#00d2ff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', minWidth: '90px' },
  muted: { color: '#8a9ba8', fontSize: '13px' },
  error: { backgroundColor: '#2a1215', border: '1px solid #ff4d4d', color: '#ff4d4d', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  row: { backgroundColor: '#121824', border: '1px solid #1e2638', borderRadius: '8px', padding: '14px 18px' },
  rowTop: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  dot: { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
  serviceName: { fontWeight: 'bold', flex: '1', minWidth: '140px' },
  statusText: { fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' },
  ms: { color: '#8a9ba8', fontSize: '13px', minWidth: '60px', textAlign: 'right' },
  note: { color: '#8a9ba8', fontSize: '12px', marginTop: '6px', marginLeft: '22px' },
  checks: { display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px', marginLeft: '22px', fontSize: '13px', color: '#c5d0db' },
  check: { whiteSpace: 'nowrap' },
  checkDetail: { color: '#8a9ba8' },
  footnote: { color: '#5c6b7a', fontSize: '12px', marginTop: '30px', lineHeight: 1.6 },
};
