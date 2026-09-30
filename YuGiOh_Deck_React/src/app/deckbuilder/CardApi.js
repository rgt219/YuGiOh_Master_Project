import React, { useMemo } from 'react';
import { Form, InputGroup, Spinner, Badge, Button } from 'react-bootstrap';
import { MAIN_CARD_TYPES, SPELL_TYPES, TRAP_TYPES, MONSTER_RACES, ALL_RACES_TYPES } from '@/constants/cardSearchConstants';
import { useDeckCardSearch } from '@/hooks/useDeckCardSearch';
import { buildCopyMap, getCardId, LIMITS } from '@/lib/deckRules';
import { getCardImage, getFallbackImage } from '@/lib/cardData';
import CardFilterModal from './CardFilterModal';

const raceOptionsFor = (mainType) => {
    if (mainType === 'SPELL') return SPELL_TYPES;
    if (mainType === 'TRAP') return TRAP_TYPES;
    if (mainType === 'NORMAL' || mainType === 'EFFECT') return MONSTER_RACES;
    return ALL_RACES_TYPES;
};

/**
 * One search result. The picture is a real button, so it works with a keyboard and a screen reader.
 * Click or Enter adds the card. Shift+click sends it to the side deck. The ⓘ button pins it in the dock.
 */
function ResultCard({ card, copies, onAdd, onPreview, onPin }) {
    const maxed = copies >= LIMITS.copies;
    return (
        <li className="db-card">
            <button
                type="button"
                className={`db-card__btn ${maxed ? 'is-maxed' : ''}`}
                onClick={(e) => onAdd(card, e.shiftKey)}
                onMouseEnter={() => onPreview(card)}
                onFocus={() => onPreview(card)}
                aria-label={`Add ${card.name} to deck. ${copies} of ${LIMITS.copies} in deck.${maxed ? ' Maximum copies reached.' : ''}`}
            >
                <img
                    src={getCardImage(card)}
                    alt=""
                    loading="lazy"
                    onError={(e) => { e.target.onerror = null; e.target.src = getFallbackImage(card); }}
                />
            </button>
            {copies > 0 && (
                <span className={`db-card__count ${maxed ? 'is-maxed' : ''}`} aria-hidden="true">{copies}/{LIMITS.copies}</span>
            )}
            <button type="button" className="db-card__info" aria-label={`Show details for ${card.name}`} onClick={() => onPin(card)}>ⓘ</button>
        </li>
    );
}

/** The search panel: search box, type buttons, filters and results. */
export default function CardApi({ cardList = [], onAddCard, onPreviewCard, onPinCard }) {
    const search = useDeckCardSearch();
    const [showFilters, setShowFilters] = React.useState(false);
    const copyMap = useMemo(() => buildCopyMap(cardList), [cardList]);

    const { filters, activeFilterCount } = search;

    return (
        <>
            <div className="db-pane__head">
                <div className="d-flex align-items-center justify-content-between">
                    <h2 id="db-search-title" className="db-pane__title terminal-font">Card search</h2>
                    {search.hasActiveFilters && (
                        <Button variant="outline-danger" className="terminal-font fw-bold" onClick={search.resetFilters}>Reset all</Button>
                    )}
                </div>

                <div className="d-flex gap-2 mt-2">
                    <InputGroup className="flex-grow-1">
                        <Form.Label htmlFor="db-search-input" className="visually-hidden">Search cards by name, text or ID</Form.Label>
                        <Form.Control
                            id="db-search-input"
                            type="search"
                            className="db-input terminal-font"
                            placeholder="Search name, text or ID…"
                            value={search.searchQuery}
                            autoComplete="off"
                            onChange={(e) => search.setSearchQuery(e.target.value)}
                        />
                        {search.searchQuery && (
                            <Button variant="outline-secondary" aria-label="Clear search" onClick={() => search.setSearchQuery('')}>✕</Button>
                        )}
                    </InputGroup>
                    <Button
                        variant={activeFilterCount > 0 ? 'info' : 'outline-info'}
                        className="terminal-font fw-bold text-nowrap"
                        onClick={() => setShowFilters(true)}
                        aria-haspopup="dialog"
                    >
                        Filters{activeFilterCount > 0 && <Badge bg="dark" className="text-info border border-info ms-2">{activeFilterCount}<span className="visually-hidden"> active</span></Badge>}
                    </Button>
                </div>

                <div className="db-types" role="group" aria-label="Card category">
                    {MAIN_CARD_TYPES.map((type) => (
                        <Button
                            key={type}
                            variant={filters.mainType === type ? 'info' : 'outline-secondary'}
                            className="terminal-font fw-bold flex-grow-1"
                            aria-pressed={filters.mainType === type}
                            onClick={() => search.setMainType(type)}
                        >
                            {type}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="db-pane__body">
                <p className="db-status" role="status" aria-live="polite">
                    {search.isLoading && 'Loading the card database…'}
                    {!search.isLoading && !search.isError && !search.hasActiveFilters && 'Type a name or pick a filter to find cards.'}
                    {!search.isLoading && search.hasActiveFilters && search.totalMatches === 0 && 'No cards match your search.'}
                    {search.totalMatches > 0 && `Showing ${search.results.length} of ${search.totalMatches} cards.`}
                </p>

                {search.isLoading && <div className="text-center py-4"><Spinner animation="border" variant="info" role="presentation" /></div>}

                {search.isError && (
                    <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
                        <span>The card database could not be loaded.</span>
                        <Button size="sm" variant="outline-light" onClick={() => search.retry()}>Try again</Button>
                    </div>
                )}

                {search.results.length > 0 && (
                    <ul className="db-cards db-cards--search" aria-label="Search results">
                        {search.results.map((card) => (
                            <ResultCard
                                key={card.id}
                                card={card}
                                copies={copyMap.get(getCardId(card)) || 0}
                                onAdd={onAddCard}
                                onPreview={onPreviewCard}
                                onPin={onPinCard}
                            />
                        ))}
                    </ul>
                )}

                {search.hasMore && (
                    <div className="text-center mt-3">
                        <Button variant="outline-info" className="terminal-font fw-bold" onClick={search.loadMore}>
                            Show more cards
                        </Button>
                    </div>
                )}
            </div>

            <CardFilterModal
                show={showFilters}
                onHide={() => setShowFilters(false)}
                filters={filters}
                setFilter={search.setFilter}
                raceOptions={raceOptionsFor(filters.mainType)}
                archetypes={search.archetypes}
                onReset={search.resetFilters}
            />
        </>
    );
}
