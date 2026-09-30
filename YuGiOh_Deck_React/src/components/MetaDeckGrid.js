import React, { memo, useMemo, useState } from 'react';
import { getCardCategory } from '@/lib/deckRules';
import { IMAGE_BASE } from '@/lib/cardData';
import { useCardFocus } from '@/lib/cardFocusStore';

const CARD_BACK = 'https://images.ygoprodeck.com/images/cards/back_high.jpg';
const GROUPS = [['monster', 'Monsters'], ['spell', 'Spells'], ['trap', 'Traps']];

/**
 * One card thumbnail. It is a real <button> (keyboard and screen-reader friendly).
 * Hovering / focusing tells the store which card to show; clicking pins it.
 * `memo` means it only re-renders if its own props change: hovering elsewhere never touches it.
 */
const Thumb = memo(function Thumb({ cardId, card, pinned, store }) {
    const name = card?.name || `Card #${cardId}`;
    // Try each image source in turn; a failed one moves on to the next instead of leaving a black box.
    const readable = /^\d+$/.test(String(cardId));
    const sources = useMemo(() => !readable ? [CARD_BACK] : [
        // Without card details (unknown to YGOPRODeck) start with the direct YGOPRODeck image, as the old page did.
        card?.image || `https://images.ygoprodeck.com/images/cards_small/${cardId}.jpg`,
        card?.fallbackImage || `${IMAGE_BASE}/${cardId}.jpg`,
        `https://images.ygoprodeck.com/images/cards/${cardId}.jpg`,
        CARD_BACK,
    ], [card, cardId, readable]);
    const [stage, setStage] = useState(0);

    return (
        <li>
            <button
                type="button"
                className={`mdp-thumb ${pinned ? 'is-pinned' : ''}`}
                aria-pressed={pinned}
                aria-label={name}
                onMouseEnter={() => store.hover(card)}
                onFocus={() => store.hover(card)}
                onClick={() => store.togglePin(card)}
            >
                <img
                    src={sources[stage]}
                    alt=""
                    width="421"
                    height="614"
                    loading="lazy"
                    decoding="async"
                    onError={() => setStage((n) => Math.min(n + 1, sources.length - 1))}
                />
            </button>
        </li>
    );
});

/**
 * A titled block of thumbnails (main / extra / side).
 * Props are all stable between hovers (same arrays, same store), so this re-renders only when a card is pinned.
 * With groupByType the main deck is split into Monsters / Spells / Traps once the card data has arrived.
 */
function MetaDeckGrid({ title, tone, deckIds, cardMap, store, groupByType = false }) {
    const pinnedId = useCardFocus(store, (s) => (s.pinned ? s.pinned.id : null));

    const items = useMemo(
        () => (deckIds || []).map((cardId, index) => ({ key: `${cardId}-${index}`, cardId, card: cardMap[String(cardId)] })),
        [deckIds, cardMap]
    );

    const sections = useMemo(() => {
        const haveData = Object.keys(cardMap).length > 0;
        if (!groupByType || !haveData) return [{ key: 'all', label: null, items }];
        const buckets = { monster: [], spell: [], trap: [] };
        items.forEach((item) => buckets[item.card ? getCardCategory(item.card) : 'monster'].push(item));
        return GROUPS.filter(([key]) => buckets[key].length).map(([key, label]) => ({ key, label, items: buckets[key] }));
    }, [items, cardMap, groupByType]);

    if (!items.length) return null;

    return (
        <section className={`mdp-panel mdp-deck mdp-deck--${tone}`} aria-labelledby={`deck-${tone}`}>
            <h2 id={`deck-${tone}`} className="mdp-deck__title">{title} ({items.length})</h2>

            {sections.map((section) => (
                <div key={section.key}>
                    {section.label && <h3 className="mdp-group">{section.label} ({section.items.length})</h3>}
                    <ul className="mdp-cards">
                        {section.items.map((item) => (
                            <Thumb
                                key={item.key}
                                cardId={item.cardId}
                                card={item.card}
                                pinned={pinnedId !== null && item.card?.id === pinnedId}
                                store={store}
                            />
                        ))}
                    </ul>
                </div>
            ))}
        </section>
    );
}

export default memo(MetaDeckGrid);
