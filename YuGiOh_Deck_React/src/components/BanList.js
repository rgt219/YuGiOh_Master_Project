'use client'; 

import React, { useState, useEffect } from 'react';
import { Modal, Row, Col, Badge, Spinner } from 'react-bootstrap';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || 
  'https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api';

const getCardTypeRank = (typeStr) => {
  if (!typeStr) return 99;
  const t = typeStr.toLowerCase();

  if (t.includes("normal monster") || (t.includes("normal") && t.includes("monster") && !t.includes("effect"))) {
    return 1;
  }
  if (t.includes("fusion")) {
    return 3;
  }
  if (t.includes("link")) {
    return 4;
  }
  if (t.includes("synchro")) {
    return 5;
  }
  if (t.includes("xyz")) {
    return 6;
  }
  if (t.includes("spell")) {
    return 7;
  }
  if (t.includes("trap")) {
    return 8;
  }
  if (t.includes("monster") || t.includes("effect") || t.includes("tuner")) {
    return 2;
  }

  return 99;
};

// Helper to render Level / Rank stars
const renderLevelStars = (level) => {
  if (!level) return null;
  return (
    <div className="d-flex align-items-center gap-1">
      <span className="text-warning fw-bold small">LEVEL / RANK {level}</span>
      <span className="text-warning">{"★".repeat(Math.min(level, 12))}</span>
    </div>
  );
};

// Helper to render color-coded Banlist Status badges
const renderBanBadge = (status) => {
  const s = (status || "Unlimited").toUpperCase();
  if (s === "FORBIDDEN" || s === "BANNED") return <Badge bg="danger" className="terminal-font shadow-sm px-2 py-1" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>FORBIDDEN</Badge>;
  if (s === "LIMITED") return <Badge bg="warning" className="text-dark terminal-font shadow-sm px-2 py-1" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>LIMITED</Badge>;
  if (s === "SEMI-LIMITED") return <Badge bg="info" className="text-dark terminal-font shadow-sm px-2 py-1" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>SEMI-LIMITED</Badge>;
  return <Badge bg="success" className="terminal-font shadow-sm px-2 py-1" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>UNLIMITED</Badge>;
};

