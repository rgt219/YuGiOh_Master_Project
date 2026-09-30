import React from 'react';
import { Badge } from 'react-bootstrap';
import { getAttributeColor } from '../utils/metaDeckProfileHelpers';
import { IMAGE_BASE } from '@/lib/cardData';
import { useCardFocus } from '@/lib/cardFocusStore';

const CARD_BACK = 'https://images.ygoprodeck.com/images/cards/back_high.jpg';

/**
 * Shows the card you are pointing at (or the one you pinned).
 * It is the ONLY component that listens to hover changes, so hovering re-renders just this.
 * On wide screens it sticks to the side while you scroll the deck; on small screens it becomes a bar
 * fixed to the bottom of the screen (see metadecks.css).
 */
export default function MetaDeckInspector({ store, archetype, fallbackId }) {
    const active = useCardFocus(store, (s) => s.pinned || s.hovered);
    const pinned = useCardFocus(store, (s) => s.pinned);

    const card = active || {
        name: archetype,
        type: 'TOURNAMENT DECK',
        desc: 'Hover over or click any card in the decklists to see its stats, level, ATK/DEF and effect text here.',
        image: `${IMAGE_BASE}/${fallbackId || 'back_high'}.jpg`,
    };

    const imageUrl = card.image || card.card_images?.[0]?.image_url || CARD_BACK;
    const level = card.level ?? null;
    const link = card.linkval ?? null;

    return (
        <aside className="mdp-panel mdp-inspector" aria-label="Card inspector">
            <div className="mdp-inspector__head">
                <h2>CARD INSPECTOR</h2>
                {pinned ? (
                    <button type="button" className="mdp-pin is-pinned" onClick={() => store.unpin()}>
                        PINNED · CLICK TO UNPIN
                    </button>
                ) : (
                    <span className="mdp-pin-hint">Click a card to pin it</span>
                )}
            </div>

            <div className="mdp-inspector__body">
                <img
                    className="mdp-inspector__img"
                    src={imageUrl}
                    alt={card.name}
                    width="421"
                    height="614"
                    onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = card.card_images?.[0]?.image_url || CARD_BACK;
                    }}
                />

                <div className="mdp-inspector__info">
                    <h3 className="mdp-inspector__name">{card.name}</h3>

                    <div className="mdp-chips">
                        {card.type && <Badge bg="dark" className="mdp-chip">{card.type}</Badge>}
                        {card.race && <Badge bg="dark" className="mdp-chip">{card.race}</Badge>}
                        {card.attribute && <Badge bg={getAttributeColor(card.attribute)} className="mdp-chip">{card.attribute}</Badge>}
                        {level !== null && <Badge bg="dark" className="mdp-chip text-info">Level/Rank {level} ★</Badge>}
                        {link !== null && <Badge bg="dark" className="mdp-chip text-info">Link {link}</Badge>}
                        {typeof card.atk === 'number' && (
                            <Badge bg="dark" className="mdp-chip">ATK {card.atk} / DEF {card.def ?? '-'}</Badge>
                        )}
                    </div>

                    <div className="mdp-effect">
                        <h4>Card Effect / Text</h4>
                        <p>{card.desc}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
