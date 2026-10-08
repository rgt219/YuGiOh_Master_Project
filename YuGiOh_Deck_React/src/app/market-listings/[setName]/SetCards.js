'use client';

import React, { Suspense, useDeferredValue, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Container, Button, Form } from 'react-bootstrap';

import { useSetCards, prefetchPriceHistory } from '@/hooks/useMarketApi';
import MarketPage from '@/components/market/MarketPage';
import Breadcrumbs from '@/components/market/Breadcrumbs';
import TcgImage from '@/components/market/TcgImage';
import { LoadingBlock, ErrorBlock } from '@/components/market/MarketStatus';
import { formatPrice, rarityTone, isSealedProduct, safeDecode, parsePageNumber, TCG_IMAGE } from '@/components/market/marketFormat';
import styles from '@/components/market/market.module.css';

const PAGE_STEP = 60; // how many tiles to draw at first, and per "Show more"

const DEFAULT_VIEW = { search: '', rarity: 'ALL', sort: 'priceDesc', hideSealed: false, visibleCount: PAGE_STEP };

const SORT_LABELS = {
    priceDesc: 'Sorted High to Low by Market Price',
    priceAsc: 'Sorted Low to High by Market Price',
    name: 'Sorted A to Z by Name',
};

// Cards with no price always go to the bottom, whichever way you sort.
const byPriceDesc = (a, b) => (b.marketPrice ?? -1) - (a.marketPrice ?? -1);
const comparePriceAsc = (a, b) => {
    if (a.marketPrice === null && b.marketPrice === null) return 0;
    if (a.marketPrice === null) return 1;
    if (b.marketPrice === null) return -1;
    return a.marketPrice - b.marketPrice;
};

const COMPARATORS = {
    priceDesc: byPriceDesc,
    priceAsc: comparePriceAsc,
    name: (a, b) => a.cardName.localeCompare(b.cardName),
};

