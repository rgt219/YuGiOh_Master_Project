import React, { useState, useMemo, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Form, Row, Col, Card, Spinner, Badge, Button, InputGroup } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import { 
    ATTRIBUTES, MAIN_CARD_TYPES, MONSTER_ABILITIES, 
    MONSTER_EXTRA_TYPES, MONSTER_RACES, SPELL_TYPES, TRAP_TYPES, 
    ALL_RACES_TYPES, RARITIES, LEVELS, LINKS, SCALES 
} from '@/constants/cardSearchConstants';
import '@/mdstyles.css';

export const deckList = {
    mainDeck: [], 
    extraDeck: [],
    sideDeck: [],
    id: '',
    title: '',
    userId: ''
};

const AZURE_BLOB_BASE_URL = "https://ygocardstore-images-gpctdecsa6a6ctfc.z01.azurefd.net/card-images";

const fetchYgoCards = async () => {
    const response = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes');
    if (!response.ok) throw new Error('NETWORK_ERROR');
    const data = await response.json();

    return data.data.map(card => {
        const extraDeckFrames = ['fusion', 'synchro', 'xyz', 'link', 'fusion_pendulum', 'synchro_pendulum', 'xyz_pendulum'];
        const isExtraDeck = extraDeckFrames.includes(card.frameType?.toLowerCase());
        
        const isLinkOrPendulum = (card.type || "").toLowerCase().includes("link") || (card.type || "").toLowerCase().includes("pendulum");
        const miscObj = card.misc_info?.[0] || {};

        return {
            ...card,
            isExtraDeck,
            isLinkOrPendulum,
            genesysPoints: isLinkOrPendulum ? "N/A" : (miscObj.genesys_points ?? 0),
            image: `${AZURE_BLOB_BASE_URL}/${card.id}.jpg`,
            fallbackImage: card.card_images?.[0]?.image_url_small || `https://images.ygoprodeck.com/images/cards_small/${card.id}.jpg`
        };
    });
};