export default function BanList() {
  const [cards, setCards] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL"); 
  const [selectedCard, setSelectedCard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [format, setFormat] = useState("tcg"); 

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    if (format === 'masterduel') {
      fetch(`${API_BASE_URL}/BanList/masterduel`)
        .then((res) => {
          if (!res.ok) throw new Error("C# API returned HTTP " + res.status);
          return res.json();
        })
        .then((apiResponse) => {
          const scrapedCards = apiResponse.cards || [];
          if (scrapedCards.length === 0) {
            throw new Error("No cards returned from Master Duel scraper service.");
          }

          const dynamicStatusMap = {};
          scrapedCards.forEach(item => {
            dynamicStatusMap[item.name] = item.status;
          });

          const mdCardNames = Object.keys(dynamicStatusMap);

          const chunkSize = 25;
          const chunks = [];
          for (let i = 0; i < mdCardNames.length; i += chunkSize) {
            chunks.push(mdCardNames.slice(i, i + chunkSize));
          }

          const fetchPromises = chunks.map(chunk => 
            fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(chunk.join('|'))}&misc=yes`)
          );

          return Promise.all(fetchPromises).then(async (responses) => {
            const jsonResults = await Promise.all(responses.map(r => r.ok ? r.json() : { data: [] }));
            
            const rawCards = [];
            jsonResults.forEach(res => {
              if (res.data) rawCards.push(...res.data);
            });

            const formattedCards = rawCards.map((card) => {
              const priceObj = card.card_prices?.[0] || {};
              const banObj = card.banlist_info || {};
              const miscObj = card.misc_info?.[0] || {};

              const mdStatus = dynamicStatusMap[card.name] || "Unlimited";

              const isLinkOrPendulum = (card.type || "").toLowerCase().includes("link") || 
                                       (card.type || "").toLowerCase().includes("pendulum");

              return {
                id: card.id,
                name: card.name,
                type: card.type,
                race: card.race || "",
                attribute: card.attribute || "",
                status: mdStatus,
                desc: card.desc || "No card text available.",
                atk: card.atk ?? null,
                def: card.def ?? null,
                level: card.level ?? card.rank ?? card.linkval ?? null,
                image: card.card_images?.[0]?.image_url || "",
                fallbackImage: card.card_images?.[0]?.image_url || "",
                prices: {
                  tcgplayer: priceObj.tcgplayer_price ? `$${priceObj.tcgplayer_price}` : "N/A",
                  cardmarket: priceObj.cardmarket_price ? `€${priceObj.cardmarket_price}` : "N/A",
                  ebay: priceObj.ebay_price ? `$${priceObj.ebay_price}` : "N/A"
                },
                banlist: {
                  masterduel: mdStatus,
                  tcg: banObj.ban_tcg || "Unlimited",
                  ocg: banObj.ban_ocg || "Unlimited"
                },
                isLinkOrPendulum,
                genesysPoints: isLinkOrPendulum ? "N/A" : (miscObj.genesys_points ?? 0)
              };
            });

            setCards(formattedCards);
            setIsLoading(false);
          });
        })
        .catch((err) => {
          console.error("Master Duel Live API Fetch Error:", err);
          setError("Could not load live Master Duel ban list from server.");
          setIsLoading(false);
        });

    } else {
      fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?banlist=${format}&misc=yes`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch ban list data");
          return res.json();
        })
        .then((data) => {
          const formattedCards = (data.data || []).map((card) => {
            const priceObj = card.card_prices?.[0] || {};
            const banObj = card.banlist_info || {};
            const miscObj = card.misc_info?.[0] || {};

            const rawStatus = format === 'ocg' ? banObj.ban_ocg : banObj.ban_tcg;

            let status = "Semi-Limited";
            if (rawStatus === "Banned" || rawStatus === "Forbidden") status = "Forbidden";
            if (rawStatus === "Limited") status = "Limited";

            const isLinkOrPendulum = (card.type || "").toLowerCase().includes("link") || 
                                     (card.type || "").toLowerCase().includes("pendulum");

            return {
              id: card.id,
              name: card.name,
              type: card.type,
              race: card.race || "",
              attribute: card.attribute || "",
              status: status,
              desc: card.desc || "No card text available.",
              atk: card.atk ?? null,
              def: card.def ?? null,
              level: card.level ?? card.rank ?? card.linkval ?? null,
              image: card.card_images?.[0]?.image_url || "",
              fallbackImage: card.card_images?.[0]?.image_url || "",
              prices: {
                tcgplayer: priceObj.tcgplayer_price ? `$${priceObj.tcgplayer_price}` : "N/A",
                cardmarket: priceObj.cardmarket_price ? `€${priceObj.cardmarket_price}` : "N/A",
                ebay: priceObj.ebay_price ? `$${priceObj.ebay_price}` : "N/A"
              },
              banlist: {
                masterduel: banObj.ban_masterduel || "Unlimited",
                tcg: banObj.ban_tcg || "Unlimited",
                ocg: banObj.ban_ocg || "Unlimited"
              },
              isLinkOrPendulum,
              genesysPoints: isLinkOrPendulum ? "N/A" : (miscObj.genesys_points ?? 0)
            };
          });

          setCards(formattedCards);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error(`${format.toUpperCase()} Fetch Error:`, err);
          setError(`Could not load live ${format.toUpperCase()} ban list.`);
          setIsLoading(false);
        });
    }
  }, [format]);

  const filteredCards = cards
    .filter(card => {
      const matchesSearch = card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            card.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = selectedStatus === "ALL" || card.status === selectedStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const rankA = getCardTypeRank(a.type);
      const rankB = getCardTypeRank(b.type);
      if (rankA !== rankB) {
        return rankA - rankB;
      }
      return a.name.localeCompare(b.name);
    });

  const forbiddenCount = cards.filter(c => c.status === "Forbidden").length;
  const limitedCount = cards.filter(c => c.status === "Limited").length;
  const semiLimitedCount = cards.filter(c => c.status === "Semi-Limited").length;

  return (
    <div style={styles.container}>
      <style>{`
        * { font-family: 'Cascadia Mono', monospace !important; }
        .terminal-font { font-family: 'Cascadia Mono', monospace !important; }
        .attr-DARK { background-color: #0d6efd; color: #fff; }
        .attr-LIGHT { background-color: #bfa136; color: #fff; }
        .attr-EARTH { background-color: #7a5127; color: #fff; }
        .attr-WATER { background-color: #2672b8; color: #fff; }
        .attr-FIRE { background-color: #b83326; color: #fff; }
        .attr-WIND { background-color: #28804a; color: #fff; }
        .attr-DIVINE { background-color: #c98018; color: #fff; }
        .vrains-corner { position: absolute; width: 8px; height: 8px; border-color: #00d2ff; border-style: solid; }
        .vrains-corner-tl { top: 0; left: 0; border-width: 2px 0 0 2px; }
        .vrains-corner-tr { top: 0; right: 0; border-width: 2px 2px 0 0; }
        .vrains-corner-bl { bottom: 0; left: 0; border-width: 0 0 2px 2px; }
        .vrains-corner-br { bottom: 0; right: 0; border-width: 0 2px 2px 0; }
        .vrains-stat-box { background: rgba(0,0,0,0.6); border: 1px solid rgba(0,210,255,0.3); border-radius: 4px; text-align: center; }
        .md-card-tile { border: 1px solid #1e2638; transition: transform 0.2s, border-color 0.2s; }
        .md-card-tile:hover { transform: translateY(-4px); border-color: #00d2ff !important; box-shadow: 0 0 15px rgba(0,210,255,0.3); }
      `}</style>

      <div className="container-fluid px-4" style={{ maxWidth: '1400px', margin: '0 auto' }}>

        <header style={styles.header}>
          <div style={styles.titleGroup}>
            <span style={styles.subtitle}>OFFICIAL FORBIDDEN & LIMITED LIST</span>
            <h1 style={styles.title}>
              {format === 'masterduel' ? 'MASTER DUEL' : format === 'ocg' ? 'OCG' : 'TCG'} REGULATION
            </h1>
          </div>

          <div style={styles.formatToggle}>
            <button
              onClick={() => setFormat('tcg')}
              style={{ ...styles.formatBtn, ...(format === 'tcg' ? styles.activeFormatBtn : {}) }}
            >
              TCG List
            </button>
            <button
              onClick={() => setFormat('ocg')}
              style={{ ...styles.formatBtn, ...(format === 'ocg' ? styles.activeFormatBtn : {}) }}
            >
              OCG List
            </button>
            <button
              onClick={() => setFormat('masterduel')}
              style={{ ...styles.formatBtn, ...(format === 'masterduel' ? styles.activeFormatBtn : {}) }}
            >
              Master Duel List
            </button>
          </div>

          <div style={styles.counterRow}>
            <div style={{ ...styles.counterCard, borderColor: '#ff4d4d' }}>
              <span style={{ color: '#ff4d4d', fontSize: '20px', fontWeight: 'bold' }}>{forbiddenCount}</span>
              <span style={styles.counterLabel}>Forbidden</span>
            </div>
            <div style={{ ...styles.counterCard, borderColor: '#ffcc00' }}>
              <span style={{ color: '#ffcc00', fontSize: '20px', fontWeight: 'bold' }}>{limitedCount}</span>
              <span style={styles.counterLabel}>Limited</span>
            </div>
            <div style={{ ...styles.counterCard, borderColor: '#00d2ff' }}>
              <span style={{ color: '#00d2ff', fontSize: '20px', fontWeight: 'bold' }}>{semiLimitedCount}</span>
              <span style={styles.counterLabel}>Semi-Limited</span>
            </div>
          </div>
        </header>

        <div style={styles.filterBar}>
          <div style={styles.searchWrapper}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search card name or card type..."
              style={styles.searchInput}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} style={styles.clearBtn}>✕</button>
            )}
          </div>

          <div style={styles.tabGroup}>
            {["ALL", "Forbidden", "Limited", "Semi-Limited"].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                style={{
                  ...styles.tabBtn,
                  ...(selectedStatus === status ? styles.activeTabBtn : {}),
                  borderColor: status === "Forbidden" ? '#ff4d4d' : status === "Limited" ? '#ffcc00' : status === "Semi-Limited" ? '#00d2ff' : '#0dcaf0'
                }}
              >
                {status.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <main style={styles.mainLayout}>
          {isLoading ? (
            <div className="text-center my-5 py-5">
              <Spinner animation="border" variant="info" style={{ width: '3rem', height: '3rem' }} />
              <p className="text-info terminal-font mt-3">ACCESSING_BANLIST_DATABASE...</p>
            </div>
          ) : error ? (
            <div style={styles.noResults}>
              <p style={{ color: '#ff4d4d' }}>{error}</p>
            </div>
          ) : filteredCards.length === 0 ? (
            <div style={styles.noResults}>
              <p style={{ fontSize: '18px', color: '#aaa' }}>No cards found matching your query.</p>
            </div>
          ) : (
            <Row className="g-3 row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-6 row-cols-xl-6">
              {filteredCards.map((card) => (
                <Col key={card.id}>
                  <div 
                    className="md-card-tile p-2 rounded-3 bg-dark h-100 d-flex flex-column justify-content-between position-relative"
                    onClick={() => setSelectedCard(card)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="overflow-hidden rounded mb-2">
                      <img 
                        src={card.image} 
                        alt={card.name} 
                        className="w-100 h-auto rounded"
                        loading="lazy"
                        onError={(e) => {
                          if (e.target.src !== card.fallbackImage && card.fallbackImage) {
                            e.target.src = card.fallbackImage;
                          } else {
                            e.target.src = "https://ygoprodeck.com/images/cards/back.jpg";
                          }
                        }}
                      />
                    </div>

                    <div className="text-center mt-auto pt-1">
                      <div className="mb-1">
                        {renderBanBadge(card.status)}
                      </div>
                      <span className="text-white fw-bold d-block text-truncate small" title={card.name}>
                        {card.name}
                      </span>
                      <span className="text-info-50 small terminal-font d-block" style={{ fontSize: '0.65rem' }}>
                        ID: #{card.id}
                      </span>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          )}

          {selectedCard && (
            <Modal
              show={!!selectedCard}
              onHide={() => setSelectedCard(null)}
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
                          onError={(e) => {
                            if (e.target.src !== selectedCard.fallbackImage && selectedCard.fallbackImage) {
                              e.target.src = selectedCard.fallbackImage;
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
                              {selectedCard.prices?.tcgplayer}
                            </span>
                          </div>
                        </Col>
                        <Col xs={4}>
                          <div className="p-1 rounded bg-dark border border-secondary border-opacity-25">
                            <span className="text-white-50 d-block" style={{ fontSize: '0.58rem' }}>Cardmarket</span>
                            <span className="fw-bold text-info font-monospace" style={{ fontSize: '0.75rem' }}>
                              {selectedCard.prices?.cardmarket}
                            </span>
                          </div>
                        </Col>
                        <Col xs={4}>
                          <div className="p-1 rounded bg-dark border border-secondary border-opacity-25">
                            <span className="text-white-50 d-block" style={{ fontSize: '0.58rem' }}>eBay</span>
                            <span className="fw-bold text-warning font-monospace" style={{ fontSize: '0.75rem' }}>
                              {selectedCard.prices?.ebay}
                            </span>
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
                        {selectedCard.attribute && (
                          <Badge className={`attr-${selectedCard.attribute.toUpperCase()} font-monospace px-2 py-1`}>
                            {selectedCard.attribute.toUpperCase()}
                          </Badge>
                        )}
                        <Badge bg="secondary" className="terminal-font">
                          {selectedCard.type?.toUpperCase()}
                        </Badge>
                        {selectedCard.race && !selectedCard.type?.toUpperCase().includes(selectedCard.race.toUpperCase()) && (
                          <Badge bg="dark" className="border border-secondary text-info terminal-font">
                            {selectedCard.race.toUpperCase()}
                          </Badge>
                        )}
                      </div>

                      {selectedCard.level && (
                        <div className="mb-2 p-2 rounded bg-black bg-opacity-40 border border-secondary border-opacity-25">
                          {renderLevelStars(selectedCard.level)}
                        </div>
                      )}

                      {(selectedCard.atk !== null || selectedCard.def !== null) && (
                        <Row className="g-2 mb-2">
                          <Col>
                            <div className="vrains-stat-box py-1">
                              <span className="text-white-50 small terminal-font d-block" style={{ fontSize: '0.65rem' }}>ATK</span>
                              <span className="fw-bold text-warning fs-6">
                                {selectedCard.atk ?? "—"}
                              </span>
                            </div>
                          </Col>
                          <Col>
                            <div className="vrains-stat-box py-1">
                              <span className="text-white-50 small terminal-font d-block" style={{ fontSize: '0.65rem' }}>DEF</span>
                              <span className="fw-bold text-warning fs-6">
                                {selectedCard.def ?? "—"}
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
                                {renderBanBadge(selectedCard.banlist?.masterduel)}
                              </div>
                              <div className="text-center flex-grow-1">
                                <span className="text-white-50 d-block" style={{ fontSize: '0.55rem' }}>TCG</span>
                                {renderBanBadge(selectedCard.banlist?.tcg)}
                              </div>
                              <div className="text-center flex-grow-1">
                                <span className="text-white-50 d-block" style={{ fontSize: '0.55rem' }}>OCG</span>
                                {renderBanBadge(selectedCard.banlist?.ocg)}
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
                              {selectedCard.isLinkOrPendulum ? (
                                <Badge bg="danger" className="terminal-font px-1 py-1" style={{ fontSize: '0.58rem' }}>
                                  N/A (BANNED)
                                </Badge>
                              ) : (
                                <Badge bg="info" className="text-dark terminal-font px-2 py-1 fw-bold fs-6">
                                  {selectedCard.genesysPoints} PTS
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
                          style={{ minHeight: '130px', maxHeight: '220px', overflowY: 'auto', whiteSpace: 'pre-line', fontSize: '0.82rem', lineHeight: '1.45' }}
                        >
                          {selectedCard.desc}
                        </div>
                      </div>

                    </div>
                  </Col>

                </Row>
              </Modal.Body>
            </Modal>
          )}
        </main>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#0a0d14',
    color: '#ffffff',
    minHeight: '100vh',
    fontFamily: "'Cascadia Mono', monospace",
    padding: '100px 20px 40px 20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '2px solid #1e2638',
    paddingBottom: '20px',
    marginBottom: '25px',
    flexWrap: 'wrap',
    gap: '20px'
  },
  titleGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  subtitle: {
    color: '#00d2ff',
    fontSize: '12px',
    letterSpacing: '3px',
    fontWeight: 'bold',
  },
  title: {
    margin: '5px 0 0 0',
    fontSize: '32px',
    fontWeight: '800',
    letterSpacing: '1px',
    background: 'linear-gradient(90deg, #ffffff, #8a9ba8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  formatToggle: {
    display: 'flex',
    gap: '10px',
  },
  formatBtn: {
    backgroundColor: '#121824',
    border: '1px solid #232d42',
    color: '#8a9ba8',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  activeFormatBtn: {
    backgroundColor: '#00d2ff',
    color: '#0a0d14',
    borderColor: '#00d2ff',
  },
  counterRow: {
    display: 'flex',
    gap: '15px',
  },
  counterCard: {
    backgroundColor: '#121824',
    border: '1px solid',
    borderRadius: '8px',
    padding: '10px 18px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '80px',
  },
  counterLabel: {
    fontSize: '11px',
    color: '#8a9ba8',
    marginTop: '4px',
    textTransform: 'uppercase',
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '30px',
    flexWrap: 'wrap',
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    flex: '1',
    minWidth: '280px',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    fontSize: '14px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 35px 12px 35px',
    backgroundColor: '#121824',
    border: '1px solid #232d42',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
  },
  clearBtn: {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    color: '#8a9ba8',
    cursor: 'pointer',
  },
  tabGroup: {
    display: 'flex',
    gap: '8px',
  },
  tabBtn: {
    backgroundColor: '#121824',
    border: '1px solid #232d42',
    color: '#8a9ba8',
    padding: '10px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    letterSpacing: '1px',
  },
  activeTabBtn: {
    backgroundColor: '#1e283d',
    color: '#fff',
    boxShadow: '0 0 10px rgba(0, 210, 255, 0.2)',
  },
  mainLayout: {
    position: 'relative',
  },
  noResults: {
    textAlign: 'center',
    padding: '50px',
    backgroundColor: '#121824',
    borderRadius: '8px',
  }
};