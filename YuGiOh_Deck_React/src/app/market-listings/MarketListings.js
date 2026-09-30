'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Container, Button } from 'react-bootstrap';

import { useMarketSets } from '@/hooks/useMarketApi';
import MarketPage from '@/components/market/MarketPage';
import SetTile from '@/components/market/SetTile';
import { LoadingBlock, ErrorBlock } from '@/components/market/MarketStatus';
import { parsePageNumber } from '@/components/market/marketFormat';
import styles from '@/components/market/market.module.css';

const PAGE_SIZE = 30;

const pageHref = (pageNumber) => (pageNumber <= 1 ? '/market-listings' : `/market-listings?page=${pageNumber}`);

// "from" remembers which page of sets you came from, so the breadcrumb on the next page can bring you back to it.
const setHref = (setName, pageNumber) =>
    `/market-listings/${encodeURIComponent(setName)}${pageNumber > 1 ? `?from=${pageNumber}` : ''}`;

/** Defined OUTSIDE the page component. Inside it, React would see a brand-new component type on every render and remount it. */
function Pagination({ page, hasNext }) {
    return (
        <div className="d-flex gap-2 align-items-center">
            <Button as={Link} href={pageHref(page - 1)} variant="outline-info" disabled={page === 1}>
                &larr; Prev
            </Button>
            <span className="text-white-50 px-3 fw-bold">Page {page}</span>
            <Button as={Link} href={pageHref(page + 1)} variant="outline-info" disabled={!hasNext}>
                Next &rarr;
            </Button>
        </div>
    );
}

function SetsGallery() {
    // The page number lives in the URL (?page=3), so refresh, sharing and the Back button all keep your place.
    const page = parsePageNumber(useSearchParams().get('page'));
    const { data: sets = [], isPending, isError, isPlaceholderData, refetch } = useMarketSets(page, PAGE_SIZE);
    const hasNext = sets.length === PAGE_SIZE;

    return (
        <Container fluid className="px-4 px-xxl-5">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                <h1 className="h2 text-info fw-bold mb-0">MARKET LISTINGS: ALL SETS</h1>
                <Pagination page={page} hasNext={hasNext} />
            </div>

            {isPending && (
                <div className={`${styles.setGrid} placeholder-glow`} role="status" aria-label="Loading sets">
                    {Array.from({ length: PAGE_SIZE }, (_, index) => <div key={index} className={`${styles.skeletonTile} placeholder`} />)}
                </div>
            )}
            {isError && <ErrorBlock message="Could not load the set catalog." onRetry={refetch} />}

            {!isPending && !isError && (
                <>
                    <div className={styles.setGrid} aria-busy={isPlaceholderData} style={{ opacity: isPlaceholderData ? 0.5 : 1, transition: 'opacity 0.15s' }}>
                        {sets.map((set) => (
                            <SetTile key={set.setName} name={set.setName} imageUrl={set.imageUrl} href={setHref(set.setName, page)} />
                        ))}
                    </div>

                    <div className="d-flex justify-content-end mt-5 border-top border-secondary border-opacity-25 pt-4">
                        <Pagination page={page} hasNext={hasNext} />
                    </div>
                </>
            )}
        </Container>
    );
}

export default function MarketListings() {
    // useSearchParams needs a Suspense boundary in the App Router (same pattern CardTelemetry already uses).
    return (
        <MarketPage>
            <Suspense fallback={<LoadingBlock label="ACCESSING SET CATALOG..." />}>
                <SetsGallery />
            </Suspense>
        </MarketPage>
    );
}
