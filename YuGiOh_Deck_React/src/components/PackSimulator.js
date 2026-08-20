'use client'; 

import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Spinner, Row, Col, Badge } from 'react-bootstrap';
import '../mdstyles.css';

export default function PackSimulator({ mdSound }) {
    const [sets, setSets] = useState([]);
    const [selectedSet, setSelectedSet] = useState("");
    const [isFetchingSets, setIsFetchingSets] = useState(true);

    // packState controls the Master Duel flow: 'loading' -> 'ready' (pack hovering) -> 'opening' (rainbow flash) -> 'opened' (cards)
    const [packState, setPackState] = useState('loading'); 
    const [currentPack, setCurrentPack] = useState([]);
    const [flippedCards, setFlippedCards] = useState([]);

    // ⚡ Fetch all available sets on component mount
    useEffect(() => {
        setIsFetchingSets(true);
        fetch('https://db.ygoprodeck.com/api/v7/cardsets.php')
            .then(res => res.json())
            .then(data => {
                const validSets = data.filter(s => s.num_of_cards >= 9);
                validSets.sort((a, b) => new Date(b.tcg_date || 0) - new Date(a.tcg_date || 0));
                
                setSets(validSets);
                if (validSets.length > 0) {
                    setSelectedSet(validSets[0].set_name);
                    setPackState('ready');
                }
            })
            .catch(err => console.error("Failed to fetch sets:", err))
            .finally(() => setIsFetchingSets(false));
    }, []);

    // ⚡ Handle dropdown change: Reset the pack
    const handleSetChange = (e) => {
        setSelectedSet(e.target.value);
        setPackState('ready');
    };

    // ⚡ The Master Duel Opening Sequence
    const handleOpenPack = async () => {
        if (!selectedSet || packState !== 'ready') return;
        
        mdSound?.playClick?.();
        setPackState('opening'); // Triggers the CSS shake and rainbow flash

        try {
            // 1. Start the API fetch in the background
            const fetchPromise = fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?cardset=${encodeURIComponent(selectedSet)}`)
                .then(res => {
                    if (!res.ok) throw new Error("Failed to fetch set cards");
                    return res.json();
                });

            // 2. Enforce a strict 2.5-second delay to let the epic animation play out
            const delayPromise = new Promise(resolve => setTimeout(resolve, 2500));

            // Wait for BOTH the animation delay and the API fetch to complete
            const [json] = await Promise.all([fetchPromise, delayPromise]);
            
            const cards = json.data;
            const commons = [];
            const foils = [];

            // The Extraction Algorithm
            cards.forEach(card => {
                const setInfo = card.card_sets?.find(s => s.set_name === selectedSet);
                if (!setInfo) return;

                const rarity = setInfo.set_rarity || "Common";
                const isCommon = ["Common", "Short Print", "Super Short Print", "Normal Parallel Rare"].includes(rarity);

                if (isCommon) commons.push({ ...card, packRarity: rarity });
                else foils.push({ ...card, packRarity: rarity });
            });

            const shuffle = (arr) => [...arr].sort(() => 0.5 - Math.random());

            let pulledCommons = [];
            if (commons.length > 0) {
                pulledCommons = shuffle(commons).slice(0, Math.min(8, commons.length));
                while (pulledCommons.length < 8) {
                    pulledCommons.push(commons[Math.floor(Math.random() * commons.length)]);
                }
            } else {
                pulledCommons = shuffle(foils).slice(0, 8); 
            }

            let pulledFoil = foils.length > 0 ? shuffle(foils).slice(0, 1) : shuffle(commons).slice(0, 1);
            const finalPack = shuffle([...pulledCommons, ...pulledFoil]);

            setCurrentPack(finalPack);
            setFlippedCards(new Array(finalPack.length).fill(false));
            
            // 3. Transition to the Reveal Phase
            setPackState('opened');

        } catch (err) {
            console.error("Pack simulation error:", err);
            setPackState('ready'); // Revert on failure
            alert("⚠️ SYSTEM ERROR: Failed to generate pack. The API may be rate-limiting requests.");
        }
    };

    const handleFlipCard = (index) => {
        if (flippedCards[index]) return;
        mdSound?.playHover?.();
        
        const newFlipped = [...flippedCards];
        newFlipped[index] = true;
        setFlippedCards(newFlipped);
    };

    const handleRevealAll = () => {
        mdSound?.playClick?.();
        setFlippedCards(new Array(currentPack.length).fill(true));
    };

    return (
        <div className="md-theme-bg min-vh-100 py-5 mt-5" style={{ fontFamily: "'Cascadia Mono', monospace", position: 'relative' }}>
            
            {/* ⚡ MASTER DUEL ANIMATION STYLES */}
            <style>{`
                .cascadia-font { font-family: 'Cascadia Mono', monospace !important; }
                
                /* MASTER DUEL RAINBOW OVERLAY */
                .md-rainbow-flash {
                    position: fixed;
                    top: 0; left: 0; width: 100vw; height: 100vh;
                    background: repeating-linear-gradient(90deg, 
                        rgba(255,0,0,0.3) 0%, rgba(255,154,0,0.3) 10%, rgba(208,222,33,0.3) 20%, 
                        rgba(79,220,74,0.3) 30%, rgba(63,218,216,0.3) 40%, rgba(47,201,226,0.3) 50%, 
                        rgba(28,127,238,0.3) 60%, rgba(95,21,242,0.3) 70%, rgba(186,12,248,0.3) 80%, 
                        rgba(251,7,217,0.3) 90%, rgba(255,0,0,0.3) 100%);
                    background-size: 200% 200%;
                    z-index: 9999;
                    pointer-events: none;
                    opacity: 0;
                }
                .md-rainbow-flash.active {
                    animation: masterDuelFlash 2.5s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
                }
                @keyframes masterDuelFlash {
                    0% { opacity: 0; background-position: 0% 0%; filter: brightness(1); }
                    30% { opacity: 1; background-position: 100% 0%; filter: brightness(1.5); }
                    70% { opacity: 1; background-color: white; filter: brightness(10); }
                    100% { opacity: 0; }
                }

                /* THE BOOSTER PACK */
                .booster-pack {
                    width: 220px;
                    height: 380px;
                    background: linear-gradient(135deg, #0f172a, #1e3a8a, #0f172a);
                    border-radius: 12px;
                    border: 3px solid #00f2ff;
                    box-shadow: 0 15px 40px rgba(0,0,0,0.8), 0 0 25px rgba(0, 242, 255, 0.4);
                    position: relative;
                    margin: 80px auto;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                    padding: 20px;
                    overflow: hidden;
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .booster-pack:hover {
                    box-shadow: 0 15px 40px rgba(0,0,0,0.8), 0 0 40px rgba(0, 242, 255, 0.8);
                }
                .booster-pack::before {
                    content: 'ERREGETE YGO';
                    position: absolute;
                    top: 15px;
                    font-size: 0.8rem;
                    color: rgba(255,255,255,0.5);
                    letter-spacing: 2px;
                }
                .booster-pack::after {
                    content: '';
                    position: absolute;
                    top: 0; left: -100%; width: 50%; height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
                    transform: skewX(-20deg);
                    animation: packSheen 3s infinite;
                }
                @keyframes packSheen {
                    0% { left: -100%; }
                    100% { left: 200%; }
                }

                .pack-floating {
                    animation: floatPack 3s ease-in-out infinite;
                }
                @keyframes floatPack {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-15px); }
                    100% { transform: translateY(0px); }
                }

                .pack-opening {
                    animation: violentShake 0.1s infinite !important;
                    filter: brightness(1.5);
                    box-shadow: 0 0 50px #fff !important;
                    border-color: #fff !important;
                }
                @keyframes violentShake {
                    0% { transform: translate(2px, 1px) rotate(0deg); }
                    10% { transform: translate(-1px, -2px) rotate(-2deg); }
                    20% { transform: translate(-3px, 0px) rotate(2deg); }
                    30% { transform: translate(0px, 2px) rotate(0deg); }
                    40% { transform: translate(1px, -1px) rotate(1deg); }
                    50% { transform: translate(-1px, 2px) rotate(-1deg); }
                    60% { transform: translate(-3px, 1px) rotate(0deg); }
                    70% { transform: translate(2px, 1px) rotate(-2deg); }
                    80% { transform: translate(-1px, -1px) rotate(2deg); }
                    90% { transform: translate(2px, 2px) rotate(0deg); }
                    100% { transform: translate(1px, -2px) rotate(-1deg); }
                }

                /* FLIP ANIMATION CLASSES */
                .pack-card-container {
                    perspective: 1000px;
                    width: 100%;
                    max-width: 220px;
                    aspect-ratio: 0.68;
                    margin: 0 auto;
                    cursor: pointer;
                }
                .pack-card-inner {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    transform-style: preserve-3d;
                }
                .pack-card-container.flipped .pack-card-inner {
                    transform: rotateY(180deg);
                }
                .pack-card-front, .pack-card-back {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    backface-visibility: hidden;
                    border-radius: 5px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.5);
                }
                .pack-card-front {
                    background-image: url('https://images.ygoprodeck.com/images/cards/back_high.jpg');
                    background-size: cover;
                    background-position: center;
                    border: 2px solid rgba(0, 242, 255, 0.3);
                    transition: all 0.3s ease;
                }
                .pack-card-front:hover {
                    box-shadow: 0 0 20px rgba(0, 242, 255, 0.5);
                    border-color: #00f2ff;
                    transform: scale(1.02);
                }
                .pack-card-back {
                    transform: rotateY(180deg);
                    background-color: #0f172a;
                    border: 2px solid #00f2ff;
                }
                .pack-card-back img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }
                
                /* RARE PULL HOLO GLOWS */
                .super-pull {
                    box-shadow: 0 0 25px rgba(192, 192, 192, 0.8) !important;
                    border: 2px solid silver !important;
                }
                .ultra-pull {
                    box-shadow: 0 0 30px rgba(255, 215, 0, 0.8), inset 0 0 20px rgba(255, 215, 0, 0.5) !important;
                    border: 2px solid gold !important;
                    animation: pulseGlow 2s infinite alternate;
                }
                .secret-pull {
                    box-shadow: 0 0 40px rgba(255, 0, 255, 0.8), inset 0 0 30px rgba(0, 242, 255, 0.8) !important;
                    border: 2px solid #ff00ff !important;
                    animation: secretGlow 2s infinite alternate;
                }
                
                @keyframes pulseGlow {
                    0% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.5); }
                    100% { box-shadow: 0 0 40px rgba(255, 215, 0, 1); }
                }
                @keyframes secretGlow {
                    0% { box-shadow: 0 0 20px rgba(255, 0, 255, 0.5); }
                    100% { box-shadow: 0 0 50px rgba(0, 242, 255, 1); }
                }

                .btn-cyber-outline { 
                    background: transparent; border: 1px solid #00f2ff; color: #00f2ff; transition: all 0.3s;
                }
                .btn-cyber-outline:hover { background: #00f2ff; color: #0a0d14 !important; box-shadow: 0 0 20px rgba(0, 242, 255, 0.6); }
            `}</style>

            {/* ⚡ THE MASTER DUEL RAINBOW FLASH OVERLAY */}
            <div className={`md-rainbow-flash ${packState === 'opening' ? 'active' : ''}`}></div>

            <Container>
                {/* CYBER HEADER */}
                <Card style={{ backgroundColor: 'rgba(10, 13, 20, 0.95)', backdropFilter: 'blur(10px)', zIndex: 10 }} className="border-info shadow-lg p-3 mb-4">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                        <div>
                            <h2 className="text-info m-0 cascadia-font fw-bold" style={{ textShadow: '0 0 10px rgba(0,242,255,0.5)' }}>
                                PACK_SIMULATOR_TERMINAL
                            </h2>
                            <p className="text-white-50 m-0 small cascadia-font mt-1">
                                ESTABLISHING LINK TO YGOPRODECK API // SELECT BOOSTER ARCHIVE
                            </p>
                        </div>
                        
                        <div className="d-flex gap-2 align-items-center">
                            {isFetchingSets ? (
                                <div className="text-info cascadia-font small me-2"><Spinner size="sm" animation="border" className="me-2"/>LOADING SETS...</div>
                            ) : (
                                <select 
                                    className="form-select bg-dark text-info border-info cascadia-font fw-bold shadow-none"
                                    value={selectedSet}
                                    onChange={handleSetChange}
                                    style={{ width: 'auto', maxWidth: '300px', cursor: 'pointer' }}
                                >
                                    {sets.map((s, i) => (
                                        <option key={i} value={s.set_name}>
                                            {s.set_name} ({s.num_of_cards} Cards)
                                        </option>
                                    ))}
                                </select>
                            )}

                            <Button 
                                className="btn-cyber-outline fw-bold cascadia-font px-4 text-nowrap"
                                onClick={() => setPackState('ready')}
                                disabled={packState === 'ready' || packState === 'opening'}
                            >
                                GET NEW PACK
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* PACK DISPLAY AREA */}
                {(packState === 'ready' || packState === 'opening') && (
                    <div className="text-center position-relative" style={{ zIndex: 5 }}>
                        
                        {/* ⚡ THE INTERACTIVE BOOSTER PACK */}
                        <div 
                            className={`booster-pack ${packState === 'opening' ? 'pack-opening' : 'pack-floating'}`}
                            onClick={handleOpenPack}
                        >
                            <h3 className="text-white cascadia-font fw-bold" style={{ textShadow: '0 2px 5px rgba(0,0,0,0.8)' }}>
                                {selectedSet}
                            </h3>
                            <Badge bg="info" className="text-dark cascadia-font mt-3 px-3 py-2">
                                9 CARDS PER PACK
                            </Badge>
                            
                            {packState === 'ready' && (
                                <p className="text-info small cascadia-font fw-bold position-absolute" style={{ bottom: '15px', animation: 'pulseGlow 1.5s infinite alternate' }}>
                                    CLICK TO OPEN
                                </p>
                            )}
                        </div>

                    </div>
                )}

                {/* THE REVEAL PHASE (GRID OF CARDS) */}
                {packState === 'opened' && (
                    <div className="pt-3 position-relative" style={{ zIndex: 10 }}>
                        {currentPack.length > 0 && flippedCards.includes(false) && (
                            <div className="text-end mb-3">
                                <Button variant="outline-warning" size="sm" className="cascadia-font fw-bold" onClick={handleRevealAll}>
                                    REVEAL ALL ➔
                                </Button>
                            </div>
                        )}

                        <Row className="g-4 justify-content-center">
                            {currentPack.map((card, idx) => {
                                const isFlipped = flippedCards[idx];
                                
                                let glowClass = "";
                                if (isFlipped) {
                                    if (card.packRarity.includes("Super")) glowClass = "super-pull";
                                    if (card.packRarity.includes("Ultra") || card.packRarity.includes("Ultimate")) glowClass = "ultra-pull";
                                    if (card.packRarity.includes("Secret") || card.packRarity.includes("Starlight")) glowClass = "secret-pull";
                                }

                                return (
                                    <Col xs={6} md={4} lg={3} key={idx}>
                                        <div 
                                            className={`pack-card-container ${isFlipped ? 'flipped' : ''}`}
                                            onClick={() => handleFlipCard(idx)}
                                        >
                                            <div className="pack-card-inner">
                                                <div className="pack-card-front d-flex justify-content-center align-items-center">
                                                    {!isFlipped && (
                                                        <span className="badge bg-dark text-info border border-info position-absolute top-50 translate-middle-y">
                                                            CLICK TO REVEAL
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <div className={`pack-card-back ${glowClass}`}>
                                                    <img 
                                                        src={`https://images.ygoprodeck.com/images/cards/${card.id}.jpg`} 
                                                        alt={card.name} 
                                                        onError={(e) => e.target.src = 'https://images.ygoprodeck.com/images/cards/back_high.jpg'}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="text-center mt-3" style={{ minHeight: '50px' }}>
                                            {isFlipped && (
                                                <>
                                                    <div className="text-white text-truncate cascadia-font small fw-bold" title={card.name}>
                                                        {card.name}
                                                    </div>
                                                    <Badge 
                                                        bg={card.packRarity.includes("Rare") && !card.packRarity.includes("Common") ? "warning" : "secondary"} 
                                                        className={card.packRarity.includes("Rare") && !card.packRarity.includes("Common") ? "text-dark mt-1" : "mt-1"}
                                                    >
                                                        {card.packRarity}
                                                    </Badge>
                                                </>
                                            )}
                                        </div>
                                    </Col>
                                );
                            })}
                        </Row>
                    </div>
                )}
            </Container>
        </div>
    );
}