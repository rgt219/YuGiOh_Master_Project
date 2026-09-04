'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, Row, Col, Badge, Modal, Button } from 'react-bootstrap';
import Image from 'next/image';

export default function MarketWatch({ productId }) {
    const [marketData, setMarketData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPreview, setShowPreview] = useState(false);

    // 3D Tilt & Holographic tracking state
    const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glintX: 50, glintY: 50, active: false });
    const cardRef = useRef(null);

    const MARKET_API = process.env.NEXT_PUBLIC_MARKET_API_URL;

    useEffect(() => {
        if (!productId) return;

        fetch(`${MARKET_API}/api/market/${productId}/history?days=30`)
            .then(res => res.json())
            .then(data => {
                const formattedData = data.map(item => ({
                    ...item,
                    displayDate: new Date(item.timestamp).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
                }));
                setMarketData(formattedData);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load market telemetry:", err);
                setLoading(false);
            });
    }, [productId, MARKET_API]);

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Scaled down the rotation slightly for the larger card size so it doesn't break perspective
        const rotateX = ((y / rect.height) - 0.5) * -25;
        const rotateY = ((x / rect.width) - 0.5) * 25;
        const glintX = (x / rect.width) * 100;
        const glintY = (y / rect.height) * 100;

        setTilt({ rotateX, rotateY, glintX, glintY, active: true });
    };

    const handleMouseLeave = () => {
        setTilt({ rotateX: 0, rotateY: 0, glintX: 50, glintY: 50, active: false });
    };

    if (loading) {
        return <div className="text-info text-center py-5 fw-bold" style={{ fontFamily: "'Cascadia Mono', monospace" }}>INITIALIZING MARKET TELEMETRY...</div>;
    }

    if (!marketData || marketData.length === 0) {
        return <div className="text-warning text-center py-5 fw-bold" style={{ fontFamily: "'Cascadia Mono', monospace" }}>NO MARKET DATA FOUND</div>;
    }

    const currentStats = marketData[marketData.length - 1];
    const highResImageUrl = `https://tcgplayer-cdn.tcgplayer.com/product/${productId}_in_1000x1000.jpg`;
    const fallbackImageUrl = `https://tcgplayer-cdn.tcgplayer.com/product/${productId}_200w.jpg`;
    
    // Check if the current card is a Starlight Rare
    const isStarlight = currentStats.rarity?.toLowerCase().includes('starlight');

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="p-3 rounded shadow-lg border border-info border-opacity-50" style={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', fontFamily: "'Cascadia Mono', monospace" }}>
                    <p className="text-white-50 mb-1 border-bottom border-secondary pb-1">{label}</p>
                    <p className="text-info fw-bold mb-0">Market: ${payload[0].value.toFixed(2)}</p>
                    {payload[1] && <p className="text-warning fw-bold mb-0">Median: ${payload[1].value.toFixed(2)}</p>}
                </div>
            );
        }
        return null;
    };

    return (
        <>
            <Card className="border-0 shadow-lg" style={{ backgroundColor: 'rgba(10, 13, 20, 0.65)', border: '1px solid rgba(0, 210, 255, 0.15)', fontFamily: "'Cascadia Mono', monospace" }}>
                <Card.Header className="bg-transparent border-bottom border-info border-opacity-25 py-4">
                    <Row className="align-items-center">
                        <Col xs={12} md={8} className="d-flex align-items-center gap-4">
                            <div 
                                onClick={() => setShowPreview(true)}
                                style={{ 
                                    width: '90px', 
                                    height: '131px', 
                                    position: 'relative', 
                                    flexShrink: 0,
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                                }}
                                className="rounded border border-info border-opacity-50 card-hover-glow"
                                title="Click to inspect 3D Holo Preview"
                            >
                                <Image 
                                    src={fallbackImageUrl}
                                    alt={currentStats.cardName}
                                    fill
                                    sizes="90px"
                                    style={{ objectFit: 'contain' }}
                                    unoptimized
                                />
                                <div className="position-absolute bottom-0 start-0 w-100 bg-black bg-opacity-75 text-info text-center py-1 fw-bold" style={{ fontSize: '0.62rem', letterSpacing: '0.5px' }}>
                                    🔍 3D VIEW
                                </div>
                            </div>

                            <div>
                                <h3 className="text-white fw-bold mb-2">{currentStats.cardName}</h3>
                                <div className="d-flex gap-2 align-items-center flex-wrap">
                                    <Badge bg="dark" className="border border-secondary text-white-50">{currentStats.setName}</Badge>
                                    <Badge bg={isStarlight ? "warning" : "dark"} className={`border ${isStarlight ? 'border-warning text-dark' : 'border-info text-info'}`}>
                                        {currentStats.rarity}
                                    </Badge>
                                    <span className="text-secondary small">ID: {productId}</span>
                                </div>
                            </div>
                        </Col>

                        <Col xs={12} md={4} className="text-md-end mt-4 mt-md-0">
                            <div className="text-white-50 small mb-1">Current Market Price</div>
                            <h2 className="text-info fw-bold mb-0 display-6" style={{ textShadow: '0 0 15px rgba(0, 210, 255, 0.3)' }}>
                                ${currentStats.marketPrice?.toFixed(2) || "0.00"}
                            </h2>
                        </Col>
                    </Row>
                </Card.Header>

                <Card.Body className="p-4">
                    <div className="text-white-50 small mb-3">30-Day Price Trend</div>
                    <div style={{ width: '100%', height: '350px' }}>
                        <ResponsiveContainer>
                            <LineChart data={marketData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                <XAxis dataKey="displayDate" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} tickLine={false} />
                                <YAxis domain={['auto', 'auto']} stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} tickLine={false} tickFormatter={(value) => `$${value}`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey="marketPrice" stroke="#00d2ff" strokeWidth={3} dot={{ fill: '#0a0d14', stroke: '#00d2ff', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#00d2ff', stroke: '#fff' }} isAnimationActive={true} />
                                <Line type="monotone" dataKey="listedMedian" stroke="#ffc107" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={false} isAnimationActive={true} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card.Body>
            </Card>

            <Modal 
                show={showPreview} 
                onHide={() => setShowPreview(false)} 
                centered 
                size="xl" // Increased modal size to accommodate the larger card
                contentClassName="bg-transparent border-0 shadow-none"
            >
                <div 
                    className="d-flex flex-column align-items-center justify-content-center p-3"
                    style={{ fontFamily: "'Cascadia Mono', monospace" }}
                >
                    <div className="d-flex justify-content-between align-items-center w-100 mb-3 px-3 py-2 rounded bg-black bg-opacity-75 border border-info border-opacity-50" style={{ maxWidth: '420px' }}>
                        <div className="d-flex flex-column">
                            <span className="text-info fw-bold small">{currentStats.cardName}</span>
                            <span className={isStarlight ? "text-warning fw-bold" : "text-white-50"} style={{ fontSize: '0.75rem' }}>
                                RARITY: {currentStats.rarity?.toUpperCase()}
                            </span>
                        </div>
                        <Button 
                            variant="outline-info" 
                            size="sm" 
                            className="py-0 px-2 fw-bold"
                            onClick={() => setShowPreview(false)}
                        >
                            ✕
                        </Button>
                    </div>

                    <div 
                        style={{ 
                            perspective: '1500px', // Increased perspective for the larger element
                            cursor: 'grab',
                            padding: '20px'
                        }}
                    >
                        <div
                            ref={cardRef}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                            style={{
                                width: '420px',  // 🚀 Increased size
                                height: '613px', // 🚀 Increased size (Yu-Gi-Oh ratio)
                                position: 'relative',
                                borderRadius: '18px',
                                transformStyle: 'preserve-3d',
                                transform: tilt.active 
                                    ? `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(1.05, 1.05, 1.05)` 
                                    : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
                                transition: tilt.active ? 'none' : 'transform 0.5s ease-out',
                                boxShadow: tilt.active 
                                    ? '0 35px 55px rgba(0, 210, 255, 0.3), 0 0 45px rgba(255, 255, 255, 0.15)' 
                                    : '0 20px 40px rgba(0, 0, 0, 0.9)',
                                overflow: 'hidden',
                                border: isStarlight ? '2px solid rgba(255, 215, 0, 0.8)' : '2px solid rgba(0, 210, 255, 0.6)'
                            }}
                        >
                            <img
                                src={highResImageUrl}
                                alt={currentStats.cardName}
                                className="w-100 h-100"
                                style={{ objectFit: 'cover' }}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = fallbackImageUrl;
                                }}
                            />

                            {/* 🚀 CONDITIONAL HOLOGRAPHIC LOGIC */}
                            {isStarlight ? (
                                <>
                                    {/* Starlight Rare: Sharp Crosshatch Grid */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            pointerEvents: 'none',
                                            mixBlendMode: 'color-dodge',
                                            opacity: tilt.active ? 0.9 : 0,
                                            transition: tilt.active ? 'none' : 'opacity 0.4s ease',
                                            backgroundImage: `
                                                repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.2) 2px, rgba(255,255,255,0.2) 4px),
                                                repeating-linear-gradient(-45deg, transparent, transparent 2px, rgba(255,255,255,0.2) 2px, rgba(255,255,255,0.2) 4px)
                                            `,
                                            backgroundPosition: `${tilt.glintX * 0.2}px ${tilt.glintY * 0.2}px`
                                        }}
                                    />
                                    {/* Starlight Rare: Intense Rainbow Beam */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '200%',
                                            height: '200%',
                                            pointerEvents: 'none',
                                            mixBlendMode: 'color-dodge',
                                            opacity: tilt.active ? 0.8 : 0,
                                            transition: tilt.active ? 'none' : 'opacity 0.4s ease',
                                            background: `linear-gradient(${tilt.rotateY * 3}deg, transparent 20%, rgba(255,0,128,0.7) 40%, rgba(0,255,255,0.8) 50%, rgba(255,255,0,0.6) 60%, transparent 80%)`,
                                            transform: `translate(${-50 + tilt.glintX * 0.5}%, ${-50 + tilt.glintY * 0.5}%)`
                                        }}
                                    />
                                </>
                            ) : (
                                <>
                                    {/* Standard Rare: Toned down, subtle sheen */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            pointerEvents: 'none',
                                            mixBlendMode: 'color-dodge',
                                            opacity: tilt.active ? 0.4 : 0, // Lowered opacity significantly
                                            transition: tilt.active ? 'none' : 'opacity 0.4s ease',
                                            background: `
                                                linear-gradient(
                                                    ${tilt.rotateY * 2}deg, 
                                                    transparent 20%, 
                                                    rgba(255, 255, 255, 0.2) 40%, 
                                                    rgba(0, 210, 255, 0.3) 50%, 
                                                    transparent 80%
                                                )
                                            `
                                        }}
                                    />
                                </>
                            )}

                            {/* Global Specular Highlight Gloss (Applies to all cards to simulate lighting) */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    pointerEvents: 'none',
                                    background: `radial-gradient(circle at ${tilt.glintX}% ${tilt.glintY}%, rgba(255, 255, 255, 0.4) 0%, transparent 50%)`,
                                    opacity: tilt.active ? 0.5 : 0,
                                    transition: tilt.active ? 'none' : 'opacity 0.4s ease'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
}