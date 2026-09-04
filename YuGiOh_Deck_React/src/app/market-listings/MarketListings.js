'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';

const MARKET_API = process.env.NEXT_PUBLIC_MARKET_API_URL;

export default function MarketListings() {
    const [sets, setSets] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const limit = 30;

    useEffect(() => {
        setLoading(true);
        fetch(`${MARKET_API}/api/market/sets?page=${page}&limit=${limit}`)
            .then(res => res.json())
            .then(data => {
                setSets(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load sets:", err);
                setLoading(false);
            });
    }, [page]);

    // Extracted pagination to reuse at the top and bottom of the gallery
    const PaginationControls = () => (
        <div className="d-flex gap-2">
            <Button 
                variant="outline-info" 
                disabled={page === 1} 
                onClick={() => setPage(p => Math.max(p - 1, 1))}
            >
                &larr; Prev
            </Button>
            <span className="text-white-50 align-self-center px-3 fw-bold">Page {page}</span>
            <Button 
                variant="outline-info" 
                onClick={() => setPage(p => p + 1)}
                disabled={sets.length < limit}
            >
                Next &rarr;
            </Button>
        </div>
    );

    return (
        <div style={{ backgroundColor: '#06080c', minHeight: '100vh', padding: '100px 20px 60px', fontFamily: "'Cascadia Mono', monospace" }}>
            <Container fluid="xl">
                {/* Top Header & Pagination */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                    <h2 className="text-info fw-bold mb-0">MARKET LISTINGS: ALL SETS</h2>
                    <PaginationControls />
                </div>

                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="info" />
                        <div className="text-info mt-3">ACCESSING SET CATALOG...</div>
                    </div>
                ) : (
                    <>
                        <Row className="g-4">
                            {sets.map((set, idx) => (
                                <Col xs={12} sm={6} md={6} lg={4} xl={3} key={idx}>
                                    <Card className="h-100 shadow-sm border-0" style={{ backgroundColor: '#0a0d14', border: '1px solid rgba(0, 210, 255, 0.2)' }}>
                                        {/* Change this wrapper block */}
                                        <div 
                                            className="position-relative w-100 d-flex align-items-center justify-content-center" 
                                            style={{ 
                                                minHeight: '280px', // Use minHeight instead of height for mobile safety
                                                height: '280px', 
                                                backgroundColor: '#11151d', 
                                                borderBottom: '1px solid rgba(0, 210, 255, 0.1)',
                                                flexShrink: 0      // Prevent Safari flexbox collapse
                                            }}
                                        >
                                            <Image 
                                                src={set.imageUrl} 
                                                alt={set.setName}
                                                fill
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                                style={{ objectFit: 'contain', padding: '10px', filter: 'drop-shadow(0px 10px 15px rgba(0, 0, 0, 0.6))' }}
                                                unoptimized
                                            />
                                        </div>

                                        <Card.Body className="d-flex flex-column p-4">
                                            {/* 🚀 FIXED: Removed text-truncate and allowed 2 lines with a min-height so the grid doesn't break */}
                                            <h6 
                                                className="text-white fw-bold mb-3" 
                                                style={{ 
                                                    display: '-webkit-box', 
                                                    WebkitLineClamp: 2, 
                                                    WebkitBoxOrient: 'vertical', 
                                                    overflow: 'hidden', 
                                                    minHeight: '38px',
                                                    lineHeight: '1.2'
                                                }}
                                            >
                                                {set.setName}
                                            </h6>
                                            <div className="mt-auto">
                                                <Button 
                                                    as={Link} 
                                                    href={`/market-listings/${encodeURIComponent(set.setName)}`}
                                                    variant="info" 
                                                    className="w-100 fw-bold rounded-1"
                                                >
                                                    View Cards
                                                </Button>
                                                {/* 🚀 FIXED: "View Live Price Guide" removed completely */}
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>

                        {/* Bottom Pagination */}
                        <div className="d-flex justify-content-end mt-5 border-top border-secondary border-opacity-25 pt-4">
                            <PaginationControls />
                        </div>
                    </>
                )}
            </Container>
        </div>
    );
}