import React, { useState } from 'react';
import Link from 'next/link';
import { Card, Table, Badge, Button } from 'react-bootstrap';

export default function ContainingDecksTable({ containingDecks }) {
    const [page, setPage] = useState(1);
    const limit = 10;
    const totalPages = Math.ceil(containingDecks.length / limit);

    // Slice the array to only show the current 10 records
    const paginatedDecks = containingDecks.slice((page - 1) * limit, page * limit);

    const PaginationControls = () => (
        <div className="d-flex gap-2 justify-content-end mt-3 border-top border-secondary border-opacity-25 pt-3">
            <Button
                variant="outline-info"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(p - 1, 1))}
            >
                &larr; Prev
            </Button>
            <span className="text-white-50 align-self-center px-2 small fw-bold">
                Page {page} of {totalPages || 1}
            </span>
            <Button
                variant="outline-info"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
            >
                Next &rarr;
            </Button>
        </div>
    );

    return (
        <Card className="border-0 shadow-lg h-100" style={{ backgroundColor: 'rgba(10, 13, 20, 0.65)', backdropFilter: 'blur(2px)', border: '1px solid rgba(0, 210, 255, 0.15)' }}>
            <Card.Header className="bg-transparent border-bottom border-info border-opacity-25 py-3 d-flex justify-content-between align-items-center">
                <h5 className="text-white fw-bold m-0">TOURNAMENT DECKS CONTAINING THIS CARD ({containingDecks.length})</h5>
            </Card.Header>
            <Card.Body className="p-4 d-flex flex-column">
                {containingDecks.length > 0 ? (
                    <>
                        <div className="table-responsive flex-grow-1">
                            <Table hover variant="dark" className="align-middle border-secondary mb-0" style={{ backgroundColor: 'rgba(10, 13, 20, 0.65)', backdropFilter: 'blur(2px)', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr className="text-info border-bottom border-secondary">
                                        <th>Format</th>
                                        <th>Archetype</th>
                                        <th>Tier</th>
                                        <th>Pilot</th>
                                        <th>Placement</th>
                                        <th className="text-center">Copies</th>
                                        <th className="text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedDecks.map((deck, idx) => (
                                        <tr key={idx} className="border-bottom border-secondary border-opacity-25">
                                            <td><Badge bg="secondary" className="text-uppercase">{deck.format}</Badge></td>
                                            <td className="fw-bold text-white">{deck.archetype}</td>
                                            <td><Badge bg="dark" className="border border-warning text-warning">{deck.tier}</Badge></td>
                                            <td className="text-white-50">{deck.pilot}</td>
                                            <td className="text-info">{deck.placement}</td>
                                            <td className="text-center fw-bold text-warning">{deck.copies}x</td>
                                            <td className="text-center">
                                                <Button 
                                                    as={Link} 
                                                    href={`/meta-decks/${deck.deckId}`} 
                                                    variant="outline-info" 
                                                    size="sm"
                                                    className="fw-bold terminal-font"
                                                    style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}
                                                >
                                                    VIEW DECK
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                        {totalPages > 1 && <PaginationControls />}
                    </>
                ) : (
                    <div className="text-center text-white-50 py-3">[ NO SPECIFIC TOURNAMENT DECKS FOUND CONTAINING THIS CARD ]</div>
                )}
            </Card.Body>
        </Card>
    );
}