'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, Table, Badge, Button } from 'react-bootstrap';
import styles from '@/components/market/market.module.css';

const PAGE_SIZE = 10;

/** Defined outside the table component so React does not remount it on every render. */
function Pagination({ page, totalPages, onPageChange }) {
    return (
        <div className="d-flex gap-2 justify-content-end mt-3 border-top border-secondary border-opacity-25 pt-3">
            <Button variant="outline-info" size="sm" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
                &larr; Prev
            </Button>
            <span className="text-white-50 align-self-center px-2 small fw-bold">
                Page {page} of {totalPages}
            </span>
            <Button variant="outline-info" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
                Next &rarr;
            </Button>
        </div>
    );
}

export default function ContainingDecksTable({ containingDecks = [] }) {
    const [view, setView] = useState({ format: 'ALL', page: 1 });

    // Which formats appear in the data, with how many decks each: these become the filter buttons.
    const formats = useMemo(() => {
        const counts = new Map();
        containingDecks.forEach((deck) => counts.set(deck.format, (counts.get(deck.format) || 0) + 1));
        return [...counts.entries()];
    }, [containingDecks]);

    // If the data changed and the chosen format is gone, fall back to ALL instead of showing an empty table.
    const activeFormat = formats.some(([format]) => format === view.format) ? view.format : 'ALL';

    const filteredDecks = useMemo(
        () => (activeFormat === 'ALL' ? containingDecks : containingDecks.filter((deck) => deck.format === activeFormat)),
        [containingDecks, activeFormat]
    );

    const totalPages = Math.max(1, Math.ceil(filteredDecks.length / PAGE_SIZE));
    const page = Math.min(view.page, totalPages); // clamp: never "page 7 of 2"
    const pageRows = useMemo(() => filteredDecks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filteredDecks, page]);

    return (
        <Card className={`border-0 shadow-lg h-100 ${styles.glass}`}>
            <Card.Header className="bg-transparent border-bottom border-info border-opacity-25 py-3">
                <h2 className="h5 text-white fw-bold m-0">TOURNAMENT DECKS CONTAINING THIS CARD ({containingDecks.length})</h2>
            </Card.Header>
            <Card.Body className="p-4 d-flex flex-column">
                {containingDecks.length > 0 ? (
                    <>
                        {formats.length > 1 && (
                            <div className="d-flex flex-wrap gap-2 mb-3">
                                {[['ALL', containingDecks.length], ...formats].map(([format, count]) => (
                                    <Button
                                        key={format}
                                        size="sm"
                                        variant={activeFormat === format ? 'info' : 'outline-secondary'}
                                        className={activeFormat === format ? 'text-dark fw-bold' : 'text-white-50'}
                                        aria-pressed={activeFormat === format}
                                        onClick={() => setView({ format, page: 1 })}
                                    >
                                        {String(format).toUpperCase()} ({count})
                                    </Button>
                                ))}
                            </div>
                        )}

                        <div className="table-responsive flex-grow-1">
                            <Table hover variant="dark" className={`align-middle border-secondary mb-0 ${styles.deckTable}`} style={{ fontSize: '0.9rem' }}>
                                <thead>
                                    <tr className="text-info border-bottom border-secondary">
                                        <th scope="col">Format</th>
                                        <th scope="col">Archetype</th>
                                        <th scope="col">Pilot</th>
                                        <th scope="col">Placement</th>
                                        <th scope="col" className="text-center">Copies</th>
                                        <th scope="col" className="text-center">Deck</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageRows.map((deck, index) => (
                                        <tr key={deck.deckId ?? `${deck.format}-${deck.archetype}-${deck.pilot}-${index}`} className="border-bottom border-secondary border-opacity-25">
                                            <td><Badge bg="secondary" className="text-uppercase">{deck.format}</Badge></td>
                                            <td>
                                                <span className="fw-bold text-white">{deck.archetype}</span>
                                                {deck.tier && <Badge bg="dark" className="border border-warning text-warning ms-2">{deck.tier}</Badge>}
                                            </td>
                                            <td className="text-white-50">{deck.pilot}</td>
                                            <td className="text-info">{deck.placement}</td>
                                            <td className="text-center fw-bold text-warning">{deck.copies}x</td>
                                            <td className="text-center">
                                                {deck.deckId != null ? (
                                                    <Button as={Link} href={`/meta-decks/${deck.deckId}`} variant="outline-info" size="sm" className="fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                                                        VIEW DECK
                                                    </Button>
                                                ) : (
                                                    <span className={styles.muted}>-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                        {totalPages > 1 && (
                            <Pagination page={page} totalPages={totalPages} onPageChange={(next) => setView({ format: activeFormat, page: next })} />
                        )}
                    </>
                ) : (
                    <div className="text-center text-white-50 py-3">NO SPECIFIC TOURNAMENT DECKS FOUND CONTAINING THIS CARD</div>
                )}
            </Card.Body>
        </Card>
    );
}
