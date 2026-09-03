import React from 'react';
import Image from 'next/image';
import { Row, Col, Card, Badge, Form, Button } from 'react-bootstrap';
import { AZURE_CDN_URL } from '@/utils/constants';

export default function GameStatsCard({ resolvedKonamiId, decodedCardName, cardDetails, selectedRarity, selectedSet, printingsMap, handleSetChange, handleRarityClick }) {
    const cdnImageUrl = resolvedKonamiId ? `${AZURE_CDN_URL}/${resolvedKonamiId}.jpg` : `https://images.ygoprodeck.com/images/cards/${resolvedKonamiId}.jpg`;
    const availableRaritiesInSet = printingsMap[selectedSet] || [];

    return (
        <Card className="border-0 shadow-lg" style={{ backgroundColor: 'rgba(10, 13, 20, 0.65)', backdropFilter: 'blur(0px)', border: '1px solid rgba(0, 210, 255, 0.15)' }}>
            <Card.Body className="p-4">
                <Row className="g-4 align-items-center">
                    <Col xs={12} md={3} className="text-center">
                        <div className="position-relative mx-auto" style={{ width: '200px', height: '292px' }}>
                            <Image 
                                src={cdnImageUrl} alt={decodedCardName} fill sizes="200px" style={{ objectFit: 'contain' }} unoptimized
                                onError={(e) => { e.target.src = `https://images.ygoprodeck.com/images/cards/${resolvedKonamiId}.jpg`; }}
                            />
                        </div>
                    </Col>
                    <Col xs={12} md={9}>
                        <h2 className="text-white fw-bold mb-2">{cardDetails?.name || decodedCardName}</h2>
                        <div className="d-flex flex-wrap gap-2 mb-3">
                            {cardDetails?.attribute && <Badge bg="warning" className="text-dark fw-bold">{cardDetails.attribute}</Badge>}
                            <Badge bg="secondary">{cardDetails?.type}</Badge>
                            <Badge bg="dark" className="border border-info text-info">{cardDetails?.race}</Badge>
                            {selectedRarity && <Badge bg="info" className="text-dark fw-bold">Active Rarity: {selectedRarity}</Badge>}
                        </div>
                        <div className="mb-3 p-3 rounded bg-black bg-opacity-40 border border-secondary border-opacity-25">
                            <Row className="g-3 align-items-center">
                                <Col xs={12} lg={5}>
                                    <label className="text-info small terminal-font mb-1 d-block">SELECT EXPANSION SET:</label>
                                    <Form.Select value={selectedSet} onChange={handleSetChange} className="bg-dark text-white border-secondary terminal-font" style={{ fontSize: '0.85rem' }}>
                                        {Object.keys(printingsMap).map((setNameKey) => (
                                            <option key={setNameKey} value={setNameKey}>{setNameKey} ({printingsMap[setNameKey].length} printings)</option>
                                        ))}
                                    </Form.Select>
                                </Col>
                                <Col xs={12} lg={7}>
                                    <label className="text-info small terminal-font mb-1 d-block">AVAILABLE RARITIES IN {selectedSet.toUpperCase()}:</label>
                                    <div className="d-flex flex-wrap gap-1">
                                        {availableRaritiesInSet.map((printing, idx) => {
                                            const isActive = printing.set_rarity === selectedRarity;
                                            return (
                                                <Button key={idx} size="sm" variant={isActive ? "info" : "outline-secondary"} className={`terminal-font ${isActive ? "text-dark fw-bold" : "text-white-50"}`} style={{ fontSize: '0.75rem' }} onClick={() => handleRarityClick(printing)}>
                                                    {printing.set_rarity} ({printing.set_code})
                                                </Button>
                                            );
                                        })}
                                    </div>
                                </Col>
                            </Row>
                        </div>
                        {cardDetails?.atk !== undefined && (
                            <div className="d-flex gap-4 mb-3 text-white">
                                <div><strong>ATK:</strong> <span className="text-warning">{cardDetails.atk}</span></div>
                                {cardDetails.def !== -1 && <div><strong>DEF:</strong> <span className="text-info">{cardDetails.def}</span></div>}
                            </div>
                        )}
                        <div className="p-3 rounded bg-black bg-opacity-50 border border-secondary border-opacity-25 text-white-50 small" style={{ whiteSpace: 'pre-line', maxHeight: '120px', overflowY: 'auto' }}>
                            {cardDetails?.desc || "No card effect text available."}
                        </div>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
}