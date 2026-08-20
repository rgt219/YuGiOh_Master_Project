import React from 'react';
import { Modal, Row, Col, Badge } from 'react-bootstrap';

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
    if (!inspectCard) return null;

    const largeImageUrl = inspectCard.card_images?.[0]?.image_url || `https://images.ygoprodeck.com/images/cards/${inspectCard.id}.jpg`;

    return (
        <Modal
            show={!!inspectCard}
            onHide={() => setInspectCard(null)}
            centered
            size="lg"
            contentClassName="bg-dark text-white border border-info shadow-lg rounded-3"
            style={{ backdropFilter: 'blur(8px)' }}
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
                                    onError={(e) => {
                                        if (e.target.src !== inspectCard.fallbackImage && inspectCard.fallbackImage) {
                                            e.target.src = inspectCard.fallbackImage;
                                        } else {
                                            e.target.src = "https://ygoprodeck.com/images/cards/back.jpg";
                                        }
                                    }}
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
                    </Col>

                    <Col md={7} className="d-flex flex-column">
                        <div className="p-3 rounded bg-black bg-opacity-50 border border-info border-opacity-30 position-relative d-flex flex-column flex-grow-1">
                            
                            <div className="vrains-corner vrains-corner-tl"></div>
                            <div className="vrains-corner vrains-corner-tr"></div>
                            <div className="vrains-corner vrains-corner-bl"></div>
                            <div className="vrains-corner vrains-corner-br"></div>

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
                                {inspectCard.race && !inspectCard.type?.toUpperCase().includes(inspectCard.race.toUpperCase()) && (
                                    <Badge bg="dark" className="border border-secondary text-info terminal-font">
                                        {inspectCard.race.toUpperCase()}
                                    </Badge>
                                )}
                            </div>

                            {inspectCard.level && (
                                <div className="mb-2 p-2 rounded bg-black bg-opacity-40 border border-secondary border-opacity-25">
                                    {renderLevelStars(inspectCard.level)}
                                </div>
                            )}

                            {(inspectCard.atk !== null || inspectCard.def !== null) && (
                                <Row className="g-2 mb-2">
                                    <Col>
                                        <div className="vrains-stat-box py-1">
                                            <span className="text-white-50 small terminal-font d-block" style={{ fontSize: '0.65rem' }}>ATK</span>
                                            <span className="fw-bold text-warning fs-6">
                                                {inspectCard.atk ?? "—"}
                                            </span>
                                        </div>
                                    </Col>
                                    <Col>
                                        <div className="vrains-stat-box py-1">
                                            <span className="text-white-50 small terminal-font d-block" style={{ fontSize: '0.65rem' }}>DEF</span>
                                            <span className="fw-bold text-info fs-6">
                                                {inspectCard.def ?? "—"}
                                            </span>
                                        </div>
                                    </Col>
                                </Row>
                            )}

                            <Row className="g-2 mb-2">
                                <Col xs={8}>
                                    <div className="p-2 rounded bg-black bg-opacity-60 border border-info border-opacity-25 h-100">
                                        <div className="text-info small terminal-font mb-1" style={{ fontSize: '0.62rem' }}>
                                            BANLIST STATUS
                                        </div>
                                        <div className="d-flex align-items-center justify-content-between gap-1">
                                            <div className="text-center flex-grow-1">
                                                <span className="text-white-50 d-block" style={{ fontSize: '0.55rem' }}>MD</span>
                                                {renderBanBadge(inspectCard.banlist?.masterduel)}
                                            </div>
                                            <div className="text-center flex-grow-1">
                                                <span className="text-white-50 d-block" style={{ fontSize: '0.55rem' }}>TCG</span>
                                                {renderBanBadge(inspectCard.banlist?.tcg)}
                                            </div>
                                            <div className="text-center flex-grow-1">
                                                <span className="text-white-50 d-block" style={{ fontSize: '0.55rem' }}>OCG</span>
                                                {renderBanBadge(inspectCard.banlist?.ocg)}
                                            </div>
                                        </div>
                                    </div>
                                </Col>

                                <Col xs={4}>
                                    <div className="p-2 rounded bg-black bg-opacity-60 border border-info border-opacity-25 h-100 d-flex flex-column justify-content-between text-center">
                                        <span className="text-info small terminal-font d-block fw-bold" style={{ fontSize: '0.62rem' }}>
                                             GENESYS POINTS
                                        </span>
                                        <div>
                                            {inspectCard.isLinkOrPendulum ? (
                                                <Badge bg="danger" className="terminal-font px-1 py-1" style={{ fontSize: '0.58rem' }}>
                                                    N/A (BANNED)
                                                </Badge>
                                            ) : (
                                                <Badge bg="info" className="text-dark terminal-font px-2 py-1 fw-bold fs-6">
                                                    {inspectCard.genesysPoints} PTS
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </Col>
                            </Row>

                            <div className="mt-1 flex-grow-1 d-flex flex-column">
                                <label className="text-info small terminal-font mb-1 d-block" style={{ fontSize: '0.7rem' }}>
                                    CARD EFFECT
                                </label>
                                <div 
                                    className="p-3 rounded bg-black bg-opacity-60 text-white-50 small border border-secondary border-opacity-30 flex-grow-1"
                                    style={{ minHeight: '90px', overflowY: 'auto', whiteSpace: 'pre-line', fontSize: '0.82rem', lineHeight: '1.45' }}
                                >
                                    {inspectCard.desc}
                                </div>
                            </div>

                        </div>
                    </Col>
                </Row>

                <div className="mt-3">
                    <label className="text-info small terminal-font mb-1 d-block" style={{ fontSize: '0.7rem' }}>
                        TCG PRINTINGS
                    </label>
                    <div 
                        className="rounded bg-black bg-opacity-60 border border-secondary border-opacity-30 overflow-auto"
                        style={{ maxHeight: '140px' }}
                    >
                        {inspectCard.cardSets && inspectCard.cardSets.length > 0 ? (
                            <table className="table table-sm table-dark table-borderless m-0 terminal-font" style={{ fontSize: '0.75rem' }}>
                                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#0a0d14', zIndex: 1 }}>
                                    <tr className="text-info-50" style={{ borderBottom: '1px solid rgba(0, 210, 255, 0.2)' }}>
                                        <th className="py-2 px-2 fw-normal">Set Code</th>
                                        <th className="py-2 px-2 fw-normal">Set Name</th>
                                        <th className="py-2 px-2 fw-normal">Rarity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inspectCard.cardSets.map((set, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td className="text-warning px-2 align-middle">{set.set_code}</td>
                                            <td className="text-white-50 px-2 align-middle">{set.set_name}</td>
                                            <td className="text-info px-2 align-middle">{set.set_rarity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-white-50 small p-3 text-center">No set data available for this card.</div>
                        )}
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    );
}