import React from 'react';
import { Modal, Row, Col, Badge } from 'react-bootstrap';
import { renderLevelStars, renderBanBadge } from '@/utils/banListHelpers';

export default function CardInspectorModal({ selectedCard, onClose }) {
  if (!selectedCard) return null;

  return (
    <Modal
      show={!!selectedCard}
      onHide={onClose}
      centered
      size="lg"
      contentClassName="bg-dark text-white border border-info shadow-lg rounded-3"
      style={{ backdropFilter: 'blur(8px)' }}
    >
      <Modal.Header closeButton closeVariant="white" className="border-secondary bg-black bg-opacity-60 py-2">
        <Modal.Title className="text-info terminal-font fw-bold fs-6 d-flex align-items-center gap-2">
          <span>CARD INSPECTOR</span>
          <span className="text-white-50">{selectedCard.id}</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4 bg-dark">
        <Row className="g-3 align-items-stretch">
          <Col md={5} className="d-flex flex-column justify-content-between">
            <div className="text-center">
              <div className="vrains-card-art-container mx-auto mb-2">
                <img 
                  src={selectedCard.image} 
                  alt={selectedCard.name} 
                  className="w-100 h-auto rounded"
                  onError={(e) => { e.target.src = selectedCard.fallbackImage || "https://ygoprodeck.com/images/cards/back.jpg"; }}
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
                    <span className="fw-bold text-success font-monospace" style={{ fontSize: '0.75rem' }}>{selectedCard.prices?.tcgplayer}</span>
                  </div>
                </Col>
                <Col xs={4}>
                  <div className="p-1 rounded bg-dark border border-secondary border-opacity-25">
                    <span className="text-white-50 d-block" style={{ fontSize: '0.58rem' }}>Cardmarket</span>
                    <span className="fw-bold text-info font-monospace" style={{ fontSize: '0.75rem' }}>{selectedCard.prices?.cardmarket}</span>
                  </div>
                </Col>
                <Col xs={4}>
                  <div className="p-1 rounded bg-dark border border-secondary border-opacity-25">
                    <span className="text-white-50 d-block" style={{ fontSize: '0.58rem' }}>eBay</span>
                    <span className="fw-bold text-warning font-monospace" style={{ fontSize: '0.75rem' }}>{selectedCard.prices?.ebay}</span>
                  </div>
                </Col>
              </Row>
            </div>
          </Col>

          <Col md={7} className="d-flex flex-column">
            <div className="p-3 rounded bg-black bg-opacity-50 border border-info border-opacity-30 position-relative flex-grow-1 d-flex flex-column">
              <div className="vrains-corner vrains-corner-tl"></div>
              <div className="vrains-corner vrains-corner-tr"></div>
              <div className="vrains-corner vrains-corner-bl"></div>
              <div className="vrains-corner vrains-corner-br"></div>

              <h3 className="fw-bold text-white mb-2" style={{ fontSize: '1.25rem' }}>{selectedCard.name}</h3>

              <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                {selectedCard.attribute && <Badge className={`attr-${selectedCard.attribute.toUpperCase()} font-monospace px-2 py-1`}>{selectedCard.attribute.toUpperCase()}</Badge>}
                <Badge bg="secondary" className="terminal-font">{selectedCard.type?.toUpperCase()}</Badge>
                {selectedCard.race && !selectedCard.type?.toUpperCase().includes(selectedCard.race.toUpperCase()) && (
                  <Badge bg="dark" className="border border-secondary text-info terminal-font">{selectedCard.race.toUpperCase()}</Badge>
                )}
              </div>

              {selectedCard.level && <div className="mb-2 p-2 rounded bg-black bg-opacity-40 border border-secondary border-opacity-25">{renderLevelStars(selectedCard.level)}</div>}

              {(selectedCard.atk !== null || selectedCard.def !== null) && (
                <Row className="g-2 mb-2">
                  <Col>
                    <div className="vrains-stat-box py-1">
                      <span className="text-white-50 small terminal-font d-block" style={{ fontSize: '0.65rem' }}>ATK</span>
                      <span className="fw-bold text-warning fs-6">{selectedCard.atk ?? "—"}</span>
                    </div>
                  </Col>
                  <Col>
                    <div className="vrains-stat-box py-1">
                      <span className="text-white-50 small terminal-font d-block" style={{ fontSize: '0.65rem' }}>DEF</span>
                      <span className="fw-bold text-warning fs-6">{selectedCard.def ?? "—"}</span>
                    </div>
                  </Col>
                </Row>
              )}

              <Row className="g-2 mb-2">
                <Col xs={8}>
                  <div className="p-2 rounded bg-black bg-opacity-60 border border-info border-opacity-25 h-100">
                    <div className="text-info small terminal-font mb-1" style={{ fontSize: '0.62rem' }}>BANLIST STATUS</div>
                    <div className="d-flex align-items-center justify-content-between gap-1">
                      <div className="text-center flex-grow-1"><span className="text-white-50 d-block" style={{ fontSize: '0.55rem' }}>MD</span>{renderBanBadge(selectedCard.banlist?.masterduel)}</div>
                      <div className="text-center flex-grow-1"><span className="text-white-50 d-block" style={{ fontSize: '0.55rem' }}>TCG</span>{renderBanBadge(selectedCard.banlist?.tcg)}</div>
                      <div className="text-center flex-grow-1"><span className="text-white-50 d-block" style={{ fontSize: '0.55rem' }}>OCG</span>{renderBanBadge(selectedCard.banlist?.ocg)}</div>
                    </div>
                  </div>
                </Col>
                <Col xs={4}>
                  <div className="p-2 rounded bg-black bg-opacity-60 border border-info border-opacity-25 h-100 d-flex flex-column justify-content-between text-center">
                    <span className="text-info small terminal-font d-block fw-bold" style={{ fontSize: '0.62rem' }}>GENESYS POINTS</span>
                    <div>
                      {selectedCard.isLinkOrPendulum ? (
                        <Badge bg="danger" className="terminal-font px-1 py-1" style={{ fontSize: '0.58rem' }}>N/A (BANNED)</Badge>
                      ) : (
                        <Badge bg="info" className="text-dark terminal-font px-2 py-1 fw-bold fs-6">{selectedCard.genesysPoints} PTS</Badge>
                      )}
                    </div>
                  </div>
                </Col>
              </Row>

              <div className="mt-1 flex-grow-1 d-flex flex-column">
                <label className="text-info small terminal-font mb-1 d-block" style={{ fontSize: '0.7rem' }}>CARD EFFECT</label>
                <div className="p-3 rounded bg-black bg-opacity-60 text-white-50 small border border-secondary border-opacity-30 flex-grow-1" style={{ minHeight: '130px', maxHeight: '220px', overflowY: 'auto', whiteSpace: 'pre-line', fontSize: '0.82rem', lineHeight: '1.45' }}>
                  {selectedCard.desc}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Modal.Body>
    </Modal>
  );
}