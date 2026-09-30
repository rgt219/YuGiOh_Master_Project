import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { getCardId, getCardName, LIMITS } from '@/lib/deckRules';
import { getCardImage, getFallbackImage } from '@/lib/cardData';

/**
 * The "card dock": a bar fixed to the bottom of the screen that always shows the card you are
 * pointing at, with add/remove buttons. "More" opens the full card text above the bar.
 * It replaces the old inspector panel that took up a whole column of the page.
 */
export default function CardInspector({ dockRef, card, isPinned, copies = 0, onAdd, onRemove, onTogglePin }) {
    const [expanded, setExpanded] = useState(false);
    const hasCard = Boolean(card && getCardId(card));

    const name = hasCard ? getCardName(card) : '';
    const description = hasCard ? card.desc || card.effect || 'No card text available.' : '';
    const atk = hasCard && typeof card.atk === 'number' ? card.atk : null;
    const def = hasCard && typeof card.def === 'number' ? card.def : null;
    const level = hasCard ? card.level ?? card.linkval ?? null : null;
    const isMaxed = copies >= LIMITS.copies;

    const facts = hasCard
        ? [
            card.type,
            card.race,
            card.attribute,
            level !== null ? `Level / Rank / Link ${level}` : null,
            atk !== null ? `ATK ${atk}` : null,
            atk !== null ? `DEF ${def ?? '-'}` : null,
        ].filter(Boolean)
        : [];

    return (
        <aside className={`db-dock ${isPinned ? 'is-pinned' : ''}`} aria-label="Card details">
            {hasCard && expanded && (
                <div className="db-dock__details" id="db-dock-details">
                    <p className="db-dock__full-effect">{description}</p>
                </div>
            )}

            {/* The bar is always rendered, so its height can be measured to keep the page clear of it. */}
            <div className={`db-dock__bar ${hasCard ? '' : 'db-dock__bar--empty'}`} ref={dockRef}>
                {!hasCard ? (
                    <p className="m-0 text-white-50">
                        Point at a card to preview it. Click a search result to add it to your deck. Use the ⓘ button to pin a card here.
                    </p>
                ) : (
                    <>
                        <img
                            className="db-dock__thumb"
                            src={getCardImage(card)}
                            alt=""
                            onError={(e) => { e.target.onerror = null; e.target.src = getFallbackImage(card); }}
                        />

                        <div className="db-dock__meta">
                            <h2 className="db-dock__name terminal-font">
                                {name}
                                {isPinned && <span className="db-dock__pinned"> · Pinned</span>}
                            </h2>
                            <p className="db-dock__facts">{facts.join(' · ')}</p>
                            {!expanded && <p className="db-dock__effect">{description}</p>}
                        </div>

                        <div className="db-dock__actions">
                            <Button size="sm" variant="outline-info" className="terminal-font fw-bold"
                                onClick={() => onAdd(card, false)}
                                aria-label={`Add ${name} to the main or extra deck. ${copies} of ${LIMITS.copies} in deck.`}>
                                + Deck
                            </Button>
                            <Button size="sm" variant="outline-success" className="terminal-font fw-bold"
                                onClick={() => onAdd(card, true)}
                                aria-label={`Add ${name} to the side deck`}>
                                + Side
                            </Button>
                            <Button size="sm" variant="outline-danger" className="terminal-font fw-bold"
                                onClick={() => onRemove(getCardId(card))} disabled={copies === 0}
                                aria-label={`Remove one copy of ${name} from the deck`}>
                                − Remove
                            </Button>
                            <span className={`db-dock__copies ${isMaxed ? 'is-max' : ''}`}>
                                {copies}/{LIMITS.copies} in deck{isMaxed ? ' (max)' : ''}
                            </span>
                            <Button size="sm" variant={isPinned ? 'warning' : 'outline-secondary'} className="terminal-font fw-bold"
                                aria-pressed={isPinned} onClick={() => onTogglePin(card)}>
                                {isPinned ? 'Unpin' : 'Pin'}
                            </Button>
                            <Button size="sm" variant="outline-secondary" className="terminal-font fw-bold"
                                aria-expanded={expanded} aria-controls="db-dock-details" onClick={() => setExpanded((v) => !v)}>
                                {expanded ? 'Less ▾' : 'More ▴'}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </aside>
    );
}
