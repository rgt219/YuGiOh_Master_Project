'use client'; 

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Badge, Spinner, Button, Modal, Form } from 'react-bootstrap';
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
        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [text]);

    return (
        <span ref={badgeRef} className={`badge bg-${bg} ${className} marquee-wrapper ${isOverflowing ? 'has-overflow' : ''}`} style={style} title={title}>
            <span className="marquee-content">{text}</span>
        </span>
    );
};

const DeckCardItem = ({ deck, localUser, onDelete }) => {
    const mainIds = (deck.mainDeck || []).map(c => typeof c === 'object' ? (c.id || c.Id) : c);
    const extraIds = (deck.extraDeck || []).map(c => typeof c === 'object' ? (c.id || c.Id) : c);
    const sideIds = (deck.sideDeck || []).map(c => typeof c === 'object' ? (c.id || c.Id) : c);
    
    const fannedCardIds = getFannedCards(mainIds, extraIds, sideIds);
    const deckFormat = (deck.format || deck.Format || 'TCG').toUpperCase();
    const pilotText = `PILOT: ${localUser?.firstName?.toUpperCase()} ${localUser?.lastName?.toUpperCase()}`;

    return (
        <Col md={4}>
            <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', backdropFilter: 'blur(0px)' }} text="white" className="border-info border-opacity-50 shadow h-100 md-panel ygo-deck-card d-flex flex-column">
                <Card.Header className="bg-transparent border-bottom border-info border-opacity-25 px-3 py-3 overflow-hidden">
                    <div className="d-flex flex-column gap-2 w-100">
                        <h5 className="m-0 fw-bold text-white cascadia-font" style={{ fontSize: '1.25rem', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.2' }} title={deck.title}>
                            {deck.title?.toUpperCase()}
                        </h5>
                        <div className="d-flex align-items-center justify-content-between w-100">
                            <OverflowBadge bg="dark" className="text-light fw-bold px-2 py-1 cascadia-font border border-secondary border-opacity-50" style={{ fontSize: '0.8rem', maxWidth: '75%' }} title={deckFormat} text={`FORMAT: ${deckFormat}`} />
                            <Button variant="outline-warning" size="sm" className="terminal-font p-1 d-flex align-items-center shadow-sm" title="Add to Playlist">[+]</Button>
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
                            <OverflowBadge bg="dark" className="border border-success text-warning px-2 py-1 cascadia-font" style={{ fontSize: '0.85rem', maxWidth: '100%' }} title={pilotText} text={pilotText} />
                        </div>
                        <div className="p-2.5 rounded mb-2" style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                            <h6 className="text-info fw-bold border-bottom border-info border-opacity-25 pb-1 mb-1.5 cascadia-font" style={{ fontSize: '0.85rem', letterSpacing: '1px' }}>DECK BREAKDOWN</h6>
                            <div className="d-flex justify-content-between text-white cascadia-font" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                                <span className="text-white-50">MAIN:</span><strong className="text-info">{deck.mainDeck?.length || 0} CARDS</strong>
                            </div>
                            <div className="d-flex justify-content-between text-white cascadia-font" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                                <span className="text-white-50">EXTRA:</span><strong className="text-warning">{deck.extraDeck?.length || 0} CARDS</strong>
                            </div>
                            <div className="d-flex justify-content-between text-white cascadia-font" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                                <span className="text-white-50">SIDE:</span><strong className="text-success">{deck.sideDeck?.length || 0} CARDS</strong>
                            </div>
                        </div>
                    </div>
                    <div className="pt-2 border-top border-secondary border-opacity-25 mt-1">
                        <div className="d-flex align-items-center justify-content-between mb-1.5">
                            <span className="small text-white-50 cascadia-font" style={{ fontSize: '0.75rem' }}>LAST UPDATED:</span>
                            <span className="small text-info cascadia-font" style={{ fontSize: '0.8rem' }}>
                                {deck.lastUpdated ? new Date(deck.lastUpdated).toLocaleDateString() : 'RECENTLY'}
                            </span>
                        </div>
                        <div className="d-flex gap-2 mt-1">
                            <Button as={Link} href={`/deckprofiledetails/${deck.id}`} variant="outline-info" className="flex-grow-1 fw-bold cascadia-font text-nowrap py-1.5" style={{ fontSize: '0.85rem' }}>VIEW PROFILE</Button>
                            <Button variant="outline-danger" className="fw-bold cascadia-font text-nowrap py-1.5 px-3" style={{ fontSize: '0.85rem' }} onClick={() => onDelete(deck.id)}>DELETE</Button>
                        </div>
                    </div>
                </Card.Body>
            </Card>
        </Col>
    );
};

export default function UserProfile() {
    const [localUser, setLocalUser] = useState(null);
    const [userDecks, setUserDecks] = useState([]);
    const [userPlaylists, setUserPlaylists] = useState([]); // 🚀 Added state for playlists
    const [loading, setLoading] = useState(true);
    const [activeFormat, setActiveFormat] = useState('ALL');
    const [activeTab, setActiveTab] = useState('VAULT'); 
    
    const [showAceModal, setShowAceModal] = useState(false);
    const [customAce, setCustomAce] = useState(null);

    const [showPlaylistModal, setShowPlaylistModal] = useState(false);
    const [playlistForm, setPlaylistForm] = useState({ title: '', description: '', coverCard: null });
    const [coverSearchQuery, setCoverSearchQuery] = useState('');
    const [coverSearchResults, setCoverSearchResults] = useState([]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedUser = sessionStorage.getItem("user");
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    setLocalUser(parsedUser);
                    const savedAce = sessionStorage.getItem(`ace_monster_${parsedUser.id}`);
                    if (savedAce) setCustomAce(JSON.parse(savedAce));
                } catch { setLocalUser(null); }
            } else { setLoading(false); }
        }
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!localUser?.id) return;
            try {
                // Fetch Decks and Playlists concurrently
                const [decksRes, playlistsRes] = await Promise.all([
                    fetch(`https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api/mongodb/DeckListMongoDb/user/${localUser.id}`),
                    fetch(`https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api/Playlist/user/${localUser.id}`)
                ]);

                if (playlistsRes.ok) {
                    const playlistsData = await playlistsRes.json();
                    setUserPlaylists(playlistsData || []);
                }

                if (!decksRes.ok) return setUserDecks([]);
                
                const rawDecks = await decksRes.json();
                let masterCards = JSON.parse(sessionStorage.getItem("YGOCardCache"));

                if (!masterCards) {
                    const masterRes = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php');
                    const result = await masterRes.json();
                    const userCardIds = new Set(rawDecks.flatMap(d => [...(d.mainDeck || []), ...(d.extraDeck || []), ...(d.sideDeck || [])]));

                    masterCards = result.data.map(card => {
                        const isPriority = userCardIds.has(String(card.id));
                        return {
                            id: card.id, image: card.card_images[0].image_url_small, name: card.name,
                            desc: isPriority ? card.desc : undefined, attribute: isPriority ? card.attribute : undefined,
                            level: isPriority ? card.level : undefined, race: isPriority ? card.race : undefined, type: isPriority ? card.type : undefined
                        };
                    });
                    sessionStorage.setItem("YGOCardCache", JSON.stringify(masterCards));
                }

                const hydratedDecks = rawDecks.map(deck => {
                    const hydrateList = (list) => (list || []).map(id => masterCards.find(m => String(m.id) === String(id)) || { id, image: `/images/card_back_placeholder.png`, name: `Card #${id}` });
                    return { ...deck, mainDeck: hydrateList(deck.mainDeck), extraDeck: hydrateList(deck.extraDeck), sideDeck: hydrateList(deck.sideDeck) };
                });

                setUserDecks(hydratedDecks);
            } catch (error) { console.error("DATABASE_LINK_FAILURE:", error); } 
            finally { setLoading(false); }
        };
        fetchUserData();
    }, [localUser]);

    useEffect(() => {
        if (coverSearchQuery.length >= 3) {
            const cache = sessionStorage.getItem("YGOCardCache");
            if (cache) {
                const allCards = JSON.parse(cache);
                const q = coverSearchQuery.toLowerCase();
                setCoverSearchResults(allCards.filter(c => c.name.toLowerCase().includes(q)).slice(0, 15));
            }
        } else { setCoverSearchResults([]); }
    }, [coverSearchQuery]);

    if (!loading && !localUser) return <div className="md-theme-bg text-info p-5 text-center terminal-font mt-5">ACCESS_DENIED: PLEASE_LOGIN</div>;

    const handleDeleteDeck = async (deckId) => {
        if (!localUser?.id || !window.confirm("SYSTEM_CONFIRMATION: PURGE_ARCHIVED_DECK?")) return;
        try {
            const response = await fetch(`https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api/mongodb/DeckListMongoDb/${deckId}/user/${localUser.id}`, { method: 'DELETE' });
            if (response.ok) setUserDecks(prev => prev.filter(deck => deck.id !== deckId));
        } catch (error) { console.error("NETWORK_ERROR", error); }
    };

    const handleCreatePlaylist = async () => {
        if (!localUser?.id || !playlistForm.title || !playlistForm.coverCard) return;

        const newPlaylistPayload = {
            userId: String(localUser.id),
            title: playlistForm.title,
            description: playlistForm.description || "",
            coverCardId: String(playlistForm.coverCard.id || playlistForm.coverCard.Id),
            deckIds: [],
            isPublic: false
        };

        try {
            const response = await fetch("https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api/Playlist", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPlaylistPayload)
            });

            if (response.ok) {
                const createdPlaylist = await response.json();
                // 🚀 Instantly updates state so the UI rerenders immediately without a refresh
                setUserPlaylists(prev => [...prev, createdPlaylist]);
                
                setPlaylistForm({ title: '', description: '', coverCard: null });
                setCoverSearchQuery('');
                setShowPlaylistModal(false);
            } else {
                console.error("PLAYLIST_CREATION_FAILED");
            }
        } catch (error) {
            console.error("NETWORK_ERROR", error);
        }
    };

    const handleDeletePlaylist = async (playlistId) => {
        if (!window.confirm("SYSTEM_CONFIRMATION: PURGE_PLAYLIST?")) return;

        try {
            const response = await fetch(`https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api/mongodb/DeckPlaylistMongoDb/${playlistId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setUserPlaylists(prev => prev.filter(p => p.id !== playlistId));
            } else {
                console.error("PLAYLIST_DELETION_FAILED");
            }
        } catch (error) {
            console.error("NETWORK_ERROR", error);
        }
    };

    const filteredDecks = userDecks.filter(deck => activeFormat === 'ALL' || (deck.format || deck.Format || 'TCG').toUpperCase() === activeFormat);
    const formatTabs = ['ALL', 'TCG', 'OCG', 'MASTER DUEL', 'GENESYS'];

    const availableAceCards = useMemo(() => {
        const map = new Map();
        userDecks.forEach(deck => {
            [...(deck.mainDeck || []), ...(deck.extraDeck || []), ...(deck.sideDeck || [])].forEach(card => {
                if (card.id && !map.has(String(card.id))) map.set(String(card.id), card);
            });
        });
        return Array.from(map.values());
    }, [userDecks]);

    const aceMonsterCard = customAce || (userDecks[0]?.mainDeck?.[0] || null);
    const handleSelectAce = (card) => {
        setCustomAce(card);
        if (localUser?.id) sessionStorage.setItem(`ace_monster_${localUser.id}`, JSON.stringify(card));
        setShowAceModal(false);
    };

    return (
        <div className="md-theme-bg min-vh-100 py-5 mt-5 terminal-font">
            <Container>
                {/* Header Section */}
                <div className="md-panel p-4 mb-4 border-info position-relative overflow-hidden">
                    <Row className="align-items-center">
                        <Col xs="auto">
                            <div className="rounded border border-info shadow-lg overflow-hidden position-relative bg-black ace-avatar-wrap" style={{ width: '75px', height: '105px', boxShadow: '0 0 15px rgba(0, 210, 255, 0.3)' }} onClick={() => setShowAceModal(true)} title="Click to edit Ace Monster">
                                <img src={aceMonsterCard?.image || "/images/card_back_placeholder.png"} alt="Ace" className="w-100 h-100" style={{ objectFit: 'cover' }} onError={(e) => e.target.src = "/images/card_back_placeholder.png"} />
                                <div className="position-absolute bottom-0 start-0 w-100 text-center bg-black bg-opacity-90 text-info fw-bold" style={{ fontSize: '0.45rem', padding: '3px 0', borderTop: '1px solid rgba(0,210,255,0.4)' }}>EDIT ACE</div>
                            </div>
                        </Col>
                        <Col>
                            <h2 className="text-info m-0 cascadia-font">{localUser?.firstName?.toUpperCase()} {localUser?.lastName?.toUpperCase()}</h2>
                            <p className="m-0 text-white-50 small">RANK: DUELIST // ID: {localUser?.id}</p>
                            {aceMonsterCard && <p className="text-warning small m-0 mt-1" style={{ fontSize: '0.75rem' }}>★ SIGNATURE ACE: {aceMonsterCard.name}</p>}
                        </Col>
                        <Col xs="auto" className="d-flex flex-column align-items-end justify-content-center">
                            <div className="text-info small mb-2 d-none d-md-block" style={{ fontSize: '0.75rem', opacity: 0.8 }}>ACTIVE DIRECTORY</div>
                            <div className="d-flex bg-black border border-secondary rounded p-1 shadow-sm">
                                <Button variant={activeTab === 'VAULT' ? 'info' : 'dark'} className={`fw-bold text-nowrap px-3 py-2 border-0 ${activeTab === 'VAULT' ? 'text-black shadow' : 'text-white-50'}`} onClick={() => setActiveTab('VAULT')} style={{ transition: 'all 0.2s ease', fontSize: '0.85rem' }}>DECK VAULT</Button>
                                <Button variant={activeTab === 'PLAYLISTS' ? 'info' : 'dark'} className={`fw-bold text-nowrap px-3 py-2 border-0 ${activeTab === 'PLAYLISTS' ? 'text-black shadow' : 'text-white-50'}`} onClick={() => setActiveTab('PLAYLISTS')} style={{ transition: 'all 0.2s ease', fontSize: '0.85rem' }}>PLAYLISTS</Button>
                            </div>
                        </Col>
                    </Row>
                </div>

                {/* Vault View */}
                {activeTab === 'VAULT' && (
                    <>
                        <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.98)' }} text="white" className="shadow-lg p-3 mb-4 border-info border-opacity-25 md-panel">
                            <Card.Header className="bg-transparent pb-0 border-0 d-flex gap-2 flex-wrap">
                                {formatTabs.map(fmt => (
                                    <Button key={fmt} variant={activeFormat === fmt ? "info" : "outline-info"} className="flex-fill fw-bold text-nowrap py-2" onClick={() => setActiveFormat(fmt)} style={{ fontSize: '0.85rem' }}>{fmt}</Button>
                                ))}
                            </Card.Header>
                        </Card>
                        <h4 className="text-white mb-4" style={{ letterSpacing: '2px' }}>SAVED DECKLISTS ({filteredDecks.length})</h4>
                        {loading ? <div className="text-center text-info mt-5"><Spinner animation="border" /></div> : (
                            <Row className="g-4">
                                {filteredDecks.length > 0 ? filteredDecks.map(deck => <DeckCardItem key={deck.id} deck={deck} localUser={localUser} onDelete={handleDeleteDeck} />) : (
                                    <Col className="text-center py-5">
                                        <p className="text-muted">NO_DECK_DATA_FOUND_FOR_{activeFormat}_FORMAT</p>
                                        <Button as={Link} href="/deckbuilder" className="md-btn-primary">INITIALIZE_DECK_BUILDER</Button>
                                    </Col>
                                )}
                            </Row>
                        )}
                    </>
                )}

                {/* Playlist View */}
                {activeTab === 'PLAYLISTS' && (
                    <div className="mt-2">
                        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                            <h4 className="text-white m-0" style={{ letterSpacing: '2px' }}>ROSTER PLAYLISTS ({userPlaylists.length})</h4>
                            <Button variant="info" className="fw-bold px-4 py-2 shadow" onClick={() => setShowPlaylistModal(true)}>CREATE NEW PLAYLIST</Button>
                        </div>
                        
                        {userPlaylists.length > 0 ? (
                            <Row className="g-4">
                                {userPlaylists.map(playlist => (
                                    <Col key={playlist.id} md={4}>
                                        <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.95)' }} text="white" className="border-info border-opacity-50 shadow h-100 md-panel d-flex flex-column">
                                            <Card.Header className="bg-transparent border-bottom border-info border-opacity-25 px-3 py-3">
                                                <h5 className="m-0 fw-bold text-white cascadia-font text-truncate">{playlist.title?.toUpperCase()}</h5>
                                            </Card.Header>
                                            <Card.Body className="d-flex flex-column justify-content-between p-3">
                                                <div>
                                                    <p className="text-white-50 small" style={{ minHeight: '40px' }}>{playlist.description || "No description provided."}</p>
                                                    <div className="p-2 rounded bg-black border border-secondary mb-3">
                                                        <span className="text-info small">ASSIGNED DECKS: {playlist.deckIds?.length || 0}</span>
                                                    </div>
                                                </div>
                                                <div className="d-flex gap-2">
                                                    <Button variant="outline-info" size="sm" className="flex-grow-1 fw-bold">VIEW</Button>
                                                    <Button variant="outline-danger" size="sm" className="fw-bold px-3" onClick={() => handleDeletePlaylist(playlist.id)}>DELETE</Button>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        ) : (
                            <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', borderStyle: 'dashed' }} className="border-secondary border-opacity-50 p-5 text-center mt-3 shadow-sm md-panel">
                                <Card.Body className="py-5">
                                    <h5 className="text-info mb-3 fw-bold" style={{ letterSpacing: '1px' }}>NO PLAYLISTS INITIALIZED</h5>
                                    <p className="text-white-50 small cascadia-font mb-0 mx-auto" style={{ maxWidth: '400px' }}>Group your decks into dedicated tournament rosters, format-specific folders, or theory-crafting blocks.</p>
                                </Card.Body>
                            </Card>
                        )}
                    </div>
                )}
            </Container>

            {/* Ace Modal */}
            <Modal show={showAceModal} onHide={() => setShowAceModal(false)} centered size="lg" contentClassName="bg-dark text-white border border-info">
                <Modal.Header closeButton closeVariant="white" className="border-secondary bg-black">
                    <Modal.Title className="text-info fw-bold fs-6">SELECT SIGNATURE ACE MONSTER</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4 bg-dark" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    <Row xs={3} sm={4} md={6} className="g-3">
                        {availableAceCards.map(card => {
                            const isSelected = aceMonsterCard?.id === card.id;
                            return (
                                <Col key={card.id}>
                                    <div className={`rounded border overflow-hidden position-relative ${isSelected ? 'border-info shadow-lg' : 'border-secondary border-opacity-50'}`} style={{ cursor: 'pointer', backgroundColor: '#000' }} onClick={() => handleSelectAce(card)}>
                                        <img src={card.image || `${CDN_BASE_URL}/${card.id}.jpg`} alt={card.name} className="w-100 h-auto" style={{ aspectRatio: '421/614', objectFit: 'cover' }} onError={(e) => e.target.src = `https://images.ygoprodeck.com/images/cards_small/${card.id}.jpg`} />
                                        {isSelected && <Badge bg="info" className="position-absolute top-0 start-0 m-1 text-dark fw-bold" style={{ fontSize: '0.55rem' }}>ACTIVE</Badge>}
                                    </div>
                                </Col>
                            );
                        })}
                    </Row>
                </Modal.Body>
            </Modal>

            {/* Playlist Modal */}
            <Modal show={showPlaylistModal} onHide={() => { setShowPlaylistModal(false); setCoverSearchQuery(''); }} centered size="lg" contentClassName="bg-dark text-white border border-info shadow-lg rounded-3 cascadia-font">
                <Modal.Header closeButton closeVariant="white" className="border-secondary bg-black bg-opacity-60 py-2">
                    <Modal.Title className="text-info fw-bold fs-6">INITIALIZE NEW PLAYLIST</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4 bg-dark">
                    <Row className="g-4">
                        <Col md={4} className="d-flex flex-column align-items-center">
                            <div className="text-info small mb-2 text-center fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>MARQUEE COVER CARD</div>
                            <div className="rounded border bg-black w-100" style={{ aspectRatio: '421/614', borderColor: playlistForm.coverCard ? '#00f0ff' : 'rgba(255,255,255,0.2)' }}>
                                {playlistForm.coverCard ? (
                                    <img src={playlistForm.coverCard.image || `${CDN_BASE_URL}/${playlistForm.coverCard.id}.jpg`} alt={playlistForm.coverCard.name} className="w-100 h-100 rounded" style={{ objectFit: 'cover' }} onError={(e) => e.target.src = `https://images.ygoprodeck.com/images/cards_small/${playlistForm.coverCard.id}.jpg`} />
                                ) : <div className="w-100 h-100 d-flex align-items-center justify-content-center text-white-50 small border-dashed rounded p-3 text-center">[ NO CARD SELECTED ]</div>}
                            </div>
                        </Col>
                        <Col md={8} className="d-flex flex-column">
                            <Form.Group className="mb-3">
                                <Form.Label className="text-info small mb-1 fw-bold" style={{ fontSize: '0.75rem' }}>PLAYLIST DESIGNATION</Form.Label>
                                <Form.Control type="text" placeholder="e.g. YCS Orlando 2026 Roster" className="bg-black text-white border-secondary shadow-none cascadia-font" value={playlistForm.title} onChange={e => setPlaylistForm({...playlistForm, title: e.target.value})} />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-info small mb-1 fw-bold" style={{ fontSize: '0.75rem' }}>DESCRIPTION (OPTIONAL)</Form.Label>
                                <Form.Control as="textarea" rows={2} placeholder="Strategy notes, event details..." className="bg-black text-white border-secondary shadow-none cascadia-font" value={playlistForm.description} onChange={e => setPlaylistForm({...playlistForm, description: e.target.value})} />
                            </Form.Group>
                            <div className="mt-2 flex-grow-1 d-flex flex-column" style={{ minHeight: '170px' }}>
                                <Form.Label className="text-warning small mb-1 fw-bold" style={{ fontSize: '0.75rem' }}>SEARCH DATABASE FOR COVER CARD</Form.Label>
                                <Form.Control type="text" placeholder="Type at least 3 letters to scan..." className="bg-black text-white border-warning border-opacity-50 shadow-none mb-2 cascadia-font" value={coverSearchQuery} onChange={e => setCoverSearchQuery(e.target.value)} />
                                <div className="rounded bg-black border border-secondary border-opacity-50 p-2 flex-grow-1 custom-scrollbar d-flex flex-wrap gap-2" style={{ maxHeight: '160px', overflowY: 'auto', alignContent: 'start' }}>
                                    {coverSearchQuery.length < 3 ? <span className="text-white-50 small m-auto">AWAITING QUERY INPUT...</span> : coverSearchResults.map(card => (
                                        <div key={card.id} className={`position-relative rounded playlist-thumb-hover ${playlistForm.coverCard?.id === card.id ? 'border border-info shadow' : 'border border-secondary border-opacity-50'}`} style={{ width: '52px', cursor: 'pointer' }} onClick={() => setPlaylistForm({...playlistForm, coverCard: card})}>
                                            <img src={card.image || `${CDN_BASE_URL}/${card.id}.jpg`} alt={card.name} className="w-100 h-100 rounded" style={{ aspectRatio: '421/614', objectFit: 'cover' }} onError={(e) => e.target.src = `https://images.ygoprodeck.com/images/cards_small/${card.id}.jpg`} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer className="border-top border-info border-opacity-25 pt-2 d-flex justify-content-between bg-black bg-opacity-60">
                    <Button variant="outline-danger" size="sm" className="cascadia-font fw-bold" onClick={() => { setShowPlaylistModal(false); setCoverSearchQuery(''); }}>ABORT</Button>
                    <Button variant="info" size="sm" className="cascadia-font fw-bold px-4" disabled={!playlistForm.title || !playlistForm.coverCard} onClick={handleCreatePlaylist}>INITIALIZE PLAYLIST</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}