'use client';

import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Form, Button, Spinner, Row, Col, InputGroup, Collapse } from 'react-bootstrap';
import {
    CARDS_PER_PAGE, ATTRIBUTES, MAIN_CARD_TYPES, MONSTER_ABILITIES,
    MONSTER_EXTRA_TYPES, MONSTER_RACES, SPELL_TYPES, TRAP_TYPES,
    ALL_RACES_TYPES, RARITIES, LEVELS, LINKS, SCALES,
} from '@/constants/cardSearchConstants';
import { useCardSearch, useGenesysPoints, useArchetypes } from '@/hooks/useCardSearch';
import { useBanStatus } from '@/hooks/useBanStatus';
import { withBanStatus } from '@/lib/banStatus';
import CardSearchInspectorModal from '@/components/CardSearchInspectorModal';
import CollectionStepper from '@/components/collection/CollectionStepper';
import '@/mdstyles.css';

/* ------------------------------------------------------------------ *
 * One object holds every control. The same object is mirrored into the address bar
 * (?q=dragon&cat=EFFECT&sort=atk&page=3&card=5559570), so refresh, the back button and
 * copy-pasting the link all keep the search. Only values that differ from DEFAULT_FILTERS are written.
 * ------------------------------------------------------------------ */
const DEFAULT_FILTERS = {
    searchQuery: '', mainType: 'ALL', attribute: 'ALL', ability: 'ALL', extraType: 'ALL', race: 'ALL RACES / TYPES',
    archetype: 'ALL', rarity: 'ALL', level: 'ALL', linkRating: 'ALL', pendulumScale: 'ALL', sortBy: 'best', pageNumber: 1, inspectedCardId: '',
};

// The address bar uses short names (?q=dragon&cat=EFFECT&page=3); the code uses the long, readable ones.
const URL_NAMES = {
    searchQuery: 'q', mainType: 'cat', attribute: 'attr', ability: 'ability', extraType: 'type', race: 'race',
    archetype: 'arch', rarity: 'rarity', level: 'level', linkRating: 'link', pendulumScale: 'scale',
    sortBy: 'sort', pageNumber: 'page', inspectedCardId: 'card',
};

const SORTS = [
    ['best', 'BEST MATCH / NAME A-Z'],
    ['name-desc', 'NAME Z-A'],
    ['atk', 'ATK HIGH-LOW'],
    ['def', 'DEF HIGH-LOW'],
    ['level', 'LEVEL HIGH-LOW'],
    ['price', 'PRICE HIGH-LOW'],
];

const CATEGORY_HINTS = { NORMAL: 'Normal monsters', EFFECT: 'Effect monsters' };

const readFiltersFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = { ...DEFAULT_FILTERS };
    Object.entries(URL_NAMES).forEach(([filterName, urlName]) => {
        const value = params.get(urlName);
        if (value === null || value === '') return;
        fromUrl[filterName] = filterName === 'pageNumber' ? Math.max(1, parseInt(value, 10) || 1) : value;
    });
    return fromUrl;
};

