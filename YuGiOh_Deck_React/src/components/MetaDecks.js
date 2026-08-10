'use client'; // 👈 Required for hooks, state, and client audio/clicks

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Card, Badge, Spinner, Button } from 'react-bootstrap';
import '../mdstyles.css';

// Base API URL configuration (Supports Next.js & React App env vars)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || 
  'https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api';

export default function MetaDecks({ mdSound }) {
  const [metaDecks, setMetaDecks] = useState([]);
  const [activeFormat, setActiveFormat] = useState('TCG'); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formats = [
    { name: 'TCG', variant: 'info' },
    { name: 'OCG', variant: 'warning' },
    { name: 'MASTER DUEL', variant: 'success' },
    { name: 'GENESYS', variant: 'danger' }
  ];

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`${API_BASE_URL}/metadecks?format=${encodeURIComponent(activeFormat)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch ${activeFormat} tournament meta decks`);
        return res.json();
      })
      .then((data) => {
        setMetaDecks(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [activeFormat]);

  return (
    <div className="md-theme-bg min-vh-100 py-5 mt-5">
      <Container>
        {/* --- HEADER PANEL --- */}
        <Card 
          style={{ 
            backgroundColor: 'rgba(8, 12, 20, 0.98)', 
            backdropFilter: 'blur(10px)' 
          }} 
          text="white" 
          className="border-info shadow-lg p-3 mb-4 md-panel"
        >
          <Card.Header className="bg-transparent border-bottom border-info border-opacity-50 pb-3">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <h3 className="m-0 text-info terminal-font fw-bold" style={{ letterSpacing: '2px' }}>
                  TOURNAMENT META ARCHIVE
                </h3>
                <span className="small text-white-50">Real-time competitive metagame profiles & decklists</span>
              </div>
            </div>
          </Card.Header>
        </Card>

        {/* --- DYNAMIC FORMAT BUTTON BAR --- */}
        <Card 
          style={{ 
            backgroundColor: 'rgba(8, 12, 20, 0.98)', 
            backdropFilter: 'blur(10px)',
            position: 'sticky',
            top: '70px',
            zIndex: 1000
          }} 
          text="white" 
          className="shadow-lg p-3 mb-4 md-panel border-info border-opacity-25"
        >
          <Card.Header className="bg-transparent pb-3 d-flex gap-2 flex-wrap">
            {formats.map((fmt) => {
              const isActive = activeFormat === fmt.name;
              return (
                <Button
                  key={fmt.name}
                  variant={isActive ? fmt.variant : `outline-${fmt.variant}`}
                  className="flex-fill fw-bold terminal-font text-nowrap py-2"
                  onMouseEnter={() => mdSound?.playHover?.()}
                  onClick={() => {
                    mdSound?.playClick?.();
                    setActiveFormat(fmt.name);
                  }}
                >
                  {fmt.name}
                </Button>
              );
            })}
          </Card.Header>
        </Card>

        {/* --- LOADING SCREEN --- */}
        {loading ? (
          <div className="d-flex justify-content-center align-items-center mt-5">
            <Card 
              style={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', backdropFilter: 'blur(10px)', maxWidth: '30rem' }} 
              className="border-info p-4 text-center md-panel shadow-lg"
            >
              <Card.Body>
                <Spinner animation="border" variant="info" className="mb-3" style={{ width: '3rem', height: '3rem' }} />
                <h5 className="text-info terminal-font fw-bold m-0" style={{ letterSpacing: '2px' }}>
                  ACCESSING METAGAME DATABASE...
                </h5>
                <p className="text-white-50 small mt-2 m-0">Synchronizing {activeFormat} tournament archives from MongoDB</p>
              </Card.Body>
            </Card>
          </div>
        ) : error ? (
          <div className="d-flex justify-content-center align-items-center mt-5">
            <Card 
              style={{ backgroundColor: 'rgba(20, 8, 8, 0.95)', backdropFilter: 'blur(10px)', maxWidth: '32rem' }} 
              className="border-danger p-4 text-center md-panel shadow-lg text-white"
            >
              <Card.Body>
                <h4 className="text-danger terminal-font fw-bold mb-3" style={{ letterSpacing: '2px' }}>
                  ⚠️ CONNECTION FAILURE
                </h4>
                <p className="text-white-50 mb-3">{error}</p>
                <Button 
                  variant="outline-danger" 
                  className="terminal-font fw-bold"
                  onClick={() => setActiveFormat(activeFormat)}
                >
                  RETRY CONNECTION
                </Button>
              </Card.Body>
            </Card>
          </div>
        ) : metaDecks.length === 0 ? (
          <div className="text-center py-5 text-white-50 terminal-font">
            <h5>NO DECKS ARCHIVED FOR {activeFormat} FORMAT YET</h5>
          </div>
        ) : (
          <Row xs={1} md={2} lg={3} className="g-4">
            {metaDecks.map((deck) => {
              const deckId = deck?.Id || deck?.['_id'] || deck?.['id'];
              const archetype = deck?.archetype || deck?.Archetype || 'TOURNAMENT META DECK';
              const sampleDeck = deck?.sampleDeck || deck?.SampleDeck;
              const mainDeck = sampleDeck?.mainDeck || sampleDeck?.MainDeck || [];
              const extraDeck = sampleDeck?.extraDeck || sampleDeck?.ExtraDeck || [];
              const sideDeck = sampleDeck?.sideDeck || sampleDeck?.SideDeck || [];

              const coverCardId = mainDeck?.[0];
              const coverImageUrl = coverCardId 
                ? `https://images.ygoprodeck.com/images/cards/${coverCardId}.jpg`
                : 'https://images.ygoprodeck.com/images/cards/back_high.jpg';

              return (
                <Col key={deckId || archetype}>
                  <Card 
                    style={{ 
                      backgroundColor: 'rgba(8, 12, 20, 0.95)', 
                      backdropFilter: 'blur(10px)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }} 
                    text="white" 
                    className="border-info border-opacity-50 shadow h-100 md-panel card-hover"
                  >
                    <Card.Header 
                      className="bg-transparent border-bottom border-info border-opacity-25 pt-3 pb-2" 
                      style={{ minHeight: '85px' }}
                    >
                      <div>
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <h5 
                            className="m-0 fw-bold text-white" 
                            style={{ 
                              fontFamily: 'Cascadia Mono, monospace', 
                              letterSpacing: '0.5px', 
                              fontSize: '1.05rem',
                              display: '-webkit-box',
                              WebkitLineClamp: '2',
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: '1.3'
                            }}
                            title={archetype}
                          >
                            {archetype}
                          </h5>
                          <Badge bg="warning" className="text-dark fw-bold text-uppercase fs-7 flex-shrink-0">
                            {deck?.tier || deck?.Tier || 'TIER 1'}
                          </Badge>
                        </div>

                        <div className="mt-2 d-flex align-items-center justify-content-between">
                          <Badge bg="dark" className="text-light fw-bold px-3 py-2">
                            🏆 {
                                  (deck?.placement || deck?.Placement || 'Tournament Placement')
                                    .replace(/Reached/gi, '')
                                    .replace(/\bat\b/gi, '@')
                                    .replace(/\s+/g, ' ')
                                    .trim()
                                }
                          </Badge>
                        </div>
                      </div>
                    </Card.Header>

                    <Card.Body className="d-flex flex-column justify-content-between">
                      <div>
                        <div className="text-center my-3">
                          <img 
                            src={coverImageUrl} 
                            alt={archetype}
                            className="img-fluid rounded border border-info border-opacity-25"
                            style={{ 
                              maxHeight: '210px', 
                              objectFit: 'contain',
                              boxShadow: '0 0 15px rgba(0, 240, 255, 0.25)'
                            }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.ygoprodeck.com/images/cards/back_high.jpg';
                            }}
                          />
                        </div>

                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="badge bg-dark border border-success text-warning fs-6">
                            PILOT: {deck?.pilot || deck?.Author || activeFormat}
                          </span>
                        </div>

                        <div 
                          className="p-3 rounded mb-3" 
                          style={{ 
                            backgroundColor: 'rgba(0, 0, 0, 0.6)', 
                            border: '1px solid rgba(0, 240, 255, 0.2)' 
                          }}
                        >
                          <h6 className="small text-info fw-bold border-bottom border-info border-opacity-25 pb-2 mb-2 terminal-font">
                            DECK BREAKDOWN
                          </h6>
                          
                          <div className="d-flex justify-content-between small text-white mb-1">
                            <span className="text-white-50">MAIN DECK:</span>
                            <strong className="text-info">{mainDeck.length} CARDS</strong>
                          </div>
                          <div className="d-flex justify-content-between small text-white mb-1">
                            <span className="text-white-50">EXTRA DECK:</span>
                            <strong className="text-warning">{extraDeck.length} CARDS</strong>
                          </div>
                          <div className="d-flex justify-content-between small text-white">
                            <span className="text-white-50">SIDE DECK:</span>
                            <strong className="text-success">{sideDeck.length} CARDS</strong>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-top border-secondary border-opacity-25">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="small text-white-50">LAST UPDATED:</span>
                          <span className="small text-info terminal-font">
                            {(deck?.lastUpdated || deck?.LastUpdated)
                              ? new Date(deck.lastUpdated || deck.LastUpdated).toLocaleDateString(undefined, { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                }) 
                              : 'RECENTLY'}
                          </span>
                        </div>

                        <Button
                          as={Link}
                          href={`/meta-decks/${deckId}`} // ⚡ Updated from 'to' to 'href'
                          variant="outline-info"
                          className="w-100 fw-bold terminal-font text-nowrap py-2 mt-2"
                          onMouseEnter={() => mdSound?.playHover?.()}
                          onClick={() => mdSound?.playClick?.()}
                        >
                          📊 VIEW DECK PROFILE
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Container>
    </div>
  );
}