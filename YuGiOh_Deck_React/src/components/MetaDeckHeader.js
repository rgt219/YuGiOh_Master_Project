import React from 'react';
import { Card, Badge, Row, Col, Button } from 'react-bootstrap';

export default function MetaDeckHeader({ deck, cardCounts, mainDeckIds, onExportYDK }) {
  const archetype = deck?.archetype || deck?.Archetype || 'TOURNAMENT META DECK';
  const format = deck?.format || deck?.Format || 'TCG';
  const pilot = deck?.pilot || deck?.Pilot || '--------';
  const placement = deck?.placement || deck?.Placement || 'Unknown';

  const totalCards = cardCounts.monsters + cardCounts.spells + cardCounts.traps || mainDeckIds.length || 1;
  const monsterPct = Math.round((cardCounts.monsters / totalCards) * 100);
  const spellPct = Math.round((cardCounts.spells / totalCards) * 100);
  const trapPct = Math.max(0, 100 - (monsterPct + spellPct));

  const monsterDeg = (monsterPct / 100) * 360;
  const spellDeg = monsterDeg + (spellPct / 100) * 360;

  return (
    <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.98)', backdropFilter: 'blur(10px)' }} text="white" className="border-info shadow-lg p-4 mb-4 md-panel">
      <Card.Header className="bg-transparent border-bottom border-info border-opacity-50 pb-3 mb-4">
        {/* Top Row: Title & Export Button */}
        <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
          <h2 className="m-0 text-info terminal-font fw-bold" style={{ letterSpacing: '2px' }}>
            {archetype}
          </h2>

          {onExportYDK && (
            <Button variant="outline-secondary" size="sm" className="terminal-font fw-bold text-white px-3 py-2 text-nowrap flex-shrink-0" onClick={onExportYDK}>
              💾 EXPORT .YDK
            </Button>
          )}
        </div>

        {/* Bottom Row: Metadata Badges */}
        <div className="d-flex gap-2 align-items-center flex-wrap">
          <Badge bg="success" className="text-dark fw-bold px-3 py-2" style={{ fontSize: '0.85rem' }}>PILOT: {pilot}</Badge>
          <Badge bg="dark" className="text-light fw-bold px-3 py-2 border border-secondary" style={{ fontSize: '0.85rem' }}>PLACEMENT: {placement}</Badge>
          <Badge bg="info" className="text-dark fw-bold px-3 py-2" style={{ fontSize: '0.85rem' }}>FORMAT: {format}</Badge>
        </div>
      </Card.Header>

      <Card.Body>
        <div className="p-3 rounded mb-2" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
          <h5 className="text-info terminal-font fw-bold border-bottom border-info border-opacity-25 pb-2 mb-3">
            📊 MAIN DECK COMPOSITION RATIO
          </h5>

          <Row className="align-items-center g-3">
            <Col sm={4} md={3} className="d-flex justify-content-center">
              <div
                style={{
                  width: '130px',
                  height: '130px',
                  borderRadius: '50%',
                  background: `conic-gradient(
                    #eab308 0deg ${monsterDeg}deg, 
                    #10b981 ${monsterDeg}deg ${spellDeg}deg, 
                    #ec4899 ${spellDeg}deg 360deg
                  )`,
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 0 20px rgba(0, 240, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(8, 12, 20, 0.98)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column'
                  }}
                >
                  <span className="small text-white-50 fw-bold" style={{ fontSize: '0.6rem' }}>TOTAL</span>
                  <span className="text-info fw-bold">{mainDeckIds.length || totalCards}</span>
                </div>
              </div>
            </Col>

            <Col sm={8} md={9}>
              <Row className="g-2">
                <Col md={4}>
                  <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                    <div className="d-flex align-items-center gap-2">
                      <span style={{ width: '12px', height: '12px', backgroundColor: '#eab308', borderRadius: '3px', display: 'inline-block' }}></span>
                      <span className="small text-white fw-bold">MONSTERS</span>
                    </div>
                    <span className="text-warning fw-bold">{cardCounts.monsters} ({monsterPct}%)</span>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <div className="d-flex align-items-center gap-2">
                      <span style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '3px', display: 'inline-block' }}></span>
                      <span className="small text-white fw-bold">SPELLS</span>
                    </div>
                    <span className="text-success fw-bold">{cardCounts.spells} ({spellPct}%)</span>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
                    <div className="d-flex align-items-center gap-2">
                      <span style={{ width: '12px', height: '12px', backgroundColor: '#ec4899', borderRadius: '3px', display: 'inline-block' }}></span>
                      <span className="small text-white fw-bold">TRAPS</span>
                    </div>
                    <span className="text-danger fw-bold">{cardCounts.traps} ({trapPct}%)</span>
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        </div>
      </Card.Body>
    </Card>
  );
}