'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container, Card, Spinner } from 'react-bootstrap';

const MARKET_API = process.env.NEXT_PUBLIC_MARKET_API_URL || "http://localhost:5165";

export default function SetCards({ setName }) {
    const decodedSetName = decodeURIComponent(setName);
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${MARKET_API}/api/market/sets/${encodeURIComponent(decodedSetName)}/cards`)
            .then(res => res.json())
            .then(data => {
                setCards(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load cards for set:", err);
                setCards([]);
                setLoading(false);
            });
    }, [decodedSetName]);

    return (
        <div style={{ backgroundColor: '#06080c', minHeight: '100vh', padding: '100px 0 60px', fontFamily: "'Cascadia Mono', monospace" }}>
            <Container fluid className="px-4 px-xl-5">
                <div className="mb-4 d-flex flex-column align-items-start">
                    <Link href="/market-listings" className="btn btn-outline-secondary btn-sm mb-3">
                        &larr; Back to All Sets
                    </Link>
                    <h2 className="text-info fw-bold mb-1">{decodedSetName.toUpperCase()}</h2>
                    <p className="text-white-50 small mb-0">Sorted High to Low by Market Price</p>
                </div>

                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="info" />
                        <div className="text-info mt-3">Fetching Set Data...</div>
                    </div>
                ) : (
                    <div 
                        style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', 
                            gap: '1.25rem',
                            alignItems: 'start',
                            maxWidth: '3400px',
                            margin: '0 auto'
                        }}
                    >
                        {cards.map((card, idx) => {
                            const productId = card.productId ?? card.ProductId;
                            const cardName = card.cardName ?? card.CardName ?? "Unknown Card";
                            const rarity = card.rarity ?? card.Rarity ?? "Common";
                            const marketPrice = card.marketPrice ?? card.MarketPrice ?? 0;

                            return (
                                <Card 
                                    key={productId ? `${productId}-${idx}` : idx}
                                    as={Link}
                                    href={`/market-listings/${encodeURIComponent(decodedSetName)}/${encodeURIComponent(cardName)}?id=${productId}`}
                                    // 🚀 FIXED: Removed 'shadow-sm' to kill the grey Bootstrap outline
                                    className="border-0 text-decoration-none" 
                                    style={{ 
                                        // 🚀 FIXED: Dropped opacity to 15% and increased blur to 12px for pure glassmorphism
                                        backgroundColor: 'rgba(10, 13, 20, 0.15)', 
                                        WebkitBackdropFilter: 'blur(12px)',
                                        // 🚀 FIXED: Barely-there resting border
                                        border: '1px solid rgba(0, 210, 255, 0.08)',
                                        transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.borderColor = 'rgba(0, 210, 255, 0.5)';
                                        // 🚀 FIXED: Pure black, deep drop shadow on hover instead of murky grey
                                        e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.8)';
                                        e.currentTarget.style.backgroundColor = 'rgba(10, 13, 20, 0.35)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.borderColor = 'rgba(0, 210, 255, 0.08)';
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.backgroundColor = 'rgba(10, 13, 20, 0.15)';
                                    }}
                                >
                                    <Card.Body className="p-3 d-flex gap-3 align-items-stretch">
                                        
                                        <div style={{ width: '135px', height: '197px', position: 'relative', flexShrink: 0 }}>
                                            {productId ? (
                                                <Image 
                                                    src={`https://tcgplayer-cdn.tcgplayer.com/product/${productId}_200w.jpg`}
                                                    alt={cardName}
                                                    fill
                                                    sizes="135px"
                                                    style={{ objectFit: 'contain' }}
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className="w-100 h-100 bg-secondary opacity-25 rounded" />
                                            )}
                                        </div>

                                        <div className="d-flex flex-column justify-content-between w-100">
                                            <div>
                                                <h6 
                                                    className="text-white fw-bold mb-1" 
                                                    title={cardName}
                                                    style={{ 
                                                        fontSize: '16px', 
                                                        lineHeight: '1.3', 
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 3,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden'
                                                    }}
                                                >
                                                    {cardName}
                                                </h6>
                                                
                                                <div className="text-white-50 mt-1" style={{ fontSize: '13px', lineHeight: '1.2' }}>
                                                    {decodedSetName}
                                                </div>
                                                <div className="text-info fw-bold mt-1" style={{ fontSize: '13px' }}>
                                                    {rarity}
                                                </div>
                                                <div className="text-secondary" style={{ fontSize: '12px' }}>
                                                    #{productId ?? "N/A"}
                                                </div>
                                            </div>
                                            
                                            <div className="mt-auto pt-3 border-top border-secondary border-opacity-25">
                                                <div className="text-white-50" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Market Price</div>
                                                <div className="text-info fw-bold fs-4 leading-none" style={{ marginTop: '-2px' }}>
                                                    ${marketPrice.toFixed(2)}
                                                </div>
                                            </div>
                                        </div>

                                    </Card.Body>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </Container>
        </div>
    );
}