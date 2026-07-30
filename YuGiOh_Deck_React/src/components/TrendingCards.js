import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Card, Badge, Spinner, Button, ProgressBar } from 'react-bootstrap';
import '../mdstyles.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://localhost:8080/api';

export default function TrendingCards({ mdSound }) {
  const [activeFormat, setActiveFormat] = useState('TCG');
  const [trendingCards, setTrendingCards] = useState([]);
  const [totalDecksCount, setTotalDecksCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 6; // 6 cards per page (2 rows x 3 cols on desktop)

  const formats = [
    { name: 'TCG', variant: 'info' },
    { name: 'OCG', variant: 'warning' },
    { name: 'MASTER DUEL', variant: 'success' },
    { name: 'GENESYS', variant: 'danger' }
  ];

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setCurrentPage(1); // Reset to page 1 on format change

    fetch(`${API_BASE_URL}/analytics/trending?format=${encodeURIComponent(activeFormat)}&limit=18`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${activeFormat} analytics`);
        return res.json();
      })
      .then(async (analyticsData) => {
        if (!isMounted) return;

        if (!analyticsData || analyticsData.length === 0) {
          setTrendingCards([]);
          setTotalDecksCount(0);
          setLoading(false);
          return;
        }

        setTotalDecksCount(analyticsData[0]?.totalDecksInFormat || 0);
        const cardIds = analyticsData.map((item) => item.cardId);

        try {
          const ygoRes = await fetch(
            `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${cardIds.join(',')}`
          );

          if (!ygoRes.ok) throw new Error('Failed to fetch card details from YGOProDeck');

          const ygoData = await ygoRes.json();
          const cardMap = {};

          if (ygoData?.data) {
            ygoData.data.forEach((card) => {
              cardMap[card.id.toString()] = card;
            });
          }

          const hydratedCards = analyticsData.map((item) => {
            const cardInfo = cardMap[item.cardId] || {};
            return {
              ...item,
              name: cardInfo.name || `Card ID #${item.cardId}`,
              imageUrl: cardInfo?.card_images?.[0]?.image_url || `https://images.ygoprodeck.com/images/cards/${item.cardId}.jpg`
            };
          });

          if (isMounted) {
            setTrendingCards(hydratedCards);
            setLoading(false);
          }
        } catch (err) {
          if (isMounted) {
            setError(err.message);
            setLoading(false);
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeFormat]);

  // Pagination Math
  const totalPages = Math.ceil(trendingCards.length / cardsPerPage);
  const indexOfLastCard = currentPage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentCards = trendingCards.slice(indexOfFirstCard, indexOfLastCard);

  return (
    <div className="md-theme-bg min-vh-100 py-5 mt-5">
      <Container>
        {/* --- HEADER PANEL --- */}
        <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.98)', backdropFilter: 'blur(10px)' }} text="white" className="border-info shadow-lg p-3 mb-4 md-panel">
          <Card.Header className="bg-transparent border-bottom border-info border-opacity-50 pb-3">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <h3 className="m-0 text-info terminal-font fw-bold" style={{ letterSpacing: '2px' }}>
                  🔥 TRENDING STAPLES & META CARDS
                </h3>
                <span className="small text-white-50">
                  Pre-computed database analytics across tournament meta decklists
                </span>
              </div>
              <div className="d-flex gap-2">
                <Badge bg="info" className="text-dark fw-bold text-uppercase px-3 py-2">
                  {activeFormat} FORMAT
                </Badge>
                <Badge bg="warning" className="text-dark fw-bold text-uppercase px-3 py-2">
                  SAMPLE: {totalDecksCount} DECKS
                </Badge>
              </div>
            </div>
          </Card.Header>
        </Card>

        {/* --- STICKY FORMAT BAR --- */}
        <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.98)', backdropFilter: 'blur(10px)', position: 'sticky', top: '70px', zIndex: 1000 }} text="white" className="shadow-lg p-3 mb-4 md-panel border-info border-opacity-25">
          <Card.Header className="bg-transparent pb-3 d-flex gap-2 flex-wrap">
            {formats.map((fmt) => (
              <Button
                key={fmt.name}
                variant={activeFormat === fmt.name ? fmt.variant : `outline-${fmt.variant}`}
                className="flex-fill fw-bold terminal-font text-nowrap py-2"
                onMouseEnter={() => mdSound?.playHover?.()}
                onClick={() => {
                  mdSound?.playClick?.();
                  setActiveFormat(fmt.name);
                }}
              >
                {fmt.name}
              </Button>
            ))}
          </Card.Header>
        </Card>

        {/* --- CONTENT AREA --- */}
        {loading ? (
          <div className="d-flex justify-content-center align-items-center mt-5">
            <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', backdropFilter: 'blur(10px)', maxWidth: '30rem' }} className="border-info p-4 text-center md-panel shadow-lg">
              <Card.Body>
                <Spinner animation="border" variant="info" className="mb-3" style={{ width: '3rem', height: '3rem' }} />
                <h5 className="text-info terminal-font fw-bold m-0" style={{ letterSpacing: '2px' }}>LOADING DATABASE ANALYTICS...</h5>
              </Card.Body>
            </Card>
          </div>
        ) : error ? (
          <div className="d-flex justify-content-center align-items-center mt-5">
            <Card style={{ backgroundColor: 'rgba(20, 8, 8, 0.95)', backdropFilter: 'blur(10px)', maxWidth: '32rem' }} className="border-danger p-4 text-center md-panel shadow-lg text-white">
              <Card.Body>
                <h4 className="text-danger terminal-font fw-bold mb-3">⚠️ CONNECTION FAILURE</h4>
                <p className="text-white-50 mb-3">{error}</p>
                <Button variant="outline-danger" className="terminal-font fw-bold" onClick={() => setActiveFormat(activeFormat)}>RETRY CONNECTION</Button>
              </Card.Body>
            </Card>
          </div>
        ) : trendingCards.length === 0 ? (
          <div className="text-center py-5 text-white-50 terminal-font">
            <h5>NO TRENDING CARDS ARCHIVED FOR {activeFormat} FORMAT YET</h5>
          </div>
        ) : (
          <>
            {/* --- PAGINATED GRID (6 CARDS PER PAGE) --- */}
            <Row xs={1} sm={2} md={3} className="g-4 mb-4">
              {currentCards.map((card, idx) => {
                const globalIndex = indexOfFirstCard + idx + 1;
                return (
                  <Col key={card.cardId || idx}>
                    <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', backdropFilter: 'blur(10px)' }} text="white" className="border-info border-opacity-30 shadow h-100 md-panel p-3">
                      <Row className="g-3 align-items-center">
                        <Col xs={4} className="position-relative text-center">
                          <Badge bg="info" className="position-absolute top-0 start-0 text-dark fw-bold terminal-font shadow" style={{ zIndex: 2 }}>
                            #{globalIndex}
                          </Badge>
                          <img
                            src={card.imageUrl}
                            alt={card.name}
                            className="img-fluid rounded border border-info border-opacity-25"
                            style={{ maxHeight: '140px', objectFit: 'contain' }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.ygoprodeck.com/images/cards/back_high.jpg';
                            }}
                          />
                        </Col>

                        <Col xs={8}>
                          <h6 className="fw-bold text-white mb-2 terminal-font text-truncate" title={card.name} style={{ fontSize: '0.95rem' }}>
                            {card.name}
                          </h6>

                          <div className="mb-2">
                            <div className="d-flex justify-content-between small text-white-50 mb-1" style={{ fontSize: '0.75rem' }}>
                              <span>INCLUSION:</span>
                              <strong className="text-info">{card.inclusionRate}%</strong>
                            </div>
                            <ProgressBar now={card.inclusionRate} variant={card.inclusionRate > 50 ? 'info' : 'warning'} style={{ height: '6px' }} />
                          </div>

                          <div className="pt-2 border-top border-secondary border-opacity-25" style={{ fontSize: '0.78rem' }}>
                            <div className="d-flex justify-content-between text-white-50">
                              <span>DECKS PLAYED:</span>
                              <strong className="text-white">{card.deckCount} / {card.totalDecksInFormat}</strong>
                            </div>
                            <div className="d-flex justify-content-between text-white-50">
                              <span>AVG COPIES:</span>
                              <strong className="text-warning">{card.avgCopies}x</strong>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                );
              })}
            </Row>

            {/* --- PAGINATION CONTROL BAR --- */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center align-items-center gap-2 mt-4">
                <Button
                  variant="outline-info"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  className="terminal-font fw-bold"
                >
                  ◀ PREV
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'info' : 'outline-secondary'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`terminal-font fw-bold ${currentPage === pageNum ? 'text-dark' : 'text-white'}`}
                  >
                    {pageNum}
                  </Button>
                ))}

                <Button
                  variant="outline-info"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="terminal-font fw-bold"
                >
                  NEXT ▶
                </Button>
              </div>
            )}
          </>
        )}
      </Container>
    </div>
  );
}