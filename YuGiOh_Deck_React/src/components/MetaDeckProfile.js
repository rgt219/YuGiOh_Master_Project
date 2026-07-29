import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Card, Badge, Spinner, Button } from 'react-bootstrap';
import '../mdstyles.css';
import DeckPriceWidget from './DeckPriceWidget';

// Helper function to map card attributes to Master Duel Bootstrap badge variants
const getAttributeColor = (attribute) => {
  if (!attribute) return 'secondary';
  switch (attribute.toUpperCase()) {
    case 'LIGHT': return 'warning';
    case 'DARK': return 'dark';
    case 'FIRE': return 'danger';
    case 'WATER': return 'primary';
    case 'WIND': return 'success';
    case 'EARTH': return 'secondary';
    case 'DIVINE': return 'warning';
    default: return 'info';
  }
};

export default function MetaDeckProfile() {
  const { id } = useParams();
  const [deck, setDeck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Card Details Cache Map { [id]: cardDataObject }
  const [cardMap, setCardMap] = useState({});
  const [cardCounts, setCardCounts] = useState({ monsters: 0, spells: 0, traps: 0 });
  const [hoveredCardData, setHoveredCardData] = useState(null);
  const [pinnedCardData, setPinnedCardData] = useState(null); // 📌 Lock inspector card state

  useEffect(() => {
    if (!id || id === 'undefined') {
      setError('Invalid Deck ID provided.');
      setLoading(false);
      return;
    }

    // 1. Fetch Meta Deck Profile from .NET API
    fetch(`https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api/metadecks/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.message || `Server responded with HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(async (deckData) => {
        setDeck(deckData);

        // 2. Extract card arrays handling all PascalCase / camelCase variants
        const sampleDeck = deckData?.sampleDeck || deckData?.SampleDeck;
        const mainDeckIds = sampleDeck?.mainDeck || sampleDeck?.MainDeck || [];
        const extraDeckIds = sampleDeck?.extraDeck || sampleDeck?.ExtraDeck || [];
        const sideDeckIds = sampleDeck?.sideDeck || sampleDeck?.SideDeck || [];

        const allDeckIds = [...mainDeckIds, ...extraDeckIds, ...sideDeckIds];
        const uniqueIds = [...new Set(allDeckIds)];

        // 3. Bulk fetch card information from YGOProDeck API
        if (uniqueIds.length > 0) {
          try {
            const ygoRes = await fetch(
              `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${uniqueIds.join(',')}`
            );
            
            if (ygoRes.ok) {
              const ygoData = await ygoRes.json();
              if (ygoData?.data) {
                const map = {};
                ygoData.data.forEach((c) => {
                  map[c.id.toString()] = c;
                });
                setCardMap(map);

                // Calculate Monster / Spell / Trap counts for Main Deck
                let monsters = 0;
                let spells = 0;
                let traps = 0;

                mainDeckIds.forEach((cardId) => {
                  const info = map[cardId.toString()];
                  if (info) {
                    const type = info.type.toLowerCase();
                    if (type.includes('spell')) spells++;
                    else if (type.includes('trap')) traps++;
                    else monsters++;
                  } else {
                    monsters++;
                  }
                });

                setCardCounts({ monsters, spells, traps });

                // Set default hovered card to first card in Main Deck
                if (mainDeckIds[0] && map[mainDeckIds[0].toString()]) {
                  setHoveredCardData(map[mainDeckIds[0].toString()]);
                }
              }
            }
          } catch (err) {
            console.warn('Could not fetch detailed card info from YGOProDeck:', err);
          }
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching meta deck profile:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="md-theme-bg min-vh-100 d-flex justify-content-center align-items-center mt-5">
        <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', backdropFilter: 'blur(10px)', maxWidth: '30rem' }} className="border-info p-4 text-center md-panel shadow-lg">
          <Card.Body>
            <Spinner animation="border" variant="info" className="mb-3" style={{ width: '3rem', height: '3rem' }} />
            <h5 className="text-info terminal-font fw-bold m-0" style={{ letterSpacing: '2px' }}>LOADING DECK PROFILE...</h5>
          </Card.Body>
        </Card>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="md-theme-bg min-vh-100 d-flex justify-content-center align-items-center mt-5">
        <Card style={{ backgroundColor: 'rgba(20, 8, 8, 0.95)', backdropFilter: 'blur(10px)', maxWidth: '32rem' }} className="border-danger p-4 text-center md-panel shadow-lg text-white">
          <Card.Body>
            <h4 className="text-danger terminal-font fw-bold mb-3">⚠️ PROFILE NOT FOUND</h4>
            <p className="text-white-50">{error || 'Deck could not be retrieved.'}</p>
            <Button as={Link} to="/meta-decks" variant="outline-danger" className="terminal-font fw-bold">
              RETURN TO ARCHIVE
            </Button>
          </Card.Body>
        </Card>
      </div>
    );
  }

  // Property casing fallbacks
  const archetype = deck?.archetype || deck?.Archetype || 'TOURNAMENT META DECK';
  const deckIdStr = deck?.id || deck?.Id || id || '';
  const format = deck?.format || deck?.Format || 'TCG';
  const pilot = deck?.pilot || deck?.Pilot || '--------';
  const placement = deck?.placement || deck?.Placement || 'Unknown';
  const tier = deck?.tier || deck?.Tier || 'TIER 1';
  const sampleDeck = deck?.sampleDeck || deck?.SampleDeck;
  const mainDeckIds = sampleDeck?.mainDeck || sampleDeck?.MainDeck || [];
  const extraDeckIds = sampleDeck?.extraDeck || sampleDeck?.ExtraDeck || [];
  const sideDeckIds = sampleDeck?.sideDeck || sampleDeck?.SideDeck || [];

  // Map card IDs to full card objects for DeckPriceWidget
  const mainDeckCards = mainDeckIds.map((cId) => cardMap[cId.toString()]).filter(Boolean);
  const extraDeckCards = extraDeckIds.map((cId) => cardMap[cId.toString()]).filter(Boolean);
  const sideDeckCards = sideDeckIds.map((cId) => cardMap[cId.toString()]).filter(Boolean);

  // Pie Chart Mathematics
  const totalCards = cardCounts.monsters + cardCounts.spells + cardCounts.traps || mainDeckIds.length || 1;
  const monsterPct = Math.round((cardCounts.monsters / totalCards) * 100);
  const spellPct = Math.round((cardCounts.spells / totalCards) * 100);
  const trapPct = Math.max(0, 100 - (monsterPct + spellPct));

  // Conic Gradient Angles
  const monsterDeg = (monsterPct / 100) * 360;
  const spellDeg = monsterDeg + (spellPct / 100) * 360;

  // Active card prioritizing Pinned card -> Hovered card -> Fallback
  const activeCard = pinnedCardData || hoveredCardData || {
    name: archetype,
    type: 'TOURNAMENT DECK',
    desc: 'Click or hover over any card thumbnail in the decklists below to view its full stats, level, ATK/DEF, and card effect text.',
    card_images: [{ image_url: `https://images.ygoprodeck.com/images/cards/${mainDeckIds[0] || 'back_high'}.jpg` }]
  };

  const activeImageUrl = activeCard?.card_images?.[0]?.image_url || 
    (activeCard?.id ? `https://images.ygoprodeck.com/images/cards/${activeCard.id}.jpg` : 'https://images.ygoprodeck.com/images/cards/back_high.jpg');

  // Hover Handler: Only updates if NO card is currently pinned
  const handleCardHover = (cardData) => {
    if (!pinnedCardData && cardData) {
      setHoveredCardData(cardData);
    }
  };

  // Click Handler: Pins/Locks card into Inspector
  const handleCardClick = (cardData) => {
    if (!cardData) return;
    if (pinnedCardData?.id === cardData.id) {
      setPinnedCardData(null); // Unpin if clicking same card
    } else {
      setPinnedCardData(cardData); // Pin new card
    }
  };

  return (
    <div className="md-theme-bg min-vh-100 py-5 mt-5">
      <Container fluid="xl">
        {/* BACK NAVIGATION BUTTON */}
        <div className="mb-3">
          <Button as={Link} to="/meta-decks" variant="outline-info" size="sm" className="terminal-font fw-bold">
            ← BACK TO META ARCHIVE
          </Button>
        </div>

        {/* --- HEADER PANEL & PIE CHART SUMMARY --- */}
        <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.98)', backdropFilter: 'blur(10px)' }} text="white" className="border-info shadow-lg p-4 mb-4 md-panel">
          <Card.Header className="bg-transparent border-bottom border-info border-opacity-50 pb-3 mb-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <h2 className="m-0 text-info terminal-font fw-bold" style={{ letterSpacing: '2px' }}>
                  {archetype}
                </h2>
                <span className="small text-white-50">DECK ID: #{deckIdStr.substring(0, 8)}...</span>
              </div>
              <div className="d-flex gap-2">
                <Badge bg="success" className="text-dark fw-bold px-3 py-2">PILOT: {pilot}</Badge>
                <Badge bg="dark" className="text-light fw-bold px-3 py-2">PLACEMENT: {placement}</Badge>
                <Badge bg="info" className="text-dark fw-bold px-3 py-2">FORMAT: {format}</Badge>
                <Badge bg="warning" className="text-dark fw-bold px-3 py-2">{tier}</Badge>
              </div>
            </div>
          </Card.Header>

          <Card.Body>
            <div className="p-3 rounded mb-2" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
              <h5 className="text-info terminal-font fw-bold border-bottom border-info border-opacity-25 pb-2 mb-3">
                📊 MAIN DECK COMPOSITION RATIO
              </h5>

              <Row className="align-items-center g-3">
                {/* --- CONIC GRADIENT PIE CHART --- */}
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

                {/* --- PIE CHART LEGEND --- */}
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

        {/* --- INTERACTIVE DECKLIST, CARD INSPECTOR & PRICE WIDGET SECTION --- */}
        <Row className="g-4">
          {/* --- LEFT COLUMN: STICKY CARD INSPECTOR + DECK PRICE WIDGET --- */}
          <Col lg={5} className="order-lg-1">
            <div style={{ position: 'sticky', top: '90px' }}>
              {/* 1. CARD INSPECTOR */}
              <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.98)', backdropFilter: 'blur(10px)' }} text="white" className="border-info shadow-lg p-3 mb-4 md-panel">
                <Card.Header className="bg-transparent border-bottom border-info border-opacity-50 pb-2 mb-3 d-flex justify-content-between align-items-center">
                  <h6 className="m-0 text-info terminal-font fw-bold" style={{ letterSpacing: '1px' }}>
                    🔍 CARD INSPECTOR
                  </h6>
                  {pinnedCardData ? (
                    <Badge 
                      bg="info" 
                      className="text-dark fw-bold terminal-font text-uppercase px-2 py-1"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setPinnedCardData(null)}
                      title="Click to unlock inspector"
                    >
                      📌 PINNED (CLICK UNPIN)
                    </Badge>
                  ) : (
                    <span className="small text-white-50" style={{ fontSize: '0.75rem' }}>
                      💡 Click card to lock
                    </span>
                  )}
                </Card.Header>

                <Card.Body className="p-2">
                  <Row className="g-3 align-items-start">
                    {/* Card Preview Image */}
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

                    {/* Card Details (Right Side of Inspector) */}
                    <div className="col-12 col-sm-7">
                      <h5 className="fw-bold mb-2 text-white" style={{ fontFamily: "Cascadia Mono, monospace", letterSpacing: '1px', fontSize: '1rem' }}>
                        {activeCard.name}
                      </h5>

                      {/* Badges Row */}
                      <div className="d-flex align-items-center mb-2 flex-wrap gap-1">
                        {activeCard.type && (
                          <Badge bg="dark" className="border border-secondary text-uppercase fs-7">
                            {activeCard.type}
                          </Badge>
                        )}
                        {activeCard.race && (
                          <Badge bg="dark" className="border border-secondary text-uppercase fs-7">
                            {activeCard.race}
                          </Badge>
                        )}
                        {activeCard.attribute && (
                          <Badge bg={getAttributeColor(activeCard.attribute)} className="ms-auto text-uppercase fs-7 fw-bold">
                            {activeCard.attribute}
                          </Badge>
                        )}
                      </div>

                      {/* Level / Rank Stars */}
                      {activeCard.level && (
                        <div className="mb-2 text-start">
                          <span className="small text-white-50 fw-bold me-2">Level / Rank:</span>
                          <span className="text-info fw-bold">{activeCard.level} ★</span>
                        </div>
                      )}

                      {/* ATK / DEF Stat Bar */}
                      {typeof activeCard.atk === 'number' && (
                        <div className="d-flex align-items-center px-3 py-1 mb-2 rounded" style={{ backgroundColor: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                          <span className="small text-white-50 fw-bold me-2">ATK /</span>
                          <span className="text-white fw-bold me-4">{activeCard.atk}</span>
                          
                          <span className="small text-white-50 fw-bold me-2">DEF /</span>
                          <span className="text-white fw-bold">{activeCard.def ?? '-'}</span>
                        </div>
                      )}

                      {/* Card Effect Text Box (EXPANDED HEIGHT & SCROLLABLE) */}
                      <div className="text-start p-2 rounded" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                        <h6 className="small text-info fw-bold border-bottom border-info border-opacity-25 pb-1 mb-2">
                          Card Effect / Text
                        </h6>
                        <p 
                          className="text-white-50 m-0" 
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

              {/* 2. DECK PRICE WIDGET (Placed Underneath Inspector) */}
              <DeckPriceWidget 
                mainDeck={mainDeckCards} 
                extraDeck={extraDeckCards} 
                sideDeck={sideDeckCards} 
              />
            </div>
          </Col>

          {/* --- RIGHT COLUMN: FULL DECKLIST GRIDS (MAIN, EXTRA, SIDE) --- */}
          <Col lg={7} className="order-lg-2">
            {/* 1. MAIN DECK GRID */}
            <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', backdropFilter: 'blur(10px)' }} text="white" className="border-info shadow-lg p-3 mb-4 md-panel">
              <Card.Header className="bg-transparent border-bottom border-info border-opacity-25 pb-2 mb-3 d-flex justify-content-between align-items-center">
                <h5 className="m-0 text-info terminal-font fw-bold">
                  🃏 MAIN DECK ({mainDeckIds.length})
                </h5>
                <span className="small text-white-50">40 - 60 Cards</span>
              </Card.Header>
              <Card.Body className="p-1">
                <div className="d-flex flex-wrap gap-2 justify-content-start">
                  {mainDeckIds.map((cardId, index) => {
                    const cardData = cardMap[cardId.toString()];
                    const imgUrl = cardData?.card_images?.[0]?.image_url_small || `https://images.ygoprodeck.com/images/cards_small/${cardId}.jpg`;
                    const isPinned = pinnedCardData?.id === cardData?.id;

                    return (
                      <div
                        key={`main-${cardId}-${index}`}
                        className="position-relative card-thumbnail-wrap"
                        style={{ 
                          cursor: 'pointer', 
                          transition: 'transform 0.15s ease, filter 0.15s ease',
                          transform: isPinned ? 'scale(1.08)' : 'scale(1)',
                          zIndex: isPinned ? 2 : 1
                        }}
                        onMouseEnter={() => handleCardHover(cardData)}
                        onClick={() => handleCardClick(cardData)}
                      >
                        <img
                          src={imgUrl}
                          alt={cardData?.name || cardId}
                          className={`rounded border ${isPinned ? 'border-info border-2 shadow-lg' : 'border-secondary'}`}
                          style={{ width: '62px', height: '90px', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.ygoprodeck.com/images/cards/back_high.jpg';
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </Card.Body>
            </Card>

            {/* 2. EXTRA DECK GRID */}
            {extraDeckIds.length > 0 && (
              <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', backdropFilter: 'blur(10px)' }} text="white" className="border-warning border-opacity-50 shadow-lg p-3 mb-4 md-panel">
                <Card.Header className="bg-transparent border-bottom border-warning border-opacity-25 pb-2 mb-3 d-flex justify-content-between align-items-center">
                  <h5 className="m-0 text-warning terminal-font fw-bold">
                    🔮 EXTRA DECK ({extraDeckIds.length})
                  </h5>
                  <span className="small text-white-50">0 - 15 Cards</span>
                </Card.Header>
                <Card.Body className="p-1">
                  <div className="d-flex flex-wrap gap-2 justify-content-start">
                    {extraDeckIds.map((cardId, index) => {
                      const cardData = cardMap[cardId.toString()];
                      const imgUrl = cardData?.card_images?.[0]?.image_url_small || `https://images.ygoprodeck.com/images/cards_small/${cardId}.jpg`;
                      const isPinned = pinnedCardData?.id === cardData?.id;

                      return (
                        <div
                          key={`extra-${cardId}-${index}`}
                          className="position-relative card-thumbnail-wrap"
                          style={{ 
                            cursor: 'pointer', 
                            transition: 'transform 0.15s ease, filter 0.15s ease',
                            transform: isPinned ? 'scale(1.08)' : 'scale(1)',
                            zIndex: isPinned ? 2 : 1
                          }}
                          onMouseEnter={() => handleCardHover(cardData)}
                          onClick={() => handleCardClick(cardData)}
                        >
                          <img
                            src={imgUrl}
                            alt={cardData?.name || cardId}
                            className={`rounded border ${isPinned ? 'border-warning border-2 shadow-lg' : 'border-warning border-opacity-50'}`}
                            style={{ width: '62px', height: '90px', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.ygoprodeck.com/images/cards/back_high.jpg';
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* 3. SIDE DECK GRID */}
            {sideDeckIds.length > 0 && (
              <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', backdropFilter: 'blur(10px)' }} text="white" className="border-success border-opacity-50 shadow-lg p-3 md-panel">
                <Card.Header className="bg-transparent border-bottom border-success border-opacity-25 pb-2 mb-3 d-flex justify-content-between align-items-center">
                  <h5 className="m-0 text-success terminal-font fw-bold">
                    ⚔️ SIDE DECK ({sideDeckIds.length})
                  </h5>
                  <span className="small text-white-50">0 - 15 Cards</span>
                </Card.Header>
                <Card.Body className="p-1">
                  <div className="d-flex flex-wrap gap-2 justify-content-start">
                    {sideDeckIds.map((cardId, index) => {
                      const cardData = cardMap[cardId.toString()];
                      const imgUrl = cardData?.card_images?.[0]?.image_url_small || `https://images.ygoprodeck.com/images/cards_small/${cardId}.jpg`;
                      const isPinned = pinnedCardData?.id === cardData?.id;

                      return (
                        <div
                          key={`side-${cardId}-${index}`}
                          className="position-relative card-thumbnail-wrap"
                          style={{ 
                            cursor: 'pointer', 
                            transition: 'transform 0.15s ease, filter 0.15s ease',
                            transform: isPinned ? 'scale(1.08)' : 'scale(1)',
                            zIndex: isPinned ? 2 : 1
                          }}
                          onMouseEnter={() => handleCardHover(cardData)}
                          onClick={() => handleCardClick(cardData)}
                        >
                          <img
                            src={imgUrl}
                            alt={cardData?.name || cardId}
                            className={`rounded border ${isPinned ? 'border-success border-2 shadow-lg' : 'border-success border-opacity-50'}`}
                            style={{ width: '62px', height: '90px', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.ygoprodeck.com/images/cards/back_high.jpg';
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
}