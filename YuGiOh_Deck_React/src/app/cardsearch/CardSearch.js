'use client'; 

import React, { useState, useEffect, useMemo } from 'react';
import { Form, Button, Spinner, Row, Col, InputGroup } from 'react-bootstrap';
import { 
    CARDS_PER_PAGE, ATTRIBUTES, MAIN_CARD_TYPES, MONSTER_ABILITIES, 
    MONSTER_EXTRA_TYPES, MONSTER_RACES, SPELL_TYPES, TRAP_TYPES, 
    ALL_RACES_TYPES, RARITIES, LEVELS, LINKS, SCALES 
} from '@/constants/cardSearchConstants';
import { useCardSearch } from '@/hooks/useCardSearch';
import CardSearchInspectorModal from '@/components/CardSearchInspectorModal';
import CardInspectorModal from '@/components/CardInspectorModal';
import '@/mdstyles.css';

export default function CardSearch() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMainType, setSelectedMainType] = useState("ALL");
    const [selectedAttribute, setSelectedAttribute] = useState("ALL");
    const [selectedAbility, setSelectedAbility] = useState("ALL");
    const [selectedType, setSelectedType] = useState("ALL");
    const [selectedRace, setSelectedRace] = useState("ALL RACES / TYPES");
    const [currentPage, setCurrentPage] = useState(1);
    const [inspectCard, setInspectCard] = useState(null);
    const [selectedArchetype, setSelectedArchetype] = useState("ALL");
    const [selectedRarity, setSelectedRarity] = useState("ALL");
    const [selectedLevel, setSelectedLevel] = useState("ALL");
    const [selectedLink, setSelectedLink] = useState("ALL");
    const [selectedScale, setSelectedScale] = useState("ALL");
    const [archetypesList, setArchetypesList] = useState(["ALL"]);

    // Pass active filters to the custom hook
    const { rawCards, isLoading, hasError, fetchCards } = useCardSearch({
        selectedAttribute, selectedRace, selectedArchetype, selectedLevel, selectedLink, selectedScale
    });

    const currentRaceOptions = useMemo(() => {
        if (selectedMainType === "SPELL") return SPELL_TYPES;
        if (selectedMainType === "TRAP") return TRAP_TYPES;
        if (selectedMainType === "NORMAL" || selectedMainType === "EFFECT") return MONSTER_RACES;
        return ALL_RACES_TYPES;
    }, [selectedMainType]);

    const handleCategoryChange = (newCategory) => {
        setSelectedMainType(newCategory);
        if (newCategory === "SPELL") setSelectedRace("ALL SPELL TYPES");
        else if (newCategory === "TRAP") setSelectedRace("ALL TRAP TYPES");
        else if (newCategory === "NORMAL" || newCategory === "EFFECT") setSelectedRace("ALL MONSTER TYPES");
        else setSelectedRace("ALL RACES / TYPES");
    };

    useEffect(() => {
        fetch("https://db.ygoprodeck.com/api/v7/archetypes.php")
            .then(res => res.json())
            .then(data => {
                const names = data.map(a => a.archetype_name).sort();
                setArchetypesList(["ALL", ...names]);
            })
            .catch(() => setArchetypesList(["ALL"]));
    }, []);

    const filteredCards = useMemo(() => {
        const queryLower = searchQuery.trim().toLowerCase();

        return rawCards.filter(card => {
            const matchesText = !queryLower || 
                card.name.toLowerCase().includes(queryLower) ||
                card.desc.toLowerCase().includes(queryLower) ||
                card.id.toString().includes(queryLower);

            let matchesMainType = true;
            if (selectedMainType === "NORMAL") matchesMainType = card.type.toLowerCase().includes("monster") && !card.type.toLowerCase().includes("effect");
            else if (selectedMainType === "EFFECT") matchesMainType = card.type.toLowerCase().includes("monster") && card.type.toLowerCase().includes("effect");
            else if (selectedMainType === "SPELL") matchesMainType = card.type.toLowerCase().includes("spell");
            else if (selectedMainType === "TRAP") matchesMainType = card.type.toLowerCase().includes("trap");

            let matchesAbility = true;
            if (selectedAbility !== "ALL") {
                matchesAbility = card.type.toLowerCase().includes(selectedAbility.toLowerCase());
            }

            let matchesType = true;
            if (selectedType !== "ALL") {
                matchesType = card.type.toLowerCase().includes(selectedType.toLowerCase());
            }

            let matchesRace = true;
            if (selectedRace && !selectedRace.startsWith("ALL")) {
                matchesRace = card.race.toLowerCase() === selectedRace.toLowerCase();
            }

            let matchesRarity = true;
            if (selectedRarity !== "ALL") {
                matchesRarity = card.cardSets && card.cardSets.some(set => 
                    (set.set_rarity && set.set_rarity.toLowerCase().includes(selectedRarity.toLowerCase())) ||
                    (set.set_rarity_code && set.set_rarity_code.toLowerCase().includes(selectedRarity.toLowerCase()))
                );
            }

            return matchesText && matchesMainType && matchesAbility && matchesType && matchesRace && matchesRarity;
        });
    }, [rawCards, searchQuery, selectedMainType, selectedAbility, selectedType, selectedRace, selectedRarity]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedMainType, selectedAttribute, selectedAbility, selectedType, selectedRace]);

    const totalPages = Math.ceil(filteredCards.length / CARDS_PER_PAGE) || 1;

    const paginatedCards = useMemo(() => {
        const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
        return filteredCards.slice(startIndex, startIndex + CARDS_PER_PAGE);
    }, [filteredCards, currentPage]);

    return (
        <div className="md-theme-bg min-vh-100 text-white" style={{ paddingTop: '95px', paddingBottom: '60px', backgroundColor: '#0a0d14', fontFamily: "'Cascadia Mono', monospace" }}>
            <style>{`
                * { font-family: 'Cascadia Mono', monospace !important; }
                .terminal-font { font-family: 'Cascadia Mono', monospace !important; }
                .hud-label { letter-spacing: 1px; }
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
                .md-card-tile { transition: transform 0.2s, border-color 0.2s; cursor: pointer; }
                .md-card-tile:hover { transform: translateY(-4px); box-shadow: 0 0 15px rgba(0,210,255,0.3); }
            `}</style>

            <div className="container-fluid px-4" style={{ maxWidth: '1400px' }}>
                {/* 🚀 REMOVED BORDER, BACKGROUND, AND SHADOW CLASSES */}
                <div className="p-4 rounded-3 mb-4" style={{ background: 'transparent' }}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <h3 className="fw-bold text-info terminal-font m-0 d-flex align-items-center gap-2">
                                CARD DATABASE
                            </h3>
                            <span className="text-white-50 small terminal-font">
                                FOUND {filteredCards.length} MATCHES • PAGE {currentPage} OF {totalPages}
                            </span>
                        </div>
                    </div>

                    <Row className="g-3">
                        <Col lg={4} md={12}>
                            <Form.Label className="hud-label text-info small terminal-font mb-1">
                                NAME OR EFFECT TEXT SEARCH
                            </Form.Label>
                            <InputGroup>
                                <Form.Control 
                                    type="text"
                                    placeholder="Search card name, 'negate', 'destroy'..."
                                    className="bg-black text-white border-secondary terminal-font"
                                    style={{ color: '#fff', backgroundColor: 'rgba(0,0,0,0.6)' }}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <Button variant="outline-secondary" onClick={() => setSearchQuery("")} className="terminal-font">
                                        ✖
                                    </Button>
                                )}
                            </InputGroup>
                        </Col>

                        <Col lg={8} md={12}>
                            <Form.Label className="hud-label text-info small terminal-font mb-1">
                                CARD CATEGORY
                            </Form.Label>
                            <div className="d-flex gap-1 flex-wrap">
                                {MAIN_CARD_TYPES.map(type => (
                                    <Button
                                        key={type}
                                        variant={selectedMainType === type ? "info" : "outline-secondary"}
                                        size="sm"
                                        className="terminal-font fw-bold flex-grow-1"
                                        onClick={() => handleCategoryChange(type)}
                                    >
                                        {type}
                                    </Button>
                                ))}
                            </div>
                        </Col>

                        <Col lg={3} md={6}>
                            <Form.Label className="hud-label text-info small terminal-font mb-1">ATTRIBUTE</Form.Label>
                            <Form.Select 
                                className="bg-black text-info border-secondary terminal-font text-uppercase"
                                style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                                value={selectedAttribute}
                                onChange={(e) => setSelectedAttribute(e.target.value)}
                                disabled={selectedMainType === "SPELL" || selectedMainType === "TRAP"}
                            >
                                {ATTRIBUTES.map(attr => (<option key={attr} value={attr}>{attr}</option>))}
                            </Form.Select>
                        </Col>

                        <Col lg={3} md={6}>
                            <Form.Label className="hud-label text-info small terminal-font mb-1">ABILITY</Form.Label>
                            <Form.Select 
                                className="bg-black text-info border-secondary terminal-font"
                                style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                                value={selectedAbility}
                                onChange={(e) => setSelectedAbility(e.target.value)}
                                disabled={selectedMainType === "SPELL" || selectedMainType === "TRAP" || selectedMainType === "NORMAL"}
                            >
                                {MONSTER_ABILITIES.map(ability => (
                                    <option key={ability} value={ability}>{ability === 'ALL' ? 'ALL ABILITIES' : ability}</option>
                                ))}
                            </Form.Select>
                        </Col>

                        <Col lg={3} md={6}>
                            <Form.Label className="hud-label text-info small terminal-font mb-1">TYPE</Form.Label>
                            <Form.Select 
                                className="bg-black text-info border-secondary terminal-font"
                                style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                disabled={selectedMainType === "SPELL" || selectedMainType === "TRAP"}
                            >
                                {MONSTER_EXTRA_TYPES.map(type => (
                                    <option key={type} value={type}>{type === 'ALL' ? 'ALL TYPES' : type}</option>
                                ))}
                            </Form.Select>
                        </Col>

                        <Col lg={3} md={6}>
                            <Form.Label className="hud-label text-info small terminal-font mb-1">
                                {selectedMainType === "SPELL" ? "SPELL TYPE" : selectedMainType === "TRAP" ? "TRAP TYPE" : "MONSTER RACE"}
                            </Form.Label>
                            <Form.Select 
                                className="bg-black text-info border-secondary terminal-font"
                                style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                                value={selectedRace}
                                onChange={(e) => setSelectedRace(e.target.value)}
                            >
                                {currentRaceOptions.map(option => (<option key={option} value={option}>{option.toUpperCase()}</option>))}
                            </Form.Select>
                        </Col>

                        <Col lg={3} md={6}>
                            <Form.Label className="hud-label text-info small terminal-font mb-1">ARCHETYPE</Form.Label>
                            <Form.Select 
                                className="bg-black text-info border-secondary terminal-font"
                                style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                                value={selectedArchetype}
                                onChange={(e) => setSelectedArchetype(e.target.value)}
                            >
                                {archetypesList.map(arch => (<option key={arch} value={arch}>{arch.toUpperCase()}</option>))}
                            </Form.Select>
                        </Col>

                        <Col lg={3} md={6}>
                            <Form.Label className="hud-label text-info small terminal-font mb-1">RARITY</Form.Label>
                            <Form.Select 
                                className="bg-black text-info border-secondary terminal-font"
                                style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                                value={selectedRarity}
                                onChange={(e) => setSelectedRarity(e.target.value)}
                            >
                                {RARITIES.map(r => (<option key={r} value={r}>{r.toUpperCase()}</option>))}
                            </Form.Select>
                        </Col>

                        <Col lg={2} md={4}>
                            <Form.Label className="hud-label text-info small terminal-font mb-1">LEVEL / RANK</Form.Label>
                            <Form.Select 
                                className="bg-black text-info border-secondary terminal-font"
                                style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                                value={selectedLevel}
                                onChange={(e) => setSelectedLevel(e.target.value)}
                                disabled={selectedMainType === "SPELL" || selectedMainType === "TRAP" || selectedType === "LINK"}
                            >
                                {LEVELS.map(l => (<option key={l} value={l}>{l === 'ALL' ? 'ALL LEVELS' : l}</option>))}
                            </Form.Select>
                        </Col>

                        <Col lg={2} md={4}>
                            <Form.Label className="hud-label text-info small terminal-font mb-1">LINK ARROWS</Form.Label>
                            <Form.Select 
                                className="bg-black text-info border-secondary terminal-font"
                                style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                                value={selectedLink}
                                onChange={(e) => setSelectedLink(e.target.value)}
                                disabled={selectedMainType === "SPELL" || selectedMainType === "TRAP" || (selectedType !== "LINK" && selectedType !== "ALL")}
                            >
                                {LINKS.map(l => (<option key={l} value={l}>{l === 'ALL' ? 'ALL LINKS' : l}</option>))}
                            </Form.Select>
                        </Col>

                        <Col lg={2} md={4}>
                            <Form.Label className="hud-label text-info small terminal-font mb-1">PEND. SCALE</Form.Label>
                            <Form.Select 
                                className="bg-black text-info border-secondary terminal-font"
                                style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                                value={selectedScale}
                                onChange={(e) => setSelectedScale(e.target.value)}
                                disabled={selectedMainType === "SPELL" || selectedMainType === "TRAP" || (selectedType !== "PENDULUM" && selectedType !== "ALL")}
                            >
                                {SCALES.map(s => (<option key={s} value={s}>{s === 'ALL' ? 'ALL SCALES' : s}</option>))}
                            </Form.Select>
                        </Col>
                    </Row>
                </div>

                {isLoading ? (
                    <div className="text-center my-5 py-5">
                        <Spinner animation="border" variant="info" style={{ width: '3rem', height: '3rem' }} />
                        <p className="text-info terminal-font mt-3">DECRYPTING_VRAINS_DATABASE...</p>
                    </div>
                ) : hasError ? (
                    <div className="p-5 text-center bg-dark rounded-3 border border-danger border-opacity-50 my-4">
                        <h4 className="text-danger terminal-font">⚠️ API_CONNECTION_ERROR</h4>
                        <p className="text-white-50 small mb-3">Unable to fetch card data from server.</p>
                        <Button variant="outline-info" size="sm" className="terminal-font" onClick={fetchCards}>RETRY_SEARCH</Button>
                    </div>
                ) : filteredCards.length === 0 ? (
                    <div className="p-5 text-center rounded-3 my-4" style={{ background: 'transparent' }}>
                        <h4 className="text-white-50 terminal-font">NO CARDS MATCH CURRENT FILTER CRITERIA</h4>
                    </div>
                ) : (
                    <Row className="g-3 row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-6 row-cols-xl-6">
                        {paginatedCards.map(card => (
                            <Col key={card.id}>
                                {/* 🚀 REMOVED bg-dark FROM CARD TILE */}
                                <div className="md-card-tile p-2 rounded-3 h-100 d-flex flex-column justify-content-between position-relative" style={{ background: 'transparent' }} onClick={() => setInspectCard(card)}>
                                    <div className="position-relative overflow-hidden rounded mb-2" style={{ aspectRatio: '59/86' }}>
                                        <img 
                                            src={card.image} alt={card.name} className="w-100 h-100 rounded" style={{ objectFit: 'cover' }} loading="lazy"
                                            onError={(e) => { e.target.src = card.fallbackImage || "https://ygoprodeck.com/images/cards/back.jpg"; }}
                                        />
                                    </div>
                                    <div className="text-center">
                                        <span className="text-white fw-bold d-block text-truncate small" title={card.name}>{card.name}</span>
                                        <span className="text-info-50 small terminal-font d-block" style={{ fontSize: '0.65rem' }}>ID: #{card.id}</span>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                )}

                {totalPages > 1 && (
                    <div className="d-flex align-items-center justify-content-center gap-3 mt-4 pt-3 border-top border-secondary border-opacity-25">
                        <Button variant="outline-info" size="sm" className="terminal-font fw-bold px-4" disabled={currentPage === 1} onClick={() => { setCurrentPage(p => Math.max(p - 1, 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>◄ PREVIOUS_PAGE</Button>
                        <span className="text-info terminal-font small fw-bold px-2">PAGE {currentPage} OF {totalPages}</span>
                        <Button variant="outline-info" size="sm" className="terminal-font fw-bold px-4" disabled={currentPage === totalPages} onClick={() => { setCurrentPage(p => Math.min(p + 1, totalPages)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>NEXT_PAGE ►</Button>
                    </div>
                )}
            </div>

            <CardSearchInspectorModal inspectCard={inspectCard} setInspectCard={setInspectCard} />
        </div>
    );
}