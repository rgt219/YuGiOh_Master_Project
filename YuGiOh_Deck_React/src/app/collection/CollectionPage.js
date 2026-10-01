'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Form, Row, Col, Spinner } from 'react-bootstrap';
import { useCollection } from '@/hooks/useCollection';
import { useCardDetails } from '@/hooks/useCardDetails';
import { summarizeCollection } from '@/lib/collectionStats';
import CollectionStepper from '@/components/collection/CollectionStepper';
import CollectionBinder from '@/components/collection/CollectionBinder';
import '@/mdstyles.css';

const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

const SORTS = {
    name: 'NAME A-Z',
    quantity: 'COPIES HIGH-LOW',
    value: 'VALUE HIGH-LOW',
};

export default function CollectionPage() {
    const { owned, status, error } = useCollection();
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [view, setView] = useState('binder'); // 'binder' | 'grid'

    // A card you take down to 0 stays on the page (dimmed) until you leave, so a misclick can be undone with "+".
    const [seen, setSeen] = useState([]);
    useEffect(() => {
        setSeen((previous) => {
            const added = Object.keys(owned).filter((id) => !previous.includes(id));
            return added.length ? [...previous, ...added] : previous;
        });
    }, [owned]);

    const { cardsById, isLoading, hasError } = useCardDetails(seen);
    const stats = useMemo(() => summarizeCollection(owned, cardsById), [owned, cardsById]);

    const rows = useMemo(() => {
        const term = search.trim().toLowerCase();
        const list = seen.map((id) => ({ id, quantity: owned[id] || 0, card: cardsById[id] }))
            .filter((row) => !term || (row.card?.name || '').toLowerCase().includes(term) || row.id.includes(term));

        const nameOf = (row) => row.card?.name || `Card #${row.id}`;
        const valueOf = (row) => row.quantity * (row.card?.price || 0);
        const sorters = {
            name: (a, b) => collator.compare(nameOf(a), nameOf(b)),
            quantity: (a, b) => b.quantity - a.quantity || collator.compare(nameOf(a), nameOf(b)),
            value: (a, b) => valueOf(b) - valueOf(a) || collator.compare(nameOf(a), nameOf(b)),
        };
        return list.sort(sorters[sortBy]);
    }, [seen, owned, cardsById, search, sortBy]);

    const waiting = status === 'idle' || status === 'loading';

    return (
        <div className="md-theme-bg min-vh-100 page-under-nav pb-4">
            <div className="container-fluid px-3 px-md-4" style={{ maxWidth: '1400px' }}>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-3">
                    <div>
                        <h1 className="fw-bold text-info terminal-font m-0 fs-4">MY COLLECTION</h1>
                        <span className="text-white-50 small terminal-font">
                            {stats.uniqueCards.toLocaleString()} DIFFERENT CARDS • {stats.totalCopies.toLocaleString()} COPIES • ABOUT ${stats.value.toFixed(2)} (TCGPLAYER)
                        </span>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                        <div className="btn-group" role="group" aria-label="Collection view">
                            <button type="button" className={`btn btn-sm terminal-font fw-bold ${view === 'binder' ? 'btn-info' : 'btn-outline-info'}`} aria-pressed={view === 'binder'} onClick={() => setView('binder')}>BINDER</button>
                            <button type="button" className={`btn btn-sm terminal-font fw-bold ${view === 'grid' ? 'btn-info' : 'btn-outline-info'}`} aria-pressed={view === 'grid'} onClick={() => setView('grid')}>GRID</button>
                        </div>
                        <Link href="/cardsearch" className="btn btn-outline-info btn-sm terminal-font fw-bold">+ ADD CARDS FROM CARD SEARCH</Link>
                    </div>
                </div>

                {error && <div className="alert alert-danger py-2 terminal-font small" role="alert">{error}</div>}

                {view === 'binder' ? (
                    waiting ? (
                        <div className="text-center p-5"><Spinner animation="border" variant="info" /></div>
                    ) : (
                        <CollectionBinder cardsById={cardsById} />
                    )
                ) : (
                    <>
                    <Row className="g-2 mb-3">
                        <Col md={8}>
                            <Form.Control
                                type="search"
                                placeholder="Search your collection by name or id"
                                aria-label="Search your collection"
                                className="bg-black text-info border-secondary terminal-font"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                            />
                        </Col>
                        <Col md={4}>
                            <Form.Select
                                aria-label="Sort your collection"
                                className="bg-black text-info border-secondary terminal-font"
                                value={sortBy}
                                onChange={(event) => setSortBy(event.target.value)}
                            >
                                {Object.entries(SORTS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                            </Form.Select>
                        </Col>
                    </Row>

                    {waiting || isLoading ? (
                        <div className="text-center p-5"><Spinner animation="border" variant="info" /></div>
                    ) : status === 'error' ? (
                        <p className="text-white-50 terminal-font p-4 text-center">COULD NOT LOAD YOUR COLLECTION. REFRESH TO TRY AGAIN.</p>
                    ) : seen.length === 0 ? (
                        <div className="text-center p-5">
                            <h2 className="text-white-50 terminal-font fs-5">YOUR COLLECTION IS EMPTY</h2>
                            <p className="text-white-50 small">Open Card Search and use the + button under any card to add the copies you own.</p>
                        </div>
                    ) : rows.length === 0 ? (
                        <p className="text-white-50 terminal-font p-4 text-center">NO CARDS MATCH YOUR SEARCH.</p>
                    ) : (
                        <Row className="g-2 g-md-3 row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-6" as="ul" style={{ listStyle: 'none', paddingLeft: 0 }}>
                            {rows.map(({ id, quantity, card }) => (
                                <Col as="li" key={id} style={{ opacity: quantity === 0 ? 0.45 : 1 }}>
                                    <div className="p-2 text-center">
                                        <div className="position-relative overflow-hidden rounded mb-2 w-100" style={{ aspectRatio: '59/86' }}>
                                            {card ? (
                                                <img
                                                    src={card.image}
                                                    alt=""
                                                    width="421"
                                                    height="614"
                                                    className="w-100 h-100 rounded"
                                                    style={{ objectFit: 'cover' }}
                                                    loading="lazy"
                                                    decoding="async"
                                                    onError={(event) => {
                                                        event.currentTarget.onerror = null;
                                                        event.currentTarget.src = card.fallbackImage || 'https://images.ygoprodeck.com/images/cards/back_high.jpg';
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-100 h-100 d-flex align-items-center justify-content-center text-white-50 small terminal-font border border-secondary rounded">
                                                    UNKNOWN CARD
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-white fw-bold small d-block" title={card?.name}>{card?.name || `Card #${id}`}</span>
                                        {card?.price != null && (
                                            <span className="text-info-50 small terminal-font d-block" style={{ fontSize: '0.65rem' }}>${card.price.toFixed(2)} EACH</span>
                                        )}
                                        <CollectionStepper cardId={id} cardName={card?.name} />
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    )}
                    </>
                )}
                {hasError && <p className="text-warning small terminal-font text-center mt-3">Some card details could not be loaded.</p>}
            </div>
        </div>
    );
}