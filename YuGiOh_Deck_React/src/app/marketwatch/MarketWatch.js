'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import Image from 'next/image';

export default function MarketWatch({ productId }) {
    const [marketData, setMarketData] = useState([]);
    const [loading, setLoading] = useState(true);

    const MARKET_API = process.env.NEXT_PUBLIC_MARKET_API_URL || "http://localhost:5165";

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
    }, [productId]);

    if (loading) {
        return <div className="text-info text-center py-5 fw-bold" style={{ fontFamily: "'Cascadia Mono', monospace" }}>INITIALIZING MARKET TELEMETRY...</div>;
    }

    if (!marketData || marketData.length === 0) {
        return <div className="text-warning text-center py-5 fw-bold" style={{ fontFamily: "'Cascadia Mono', monospace" }}>NO MARKET DATA FOUND</div>;
    }

    const currentStats = marketData[marketData.length - 1];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="p-3 rounded shadow-lg border border-info border-opacity-50" style={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', fontFamily: "'Cascadia Mono', monospace" }}>
                    <p className="text-white-50 mb-1 border-bottom border-secondary pb-1">{label}</p>
                    <p className="text-info fw-bold mb-0">
                        Market: ${payload[0].value.toFixed(2)}
                    </p>
                    {payload[1] && (
                        <p className="text-warning fw-bold mb-0">
                            Median: ${payload[1].value.toFixed(2)}
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="border-0 shadow-lg" style={{ backgroundColor: 'rgba(10, 13, 20, 0.65)', backdropFilter: 'blur(0px)', border: '1px solid rgba(0, 210, 255, 0.15)', fontFamily: "'Cascadia Mono', monospace" }}>
            <Card.Header className="bg-transparent border-bottom border-info border-opacity-25 py-4">
                <Row className="align-items-center">
                    
                    {/* 🚀 FIXED: Added Card Image Thumbnail next to the Title Info */}
                    <Col xs={12} md={8} className="d-flex align-items-center gap-4">
                        <div style={{ width: '90px', height: '131px', position: 'relative', flexShrink: 0 }}>
                            <Image 
                                src={`https://tcgplayer-cdn.tcgplayer.com/product/${productId}_200w.jpg`}
                                alt={currentStats.cardName}
                                fill
                                sizes="90px"
                                style={{ objectFit: 'contain' }}
                                unoptimized
                            />
                        </div>
                        <div>
                            <h3 className="text-white fw-bold mb-2">{currentStats.cardName}</h3>
                            <div className="d-flex gap-2 align-items-center flex-wrap">
                                <Badge bg="dark" className="border border-secondary text-white-50">{currentStats.setName}</Badge>
                                <Badge bg="dark" className="border border-info text-info">{currentStats.rarity}</Badge>
                                <span className="text-secondary small">ID: {productId}</span>
                            </div>
                        </div>
                    </Col>

                    {/* Price Metric Block */}
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
                            <XAxis 
                                dataKey="displayDate" 
                                stroke="rgba(255,255,255,0.5)" 
                                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} 
                                tickLine={false} 
                            />
                            <YAxis 
                                domain={['auto', 'auto']} 
                                stroke="rgba(255,255,255,0.5)" 
                                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} 
                                tickLine={false}
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            
                            {/* Market Price Line (Blue) */}
                            <Line 
                                type="monotone" 
                                dataKey="marketPrice" 
                                stroke="#00d2ff" 
                                strokeWidth={3}
                                dot={{ fill: '#0a0d14', stroke: '#00d2ff', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, fill: '#00d2ff', stroke: '#fff' }}
                                isAnimationActive={true}
                            />
                            
                            {/* Listed Median Line (Yellow/Warning) */}
                            <Line 
                                type="monotone" 
                                dataKey="listedMedian" 
                                stroke="#ffc107" 
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                                activeDot={false}
                                isAnimationActive={true}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card.Body>
        </Card>
    );
}