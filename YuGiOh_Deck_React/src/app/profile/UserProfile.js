'use client'; 

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Badge, Spinner, Button, Modal } from 'react-bootstrap';
import Link from 'next/link'; 
import { getFannedCards } from '@/utils/metaDeckHelpers';
import '@/mdstyles.css';

const CDN_BASE_URL = 'https://cards.erregeteygo.com/card-images';

const OverflowBadge = ({ bg, className, style, title, text }) => {
  const badgeRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (badgeRef.current) {
        setIsOverflowing(badgeRef.current.scrollWidth > badgeRef.current.clientWidth);
      }
    };
    checkOverflow();
    setTimeout(checkOverflow, 100);
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [text]);

  return (
    <span 
      ref={badgeRef}
      className={`badge bg-${bg} ${className} marquee-wrapper ${isOverflowing ? 'has-overflow' : ''}`} 
      style={style} 
      title={title}
    >
      <span className="marquee-content">{text}</span>
    </span>
  );
};

export default function UserProfile() {
    const [localUser, setLocalUser] = useState(null);
    const [userDecks, setUserDecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFormat, setActiveFormat] = useState('ALL');
    
    // 🚀 Ace Monster Customization State
    const [showAceModal, setShowAceModal] = useState(false);
    const [customAce, setCustomAce] = useState(null);

    // Grab the user from storage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedUser = sessionStorage.getItem("user");
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    setLocalUser(parsedUser);
                    
                    // Load saved custom Ace Monster if present
                    const savedAce = sessionStorage.getItem(`ace_monster_${parsedUser.id}`);
                    if (savedAce) {
                        setCustomAce(JSON.parse(savedAce));
                    }
                } catch {
                    setLocalUser(null);
                }
            } else {
                setLoading(false); 
            }
        }
    }, []);

    useEffect(() => {
        const fetchAndHydrateDecks = async () => {
            if (!localUser || !localUser.id) return;

            try {
                const response = await fetch(`https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api/mongodb/DeckListMongoDb/user/${localUser.id}`);
                if (!response.ok) {
                    setUserDecks([]);
                    return;
                }
                const rawDecks = await response.json();

                let masterCards = [];
                const cachedData = sessionStorage.getItem("YGOCardCache");

                if (cachedData) {
                    masterCards = JSON.parse(cachedData);
                } else {
                    const masterRes = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php');
                    const result = await masterRes.json();
                    
                    const userCardIds = new Set(rawDecks.flatMap(d => [
                        ...(d.mainDeck || []), 
                        ...(d.extraDeck || []), 
                        ...(d.sideDeck || [])
                    ]));

                    masterCards = result.data.map(card => {
                        const isPriority = userCardIds.has(String(card.id));
                        
                        return {
                            id: card.id,
                            image: card.card_images[0].image_url_small,
                            name: card.name,
                            desc: isPriority ? card.desc : undefined, 
                            attribute: isPriority ? card.attribute : undefined,
                            level: isPriority ? card.level : undefined,
                            race: isPriority ? card.race : undefined,
                            type: isPriority ? card.type : undefined
                        };
                    });
                    
                    sessionStorage.setItem("YGOCardCache", JSON.stringify(masterCards));
                }

                const hydratedDecks = rawDecks.map(deck => ({
                    ...deck,
                    mainDeck: (deck.mainDeck || []).map(cardId => {
                        const match = masterCards.find(m => String(m.id) === String(cardId));
                        return match ? match : { id: cardId, image: `/images/card_back_placeholder.png`, name: `Card #${cardId}` };
                    }),
                    extraDeck: (deck.extraDeck || []).map(cardId => {
                        const match = masterCards.find(m => String(m.id) === String(cardId));
                        return match ? match : { id: cardId, image: `/images/card_back_placeholder.png`, name: `Card #${cardId}` };
                    }),
                    sideDeck: (deck.sideDeck || []).map(cardId => {
                        const match = masterCards.find(m => String(m.id) === String(cardId));
                        return match ? match : { id: cardId, image: `/images/card_back_placeholder.png`, name: `Card #${cardId}` };
                    })
                }));

                setUserDecks(hydratedDecks);
            } catch (error) {
                console.error("DATABASE_LINK_FAILURE:", error);
            } finally {
                setLoading(false);
            }
        };

        if (localUser) {
            fetchAndHydrateDecks();
        }
    }, [localUser]);

    if (!loading && !localUser) {
        return <div className="md-theme-bg text-info p-5 text-center terminal-font mt-5">ACCESS_DENIED: PLEASE_LOGIN</div>;
    }

    const handleDeleteDeck = async (deckId) => {
        if (!localUser?.id) return;

        if (!window.confirm("SYSTEM_CONFIRMATION: PURGE_ARCHIVED_DECK?")) return;

        try {
            const response = await fetch(`https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api/mongodb/DeckListMongoDb/${deckId}/user/${localUser.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setUserDecks(prevDecks => prevDecks.filter(deck => deck.id !== deckId));
                console.log("UI_SYNCHRONIZED: DECK_REMOVED");
            } else {
                console.error("DELETION_FAILED");
            }
        } catch (error) {
            console.error("NETWORK_ERROR", error);
        }
    };

    const filteredDecks = userDecks.filter(deck => {
        if (activeFormat === 'ALL') return true;
        const deckFormat = (deck.format || deck.Format || 'TCG').toUpperCase();
        return deckFormat === activeFormat;
    });

    const formatTabs = ['ALL', 'TCG', 'OCG', 'MASTER DUEL', 'GENESYS'];

    // Collect all unique cards from the user's archived decks for the Ace picker modal
    const availableAceCards = useMemo(() => {
        const map = new Map();
        userDecks.forEach(deck => {
            [...(deck.mainDeck || []), ...(deck.extraDeck || []), ...(deck.sideDeck || [])].forEach(card => {
                const cardId = card.id || card.Id;
                if (cardId && !map.has(String(cardId))) {
                    map.set(String(cardId), card);
                }
            });
        });
        return Array.from(map.values());
    }, [userDecks]);

    // Determine current Ace Monster (Custom choice > First card of first deck > Fallback)
    const aceMonsterCard = customAce || (userDecks.length > 0 && userDecks[0]?.mainDeck?.length > 0 ? userDecks[0].mainDeck[0] : null);

    const handleSelectAce = (card) => {
        setCustomAce(card);
        if (localUser?.id) {
            sessionStorage.setItem(`ace_monster_${localUser.id}`, JSON.stringify(card));
        }
        setShowAceModal(false);
    };

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

                .marquee-wrapper {
                  display: inline-block;
                  width: 100%;
                  overflow: hidden;
                  white-space: nowrap;
                  text-overflow: ellipsis;
                  vertical-align: middle;
                }
                .ygo-deck-card:hover .marquee-wrapper.has-overflow { text-overflow: clip; }
                .ygo-deck-card:hover .marquee-wrapper.has-overflow .marquee-content {
                  display: inline-block;
                  animation: text-slide 3.5s ease-in-out infinite alternate;
                }
                @keyframes text-slide {
                  0%, 15% { transform: translateX(0); }
                  85%, 100% { transform: translateX(-35%); }
                }
                .ace-avatar-wrap {
                  cursor: pointer;
                  transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .ace-avatar-wrap:hover {
                  transform: scale(1.05);
                  box-shadow: 0 0 20px rgba(0, 242, 255, 0.6) !important;
                }
            `}</style>

            <Container>
                {/* User Header HUD with Interactive Ace Monster Showcase */}
                <div className="md-panel p-4 mb-4 border-info position-relative overflow-hidden">
                    <Row className="align-items-center">
                        <Col xs="auto">
                            <div 
                                className="rounded border border-info shadow-lg overflow-hidden position-relative bg-black ace-avatar-wrap" 
                                style={{ width: '75px', height: '105px', boxShadow: '0 0 15px rgba(0, 210, 255, 0.3)' }}
                                onClick={() => setShowAceModal(true)}
                                title="Click to edit Ace Monster"
                            >
                                <img 
                                    src={aceMonsterCard?.image || "/images/card_back_placeholder.png"} 
                                    alt="Ace Monster"
                                    className="w-100 h-100"
                                    style={{ objectFit: 'cover' }}
                                    onError={(e) => { e.target.src = "/images/card_back_placeholder.png"; }}
                                />
                                <div 
                                    className="position-absolute bottom-0 start-0 w-100 text-center bg-black bg-opacity-90 text-info terminal-font fw-bold"
                                    style={{ fontSize: '0.45rem', padding: '3px 0', letterSpacing: '1px', borderTop: '1px solid rgba(0,210,255,0.4)' }}
                                >
                                    EDIT ACE ⚙️
                                </div>
                            </div>
                        </Col>
                        
                        <Col>
                            <h2 className="text-info m-0" style={{ fontFamily: 'Cascadia Mono' }}>
                                {localUser?.firstName?.toUpperCase()} {localUser?.lastName?.toUpperCase()}
                            </h2>
                            <p className="m-0 text-white-50 small">RANK: DUELIST // ID: {localUser?.id}</p>
                            {aceMonsterCard?.name && (
                                <p className="text-warning small m-0 mt-1 terminal-font" style={{ fontSize: '0.75rem' }}>
                                    ★ SIGNATURE ACE: {aceMonsterCard.name}
                                </p>
                            )}
                        </Col>
                        <Col xs="auto" className="text-end">
                            <div className="text-info">DECKS ARCHIVED: {userDecks.length}</div>
                        </Col>
                    </Row>
                </div>

                {/* Format Filter Tabs HUD */}
                <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.98)' }} text="white" className="shadow-lg p-3 mb-4 border-info border-opacity-25 md-panel">
                    <Card.Header className="bg-transparent pb-0 border-0 d-flex gap-2 flex-wrap">
                        {formatTabs.map((fmt) => {
                            const isActive = activeFormat === fmt;
                            return (
                                <Button
                                    key={fmt}
                                    variant={isActive ? "info" : "outline-info"}
                                    className="flex-fill fw-bold terminal-font text-nowrap py-2"
                                    onClick={() => setActiveFormat(fmt)}
                                    style={{ fontSize: '0.85rem' }}
                                >
                                    {fmt}
                                </Button>
                            );
                        })}
                    </Card.Header>
                </Card>

                <h4 className="text-white mb-4" style={{ letterSpacing: '2px' }}>SAVED DECKLISTS ({filteredDecks.length})</h4>

                {loading ? (
                    <div className="text-center text-info mt-5"><Spinner animation="border" /></div>
                ) : (
                    <Row className="g-4">
                        {filteredDecks.length > 0 ? (
                            filteredDecks.map((deck) => {
                                const mainIds = (deck.mainDeck || []).map(c => typeof c === 'object' ? (c.id || c.Id) : c);
                                const extraIds = (deck.extraDeck || []).map(c => typeof c === 'object' ? (c.id || c.Id) : c);
                                const sideIds = (deck.sideDeck || []).map(c => typeof c === 'object' ? (c.id || c.Id) : c);
                                
                                const fannedCardIds = getFannedCards(mainIds, extraIds, sideIds);
                                const deckFormat = (deck.format || deck.Format || 'TCG').toUpperCase();
                                const pilotText = `PILOT: ${localUser?.firstName?.toUpperCase()} ${localUser?.lastName?.toUpperCase()}`;

                                return (
                                    <Col key={deck.id} md={4}>
                                        <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', backdropFilter: 'blur(0px)' }} text="white" className="border-info border-opacity-50 shadow h-100 md-panel ygo-deck-card d-flex flex-column">
                                            <Card.Header className="bg-transparent border-bottom border-info border-opacity-25 px-3 py-3 overflow-hidden">
                                                <div className="d-flex flex-column gap-2 w-100">
                                                    <h5 className="m-0 fw-bold text-white cascadia-font" style={{ fontSize: '1.25rem', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.2' }} title={deck.title}>
                                                        {deck.title?.toUpperCase()}
                                                    </h5>
                                                    <div className="d-flex align-items-center w-100">
                                                        <OverflowBadge 
                                                            bg="dark" 
                                                            className="text-light fw-bold px-2 py-1 cascadia-font border border-secondary border-opacity-50" 
                                                            style={{ fontSize: '0.8rem', maxWidth: '100%' }}
                                                            title={deckFormat}
                                                            text={`FORMAT: ${deckFormat}`}
                                                        />
                                                    </div>
                                                </div>
                                            </Card.Header>

                                            <Card.Body className="d-flex flex-column justify-content-between p-3">
                                                <div>
                                                    <div className="my-3 d-flex justify-content-center align-items-center position-relative fanned-container" style={{ height: '220px', width: '100%' }}>
                                                        <div className="holo-glow"></div>
                                                        <img src={`${CDN_BASE_URL}/${fannedCardIds[0]}.jpg`} alt="Card 1" className="border border-info border-opacity-25 card-left" style={{ height: '170px', objectFit: 'contain' }} onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.ygoprodeck.com/images/cards/back_high.jpg'; }} />
                                                        <img src={`${CDN_BASE_URL}/${fannedCardIds[2]}.jpg`} alt="Card 3" className="border border-info border-opacity-25 card-right" style={{ height: '170px', objectFit: 'contain' }} onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.ygoprodeck.com/images/cards/back_high.jpg'; }} />
                                                        <img src={`${CDN_BASE_URL}/${fannedCardIds[1]}.jpg`} alt="Card 2" className="border border-info card-center" style={{ height: '185px', objectFit: 'contain' }} onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.ygoprodeck.com/images/cards/back_high.jpg'; }} />
                                                    </div>

                                                    <div className="d-flex align-items-center mb-2 w-100">
                                                        <OverflowBadge 
                                                            bg="dark"
                                                            className="border border-success text-warning px-2 py-1 cascadia-font" 
                                                            style={{ fontSize: '0.85rem', maxWidth: '100%' }} 
                                                            title={pilotText}
                                                            text={pilotText}
                                                        />
                                                    </div>

                                                    <div className="p-2.5 rounded mb-2" style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                                                        <h6 className="text-info fw-bold border-bottom border-info border-opacity-25 pb-1 mb-1.5 cascadia-font" style={{ fontSize: '0.85rem', letterSpacing: '1px' }}>DECK BREAKDOWN</h6>
                                                        <div className="d-flex justify-content-between text-white cascadia-font" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                                                            <span className="text-white-50">MAIN DECK:</span>
                                                            <strong className="text-info">{deck.mainDeck?.length || 0} CARDS</strong>
                                                        </div>
                                                        <div className="d-flex justify-content-between text-white cascadia-font" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                                                            <span className="text-white-50">EXTRA DECK:</span>
                                                            <strong className="text-warning">{deck.extraDeck?.length || 0} CARDS</strong>
                                                        </div>
                                                        <div className="d-flex justify-content-between text-white cascadia-font" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                                                            <span className="text-white-50">SIDE DECK:</span>
                                                            <strong className="text-success">{deck.sideDeck?.length || 0} CARDS</strong>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-2 border-top border-secondary border-opacity-25 mt-1">
                                                    <div className="d-flex align-items-center justify-content-between mb-1.5">
                                                        <span className="small text-white-50 cascadia-font" style={{ fontSize: '0.75rem' }}>LAST UPDATED:</span>
                                                        <span className="small text-info cascadia-font" style={{ fontSize: '0.8rem' }}>
                                                            {deck.lastUpdated ? new Date(deck.lastUpdated).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'RECENTLY'}
                                                        </span>
                                                    </div>

                                                    <div className="d-flex gap-2 mt-1">
                                                        <Button as={Link} href={`/deckprofiledetails/${deck.id}`} variant="outline-info" className="flex-grow-1 fw-bold cascadia-font text-nowrap py-1.5" style={{ fontSize: '0.85rem' }}>
                                                            VIEW PROFILE
                                                        </Button>
                                                        <Button variant="outline-danger" className="fw-bold cascadia-font text-nowrap py-1.5 px-3" style={{ fontSize: '0.85rem' }} onClick={() => handleDeleteDeck(deck.id)}>
                                                            DELETE
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                );
                            })
                        ) : (
                            <Col className="text-center py-5">
                                <p className="text-muted">NO_DECK_DATA_FOUND_FOR_{activeFormat}_FORMAT</p>
                                <Button as={Link} href="/deckbuilder" className="md-btn-primary">INITIALIZE_DECK_BUILDER</Button>
                            </Col>
                        )}
                    </Row>
                )}
            </Container>

            {/* 🚀 Ace Monster Selector Modal */}
            <Modal show={showAceModal} onHide={() => setShowAceModal(false)} centered size="lg" contentClassName="bg-dark text-white border border-info">
                <Modal.Header closeButton closeVariant="white" className="border-secondary bg-black">
                    <Modal.Title className="text-info terminal-font fw-bold fs-6">
                        SELECT SIGNATURE ACE MONSTER
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4 bg-dark" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    <p className="text-white-50 small terminal-font mb-3">
                        Choose your signature card from any card present across your archived decklists:
                    </p>
                    {availableAceCards.length > 0 ? (
                        <Row xs={3} sm={4} md={6} className="g-3">
                            {availableAceCards.map((card) => {
                                const cardId = card.id || card.Id;
                                const isSelected = (aceMonsterCard?.id || aceMonsterCard?.Id) === cardId;
                                return (
                                    <Col key={cardId}>
                                        <div 
                                            className={`rounded border overflow-hidden position-relative ${isSelected ? 'border-info shadow-lg' : 'border-secondary border-opacity-50'}`}
                                            style={{ cursor: 'pointer', backgroundColor: '#000', transition: 'transform 0.15s ease' }}
                                            onClick={() => handleSelectAce(card)}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            <img 
                                                src={card.image || `${CDN_BASE_URL}/${cardId}.jpg`} 
                                                alt={card.name} 
                                                className="w-100 h-auto"
                                                style={{ aspectRatio: '421/614', objectFit: 'cover' }}
                                                onError={(e) => { e.target.src = `https://images.ygoprodeck.com/images/cards_small/${cardId}.jpg`; }}
                                            />
                                            {isSelected && (
                                                <Badge bg="info" className="position-absolute top-0 start-0 m-1 text-dark fw-bold" style={{ fontSize: '0.55rem' }}>
                                                    ACTIVE
                                                </Badge>
                                            )}
                                        </div>
                                    </Col>
                                );
                            })}
                        </Row>
                    ) : (
                        <div className="text-center py-4 text-white-50 terminal-font small">
                            NO CARDS AVAILABLE IN ARCHIVED DECKS YET. BUILD OR IMPORT A DECK FIRST!
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
}