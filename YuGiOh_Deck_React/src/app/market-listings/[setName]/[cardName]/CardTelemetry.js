'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { Container, Row, Col, Spinner } from 'react-bootstrap';

import MarketWatch from '@/app/marketwatch/MarketWatch';
import useCardTelemetryLogic from '@/hooks/useTelemetryLogic';
import GameStatsCard from '@/telemetry/GameStatsCard';
import CrossFormatStatsCard from '@/telemetry/CrossFormatStatsCard';
import ContainingDecksTable from '@/telemetry/ContainingDecksTable';

function TelemetryContent({ setName, cardName }) {
    const data = useCardTelemetryLogic(setName, cardName);

    if (data.loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" variant="info" />
                <div className="text-info mt-3">INITIALIZING TELEMETRY VIEWPORT... </div>
            </div>
        );
    }

    const formatStats = data.comprehensiveAnalytics?.formatStats || [];
    const containingDecks = data.comprehensiveAnalytics?.containingDecks || [];

    return (
        // 🚀 FIXED: Changed from fluid="xl" to just fluid. This forces 100% width on ultrawides.
        // Also bumped horizontal padding on larger screens (px-xxl-5) so it doesn't hug the bezel too tightly.
        <Container fluid className="px-4 px-xxl-5">
            <div className="mb-4">
                <Link href={`/market-listings/${encodeURIComponent(data.selectedSet)}`} className="btn btn-outline-secondary btn-sm mb-3">
                    &larr; Back to {data.selectedSet}
                </Link>
            </div>

            {/* 🚀 FIXED: Wrapped the components in a Row to enable the 2-column layout */}
            <Row className="g-4 align-items-stretch">
                
                {/* --- LEFT COLUMN: Core Stats & Pricing --- */}
                {/* 100% width on mobile/tablet, 50% width on Extra Large (ultrawide) screens */}
                <Col xs={12} xl={6} className="d-flex flex-column gap-4">
                    <GameStatsCard {...data} />

                    {data.tcgProductId ? (
                        <MarketWatch productId={data.tcgProductId} />
                    ) : (
                        <div className="text-center text-warning py-4 border border-warning border-opacity-25 rounded bg-black bg-opacity-50">
                            [ NO PRICING DATA FOUND FOR THIS PRODUCT ID ]
                        </div>
                    )}
                </Col>

                {/* --- RIGHT COLUMN: Meta Analytics & Deck Usage --- */}
                <Col xs={12} xl={6} className="d-flex flex-column gap-4">
                    <CrossFormatStatsCard formatStats={formatStats} />
                    <ContainingDecksTable containingDecks={containingDecks} />
                </Col>

            </Row>
        </Container>
    );
}

export default function CardTelemetry({ setName, cardName }) {
    return (
        <div style={{ backgroundColor: '#06080c', minHeight: '100vh', padding: '100px 0 60px', fontFamily: "'Cascadia Mono', monospace" }}>
            <Suspense fallback={
                <div className="text-center py-5">
                    <Spinner animation="border" variant="info" />
                    <div className="text-info mt-3">[ INITIALIZING VIEWPORT... ]</div>
                </div>
            }>
                <TelemetryContent setName={setName} cardName={cardName} />
            </Suspense>
        </div>
    );
}