import React from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import { getAttributeColor } from '../utils/metaDeckProfileHelpers';

export default function MetaDeckInspector({ activeCard, pinnedCardData, setPinnedCardData }) {
  const activeImageUrl = activeCard?.card_images?.[0]?.image_url || 
    (activeCard?.id ? `https://images.ygoprodeck.com/images/cards/${activeCard.id}.jpg` : 'https://images.ygoprodeck.com/images/cards/back_high.jpg');

  return (
    <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.98)', backdropFilter: 'blur(10px)' }} text="white" className="border-info shadow-lg p-3 mb-4 md-panel">
      <Card.Header className="bg-transparent border-bottom border-info border-opacity-50 pb-2 mb-3 d-flex justify-content-between align-items-center">
        <h6 className="m-0 text-info terminal-font fw-bold" style={{ letterSpacing: '1px' }}>
          CARD INSPECTOR
        </h6>
        {pinnedCardData ? (
          <Badge 
            bg="warning" 
            className="text-dark fw-bold terminal-font text-uppercase px-2 py-1"
            style={{ cursor: 'pointer' }}
            onClick={() => setPinnedCardData(null)}
            title="Click to unlock inspector"
          >
            PINNED (CLICK UNPIN)
          </Badge>
        ) : (
          <Badge 
            bg="info" 
            className="text-dark fw-bold terminal-font text-uppercase px-2 py-1"
            style={{ cursor: 'pointer' }}
            onClick={() => setPinnedCardData(null)}
            title="Click to unlock inspector"
          >
            CLICK TO PIN CARD
          </Badge>
        )}
      </Card.Header>

      <Card.Body className="p-2">
        <Row className="g-3 align-items-start">
          <Col xs={12} sm={5} className="text-center">
            <img
              src={activeImageUrl}
              alt={activeCard.name}
              className="img-fluid rounded border border-info border-opacity-50 shadow"
              style={{ maxHeight: '280px', objectFit: 'contain', boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.ygoprodeck.com/images/cards/back_high.jpg';
              }}
            />
          </Col>

          <div className="col-12 col-sm-7">
            <h5 className="fw-bold mb-2 text-white terminal-font" style={{ letterSpacing: '1px', fontSize: '1rem' }}>
              {activeCard.name}
            </h5>

            <div className="d-flex align-items-center mb-2 flex-wrap gap-1">
              {activeCard.type && (
                <Badge bg="dark" className="border border-secondary text-uppercase fs-7 terminal-font">
                  {activeCard.type}
                </Badge>
              )}
              {activeCard.race && (
                <Badge bg="dark" className="border border-secondary text-uppercase fs-7 terminal-font">
                  {activeCard.race}
                </Badge>
              )}
              {activeCard.attribute && (
                <Badge bg={getAttributeColor(activeCard.attribute)} className="ms-auto text-uppercase fs-7 fw-bold terminal-font">
                  {activeCard.attribute}
                </Badge>
              )}
            </div>

            {activeCard.level && (
              <div className="mb-2 text-start">
                <span className="small text-white-50 fw-bold me-2 terminal-font">Level / Rank:</span>
                <span className="text-info fw-bold terminal-font">{activeCard.level} ★</span>
              </div>
            )}

            {typeof activeCard.atk === 'number' && (
              <div className="d-flex align-items-center px-3 py-1 mb-2 rounded" style={{ backgroundColor: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                <span className="small text-white-50 fw-bold me-2 terminal-font">ATK /</span>
                <span className="text-white fw-bold me-4 terminal-font">{activeCard.atk}</span>
                
                <span className="small text-white-50 fw-bold me-2 terminal-font">DEF /</span>
                <span className="text-white fw-bold terminal-font">{activeCard.def ?? '-'}</span>
              </div>
            )}

            <div className="text-start p-2 rounded" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
              <h6 className="small text-info fw-bold border-bottom border-info border-opacity-25 pb-1 mb-2 terminal-font">
                Card Effect / Text
              </h6>
              {/* 🚀 FIXED: Applied terminal-font so it renders in Cascadia Mono */}
              <p 
                className="text-white-50 m-0 terminal-font" 
                style={{ 
                  fontSize: '0.82rem', 
                  lineHeight: '1.45', 
                  minHeight: '160px',
                  maxHeight: '260px', 
                  overflowY: 'auto' 
                }}
              >
                {activeCard.desc}
              </p>
            </div>
          </div>
        </Row>
      </Card.Body>
    </Card>
  );
}