export default function CardApi({ onAddCard, cardList = [], onInspectCard, onPinCard }) {
    const { 
        data: cards = [], 
        isLoading, 
        isError 
    } = useQuery({
        queryKey: ['ygoCards'],
        queryFn: fetchYgoCards,
        staleTime: 1000 * 60 * 60,
        cacheTime: 1000 * 60 * 60 * 2,
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMainType, setSelectedMainType] = useState('ALL');
    const [selectedAttribute, setSelectedAttribute] = useState('ALL');
    const [selectedAbility, setSelectedAbility] = useState('ALL');
    const [selectedType, setSelectedType] = useState('ALL');
    const [selectedRace, setSelectedRace] = useState('ALL RACES / TYPES');
    const [selectedArchetype, setSelectedArchetype] = useState('ALL');
    const [selectedRarity, setSelectedRarity] = useState('ALL');
    const [selectedLevel, setSelectedLevel] = useState('ALL');
    const [selectedLink, setSelectedLink] = useState('ALL');
    const [selectedScale, setSelectedScale] = useState('ALL');
    const [archetypesList, setArchetypesList] = useState(['ALL']);

    useEffect(() => {
        fetch("https://db.ygoprodeck.com/api/v7/archetypes.php")
            .then(res => res.json())
            .then(data => {
                const names = data.map(a => a.archetype_name).sort();
                setArchetypesList(["ALL", ...names]);
            })
            .catch(() => setArchetypesList(["ALL"]));
    }, []);

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

    const handleResetFilters = () => {
        setSearchQuery('');
        setSelectedMainType('ALL');
        setSelectedAttribute('ALL');
        setSelectedAbility('ALL');
        setSelectedType('ALL');
        setSelectedRace('ALL RACES / TYPES');
        setSelectedArchetype('ALL');
        setSelectedRarity('ALL');
        setSelectedLevel('ALL');
        setSelectedLink('ALL');
        setSelectedScale('ALL');
    };

    const hasActiveFilters = searchQuery.trim() !== '' || selectedMainType !== 'ALL' || selectedAttribute !== 'ALL' ||
        selectedAbility !== 'ALL' || selectedType !== 'ALL' || (selectedRace && !selectedRace.startsWith('ALL')) ||
        selectedArchetype !== 'ALL' || selectedRarity !== 'ALL' || selectedLevel !== 'ALL' ||
        selectedLink !== 'ALL' || selectedScale !== 'ALL';

    const filteredCards = useMemo(() => {
        if (!hasActiveFilters) return [];

        const queryLower = searchQuery.trim().toLowerCase();

        return cards.filter(card => {
            const matchesText = !queryLower || 
                card.name.toLowerCase().includes(queryLower) ||
                (card.desc && card.desc.toLowerCase().includes(queryLower)) ||
                card.id.toString().includes(queryLower);

            let matchesMainType = true;
            if (selectedMainType === "NORMAL") matchesMainType = card.type?.toLowerCase().includes("monster") && !card.type?.toLowerCase().includes("effect");
            else if (selectedMainType === "EFFECT") matchesMainType = card.type?.toLowerCase().includes("monster") && card.type?.toLowerCase().includes("effect");
            else if (selectedMainType === "SPELL") matchesMainType = card.type?.toLowerCase().includes("spell");
            else if (selectedMainType === "TRAP") matchesMainType = card.type?.toLowerCase().includes("trap");

            let matchesAttribute = true;
            if (selectedAttribute !== "ALL") {
                matchesAttribute = card.attribute?.toUpperCase() === selectedAttribute.toUpperCase();
            }

            let matchesAbility = true;
            if (selectedAbility !== "ALL") {
                matchesAbility = card.type?.toLowerCase().includes(selectedAbility.toLowerCase());
            }

            let matchesType = true;
            if (selectedType !== "ALL") {
                matchesType = card.type?.toLowerCase().includes(selectedType.toLowerCase());
            }

            let matchesRace = true;
            if (selectedRace && !selectedRace.startsWith("ALL")) {
                matchesRace = card.race?.toLowerCase() === selectedRace.toLowerCase();
            }

            let matchesArchetype = true;
            if (selectedArchetype !== "ALL") {
                matchesArchetype = card.archetype?.toLowerCase() === selectedArchetype.toLowerCase();
            }

            let matchesRarity = true;
            if (selectedRarity !== "ALL") {
                matchesRarity = card.card_sets && card.card_sets.some(set => 
                    (set.set_rarity && set.set_rarity.toLowerCase().includes(selectedRarity.toLowerCase())) ||
                    (set.set_rarity_code && set.set_rarity_code.toLowerCase().includes(selectedRarity.toLowerCase()))
                );
            }

            let matchesLevel = true;
            if (selectedLevel !== "ALL") {
                matchesLevel = card.level === parseInt(selectedLevel, 10);
            }

            let matchesLink = true;
            if (selectedLink !== "ALL") {
                matchesLink = card.linkval === parseInt(selectedLink, 10);
            }

            let matchesScale = true;
            if (selectedScale !== "ALL") {
                matchesScale = card.scale === parseInt(selectedScale, 10);
            }

            return matchesText && matchesMainType && matchesAttribute && matchesAbility && 
                   matchesType && matchesRace && matchesArchetype && matchesRarity && 
                   matchesLevel && matchesLink && matchesScale;
        }).slice(0, 48);
    }, [
        cards, hasActiveFilters, searchQuery, selectedMainType, selectedAttribute, selectedAbility,
        selectedType, selectedRace, selectedArchetype, selectedRarity, selectedLevel, selectedLink, selectedScale
    ]);

    const getCardDeckCount = (cardId) => {
        return cardList.filter((c) => (c.id || c.Id) === cardId).length;
    };

    return (
        <Card 
            style={{ 
                backgroundColor: 'rgba(8, 12, 20, 0.98)', 
                backdropFilter: 'blur(10px)',
                zIndex: 100 
            }} 
            text="white" 
            className="border-info shadow-lg p-3 md-panel h-100"
        >            
            <Card.Header className="bg-transparent border-bottom border-info border-opacity-50 pb-2 mb-3 d-flex justify-content-between align-items-center flex-shrink-0">
                <h6 className="m-0 text-info terminal-font fw-bold" style={{ letterSpacing: '1px' }}>
                    🔍 CARD DATABASE SEARCH
                </h6>
                {hasActiveFilters && (
                    <Button 
                        variant="outline-danger" 
                        size="sm" 
                        className="terminal-font py-0 px-2 fw-bold" 
                        style={{ fontSize: '0.7rem' }}
                        onClick={handleResetFilters}
                    >
                        CLEAR FILTERS
                    </Button>
                )}
            </Card.Header>

            <Card.Body className="p-0 d-flex flex-column flex-grow-1">
                <Row className="g-3 h-100">
                    {/* LEFT COLUMN: Cleanly spaced, larger form elements filling vertical space */}
                    <Col xs={12} xl={5} className="border-end border-secondary border-opacity-50 pe-xl-3 d-flex flex-column justify-content-between">
                        <Form className="d-flex flex-column gap-2">
                            <Form.Group>
                                <Form.Label className="text-info terminal-font mb-1" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
                                    NAME OR EFFECT TEXT SEARCH
                                </Form.Label>
                                <InputGroup size="md">
                                    <Form.Control
                                        type="search"
                                        placeholder="Search name, 'negate', 'destroy'..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="bg-black text-white border-secondary terminal-font shadow-none py-2"
                                        style={{ fontSize: '0.9rem', backgroundColor: 'rgba(0,0,0,0.6)' }}
                                    />
                                    {searchQuery && (
                                        <Button variant="outline-secondary" onClick={() => setSearchQuery("")} className="terminal-font px-3">
                                            ✖
                                        </Button>
                                    )}
                                </InputGroup>
                            </Form.Group>

                            <Form.Group>
                                <Form.Label className="text-info terminal-font mb-1" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
                                    CARD CATEGORY
                                </Form.Label>
                                <div className="d-flex gap-1 flex-wrap">
                                    {MAIN_CARD_TYPES.map(type => (
                                        <Button
                                            key={type}
                                            variant={selectedMainType === type ? "info" : "outline-secondary"}
                                            size="sm"
                                            className="terminal-font fw-bold flex-grow-1 py-2 px-1"
                                            style={{ fontSize: '0.75rem' }}
                                            onClick={() => handleCategoryChange(type)}
                                        >
                                            {type}
                                        </Button>
                                    ))}
                                </div>
                            </Form.Group>

                            <Row className="g-2">
                                <Col xs={6}>
                                    <Form.Label className="text-info terminal-font mb-1" style={{ fontSize: '0.7rem' }}>ATTRIBUTE</Form.Label>
                                    <Form.Select 
                                        size="md" 
                                        className="bg-black text-info border-secondary terminal-font text-uppercase py-2"
                                        value={selectedAttribute}
                                        onChange={(e) => setSelectedAttribute(e.target.value)}
                                        disabled={selectedMainType === "SPELL" || selectedMainType === "TRAP"}
                                        style={{ fontSize: '0.8rem', backgroundColor: 'rgba(0,0,0,0.6)' }}
                                    >
                                        {ATTRIBUTES.map(attr => (<option key={attr} value={attr}>{attr}</option>))}
                                    </Form.Select>
                                </Col>

                                <Col xs={6}>
                                    <Form.Label className="text-info terminal-font mb-1" style={{ fontSize: '0.7rem' }}>ABILITY</Form.Label>
                                    <Form.Select 
                                        size="md" 
                                        className="bg-black text-info border-secondary terminal-font py-2"
                                        value={selectedAbility}
                                        onChange={(e) => setSelectedAbility(e.target.value)}
                                        disabled={selectedMainType === "SPELL" || selectedMainType === "TRAP" || selectedMainType === "NORMAL"}
                                        style={{ fontSize: '0.8rem', backgroundColor: 'rgba(0,0,0,0.6)' }}
                                    >
                                        {MONSTER_ABILITIES.map(ability => (
                                            <option key={ability} value={ability}>{ability === 'ALL' ? 'ALL ABILITIES' : ability}</option>
                                        ))}
                                    </Form.Select>
                                </Col>

                                <Col xs={6}>
                                    <Form.Label className="text-info terminal-font mb-1" style={{ fontSize: '0.7rem' }}>TYPE</Form.Label>
                                    <Form.Select 
                                        size="md" 
                                        className="bg-black text-info border-secondary terminal-font py-2"
                                        value={selectedType}
                                        onChange={(e) => setSelectedType(e.target.value)}
                                        disabled={selectedMainType === "SPELL" || selectedMainType === "TRAP"}
                                        style={{ fontSize: '0.8rem', backgroundColor: 'rgba(0,0,0,0.6)' }}
                                    >
                                        {MONSTER_EXTRA_TYPES.map(type => (
                                            <option key={type} value={type}>{type === 'ALL' ? 'ALL TYPES' : type}</option>
                                        ))}
                                    </Form.Select>
                                </Col>

                                <Col xs={6}>
                                    <Form.Label className="text-info terminal-font mb-1" style={{ fontSize: '0.7rem' }}>
                                        {selectedMainType === "SPELL" ? "SPELL TYPE" : selectedMainType === "TRAP" ? "TRAP TYPE" : "MONSTER RACE"}
                                    </Form.Label>
                                    <Form.Select 
                                        size="md" 
                                        className="bg-black text-info border-secondary terminal-font py-2"
                                        value={selectedRace}
                                        onChange={(e) => setSelectedRace(e.target.value)}
                                        style={{ fontSize: '0.8rem', backgroundColor: 'rgba(0,0,0,0.6)' }}
                                    >
                                        {currentRaceOptions.map(option => (<option key={option} value={option}>{option.toUpperCase()}</option>))}
                                    </Form.Select>
                                </Col>

                                <Col xs={6}>
                                    <Form.Label className="text-info terminal-font mb-1" style={{ fontSize: '0.7rem' }}>ARCHETYPE</Form.Label>
                                    <Form.Select 
                                        size="md" 
                                        className="bg-black text-info border-secondary terminal-font py-2"
                                        value={selectedArchetype}
                                        onChange={(e) => setSelectedArchetype(e.target.value)}
                                        style={{ fontSize: '0.8rem', backgroundColor: 'rgba(0,0,0,0.6)' }}
                                    >
                                        {archetypesList.map(arch => (<option key={arch} value={arch}>{arch.toUpperCase()}</option>))}
                                    </Form.Select>
                                </Col>

                                <Col xs={6}>
                                    <Form.Label className="text-info terminal-font mb-1" style={{ fontSize: '0.7rem' }}>RARITY</Form.Label>
                                    <Form.Select 
                                        size="md" 
                                        className="bg-black text-info border-secondary terminal-font py-2"
                                        value={selectedRarity}
                                        onChange={(e) => setSelectedRarity(e.target.value)}
                                        style={{ fontSize: '0.8rem', backgroundColor: 'rgba(0,0,0,0.6)' }}
                                    >
                                        {RARITIES.map(r => (<option key={r} value={r}>{r.toUpperCase()}</option>))}
                                    </Form.Select>
                                </Col>

                                <Col xs={4}>
                                    <Form.Label className="text-info terminal-font mb-1" style={{ fontSize: '0.65rem' }}>LVL/RANK</Form.Label>
                                    <Form.Select 
                                        size="md" 
                                        className="bg-black text-info border-secondary terminal-font py-2"
                                        value={selectedLevel}
                                        onChange={(e) => setSelectedLevel(e.target.value)}
                                        disabled={selectedMainType === "SPELL" || selectedMainType === "TRAP" || selectedType === "LINK"}
                                        style={{ fontSize: '0.75rem', backgroundColor: 'rgba(0,0,0,0.6)' }}
                                    >
                                        {LEVELS.map(l => (<option key={l} value={l}>{l === 'ALL' ? 'ALL' : `${l}★`}</option>))}
                                    </Form.Select>
                                </Col>

                                <Col xs={4}>
                                    <Form.Label className="text-info terminal-font mb-1" style={{ fontSize: '0.65rem' }}>LINK</Form.Label>
                                    <Form.Select 
                                        size="md" 
                                        className="bg-black text-info border-secondary terminal-font py-2"
                                        value={selectedLink}
                                        onChange={(e) => setSelectedLink(e.target.value)}
                                        disabled={selectedMainType === "SPELL" || selectedMainType === "TRAP" || (selectedType !== "LINK" && selectedType !== "ALL")}
                                        style={{ fontSize: '0.75rem', backgroundColor: 'rgba(0,0,0,0.6)' }}
                                    >
                                        {LINKS.map(l => (<option key={l} value={l}>{l === 'ALL' ? 'ALL' : `L-${l}`}</option>))}
                                    </Form.Select>
                                </Col>

                                <Col xs={4}>
                                    <Form.Label className="text-info terminal-font mb-1" style={{ fontSize: '0.65rem' }}>SCALE</Form.Label>
                                    <Form.Select 
                                        size="md" 
                                        className="bg-black text-info border-secondary terminal-font py-2"
                                        value={selectedScale}
                                        onChange={(e) => setSelectedScale(e.target.value)}
                                        disabled={selectedMainType === "SPELL" || selectedMainType === "TRAP" || (selectedType !== "PENDULUM" && selectedType !== "ALL")}
                                        style={{ fontSize: '0.75rem', backgroundColor: 'rgba(0,0,0,0.6)' }}
                                    >
                                        {SCALES.map(s => (<option key={s} value={s}>{s === 'ALL' ? 'ALL' : s}</option>))}
                                    </Form.Select>
                                </Col>
                            </Row>
                        </Form>
                    </Col>

                    {/* RIGHT COLUMN: Results Map */}
                    <Col xs={12} xl={7} className="ps-xl-2 flex-grow-1">
                        {isLoading && (
                            <div className="text-center py-4">
                                <Spinner animation="border" variant="info" size="sm" className="mb-2" />
                                <p className="small text-info terminal-font m-0">ACCESSING_MASTER_DATABASE...</p>
                            </div>
                        )}

                        {isError && (
                            <p className="small text-danger terminal-font text-center py-3">⚠️ DATABASE_OFFLINE</p>
                        )}

                        {!isLoading && (
                            <div 
                                className="custom-scrollbar"
                                style={{ 
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', 
                                    gap: '6px',
                                    height: '560px', 
                                    overflowY: 'auto', 
                                    paddingRight: '4px',
                                    alignContent: 'start' 
                                }}
                            >
                                {!hasActiveFilters ? (
                                    <p className="small text-white-50 terminal-font text-center py-4" style={{ gridColumn: '1 / -1' }}>
                                        ENTER A SEARCH TERM OR SELECT FILTERS TO FIND CARDS...
                                    </p>
                                ) : filteredCards.length === 0 ? (
                                    <p className="small text-white-50 terminal-font text-center py-4" style={{ gridColumn: '1 / -1' }}>
                                        NO CARDS MATCHING YOUR SEARCH CRITERIA
                                    </p>
                                ) : (
                                    filteredCards.map((card) => {
                                        const countInDeck = getCardDeckCount(card.id);
                                        const isMaxedOut = countInDeck >= 3;

                                        return (
                                            <div
                                                key={card.id}
                                                className="position-relative card-thumbnail-wrap"
                                                style={{ 
                                                    cursor: 'pointer', 
                                                    width: '100%',
                                                    transition: 'transform 0.15s ease'
                                                }}
                                                onMouseEnter={() => onInspectCard?.(card)}
                                                onClick={(e) => {
                                                    onInspectCard?.(card);
                                                    if (!isMaxedOut) {
                                                        onAddCard(card, e.shiftKey);
                                                    }
                                                }}
                                                onContextMenu={(e) => {
                                                    e.preventDefault();
                                                    if (onPinCard) onPinCard(card);
                                                }}
                                                title={isMaxedOut 
                                                    ? "Right-click: Lock Inspector" 
                                                    : "Left-click: Add | Shift+Click: Side Deck | Right-click: Lock"
                                                }
                                            >
                                                <img
                                                    src={card.image}
                                                    alt={card.name}
                                                    className={`rounded border ${isMaxedOut ? 'border-danger' : 'border-info border-opacity-50'} w-100`}
                                                    style={{ aspectRatio: '421 / 614', objectFit: 'cover' }}
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = card.fallbackImage;
                                                    }}
                                                />

                                                {countInDeck > 0 && (
                                                    <Badge 
                                                        bg={isMaxedOut ? "danger" : "success"} 
                                                        className="position-absolute top-0 end-0 m-1 fw-bold shadow-sm"
                                                    >
                                                        {countInDeck}/3
                                                    </Badge>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
}