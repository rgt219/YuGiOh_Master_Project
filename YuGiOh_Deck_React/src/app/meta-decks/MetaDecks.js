'use client'; 

import React from 'react';
import Link from 'next/link';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Card, Badge, Spinner, Button } from 'react-bootstrap';
import { useMetaDecks } from '@/hooks/useMetaDecks';
import { getFannedCards } from '@/utils/metaDeckHelpers';
import '@/mdstyles.css';

const DECKS_PER_PAGE = 12;

const formats = [
  { name: 'TCG', variant: 'info' },
  { name: 'OCG', variant: 'warning' },
  { name: 'MASTER DUEL', variant: 'success' },
  { name: 'GENESYS', variant: 'danger' }
];

export default function MetaDecks({ mdSound }) {
  const {
    metaDecks,
    activeFormat,
    setActiveFormat,
    loading,
    error,
    currentPage,
    setCurrentPage
  } = useMetaDecks();

  const sortedMetaDecks = [...metaDecks].sort((a, b) => {
    const dateA = new Date(a.lastUpdated || a.LastUpdated || 0);
    const dateB = new Date(b.lastUpdated || b.LastUpdated || 0);
    return dateB - dateA; 
  });

  const totalPages = Math.ceil(sortedMetaDecks.length / DECKS_PER_PAGE) || 1;
  const paginatedDecks = sortedMetaDecks.slice(
    (currentPage - 1) * DECKS_PER_PAGE, 
    currentPage * DECKS_PER_PAGE
  );

  return (
    <div className="md-theme-bg min-vh-100 py-5 mt-5" style={{ fontFamily: "'Cascadia Mono', monospace" }}>
      <style>{`
        .cascadia-font { font-family: 'Cascadia Mono', monospace !important; }
        .ygo-deck-card {
          transition: all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
          transform-style: preserve-3d;
        }
        .ygo-deck-card:hover {
          transform: translateY(-6px) scale(1.015);
          box-shadow: 0 12px 30px rgba(0, 242, 255, 0.18) !important;
          border-color: #00f2ff !important;
        }
        .fanned-container { perspective: 1000px; }
        .card-left, .card-center, .card-right {
          position: absolute;
          transition: all 0.45s cubic-bezier(0.25, 0.8, 0.25, 1);
          transform-origin: bottom center;
          border-radius: 4px;
        }
        .card-left { transform: translateX(-15px) rotate(-6deg) scale(0.9); z-index: 1; opacity: 0.65; filter: brightness(0.6) blur(0.5px); }
        .card-right { transform: translateX(15px) rotate(6deg) scale(0.9); z-index: 2; opacity: 0.65; filter: brightness(0.6) blur(0.5px); }
        .card-center { transform: translateY(0) scale(1); z-index: 3; box-shadow: 0 8px 18px rgba(0,0,0,0.85); }
        
        .ygo-deck-card:hover .card-left { transform: translateX(-68px) translateY(-10px) rotate(-18deg) scale(0.95); opacity: 1; filter: brightness(0.95) blur(0); box-shadow: -8px 12px 20px rgba(0,0,0,0.6); }
        .ygo-deck-card:hover .card-right { transform: translateX(68px) translateY(-10px) rotate(18deg) scale(0.95); opacity: 1; filter: brightness(0.95) blur(0); box-shadow: 8px 12px 20px rgba(0,0,0,0.6); }
        .ygo-deck-card:hover .card-center { transform: translateY(-20px) scale(1.15); z-index: 4; filter: brightness(1.1); box-shadow: 0 15px 35px rgba(0, 242, 255, 0.5); }
        
        .holo-glow {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          width: 0px; height: 0px; background: radial-gradient(circle, rgba(0, 242, 255, 0.35) 0%, rgba(0, 0, 0, 0) 70%);
          border-radius: 50%; transition: all 0.5s ease; z-index: 0; opacity: 0;
        }
        .ygo-deck-card:hover .holo-glow { width: 250px; height: 250px; opacity: 1; }
      `}</style>

      <Container>
        <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.98)', backdropFilter: 'blur(10px)' }} text="white" className="border-info shadow-lg p-3 mb-4 md-panel">
          <Card.Header className="bg-transparent border-bottom border-info border-opacity-50 pb-3">
            <h3 className="m-0 text-info cascadia-font fw-bold" style={{ letterSpacing: '2px' }}>TOURNAMENT META ARCHIVE</h3>
            <span className="small text-white-50 cascadia-font">Real-time competitive metagame profiles & decklists</span>
          </Card.Header>
        </Card>

        <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.98)', backdropFilter: 'blur(10px)', position: 'sticky', top: '70px', zIndex: 1000 }} text="white" className="shadow-lg p-3 mb-4 md-panel border-info border-opacity-25">
          <Card.Header className="bg-transparent pb-3 d-flex gap-2 flex-wrap">
            {formats.map((fmt) => {
              const isActive = activeFormat === fmt.name;
              return (
                <Button
                  key={fmt.name}
                  variant={isActive ? fmt.variant : `outline-${fmt.variant}`}
                  className="flex-fill fw-bold cascadia-font text-nowrap py-2"
                  onMouseEnter={() => mdSound?.playHover?.()}
                  onClick={() => { mdSound?.playClick?.(); setActiveFormat(fmt.name); }}
                >
                  {fmt.name}
                </Button>
              );
            })}
          </Card.Header>
        </Card>

        {loading ? (
          <div className="d-flex justify-content-center align-items-center mt-5">
            <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', backdropFilter: 'blur(10px)', maxWidth: '30rem' }} className="border-info p-4 text-center md-panel shadow-lg">
              <Card.Body>
                <Spinner animation="border" variant="info" className="mb-3" style={{ width: '3rem', height: '3rem' }} />
                <h5 className="text-info cascadia-font fw-bold m-0" style={{ letterSpacing: '1px' }}>ACCESSING METAGAME DATABASE...</h5>
                <p className="text-white-50 small mt-2 m-0 cascadia-font">Synchronizing {activeFormat} tournament archives from MongoDB</p>
              </Card.Body>
            </Card>
          </div>
        ) : error ? (
          <div className="d-flex justify-content-center align-items-center mt-5">
            <Card style={{ backgroundColor: 'rgba(20, 8, 8, 0.95)', backdropFilter: 'blur(10px)', maxWidth: '32rem' }} className="border-danger p-4 text-center md-panel shadow-lg text-white">
              <Card.Body>
                <h4 className="text-danger cascadia-font fw-bold mb-3" style={{ letterSpacing: '2px' }}>CONNECTION FAILURE</h4>
                <p className="text-white-50 mb-3 cascadia-font">{error}</p>
                <Button variant="outline-danger" className="cascadia-font fw-bold" onClick={() => setActiveFormat(prev => prev)}>RETRY CONNECTION</Button>
              </Card.Body>
            </Card>
          </div>
        ) : metaDecks.length === 0 ? (
          <div className="text-center py-5 text-white-50 cascadia-font">
            <h5>NO DECKS ARCHIVED FOR {activeFormat} FORMAT YET</h5>
          </div>
        ) : (
          <>
            <Row xs={1} md={2} lg={3} className="g-4">
              {paginatedDecks.map((deck) => {
                const deckId = deck?.Id || deck?.['_id'] || deck?.['id'];
                const archetype = deck?.archetype || deck?.Archetype || 'TOURNAMENT META DECK';
                const sampleDeck = deck?.sampleDeck || deck?.SampleDeck;
                const mainDeck = sampleDeck?.mainDeck || sampleDeck?.MainDeck || [];
                const extraDeck = sampleDeck?.extraDeck || sampleDeck?.ExtraDeck || [];
                const sideDeck = sampleDeck?.sideDeck || sampleDeck?.SideDeck || [];
                // 1. Grab the raw placement string from the database
                const rawPlacement = deck?.placement || deck?.Placement || 'Tournament Placement';

                // 2. Extract just the year from the existing lastUpdated date
                const deckYear = (deck?.lastUpdated || deck?.LastUpdated) 
                  ? new Date(deck.lastUpdated || deck.LastUpdated).getFullYear() 
                  : new Date().getFullYear();

                const finalBadgeText = `${rawPlacement} ${deckYear}`;

                const fannedCardIds = getFannedCards(mainDeck, extraDeck, sideDeck);

                return (
                  <Col key={deckId || archetype}>
                    <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', backdropFilter: 'blur(10px)' }} text="white" className="border-info border-opacity-50 shadow h-100 md-panel ygo-deck-card d-flex flex-column">
                      <Card.Header className="bg-transparent border-bottom border-info border-opacity-25 px-3 py-3">
                        <div className="d-flex flex-column gap-2">
                          <h5 className="m-0 fw-bold text-white cascadia-font" style={{ fontSize: '1.25rem', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.2' }} title={archetype}>
                            {archetype}
                          </h5>
                          <div className="d-flex align-items-center">
                          <Badge bg="dark" className="text-light fw-bold px-2 py-1 cascadia-font border border-secondary border-opacity-50" style={{ fontSize: '0.8rem' }}>
                            {finalBadgeText}
                          </Badge>
                          </div>
                        </div>
                      </Card.Header>

                      <Card.Body className="d-flex flex-column justify-content-between p-3">
                        <div>
                          <div className="my-3 d-flex justify-content-center align-items-center position-relative fanned-container" style={{ height: '220px', width: '100%' }}>
                            <div className="holo-glow"></div>
                            <img src={`https://images.ygoprodeck.com/images/cards/${fannedCardIds[0]}.jpg`} alt="Card 1" className="border border-info border-opacity-25 card-left" style={{ height: '170px', objectFit: 'contain' }} onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.ygoprodeck.com/images/cards/back_high.jpg'; }} />
                            <img src={`https://images.ygoprodeck.com/images/cards/${fannedCardIds[2]}.jpg`} alt="Card 3" className="border border-info border-opacity-25 card-right" style={{ height: '170px', objectFit: 'contain' }} onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.ygoprodeck.com/images/cards/back_high.jpg'; }} />
                            <img src={`https://images.ygoprodeck.com/images/cards/${fannedCardIds[1]}.jpg`} alt="Card 2" className="border border-info card-center" style={{ height: '185px', objectFit: 'contain' }} onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.ygoprodeck.com/images/cards/back_high.jpg'; }} />
                          </div>

                          <div className="d-flex align-items-center mb-2">
                            <span className="badge bg-dark border border-success text-warning px-2 py-1 cascadia-font text-truncate" style={{ fontSize: '0.85rem', maxWidth: '100%' }}>
                              PILOT: {deck?.pilot || deck?.Author || activeFormat}
                            </span>
                          </div>

                          <div className="p-2.5 rounded mb-2" style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                            <h6 className="text-info fw-bold border-bottom border-info border-opacity-25 pb-1 mb-1.5 cascadia-font" style={{ fontSize: '0.85rem', letterSpacing: '1px' }}>DECK BREAKDOWN</h6>
                            <div className="d-flex justify-content-between text-white cascadia-font" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                              <span className="text-white-50">MAIN DECK:</span>
                              <strong className="text-info">{mainDeck.length} CARDS</strong>
                            </div>
                            <div className="d-flex justify-content-between text-white cascadia-font" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                              <span className="text-white-50">EXTRA DECK:</span>
                              <strong className="text-warning">{extraDeck.length} CARDS</strong>
                            </div>
                            <div className="d-flex justify-content-between text-white cascadia-font" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                              <span className="text-white-50">SIDE DECK:</span>
                              <strong className="text-success">{sideDeck.length} CARDS</strong>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-top border-secondary border-opacity-25 mt-1">
                          <div className="d-flex align-items-center justify-content-between mb-1.5">
                            <span className="small text-white-50 cascadia-font" style={{ fontSize: '0.75rem' }}>LAST UPDATED:</span>
                            <span className="small text-info cascadia-font" style={{ fontSize: '0.8rem' }}>
                              {(deck?.lastUpdated || deck?.LastUpdated) ? new Date(deck.lastUpdated || deck.LastUpdated).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'RECENTLY'}
                            </span>
                          </div>

                          <Button as={Link} href={`/meta-decks/${deckId}`} variant="outline-info" className="w-100 fw-bold cascadia-font text-nowrap py-1.5 mt-1" style={{ fontSize: '0.9rem', letterSpacing: '0.5px' }} onMouseEnter={() => mdSound?.playHover?.()} onClick={() => mdSound?.playClick?.()}>
                            VIEW DECK PROFILE
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>

            {totalPages > 1 && (
              <div className="d-flex align-items-center justify-content-center gap-3 mt-5 pt-4 border-top border-info border-opacity-25">
                <Button variant="outline-info" className="cascadia-font fw-bold px-4" disabled={currentPage === 1} onMouseEnter={() => mdSound?.playHover?.()} onClick={() => { mdSound?.playClick?.(); setCurrentPage(prev => Math.max(prev - 1, 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                  ◄ PREV
                </Button>
                <span className="text-info cascadia-font fw-bold px-3">PAGE {currentPage} OF {totalPages}</span>
                <Button variant="outline-info" className="cascadia-font fw-bold px-4" disabled={currentPage === totalPages} onMouseEnter={() => mdSound?.playHover?.()} onClick={() => { mdSound?.playClick?.(); setCurrentPage(prev => Math.min(prev + 1, totalPages)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                  NEXT ►
                </Button>
              </div>
            )}
          </>
        )}
      </Container>
    </div>
  );
}