'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Card, Container, Spinner } from 'react-bootstrap';
import { useMetaDeckProfile } from '@/hooks/useMetaDeckProfile';
import { useCardSize } from '@/hooks/useCardSize';
import { createCardFocusStore } from '@/lib/cardFocusStore';
import { importYdkDeck } from '@/store/deckSlice';
import { buildYdk } from '@/lib/ydk';
import MetaDeckHeader from '@/components/MetaDeckHeader';
import MetaDeckInspector from '@/components/MetaDeckInspector';
import MetaDeckGrid from '@/components/MetaDeckGrid';
import DeckPriceWidget from '@/components/DeckPriceWidget';
import CollectionGapPanel from '@/components/collection/CollectionGapPanel';
import '@/mdstyles.css';
import '@/components/metadecks.css';

const SIZES = [['sm', 'S'], ['md', 'M'], ['lg', 'L']];

const downloadTextFile = (filename, text) => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * The deck profile page. Layout: [summary | price] on top, then [decklists | sticky card inspector].
 * Hovering a card never re-renders this component: hover lives in `store` (see lib/cardFocusStore.js).
 */
export default function MetaDeckProfile() {
    const {
        deck, loading, error, refetch, cardsLoading,
        cardMap, cardCounts, mainCards, allCards,
    } = useMetaDeckProfile();

    // Created once for the lifetime of the page. useState(() => ...) runs the function only on the first render.
    const [store] = useState(() => createCardFocusStore());
    const [cardSize, setCardSize] = useCardSize('md');

    const router = useRouter();
    const dispatch = useDispatch();
    const builderCardCount = useSelector((state) =>
        (state.deck?.mainDeck?.length || 0) + (state.deck?.extraDeck?.length || 0) + (state.deck?.sideDeck?.length || 0));

    // When the card details arrive, show the first main-deck card in the inspector (unless the visitor already hovered one).
    useEffect(() => {
        const first = mainCards[0];
        if (first && !store.getState().hovered) store.hover(first);
    }, [mainCards, store]);

    // One entry per copy, for EVERY card id in the deck. (allCards skips cards whose details failed to load;
    // the collection is matched by id, so those still need to be counted.)
    const gapCards = useMemo(() => {
        if (!deck) return [];
        return [...deck.main, ...deck.extra, ...deck.side].map((id) => cardMap[String(id)] || { id: String(id), name: `Card #${id}` });
    }, [deck, cardMap]);

    const handleExportYDK = useCallback(() => {
        if (!deck) return;
        const text = buildYdk({ main: deck.main.map(String), extra: deck.extra.map(String), side: deck.side.map(String) });
        downloadTextFile(`${deck.archetype.toLowerCase().replace(/[^a-z0-9]/g, '_')}_meta.ydk`, text);
    }, [deck]);

    // Copy this deck into the deck builder's Redux store, then go there.
    const handleOpenInBuilder = useCallback(() => {
        if (!deck) return;
        const toCards = (ids) => ids.map((id, index) => ({
            ...(cardMap[String(id)] || { id, name: `Card #${id}` }),
            instanceId: `${id}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
        }));
        dispatch(importYdkDeck({
            main: toCards(deck.main),
            extra: toCards(deck.extra),
            side: toCards(deck.side),
            name: deck.archetype.toUpperCase(),
        }));
        router.push('/deckbuilder');
    }, [deck, cardMap, dispatch, router]);

    if (loading) {
        return (
            <div className="md-theme-bg min-vh-100 d-flex justify-content-center align-items-center mt-5">
                <Card className="border-info p-4 text-center md-panel shadow-lg" style={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', maxWidth: '30rem' }}>
                    <Card.Body>
                        <Spinner animation="border" variant="info" className="mb-3" style={{ width: '3rem', height: '3rem' }} />
                        <h1 className="h5 text-info terminal-font fw-bold m-0" style={{ letterSpacing: '2px' }}>LOADING DECK PROFILE...</h1>
                    </Card.Body>
                </Card>
            </div>
        );
    }

    if (error || !deck) {
        return (
            <div className="md-theme-bg min-vh-100 d-flex justify-content-center align-items-center mt-5">
                <Card className="border-danger p-4 text-center md-panel shadow-lg text-white" style={{ backgroundColor: 'rgba(20, 8, 8, 0.95)', maxWidth: '32rem' }}>
                    <Card.Body>
                        <h1 className="h4 text-danger terminal-font fw-bold mb-3">⚠️ PROFILE NOT FOUND</h1>
                        <p className="text-white-50">{error || 'Deck could not be retrieved.'}</p>
                        <div className="d-flex gap-2 justify-content-center">
                            <Button variant="outline-light" className="terminal-font fw-bold" onClick={() => refetch()}>TRY AGAIN</Button>
                            <Button as={Link} href="/meta-decks" variant="outline-danger" className="terminal-font fw-bold">RETURN TO ARCHIVE</Button>
                        </div>
                    </Card.Body>
                </Card>
            </div>
        );
    }

    return (
        <div className={`md-theme-bg min-vh-100 py-5 mt-5 mdp-page mdp-size-${cardSize}`}>
            <Container fluid className="px-3 px-md-4 px-xxl-5">
                <div className="mb-3">
                    <Button as={Link} href="/meta-decks" variant="outline-info" size="sm" className="terminal-font fw-bold">← BACK TO META ARCHIVE</Button>
                </div>

                <div className="mdp-top">
                    <MetaDeckHeader
                        deck={deck}
                        cardCounts={cardCounts}
                        onExportYDK={handleExportYDK}
                        onOpenInBuilder={handleOpenInBuilder}
                        canOpenInBuilder={!cardsLoading && mainCards.length > 0}
                        replacesDeck={builderCardCount > 0}
                    />
                    <DeckPriceWidget cards={allCards} loading={cardsLoading} />
                </div>

                <div className="mdp-main">
                    <div className="mdp-decks">
                        <CollectionGapPanel cards={gapCards} loading={cardsLoading} />

                        <div className="mdp-size" role="group" aria-label="Card size">
                            <span>Card size</span>
                            {SIZES.map(([value, label]) => (
                                <button key={value} type="button" aria-pressed={cardSize === value} onClick={() => setCardSize(value)}>{label}</button>
                            ))}
                        </div>

                        <MetaDeckGrid title="MAIN DECK" tone="info" deckIds={deck.main} cardMap={cardMap} store={store} groupByType />
                        <MetaDeckGrid title="EXTRA DECK" tone="warning" deckIds={deck.extra} cardMap={cardMap} store={store} />
                        <MetaDeckGrid title="SIDE DECK" tone="success" deckIds={deck.side} cardMap={cardMap} store={store} />
                    </div>

                    <MetaDeckInspector store={store} archetype={deck.archetype} fallbackId={deck.main[0]} />
                </div>
            </Container>
        </div>
    );
}