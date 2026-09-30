import React, { useMemo } from 'react';
import { Badge } from 'react-bootstrap';
import {
    LIMITS, getCardId, getCardName, getCardCategory, sortDeckCards,
    summarizeMain, summarizeGenesys, validateDeck,
} from '@/lib/deckRules';
import { getCardImage, getFallbackImage } from '@/lib/cardData';

const CATEGORY_LABELS = { monster: 'Monsters', spell: 'Spells', trap: 'Traps' };

/**
 * One card in the deck. The picture pins the card in the dock, the − button removes it.
 * Delete/Backspace also removes it, and the old right-click shortcut still works.
 */
function DeckCard({ card, section, isPinned, onPreview, onPin, onRemove }) {
    const name = getCardName(card);

    const remove = (event) => {
        // After removing, move keyboard focus to a neighbouring card instead of losing it.
        const item = event.currentTarget.closest('li');
        const neighbour = item?.nextElementSibling || item?.previousElementSibling;
        onRemove(getCardId(card), card.instanceId);
        requestAnimationFrame(() => neighbour?.querySelector('button')?.focus());
    };

    return (
        <li className="db-card">
            <button
                type="button"
                className={`db-card__btn ${isPinned ? 'is-pinned' : ''}`}
                aria-pressed={isPinned}
                aria-label={`${name}. Press Enter to pin its details. Press Delete to remove it from the ${section} deck.`}
                onClick={() => onPin(card)}
                onMouseEnter={() => onPreview(card)}
                onFocus={() => onPreview(card)}
                onKeyDown={(e) => { if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); remove(e); } }}
                onContextMenu={(e) => { e.preventDefault(); remove(e); }}
            >
                <img
                    src={getCardImage(card)}
                    alt=""
                    loading="lazy"
                    onError={(e) => { e.target.onerror = null; e.target.src = getFallbackImage(card); }}
                />
            </button>
            <button type="button" className="db-card__remove" aria-label={`Remove ${name} from the ${section} deck`} onClick={remove}>−</button>
        </li>
    );
}

function DeckSection({ id, title, subtitle, cards, section, emptyText, pinnedId, onPreview, onPin, onRemove }) {
    const groups = useMemo(() => {
        if (section !== 'main') return [{ key: 'all', label: null, cards }];
        return ['monster', 'spell', 'trap']
            .map((key) => ({ key, label: CATEGORY_LABELS[key], cards: cards.filter((c) => getCardCategory(c) === key) }))
            .filter((group) => group.cards.length > 0);
    }, [cards, section]);

    return (
        <section className="db-section" aria-labelledby={`${id}-title`}>
            <div className="db-section__head">
                <h3 id={`${id}-title`} className={`db-section__title db-section__title--${section} terminal-font`}>{title}</h3>
                <span className="db-section__meta">{subtitle}</span>
            </div>

            {cards.length === 0 ? (
                <p className="db-empty">{emptyText}</p>
            ) : (
                groups.map((group) => (
                    <div key={group.key}>
                        {group.label && <h4 className="db-group-title">{group.label} ({group.cards.length})</h4>}
                        <ul className="db-cards" aria-label={`${title} cards${group.label ? `: ${group.label}` : ''}`}>
                            {group.cards.map((card, index) => (
                                <DeckCard
                                    key={card.instanceId ?? `${getCardId(card)}-${index}`}
                                    card={card}
                                    section={section}
                                    isPinned={pinnedId !== '' && pinnedId === getCardId(card)}
                                    onPreview={onPreview}
                                    onPin={onPin}
                                    onRemove={onRemove}
                                />
                            ))}
                        </ul>
                    </div>
                ))
            )}
        </section>
    );
}

/** The deck panel: rules status, then the main, extra and side decks. */
export default function CustomDeck({ mainDeck = [], extraDeck = [], sideDeck = [], pinnedCard, onDeleteCard, onPreviewCard, onPinCard }) {
    const sortedMain = useMemo(() => sortDeckCards(mainDeck), [mainDeck]);
    const sortedExtra = useMemo(() => sortDeckCards(extraDeck), [extraDeck]);
    const sortedSide = useMemo(() => sortDeckCards(sideDeck), [sideDeck]);

    const totals = useMemo(() => summarizeMain(mainDeck), [mainDeck]);
    const genesys = useMemo(() => summarizeGenesys([...mainDeck, ...extraDeck, ...sideDeck]), [mainDeck, extraDeck, sideDeck]);
    const { issues } = useMemo(() => validateDeck({ main: mainDeck, extra: extraDeck, side: sideDeck }), [mainDeck, extraDeck, sideDeck]);

    const pinnedId = pinnedCard ? getCardId(pinnedCard) : '';
    const shared = { pinnedId, onPreview: onPreviewCard, onPin: onPinCard, onRemove: onDeleteCard };

    const genesysTone = genesys.hasIllegalCards || genesys.points >= 100 ? 'danger'
        : genesys.points >= 75 ? 'warning' : genesys.points >= 50 ? 'success' : 'info';

    return (
        <>
            <div className="db-pane__head">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <h2 id="db-deck-title" className="db-pane__title terminal-font">Your deck</h2>
                    <div className="d-flex flex-wrap gap-2">
                        <Badge bg="dark" className={`border border-${genesysTone} text-${genesysTone} terminal-font`}>
                            Genesys: {genesys.points} pts
                        </Badge>
                        {genesys.hasIllegalCards && (
                            <Badge bg="danger" className="terminal-font">Link or Pendulum cards are not allowed in Genesys</Badge>
                        )}
                    </div>
                </div>

                <ul className="db-counts terminal-font" aria-label="Deck size">
                    <li>Main <strong>{mainDeck.length}</strong>/{LIMITS.mainMax}</li>
                    <li>Extra <strong>{extraDeck.length}</strong>/{LIMITS.extraMax}</li>
                    <li>Side <strong>{sideDeck.length}</strong>/{LIMITS.sideMax}</li>
                </ul>

                <div role="status" aria-live="polite">
                    {issues.length > 0 && (
                        <ul className="db-issues">
                            {issues.map((issue) => (
                                <li key={issue.id} className={`db-issues__item db-issues__item--${issue.level}`}>
                                    <span aria-hidden="true">{issue.level === 'error' ? '✖' : '⚠'}</span> {issue.text}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <div className="db-pane__body">
                <DeckSection id="db-main" section="main" title="Main deck"
                    subtitle={`${totals.monster} monsters · ${totals.spell} spells · ${totals.trap} traps`}
                    cards={sortedMain} emptyText="No cards yet. Search on the left and click a card to add it." {...shared} />
                <DeckSection id="db-extra" section="extra" title="Extra deck"
                    subtitle={`${extraDeck.length}/${LIMITS.extraMax}`}
                    cards={sortedExtra} emptyText="Fusion, Synchro, Xyz and Link monsters go here automatically." {...shared} />
                <DeckSection id="db-side" section="side" title="Side deck"
                    subtitle={`${sideDeck.length}/${LIMITS.sideMax}`}
                    cards={sortedSide} emptyText="Shift+click a search result, or use “+ Side” in the card bar, to add cards here." {...shared} />
            </div>
        </>
    );
}
