import React, { useState } from 'react';
import { Modal, Row, Col, Badge, Button } from 'react-bootstrap';
import Link from 'next/link';

const renderLevelStars = (level) => {
    if (!level) return null;
    return (
        <div className="d-flex align-items-center gap-1">
            <span className="text-warning fw-bold small">LEVEL / RANK {level}</span>
            <span className="text-warning">{"★".repeat(Math.min(level, 12))}</span>
        </div>
    );
};

const renderBanBadge = (status) => {
    const s = (status || "Unlimited").toUpperCase();
    if (s === "FORBIDDEN" || s === "BANNED") return <Badge bg="danger" className="terminal-font shadow-sm px-2 py-1" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>FORBIDDEN</Badge>;
    if (s === "LIMITED") return <Badge bg="warning" className="text-dark terminal-font shadow-sm px-2 py-1" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>LIMITED</Badge>;
    if (s === "SEMI-LIMITED") return <Badge bg="info" className="text-dark terminal-font shadow-sm px-2 py-1" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>SEMI-LIMITED</Badge>;
    return <Badge bg="success" className="terminal-font shadow-sm px-2 py-1" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>UNLIMITED</Badge>;
};

export default function CardSearchInspectorModal({ inspectCard, setInspectCard }) {
    const [showLargeImage, setShowLargeImage] = useState(false);
    // Track selected printing/rarity from the TCG Printings table
    const [selectedPrinting, setSelectedPrinting] = useState(null);

    if (!inspectCard) return null;

    const largeImageUrl = inspectCard.card_images?.[0]?.image_url || `https://images.ygoprodeck.com/images/cards/${inspectCard.id}.jpg`;
    
    // Default to the first available printing or a fallback set name
    const defaultSet = inspectCard.cardSets?.[0] || { set_name: "Chaos Origins", set_rarity: "Common" };
    const activeSet = selectedPrinting || defaultSet;

    // 🚀 Rarity Mapping: If your backend links set codes/rarities to TCGPlayer Product IDs, 
    // you can attach or resolve the specific productId here. If inspectCard already has product bindings, use them.
    const targetProductId = activeSet.productId || inspectCard.id; 

    return (
        <>
            <Modal
                show={!!inspectCard}
                onHide={() => { setInspectCard(null); setSelectedPrinting(null); }}
                centered
                size="lg"
                contentClassName="bg-dark text-white border border-info shadow-lg rounded-3"
                style={{ 
                    backdropFilter: 'blur(8px)',
                    filter: showLargeImage ? 'blur(6px) brightness(0.25)' : 'none',
                    transition: 'filter 0.25s ease'
                }}
            >
                <Modal.Header closeButton closeVariant="white" className="border-secondary bg-black bg-opacity-60 py-2">
                    <Modal.Title className="text-info terminal-font fw-bold fs-6 d-flex align-items-center gap-2">
                        <span>CARD INSPECTOR</span>
                        <span className="text-white-50">{inspectCard.id}</span>
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body className="p-4 bg-dark">
                    <Row className="g-3 align-items-stretch">
                        <Col md={5} className="d-flex flex-column justify-content-between">
                            <div className="text-center">
                                <div className="mx-auto mb-2">
                                    <img 
                                        src={largeImageUrl} 
                                        alt={inspectCard.name} 
                                        className="w-100 h-auto rounded"
                                        style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }}
                                        onClick={() => setShowLargeImage(true)}
                                    />
                                </div>
                            </div>

                            <div className="p-2 rounded bg-black bg-opacity-60 border border-info border-opacity-30">
                                <div className="text-info small terminal-font mb-1 d-flex align-items-center justify-content-between" style={{ fontSize: '0.7rem' }}>
                                    <span>MARKET VALUATION</span>
                                    <span className="text-white-50" style={{ fontSize: '0.58rem' }}>TCG INDEX</span>
                                </div>
                                <Row className="g-1 text-center">
                                    <Col xs={4}>
                                        <div className="p-1 rounded bg-dark border border-secondary border-opacity-25">
                                            <span className="text-white-50 d-block" style={{ fontSize: '0.58rem' }}>TCGPlayer</span>
                                            <span className="fw-bold text-success font-monospace" style={{ fontSize: '0.75rem' }}>
                                                {inspectCard.prices?.tcgplayer}
                                            </span>
                                        </div>
                                    </Col>
                                    <Col xs={4}>
                                        <div className="p-1 rounded bg-dark border border-secondary border-opacity-25">
                                            <span className="text-white-50 d-block" style={{ fontSize: '0.58rem' }}>Cardmarket</span>
                                            <span className="fw-bold text-info font-monospace" style={{ fontSize: '0.75rem' }}>
                                                {inspectCard.prices?.cardmarket}
                                            </span>
                                        </div>
                                    </Col>
                                    <Col xs={4}>
                                        <div className="p-1 rounded bg-dark border border-secondary border-opacity-25">
                                            <span className="text-white-50 d-block" style={{ fontSize: '0.58rem' }}>eBay</span>
                                            <span className="fw-bold text-warning font-monospace" style={{ fontSize: '0.75rem' }}>
                                                {inspectCard.prices?.ebay}
                                            </span>
                                        </div>
                                    </Col>
                                </Row>
                            </div>

                            {/* 🚀 Routes to Telemetry with the specific set name and rarity/product ID */}
                            <div className="mt-3">
                                // Inside CardSearchInspectorModal.js, update the routing button href:
                                <Button 
                                    as={Link}
                                    href={`/market-listings/${encodeURIComponent(activeSet.set_name)}/${encodeURIComponent(inspectCard.name)}?id=${activeSet.productId || inspectCard.id}&konamiId=${inspectCard.id}&rarity=${encodeURIComponent(activeSet.set_rarity)}`}
                                    variant="info" 
                                    className="w-100 fw-bold terminal-font py-2 shadow"
                                    onClick={() => { setInspectCard(null); setSelectedPrinting(null); }}
                                >
                                    See Telemetry ({activeSet.set_rarity})
                                </Button>
                            </div>
                        </Col>

                        <Col md={7} className="d-flex flex-column">
                            <div className="p-3 rounded bg-black bg-opacity-50 border border-info border-opacity-30 position-relative d-flex flex-column flex-grow-1">
                                <h3 className="fw-bold text-white mb-2" style={{ fontSize: '1.25rem' }}>{inspectCard.name}</h3>

                                <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                                    {inspectCard.attribute && (
                                        <Badge className={`attr-${inspectCard.attribute.toUpperCase()} font-monospace px-2 py-1`}>
                                            {inspectCard.attribute.toUpperCase()}
                                        </Badge>
                                    )}
                                    <Badge bg="secondary" className="terminal-font">
                                        {inspectCard.type?.toUpperCase()}
                                    </Badge>
                                </div>

                                {inspectCard.level && (
                                    <div className="mb-2 p-2 rounded bg-black bg-opacity-40 border border-secondary border-opacity-25">
                                        {renderLevelStars(inspectCard.level)}
                                    </div>
                                )}

                                <div className="mt-1 flex-grow-1 d-flex flex-column">
                                    <label className="text-info small terminal-font mb-1 d-block" style={{ fontSize: '0.7rem' }}>
                                        CARD EFFECT
                                    </label>
                                    <div 
                                        className="p-3 rounded bg-black bg-opacity-60 text-white-50 small border border-secondary border-opacity-30 flex-grow-1"
                                        style={{ minHeight: '120px', overflowY: 'auto', whiteSpace: 'pre-line', fontSize: '0.82rem', lineHeight: '1.45' }}
                                    >
                                        {inspectCard.desc}
                                    </div>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    {/* TCG Printings Table: Clicking a row selects that specific rarity/set variant */}
                    <div className="mt-3">
                        <label className="text-info small terminal-font mb-1 d-block" style={{ fontSize: '0.7rem' }}>
                            TCG PRINTINGS (CLICK TO SELECT RARITY VARIANT)
                        </label>
                        <div className="rounded bg-black bg-opacity-60 border border-secondary border-opacity-30 overflow-auto" style={{ maxHeight: '140px' }}>
                            {inspectCard.cardSets && inspectCard.cardSets.length > 0 ? (
                                <table className="table table-sm table-dark table-hover table-borderless m-0 terminal-font" style={{ fontSize: '0.75rem', cursor: 'pointer' }}>
                                    <thead style={{ position: 'sticky', top: 0, backgroundColor: '#0a0d14', zIndex: 1 }}>
                                        <tr className="text-info-50" style={{ borderBottom: '1px solid rgba(0, 210, 255, 0.2)' }}>
                                            <th className="py-2 px-2 fw-normal">Set Code</th>
                                            <th className="py-2 px-2 fw-normal">Set Name</th>
                                            <th className="py-2 px-2 fw-normal">Rarity</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inspectCard.cardSets.map((set, idx) => {
                                            const isSelected = activeSet.set_code === set.set_code && activeSet.set_rarity === set.set_rarity;
                                            return (
                                                <tr 
                                                    key={idx} 
                                                    onClick={() => setSelectedPrinting(set)}
                                                    style={{ 
                                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                        backgroundColor: isSelected ? 'rgba(0, 210, 255, 0.15)' : 'transparent'
                                                    }}
                                                >
                                                    <td className="text-warning px-2 align-middle">{set.set_code}</td>
                                                    <td className="text-white-50 px-2 align-middle">{set.set_name}</td>
                                                    <td className="text-info px-2 align-middle fw-bold">{set.set_rarity} {isSelected && " ✓"}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-white-50 small p-3 text-center">No set data available for this card.</div>
                            )}
                        </div>
                    </div>
                </Modal.Body>
            </Modal>

            <Modal show={showLargeImage} onHide={() => setShowLargeImage(false)} centered size="md" contentClassName="bg-transparent border-0 text-center shadow-none">
                <Modal.Body className="p-0 text-center position-relative">
                    <button type="button" className="btn-close btn-close-white position-absolute top-0 end-0 m-3 z-3 shadow" onClick={() => setShowLargeImage(false)} aria-label="Close" />
                    <img 
                        src={largeImageUrl} 
                        alt={inspectCard.name} 
                        className="img-fluid rounded shadow-lg"
                        style={{ maxHeight: '85vh', objectFit: 'contain' }}
                    />
                </Modal.Body>
            </Modal>
        </>
    );
}