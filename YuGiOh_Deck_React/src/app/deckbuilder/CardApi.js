import React, { useState, useMemo, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Form, Row, Col, Card, Spinner, Badge, Button, InputGroup, Modal } from 'react-bootstrap';
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

const AZURE_BLOB_BASE_URL = "https://cards.erregeteygo.com/card-images";

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
    const [showFilterModal, setShowFilterModal] = useState(false);

// Count how many advanced filters are active (excluding the text search)
const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedMainType !== 'ALL') count++;
    if (selectedAttribute !== 'ALL') count++;
    if (selectedAbility !== 'ALL') count++;
    if (selectedType !== 'ALL') count++;
    if (selectedRace && !selectedRace.startsWith('ALL')) count++;
    if (selectedArchetype !== 'ALL') count++;
    if (selectedRarity !== 'ALL') count++;
    if (selectedLevel !== 'ALL') count++;
    if (selectedLink !== 'ALL') count++;
    if (selectedScale !== 'ALL') count++;
    return count;
}, [selectedMainType, selectedAttribute, selectedAbility, selectedType, selectedRace, selectedArchetype, selectedRarity, selectedLevel, selectedLink, selectedScale]);

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
            style={{ backgroundColor: 'rgba(8, 12, 20, 0.98)', zIndex: 100 }} 
            text="white" 
            className="border-info shadow-lg p-3 md-panel h-100"
        >
            {/* Panel Header */}
            <Card.Header className="bg-transparent border-bottom border-info border-opacity-50 pb-2 mb-2 d-flex justify-content-between align-items-center flex-shrink-0 px-0">
                <h6 className="m-0 text-info terminal-font fw-bold" style={{ letterSpacing: '1px' }}>
                    CARD DATABASE SEARCH
                </h6>
                {hasActiveFilters && (
                    <Button 
                        variant="outline-danger" 
                        size="sm" 
                        className="terminal-font py-0 px-2 fw-bold" 
                        style={{ fontSize: '0.7rem' }}
                        onClick={handleResetFilters}
                    >
                        RESET ALL
                    </Button>
                )}
            </Card.Header>

            {/* Top Control Bar: Search Input + Filter Button */}
            <div className="d-flex gap-2 mb-2 flex-shrink-0">
                <InputGroup size="sm" className="flex-grow-1">
                    <Form.Control
                        type="search"
                        placeholder="Search card name, text..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-black text-white border-secondary terminal-font shadow-none py-1.5"
                        style={{ fontSize: '0.85rem' }}
                    />
                    {searchQuery && (
                        <Button variant="outline-secondary" onClick={() => setSearchQuery("")} className="terminal-font px-2">
                            ✖
                        </Button>
                    )}
                </InputGroup>

                <Button 
                    variant={activeFilterCount > 0 ? "info" : "outline-info"} 
                    size="sm"
                    className="terminal-font fw-bold d-flex align-items-center gap-1 text-nowrap px-2"
                    style={{ fontSize: '0.8rem' }}
                    onClick={() => setShowFilterModal(true)}
                >
                    <span>FILTERS</span>
                    {activeFilterCount > 0 && (
                        <Badge bg="dark" className="text-info border border-info ms-1 px-1.5">
                            {activeFilterCount}
                        </Badge>
                    )}
                </Button>
            </div>

            {/* Quick Filter Pills (Optional bonus: 1-click toggles right under the search bar) */}
            <div className="d-flex gap-1 mb-2 flex-shrink-0">
                {MAIN_CARD_TYPES.map(type => (
                    <Button
                        key={type}
                        variant={selectedMainType === type ? "info" : "outline-secondary"}
                        size="sm"
                        className="terminal-font fw-bold flex-grow-1 py-0 px-1"
                        style={{ fontSize: '0.65rem' }}
                        onClick={() => handleCategoryChange(type)}
                    >
                        {type}
                    </Button>
                ))}
            </div>

            {/* Full-Width Results Grid */}
            <Card.Body className="p-0 d-flex flex-column flex-grow-1 mt-2">
                <div 
                    className="custom-scrollbar"
                    style={{ 
                        display: 'grid',
                        // 🚀 Bumped from 65px to 88px so search results are prominent and clear
                        gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))', 
                        gap: '8px',
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
                                            style={{ fontSize: '0.6rem' }}
                                        >
                                            {countInDeck}/3
                                        </Badge>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </Card.Body>
            <Modal 
                show={showFilterModal} 
                onHide={() => setShowFilterModal(false)}
                centered
                contentClassName="master-duel-modal border-info"
            >
                <Modal.Header closeButton closeVariant="white" className="border-bottom border-info border-opacity-25 pb-2">
                    <Modal.Title className="text-info terminal-font fw-bold" style={{ fontSize: '1rem', letterSpacing: '1px' }}>
                        ADVANCED SEARCH FILTERS
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-3">
                    <Form className="d-flex flex-column gap-2.5">
                        <Row className="g-2">
                            <Col xs={6}>
                                <Form.Label className="text-info terminal-font mb-1" style={{ fontSize: '0.7rem' }}>ATTRIBUTE</Form.Label>
                                <Form.Select 
                                    size="sm" 
                                    className="bg-black text-info border-secondary terminal-font text-uppercase"
                                    value={selectedAttribute}
                                    onChange={(e) => setSelectedAttribute(e.target.value)}
                                    disabled={selectedMainType === "SPELL" || selectedMainType === "TRAP"}
                                >
                                    {ATTRIBUTES.map(attr => (<option key={attr} value={attr}>{attr}</option>))}
                                </Form.Select>
                            </Col>

                            <Col xs={6}>
                                <Form.Label className="text-info terminal-font mb-1" style={{ fontSize: '0.7rem' }}>ABILITY</Form.Label>
                                <Form.Select 
                                    size="sm" 
                                    className="bg-black text-info border-secondary terminal-font"
                                    value={selectedAbility}
                                    onChange={(e) => setSelectedAbility(e.target.value)}
                                    disabled={selectedMainType === "SPELL" || selectedMainType === "TRAP" || selectedMainType === "NORMAL"}
                                >
                                    {MONSTER_ABILITIES.map(ability => (
                                        <option key={ability} value={ability}>{ability === 'ALL' ? 'ALL ABILITIES' : ability}</option>
                                    ))}
                                </Form.Select>
                            </Col>

                            {/* TYPE & RACE */}
                            <Col xs={6}>
                                <Form.Label className="text-info terminal-font mb-1" style={{ fontSize: '0.7rem' }}>TYPE</Form.Label>
                                <Form.Select 
                                    size="sm" 
                                    className="bg-black text-info border-secondary terminal-font"
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(e.target.value)}
                                    disabled={selectedMainType === "SPELL" || selectedMainType === "TRAP"}
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
                                    size="sm" 
                                    className="bg-black text-info border-secondary terminal-font"
                                    value={selectedRace}
                                    onChange={(e) => setSelectedRace(e.target.value)}
                                >
                                    {currentRaceOptions.map(option => (<option key={option} value={option}>{option.toUpperCase()}</option>))}
                                </Form.Select>
                            </Col>

                            {/* ARCHETYPE & RARITY */}
                            <Col xs={6}>
                                <Form.Label className="text-info terminal-font mb-1" style={{ fontSize: '0.7rem' }}>ARCHETYPE</Form.Label>
                                <Form.Select 
                                    size="sm" 
                                    className="bg-black text-info border-secondary terminal-font"
                                    value={selectedArchetype}
                                    onChange={(e) => setSelectedArchetype(e.target.value)}
                                >
                                    {archetypesList.map(arch => (<option key={arch} value={arch}>{arch.toUpperCase()}</option>))}
                                </Form.Select>
                            </Col>

                            <Col xs={6}>
                                <Form.Label className="text-info terminal-font mb-1" style={{ fontSize: '0.7rem' }}>RARITY</Form.Label>
                                <Form.Select 
                                    size="sm" 
                                    className="bg-black text-info border-secondary terminal-font"
                                    value={selectedRarity}
                                    onChange={(e) => setSelectedRarity(e.target.value)}
                                >
                                    {RARITIES.map(r => (<option key={r} value={r}>{r.toUpperCase()}</option>))}
                                </Form.Select>
                            </Col>

                            {/* LVL, LINK, SCALE */}
                            <Col xs={4}>
                                <Form.Label className="text-info terminal-font mb-1" style={{ fontSize: '0.65rem' }}>LVL/RANK</Form.Label>
                                <Form.Select 
                                    size="sm" 
                                    className="bg-black text-info border-secondary terminal-font"
                                    value={selectedLevel}
                                    onChange={(e) => setSelectedLevel(e.target.value)}
                                    disabled={selectedMainType === "SPELL" || selectedMainType === "TRAP" || selectedType === "LINK"}
                                >
                                    {LEVELS.map(l => (<option key={l} value={l}>{l === 'ALL' ? 'ALL' : `${l}★`}</option>))}
                                </Form.Select>
                            </Col>

                            <Col xs={4}>
                                <Form.Label className="text-info terminal-font mb-1" style={{ fontSize: '0.65rem' }}>LINK</Form.Label>
                                <Form.Select 
                                    size="sm" 
                                    className="bg-black text-info border-secondary terminal-font"
                                    value={selectedLink}
                                    onChange={(e) => setSelectedLink(e.target.value)}
                                    disabled={selectedMainType === "SPELL" || selectedMainType === "TRAP" || (selectedType !== "LINK" && selectedType !== "ALL")}
                                >
                                    {LINKS.map(l => (<option key={l} value={l}>{l === 'ALL' ? 'ALL' : `L-${l}`}</option>))}
                                </Form.Select>
                            </Col>

                            <Col xs={4}>
                                <Form.Label className="text-info terminal-font mb-1" style={{ fontSize: '0.65rem' }}>SCALE</Form.Label>
                                <Form.Select 
                                    size="sm" 
                                    className="bg-black text-info border-secondary terminal-font"
                                    value={selectedScale}
                                    onChange={(e) => setSelectedScale(e.target.value)}
                                    disabled={selectedMainType === "SPELL" || selectedMainType === "TRAP" || (selectedType !== "PENDULUM" && selectedType !== "ALL")}
                                >
                                    {SCALES.map(s => (<option key={s} value={s}>{s === 'ALL' ? 'ALL' : s}</option>))}
                                </Form.Select>
                            </Col>
                        </Row>
                    </Form>
                </Modal.Body>
                <Modal.Footer className="border-top border-info border-opacity-25 pt-2 d-flex justify-content-between">
                    <Button 
                        variant="outline-danger" 
                        size="sm" 
                        className="terminal-font"
                        onClick={handleResetFilters}
                    >
                        RESET
                    </Button>
                    <Button 
                        variant="info" 
                        size="sm" 
                        className="terminal-font fw-bold px-4"
                        onClick={() => setShowFilterModal(false)}
                    >
                        APPLY FILTERS
                    </Button>
                </Modal.Footer>
            </Modal>
        </Card>
        
    );
}