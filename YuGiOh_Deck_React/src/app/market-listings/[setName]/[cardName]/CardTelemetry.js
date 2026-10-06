'use client';

import React, { Suspense, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { Container, Row, Col } from 'react-bootstrap';

import MarketWatch from '@/app/marketwatch/MarketWatch';
import useCardTelemetryLogic from '@/hooks/useTelemetryLogic';
import GameStatsCard from '@/telemetry/GameStatsCard';
import CrossFormatStatsCard from '@/telemetry/CrossFormatStatsCard';
import ContainingDecksTable from '@/telemetry/ContainingDecksTable';
import MarketPage from '@/components/market/MarketPage';
import TrackPriceButton from '@/components/market/TrackPriceButton';
import Breadcrumbs from '@/components/market/Breadcrumbs';
import { LoadingBlock } from '@/components/market/MarketStatus';

// The 3D preview (and its big image) is only downloaded the first time someone opens it.
const HoloPreviewModal = dynamic(() => import('@/app/marketwatch/HoloPreviewModal'), { ssr: false });

function TelemetryContent({ setName, cardName }) {
    const data = useCardTelemetryLogic(setName, cardName);

    // `loaded` = the modal has been opened at least once (keeps it mounted so it can animate closed); `open` = visible now.
    // Hooks must run on every render, so this sits ABOVE the early return below.
    const [holo, setHolo] = useState({ loaded: false, open: false });
    const openHolo = useCallback(() => setHolo({ loaded: true, open: true }), []);
    const closeHolo = useCallback(() => setHolo((previous) => ({ ...previous, open: false })), []);

    if (data.loading) {
        return <LoadingBlock label="INITIALIZING TELEMETRY VIEWPORT..." />;
    }

    const formatStats = data.comprehensiveAnalytics?.formatStats || [];
    const containingDecks = data.comprehensiveAnalytics?.containingDecks || [];
    const displayName = data.cardDetails?.name || data.decodedCardName;

    return (
        <Container fluid className="px-4 px-xxl-5">
            <Breadcrumbs
                items={[
                    { label: 'Market Listings', href: '/market-listings' },
                    { label: data.selectedSet, href: `/market-listings/${encodeURIComponent(data.selectedSet)}` },
                    { label: displayName },
                ]}
            />

            <Row className="g-4 align-items-stretch">
                {/* LEFT: the card itself, then its price. Full width on phones and tablets, half width from "xl" up. */}
                <Col xs={12} xl={6} className="d-flex flex-column gap-4">
                    <GameStatsCard
                        resolvedKonamiId={data.resolvedKonamiId}
                        decodedCardName={data.decodedCardName}
                        cardDetails={data.cardDetails}
                        selectedRarity={data.selectedRarity}
                        selectedSet={data.selectedSet}
                        printingsMap={data.printingsMap}
                        handleSetChange={data.handleSetChange}
                        handleRarityClick={data.handleRarityClick}
                        tcgProductId={data.tcgProductId}
                        onOpenHolo={openHolo}
                    />

                    {data.tcgProductId ? (
                        <>
                            <div className="d-flex justify-content-end">
                                <TrackPriceButton
                                    productId={data.tcgProductId}
                                    cardName={displayName}
                                    setName={data.selectedSet}
                                    rarity={data.selectedRarity}
                                />
                            </div>
                            <MarketWatch productId={data.tcgProductId} />
                        </>
                    ) : (
                        <div className="text-center text-warning py-4 border border-warning border-opacity-25 rounded bg-black bg-opacity-50">
                            NO PRICING DATA FOUND FOR THIS PRODUCT ID
                        </div>
                    )}
                </Col>

                {/* RIGHT: how often the card shows up in tournament decks */}
                <Col xs={12} xl={6} className="d-flex flex-column gap-4">
                    <CrossFormatStatsCard formatStats={formatStats} />
                    <ContainingDecksTable containingDecks={containingDecks} />
                </Col>
            </Row>

            {holo.loaded && data.tcgProductId && (
                <HoloPreviewModal show={holo.open} onHide={closeHolo} productId={data.tcgProductId} fallbackName={displayName} />
            )}
        </Container>
    );
}

export default function CardTelemetry({ setName, cardName }) {
    return (
        <MarketPage>
            <Suspense fallback={<LoadingBlock label="INITIALIZING VIEWPORT..." />}>
                <TelemetryContent setName={setName} cardName={cardName} />
            </Suspense>
        </MarketPage>
    );
}