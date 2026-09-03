import React from 'react';
import { Row, Col, Card, Badge } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CrossFormatStatsCard({ formatStats }) {
    return (
        <Card className="border-0 shadow-lg" style={{ backgroundColor: 'rgba(10, 13, 20, 0.65)', backdropFilter: 'blur(0px)', border: '1px solid rgba(0, 210, 255, 0.15)' }}>
            <Card.Header className="bg-transparent border-bottom border-info border-opacity-25 py-3">
                <h5 className="text-white fw-bold m-0">DECK INCLUSION STATS</h5>
            </Card.Header>
            <Card.Body className="p-4">
                {formatStats.length > 0 ? (
                    <>
                        <Row className="g-3 mb-4">
                            {formatStats.map((stat, idx) => (
                                <Col xs={12} md={4} key={idx}>
                                    <div className="p-3 rounded bg-black bg-opacity-20 border border-secondary border-opacity-25 text-center">
                                        <Badge bg="info" className="text-dark fw-bold mb-2">{stat.format.toUpperCase()}</Badge>
                                        <div className="text-white fw-bold fs-4">{stat.deckCount} <span className="text-white-50 fs-6">/ {stat.TotalDecksInFormat} Decks</span></div>
                                        <div className="text-info small mt-1">Inclusion Rate: {stat.inclusionRate}% ({stat.avgCopies}x avg)</div>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                        <div className="text-white-50 small mb-3">Deck Count by Format</div>
                        <div style={{ width: '100%', height: '280px' }}>
                            <ResponsiveContainer>
                                <BarChart data={formatStats} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                    <XAxis dataKey="format" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                                    <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} allowDecimals={false} />
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', borderColor: 'rgba(0, 210, 255, 0.5)', fontFamily: "'Cascadia Mono', monospace" }} formatter={(value, name) => [value, name === 'deckCount' ? 'Decks Containing Card' : name]} />
                                    <Bar dataKey="deckCount" fill="#00d2ff" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                ) : (
                    <div className="text-center text-white-50 py-3">[ NO DECK ANALYTICS ARCHIVED FOR THIS CARD YET ]</div>
                )}
            </Card.Body>
        </Card>
    );
}