const writeFiltersToUrl = (currentFilters) => {
    const params = new URLSearchParams();
    Object.entries(URL_NAMES).forEach(([filterName, urlName]) => {
        if (currentFilters[filterName] !== DEFAULT_FILTERS[filterName]) params.set(urlName, String(currentFilters[filterName]));
    });
    const queryString = params.toString();
    // Pass along Next.js's own history.state: replacing it with null confuses the router and can swallow a link click.
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${queryString ? `?${queryString}` : ''}`);
};

const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });
const byNumberDesc = (field) => (cardA, cardB) => {
    const valueA = cardA[field], valueB = cardB[field];
    const hasA = typeof valueA === 'number', hasB = typeof valueB === 'number';
    if (hasA && hasB) return valueB - valueA || collator.compare(cardA.name, cardB.name);
    if (hasA) return -1;   // cards without a value always go last
    if (hasB) return 1;
    return collator.compare(cardA.name, cardB.name);
};

/** Which page buttons to show: first, last, and a window around the current page. */
const visiblePageNumbers = (currentPage, totalPages) => {
    const items = [];
    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
        if (pageNumber === 1 || pageNumber === totalPages || Math.abs(pageNumber - currentPage) <= 2) items.push(pageNumber);
        else if (items[items.length - 1] !== '…') items.push('…');
    }
    return items;
};

/** A label + dropdown. Replaces nine copies of the same markup. */
function FilterSelect({ label, value, onChange, options, disabled, allLabel, lg, md }) {
    return (
        <Col lg={lg} md={md}>
            <Form.Label className="hud-label text-info small terminal-font mb-1">{label}</Form.Label>
            <Form.Select
                className="bg-black text-info border-secondary terminal-font"
                style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                disabled={disabled}
            >
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option === 'ALL' && allLabel ? allLabel : option.toUpperCase()}
                    </option>
                ))}
            </Form.Select>
        </Col>
    );
}

export default function CardSearch() {
    // `filters` holds the current value of every control on the page (filters.searchQuery = search text, filters.mainType = category, ...).
    // `setFilters` replaces the whole object; the `set` helper below changes just some of the fields.
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [urlReady, setUrlReady] = useState(false);
    const [openFilters, setOpenFilters] = useState(false);
    const pathAtLoad = useRef('');

    // Read the address bar once, after the page has loaded (reading it earlier would not match the server-rendered HTML).
    useEffect(() => {
        pathAtLoad.current = window.location.pathname;
        const fromUrl = readFiltersFromUrl();
        setFilters(fromUrl);
        setUrlReady(true);
        // Open the advanced panel if the link already uses one of its filters.
        if (['ability', 'extraType', 'race', 'archetype', 'rarity', 'level', 'linkRating', 'pendulumScale', 'attribute'].some((name) => fromUrl[name] !== DEFAULT_FILTERS[name])) setOpenFilters(true);
    }, []);

    // Only touch the address bar while we are still on this page. When a link (such as "See Telemetry") is navigating away,
    // the page re-renders one last time as the modal closes; writing the URL then would fight the navigation.
    useEffect(() => {
        if (urlReady && window.location.pathname === pathAtLoad.current) writeFiltersToUrl(filters);
    }, [filters, urlReady]);

    /** Change one or more controls. Anything except a page change sends you back to page 1. */
    const updateFilters = useCallback((patch) => {
        setFilters((previous) => ({ ...previous, ...patch, pageNumber: 'pageNumber' in patch ? patch.pageNumber : 1 }));
    }, []);
const setCard = useCallback((cardId) => setFilters((previous) => ({ ...previous, inspectedCardId: cardId })), []);
    const { rawCards, isLoading, isFetching, hasError, fetchCards } = useCardSearch({
        selectedAttribute: filters.attribute, selectedRace: filters.race, selectedArchetype: filters.archetype,
        selectedLevel: filters.level, selectedLink: filters.linkRating, selectedScale: filters.pendulumScale,
    });
    const archetypesList = useArchetypes();

    const currentRaceOptions = useMemo(() => {
        if (filters.mainType === 'SPELL') return SPELL_TYPES;
        if (filters.mainType === 'TRAP') return TRAP_TYPES;
        if (filters.mainType === 'NORMAL' || filters.mainType === 'EFFECT') return MONSTER_RACES;
        return ALL_RACES_TYPES;
    }, [filters.mainType]);

    const handleCategoryChange = (newMainType) => {
        const race = newMainType === 'SPELL' ? 'ALL SPELL TYPES' : newMainType === 'TRAP' ? 'ALL TRAP TYPES'
            : newMainType === 'NORMAL' || newMainType === 'EFFECT' ? 'ALL MONSTER TYPES' : 'ALL RACES / TYPES';
        updateFilters({ mainType: newMainType, race });
    };

    const activeFilterCount = [
        filters.attribute !== 'ALL', filters.ability !== 'ALL', filters.extraType !== 'ALL', !filters.race.startsWith('ALL'),
        filters.archetype !== 'ALL', filters.rarity !== 'ALL', filters.level !== 'ALL', filters.linkRating !== 'ALL', filters.pendulumScale !== 'ALL',
    ].filter(Boolean).length;

    const handleResetFilters = () => updateFilters({ ...DEFAULT_FILTERS, sortBy: filters.sortBy });

    // Typing stays instant: the input shows what you type immediately, the big list catches up a moment later.
    const deferredSearch = useDeferredValue(filters.searchQuery.trim().toLowerCase());

    const filteredCards = useMemo(() => {
        const abilityLower = filters.ability.toLowerCase();
        const extraTypeLower = filters.extraType.toLowerCase();
        const raceLower = filters.race.toLowerCase();
        const rarityLower = filters.rarity.toLowerCase();
        const restrictRace = !filters.race.startsWith('ALL');

        return rawCards.filter((card) => {
            if (deferredSearch && !card.searchText.includes(deferredSearch)) return false;
            if (filters.mainType === 'NORMAL' && !(card.typeLower.includes('monster') && !card.typeLower.includes('effect'))) return false;
            if (filters.mainType === 'EFFECT' && !(card.typeLower.includes('monster') && card.typeLower.includes('effect'))) return false;
            if (filters.mainType === 'SPELL' && !card.typeLower.includes('spell')) return false;
            if (filters.mainType === 'TRAP' && !card.typeLower.includes('trap')) return false;
            if (filters.ability !== 'ALL' && !card.typeLower.includes(abilityLower)) return false;
            if (filters.extraType !== 'ALL' && !card.typeLower.includes(extraTypeLower)) return false;
            if (restrictRace && card.raceLower !== raceLower) return false;
            if (filters.rarity !== 'ALL' && !card.raritiesLower.includes(rarityLower)) return false;
            return true;
        });
    }, [rawCards, deferredSearch, filters.mainType, filters.ability, filters.extraType, filters.race, filters.rarity]);

    const sortedCards = useMemo(() => {
        const list = [...filteredCards];
        switch (filters.sortBy) {
            case 'name-desc': return list.sort((cardA, cardB) => collator.compare(cardB.name, cardA.name));
            case 'atk': return list.sort(byNumberDesc('atk'));
            case 'def': return list.sort(byNumberDesc('def'));
            case 'level': return list.sort(byNumberDesc('levelNum'));
            case 'price': return list.sort(byNumberDesc('priceNum'));
            default: {
                if (!deferredSearch) return list.sort((cardA, cardB) => collator.compare(cardA.name, cardB.name));
                // With a search: exact name, then names starting with it, then names containing it, then effect text.
                const rank = (card) => (card.nameLower === deferredSearch ? 0 : card.nameLower.startsWith(deferredSearch) ? 1 : card.nameLower.includes(deferredSearch) ? 2 : 3);
                return list.sort((cardA, cardB) => rank(cardA) - rank(cardB) || collator.compare(cardA.name, cardB.name));
            }
        }
    }, [filteredCards, filters.sortBy, deferredSearch]);

    const totalPages = Math.max(1, Math.ceil(sortedCards.length / CARDS_PER_PAGE));
    const currentPage = Math.min(filters.pageNumber, totalPages);
    const paginatedCards = useMemo(
        () => sortedCards.slice((currentPage - 1) * CARDS_PER_PAGE, currentPage * CARDS_PER_PAGE),
        [sortedCards, currentPage]
    );

    const goToPage = (targetPage) => {
        updateFilters({ pageNumber: Math.min(Math.max(1, targetPage), totalPages) });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // The inspector: the card comes from the address bar (?card=ID). Genesys points are downloaded only once one is open.
    const baseInspectCard = useMemo(
        () => (filters.inspectedCardId ? rawCards.find((card) => String(card.id) === filters.inspectedCardId) || null : null),
        [rawCards, filters.inspectedCardId]
    );
    const genesys = useGenesysPoints(Boolean(baseInspectCard));
    const banLists = useBanStatus(Boolean(baseInspectCard)); // Master Duel / TCG / OCG status from our own API
    const inspectCard = useMemo(() => {
        const card = withBanStatus(baseInspectCard, banLists);
        if (!card || card.isLinkOrPendulum) return card;
        return { ...card, genesysPoints: genesys ? (genesys[card.id] ?? 0) : '…' };
    }, [baseInspectCard, banLists, genesys]);

    return (
        <div className="cs-root md-theme-bg min-vh-100 text-white" style={{ paddingTop: '90px', paddingBottom: '60px', backgroundColor: '#0a0d14', fontFamily: "'Cascadia Mono', monospace" }}>
            <style>{`
                .cs-root *, .modal, .modal * { font-family: 'Cascadia Mono', monospace !important; }
                .hud-label { letter-spacing: 1px; }
                .attr-DARK { background-color: #0d6efd; color: #fff; }
                .attr-LIGHT { background-color: #bfa136; color: #fff; }
                .attr-EARTH { background-color: #7a5127; color: #fff; }
                .attr-WATER { background-color: #2672b8; color: #fff; }
                .attr-FIRE { background-color: #b83326; color: #fff; }
                .attr-WIND { background-color: #28804a; color: #fff; }
                .attr-DIVINE { background-color: #c98018; color: #fff; }
                .cs-search::placeholder { color: rgba(255,255,255,0.65); opacity: 1; }
                .cs-tile { display: flex; flex-direction: column; width: 100%; height: 100%; padding: 8px; color: inherit; text-align: center; background: transparent; border: 1px solid transparent; border-radius: 12px; cursor: pointer; transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s; }
                .cs-tile:hover, .cs-tile:focus-visible { transform: translateY(-4px); border-color: rgba(0,210,255,0.5); box-shadow: 0 0 15px rgba(0,210,255,0.3); outline: none; }
                .cs-tile__name { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 2.6em; line-height: 1.3; }
                @media (prefers-reduced-motion: reduce) { .cs-tile { transition: none; } .cs-tile:hover { transform: none; } }
            `}</style>

            <div className="container-fluid px-3 px-md-4" style={{ maxWidth: '1400px' }}>
                <div className="p-3 p-md-4 rounded-3 mb-3" style={{ background: 'transparent' }}>

                    {/* Header & match count */}
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
                        <div>
                            <h1 className="fw-bold text-info terminal-font m-0 fs-4">CARD DATABASE</h1>
                            <span className="text-white-50 small terminal-font" aria-live="polite">
                                FOUND {sortedCards.length.toLocaleString()} MATCHES • PAGE {currentPage} OF {totalPages}
                                {isFetching && !isLoading && <span className="text-info ms-2">UPDATING…</span>}
                            </span>
                        </div>

                        <Button
                            variant="outline-info"
                            size="sm"
                            className="terminal-font fw-bold d-flex align-items-center justify-content-center gap-2 py-2 mt-2 mt-md-0"
                            onClick={() => setOpenFilters((open) => !open)}
                            aria-controls="advanced-filters-collapse"
                            aria-expanded={openFilters}
                        >
                            <span>ADVANCED FILTERS</span>
                            {activeFilterCount > 0 && <span className="badge bg-info text-dark rounded-pill px-2">{activeFilterCount}</span>}
                            <span className="ms-1" aria-hidden="true">{openFilters ? '▲' : '▼'}</span>
                        </Button>
                    </div>

                    <Row className="g-3 mb-2">
                        <Col lg={4} md={12}>
                            <Form.Label htmlFor="cs-search" className="hud-label text-info small terminal-font mb-1">NAME OR EFFECT TEXT SEARCH</Form.Label>
                            <InputGroup>
                                <Form.Control
                                    id="cs-search"
                                    type="search"
                                    placeholder="Search card name, 'negate', 'destroy'..."
                                    className="cs-search bg-black text-white border-secondary terminal-font"
                                    style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                                    value={filters.searchQuery}
                                    onChange={(event) => updateFilters({ searchQuery: event.target.value })}
                                />
                                {filters.searchQuery && (
                                    <Button variant="outline-secondary" onClick={() => updateFilters({ searchQuery: '' })} className="terminal-font" aria-label="Clear search">✖</Button>
                                )}
                            </InputGroup>
                        </Col>

                        <Col lg={5} md={7}>
                            <Form.Label className="hud-label text-info small terminal-font mb-1">CARD CATEGORY</Form.Label>
                            <div className="d-flex gap-1 flex-wrap">
                                {MAIN_CARD_TYPES.map((type) => (
                                    <Button
                                        key={type}
                                        variant={filters.mainType === type ? 'info' : 'outline-secondary'}
                                        size="sm"
                                        className="terminal-font fw-bold py-2"
                                        style={{ flex: '1 1 0', whiteSpace: 'nowrap' }}
                                        title={CATEGORY_HINTS[type]}
                                        aria-pressed={filters.mainType === type}
                                        onClick={() => handleCategoryChange(type)}
                                    >
                                        {type}
                                    </Button>
                                ))}
                            </div>
                        </Col>

                        <Col lg={3} md={5}>
                            <Form.Label htmlFor="cs-sort" className="hud-label text-info small terminal-font mb-1">SORT BY</Form.Label>
                            <Form.Select
                                id="cs-sort"
                                className="bg-black text-info border-secondary terminal-font"
                                style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                                value={filters.sortBy}
                                onChange={(event) => updateFilters({ sortBy: event.target.value })}
                            >
                                {SORTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                            </Form.Select>
                        </Col>
                    </Row>

                    <Collapse in={openFilters}>
                        <div id="advanced-filters-collapse" className="pt-3 border-top border-secondary border-opacity-25 mt-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="text-info small terminal-font fw-bold">GRANULAR FILTERS & ATTRIBUTES</span>
                                {activeFilterCount > 0 && (
                                    <Button variant="link" size="sm" className="text-danger text-decoration-none p-0 terminal-font small" onClick={handleResetFilters}>
                                        [ RESET ALL FILTERS ]
                                    </Button>
                                )}
                            </div>

                            <Row className="g-3">
                                <FilterSelect lg={3} md={6} label="ATTRIBUTE" value={filters.attribute} onChange={(newValue) => updateFilters({ attribute: newValue })} options={ATTRIBUTES}
                                    disabled={filters.mainType === 'SPELL' || filters.mainType === 'TRAP'} />
                                <FilterSelect lg={3} md={6} label="ABILITY" value={filters.ability} onChange={(newValue) => updateFilters({ ability: newValue })} options={MONSTER_ABILITIES} allLabel="ALL ABILITIES"
                                    disabled={filters.mainType === 'SPELL' || filters.mainType === 'TRAP' || filters.mainType === 'NORMAL'} />
                                <FilterSelect lg={3} md={6} label="TYPE" value={filters.extraType} onChange={(newValue) => updateFilters({ extraType: newValue })} options={MONSTER_EXTRA_TYPES} allLabel="ALL TYPES"
                                    disabled={filters.mainType === 'SPELL' || filters.mainType === 'TRAP'} />
                                <FilterSelect lg={3} md={6} label={filters.mainType === 'SPELL' ? 'SPELL TYPE' : filters.mainType === 'TRAP' ? 'TRAP TYPE' : 'MONSTER RACE'}
                                    value={filters.race} onChange={(newValue) => updateFilters({ race: newValue })} options={currentRaceOptions} />
                                <FilterSelect lg={3} md={6} label="ARCHETYPE" value={filters.archetype} onChange={(newValue) => updateFilters({ archetype: newValue })} options={archetypesList} />
                                <FilterSelect lg={3} md={6} label="RARITY" value={filters.rarity} onChange={(newValue) => updateFilters({ rarity: newValue })} options={RARITIES} />
                                <FilterSelect lg={2} md={4} label="LEVEL / RANK" value={filters.level} onChange={(newValue) => updateFilters({ level: newValue })} options={LEVELS} allLabel="ALL LEVELS"
                                    disabled={filters.mainType === 'SPELL' || filters.mainType === 'TRAP' || filters.extraType === 'LINK'} />
                                <FilterSelect lg={2} md={4} label="LINK ARROWS" value={filters.linkRating} onChange={(newValue) => updateFilters({ linkRating: newValue })} options={LINKS} allLabel="ALL LINKS"
                                    disabled={filters.mainType === 'SPELL' || filters.mainType === 'TRAP' || (filters.extraType !== 'LINK' && filters.extraType !== 'ALL')} />
                                <FilterSelect lg={2} md={4} label="PEND. SCALE" value={filters.pendulumScale} onChange={(newValue) => updateFilters({ pendulumScale: newValue })} options={SCALES} allLabel="ALL SCALES"
                                    disabled={filters.mainType === 'SPELL' || filters.mainType === 'TRAP' || (filters.extraType !== 'PENDULUM' && filters.extraType !== 'ALL')} />
                            </Row>
                        </div>
                    </Collapse>
                </div>

                {isLoading ? (
                    <div className="text-center my-5 py-5">
                        <Spinner animation="border" variant="info" style={{ width: '3rem', height: '3rem' }} />
                        <p className="text-info terminal-font mt-3">LOADING CARDS FROM VRAINS DATABASE...</p>
                    </div>
                ) : hasError ? (
                    <div className="p-5 text-center bg-dark rounded-3 border border-danger border-opacity-50 my-4" role="alert">
                        <h4 className="text-danger terminal-font">⚠️ API_CONNECTION_ERROR</h4>
                        <p className="text-white-50 small mb-3">Unable to fetch card data from server.</p>
                        <Button variant="outline-info" size="sm" className="terminal-font" onClick={() => fetchCards()}>RETRY_SEARCH</Button>
                    </div>
                ) : sortedCards.length === 0 ? (
                    <div className="p-5 text-center rounded-3 my-4">
                        <h4 className="text-white-50 terminal-font">NO CARDS MATCH CURRENT FILTER CRITERIA</h4>
                        {(activeFilterCount > 0 || filters.searchQuery || filters.mainType !== 'ALL') && (
                            <Button variant="outline-info" size="sm" className="terminal-font mt-2" onClick={handleResetFilters}>CLEAR ALL FILTERS</Button>
                        )}
                    </div>
                ) : (
                    <Row className="g-2 g-md-3 row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-6" as="ul" style={{ listStyle: 'none', paddingLeft: 0 }}>
                        {paginatedCards.map((card) => (
                            <Col as="li" key={card.id}>
                                <button type="button" className="cs-tile" onClick={() => setCard(String(card.id))} aria-label={`Inspect ${card.name}`}>
                                    <div className="position-relative overflow-hidden rounded mb-2 w-100" style={{ aspectRatio: '59/86' }}>
                                        <img
                                            src={card.image}
                                            alt=""
                                            width="421"
                                            height="614"
                                            className="w-100 h-100 rounded"
                                            style={{ objectFit: 'cover' }}
                                            loading="lazy"
                                            decoding="async"
                                            onError={(event) => {
                                                event.currentTarget.onerror = null;
                                                event.currentTarget.src = card.fallbackImage || 'https://images.ygoprodeck.com/images/cards/back_high.jpg';
                                            }}
                                        />
                                    </div>
                                    <span className="cs-tile__name text-white fw-bold small" title={card.name}>{card.name}</span>
                                    <span className="text-info-50 small terminal-font d-block mt-auto" style={{ fontSize: '0.65rem' }}>ID: #{card.id}</span>
                                </button>
                                <CollectionStepper cardId={card.id} cardName={card.name} />
                            </Col>
                        ))}
                    </Row>
                )}

                {totalPages > 1 && !isLoading && (
                    <nav className="d-flex align-items-center justify-content-center flex-wrap gap-2 mt-4 pt-3 border-top border-secondary border-opacity-25" aria-label="Card pages">
                        <Button variant="outline-info" size="sm" className="terminal-font fw-bold px-3" disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}>◄ PREV</Button>
                        {visiblePageNumbers(currentPage, totalPages).map((pageNumber, index) => (pageNumber === '…'
                            ? <span key={`gap-${index}`} className="text-white-50 terminal-font px-1">…</span>
                            : (
                                <Button
                                    key={pageNumber}
                                    variant={pageNumber === currentPage ? 'info' : 'outline-secondary'}
                                    size="sm"
                                    className="terminal-font fw-bold"
                                    aria-current={pageNumber === currentPage ? 'page' : undefined}
                                    onClick={() => goToPage(pageNumber)}
                                >
                                    {pageNumber}
                                </Button>
                            )))}
                        <Button variant="outline-info" size="sm" className="terminal-font fw-bold px-3" disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)}>NEXT ►</Button>
                    </nav>
                )}
            </div>

            <CardSearchInspectorModal inspectCard={inspectCard} setInspectCard={(card) => setCard(card ? String(card.id) : '')} />
        </div>
    );
}