function SetCardsContent({ setName }) {
    const from = parsePageNumber(useSearchParams().get('from'));
    const queryClient = useQueryClient();
    const { data: cards = [], isPending, isError, refetch } = useSetCards(setName);

    // One state object for everything the toolbar controls, like Card Search's `filters`.
    const [view, setView] = useState(DEFAULT_VIEW);
    // Any change to a filter sends you back to the first 60 tiles, unless the change itself sets visibleCount.
    const updateView = (patch) => setView((previous) => ({ ...previous, visibleCount: PAGE_STEP, ...patch }));
    const deferredSearch = useDeferredValue(view.search);

    // Derived data: computed from `cards` + `view`, never stored in state.
    const rarityOptions = useMemo(() => {
        const counts = new Map();
        cards.forEach((card) => counts.set(card.rarity, (counts.get(card.rarity) || 0) + 1));
        return [...counts.entries()].sort((a, b) => b[1] - a[1]);
    }, [cards]);

    const filteredCards = useMemo(() => {
        const needle = deferredSearch.trim().toLowerCase();
        return cards.filter((card) => {
            if (view.rarity !== 'ALL' && card.rarity !== view.rarity) return false;
            if (view.hideSealed && isSealedProduct(card.cardName)) return false;
            return !needle || card.cardName.toLowerCase().includes(needle);
        });
    }, [cards, deferredSearch, view.rarity, view.hideSealed]);

    const sortedCards = useMemo(() => [...filteredCards].sort(COMPARATORS[view.sort]), [filteredCards, view.sort]);
    const visibleCards = useMemo(() => sortedCards.slice(0, view.visibleCount), [sortedCards, view.visibleCount]);

    return (
        <Container fluid className="px-4 px-xxl-5">
            <Breadcrumbs
                items={[
                    { label: 'Market Listings', href: from > 1 ? `/market-listings?page=${from}` : '/market-listings' },
                    { label: setName },
                ]}
            />
            <h1 className="h2 text-info fw-bold mb-1">{setName.toUpperCase()}</h1>
            <p className="text-white-50 small mb-4">{SORT_LABELS[view.sort]}</p>

            {isPending && <LoadingBlock label="Fetching Set Data..." />}
            {isError && <ErrorBlock message="Could not load the cards for this set." onRetry={refetch} />}

            {!isPending && !isError && (
                <>
                    <div className={styles.toolbar}>
                        <Form.Control
                            type="search"
                            aria-label="Search cards in this set"
                            placeholder="Search cards..."
                            value={view.search}
                            onChange={(event) => updateView({ search: event.target.value })}
                            className={`bg-dark text-white border-secondary ${styles.toolbarSearch}`}
                        />
                        <Form.Select
                            aria-label="Filter by rarity"
                            value={view.rarity}
                            onChange={(event) => updateView({ rarity: event.target.value })}
                            className="bg-dark text-white border-secondary w-auto"
                        >
                            <option value="ALL">All rarities ({cards.length})</option>
                            {rarityOptions.map(([rarity, count]) => (
                                <option key={rarity} value={rarity}>{rarity} ({count})</option>
                            ))}
                        </Form.Select>
                        <Form.Select
                            aria-label="Sort cards"
                            value={view.sort}
                            onChange={(event) => updateView({ sort: event.target.value })}
                            className="bg-dark text-white border-secondary w-auto"
                        >
                            <option value="priceDesc">Price: high to low</option>
                            <option value="priceAsc">Price: low to high</option>
                            <option value="name">Name: A to Z</option>
                        </Form.Select>
                        <Form.Check
                            type="switch"
                            id="hide-sealed"
                            label="Hide sealed boxes/packs"
                            className="text-white-50"
                            checked={view.hideSealed}
                            onChange={(event) => updateView({ hideSealed: event.target.checked })}
                        />
                        <span className="text-white-50 small ms-auto" aria-live="polite">
                            {sortedCards.length} of {cards.length} cards
                        </span>
                    </div>

                    {sortedCards.length === 0 ? (
                        <div className="text-center text-white-50 py-5">
                            <div className="mb-3">No cards match these filters.</div>
                            <Button variant="outline-info" size="sm" onClick={() => setView(DEFAULT_VIEW)}>
                                Reset filters
                            </Button>
                        </div>
                    ) : (
                        <div className={styles.cardGrid}>
                            {visibleCards.map((card, index) => {
                                const query = new URLSearchParams();
                                if (card.productId) query.set('id', card.productId);
                                if (card.rarity) query.set('rarity', card.rarity);
                                const queryString = query.toString();
                                const href = `/market-listings/${encodeURIComponent(setName)}/${encodeURIComponent(card.cardName)}${queryString ? `?${queryString}` : ''}`;
                                // Warm the price-history cache while the pointer is still over the tile: the next page then opens with its chart data ready.
                                const warmUp = () => prefetchPriceHistory(queryClient, card.productId);
                                return (
                                    <Link
                                        key={card.productId ?? `${card.cardName}-${card.rarity}-${index}`}
                                        href={href}
                                        className={styles.tile}
                                        onPointerEnter={warmUp}
                                        onFocus={warmUp}
                                    >
                                        <div className={styles.cardArt}>
                                            <TcgImage
                                                sources={card.productId ? [TCG_IMAGE(card.productId)] : []}
                                                alt={card.cardName}
                                                sizes="200px"
                                            />
                                        </div>
                                        <div className={styles.tileBody}>
                                            <h2 className={styles.tileTitle} title={card.cardName}>{card.cardName}</h2>
                                            <span className={`${styles.chip} ${styles[`tone_${rarityTone(card.rarity)}`]}`}>{card.rarity}</span>
                                            <span className={styles.productId}>#{card.productId ?? 'N/A'}</span>
                                            <div className="mt-auto pt-2 border-top border-secondary border-opacity-25">
                                                <div className={styles.priceLabel}>Market Price</div>
                                                <div className={styles.price}>{formatPrice(card.marketPrice)}</div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    {visibleCards.length < sortedCards.length && (
                        <div className="text-center mt-4">
                            <Button variant="outline-info" onClick={() => setView((previous) => ({ ...previous, visibleCount: previous.visibleCount + PAGE_STEP }))}>
                                Show {Math.min(PAGE_STEP, sortedCards.length - visibleCards.length)} more
                                <span className="text-white-50"> ({visibleCards.length} of {sortedCards.length} shown)</span>
                            </Button>
                        </div>
                    )}
                </>
            )}
        </Container>
    );
}

export default function SetCards({ setName }) {
    const decodedSetName = safeDecode(setName);
    return (
        <MarketPage>
            <Suspense fallback={<LoadingBlock label="Fetching Set Data..." />}>
                {/* key = set name: opening a different set starts with fresh filters instead of inheriting the old ones */}
                <SetCardsContent key={decodedSetName} setName={decodedSetName} />
            </Suspense>
        </MarketPage>
    );
}
