'use client';

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, Badge, Button, ButtonGroup } from 'react-bootstrap';

import { usePriceHistory, lastDays } from '@/hooks/useMarketApi';
import { LoadingBlock, ErrorBlock } from '@/components/market/MarketStatus';
import { formatPrice, formatChange } from '@/components/market/marketFormat';
import styles from '@/components/market/market.module.css';

// The charting library is big. Loading it lazily keeps it out of the first download of this page.
const PriceChart = dynamic(() => import('./PriceChart'), {
    ssr: false,
    loading: () => <div className={styles.chartSkeleton} aria-hidden="true" />,
});

const RANGES = [
    { label: '7D', days: 7 },
    { label: '14D', days: 14 },
    { label: '30D', days: 30 },
];

const EMPTY = []; // a stable empty array, so useMemo below does not see a "new" array on every render while loading

function Stat({ label, value }) {
    return (
        <div>
            <div className={styles.priceLabel}>{label}</div>
            <div className="text-white fw-bold">{value}</div>
        </div>
    );
}

export default function MarketWatch({ productId }) {
    const [rangeDays, setRangeDays] = useState(30);
    const { data: history = EMPTY, isPending, isError, refetch } = usePriceHistory(productId);

    // Derived from the one cached 30-day download: changing the range slices it, no new request.
    const series = useMemo(() => lastDays(history, rangeDays), [history, rangeDays]);

    const stats = useMemo(() => {
        const prices = series.map((point) => point.marketPrice).filter((price) => Number.isFinite(price) && price > 0);
        if (prices.length === 0) return { low: null, high: null, change: null };
        const first = prices[0];
        const last = prices[prices.length - 1];
        return {
            low: Math.min(...prices),
            high: Math.max(...prices),
            change: first > 0 ? ((last - first) / first) * 100 : null,
        };
    }, [series]);

    if (isPending) return <LoadingBlock label="INITIALIZING MARKET TELEMETRY..." />;
    if (isError) return <ErrorBlock message="MARKET DATA UNAVAILABLE" onRetry={refetch} />;
    if (history.length === 0) return <div className="text-warning text-center py-5 fw-bold">NO MARKET DATA FOUND</div>;

    const latest = history[history.length - 1];
    const isStarlight = latest.rarity?.toLowerCase().includes('starlight');
    const changeClass = stats.change > 0 ? styles.up : stats.change < 0 ? styles.down : styles.flat;

    return (
        <Card className={`border-0 shadow-lg ${styles.glass}`}>
            <Card.Header className="bg-transparent border-bottom border-info border-opacity-25 py-4">
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                    <div>
                        <div className={styles.priceLabel}>Current Market Price</div>
                        <div className="d-flex align-items-baseline flex-wrap gap-3">
                            <h2 className="text-info fw-bold mb-0 display-6" style={{ textShadow: '0 0 15px rgba(0, 210, 255, 0.3)' }}>
                                {formatPrice(latest.marketPrice)}
                            </h2>
                            {stats.change !== null && (
                                <span className={`fw-bold ${changeClass}`} title={`Change over the last ${rangeDays} days`}>
                                    {formatChange(stats.change)} <span className="small">({rangeDays}d)</span>
                                </span>
                            )}
                        </div>
                        <div className="d-flex gap-2 align-items-center flex-wrap mt-2">
                            <Badge bg="dark" className="border border-secondary text-white-50">{latest.setName}</Badge>
                            <Badge bg={isStarlight ? 'warning' : 'dark'} className={`border ${isStarlight ? 'border-warning text-dark' : 'border-info text-info'}`}>
                                {latest.rarity}
                            </Badge>
                            <span className={`${styles.muted} small`}>ID: {productId}</span>
                        </div>
                    </div>

                    <ButtonGroup aria-label="Price history range">
                        {RANGES.map((range) => (
                            <Button
                                key={range.days}
                                size="sm"
                                variant={rangeDays === range.days ? 'info' : 'outline-info'}
                                className="fw-bold"
                                aria-pressed={rangeDays === range.days}
                                onClick={() => setRangeDays(range.days)}
                            >
                                {range.label}
                            </Button>
                        ))}
                    </ButtonGroup>
                </div>

                <div className="d-flex flex-wrap gap-4 mt-4">
                    <Stat label={`Low (${rangeDays}d)`} value={formatPrice(stats.low)} />
                    <Stat label={`High (${rangeDays}d)`} value={formatPrice(stats.high)} />
                    <Stat label="Listed median" value={formatPrice(latest.listedMedian)} />
                </div>
            </Card.Header>

            <Card.Body className="p-4">
                <PriceChart data={series} />
            </Card.Body>
        </Card>
    );
}
