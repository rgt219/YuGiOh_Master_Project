'use client';

import React, { useMemo } from 'react';
import { useCardCompanions } from '@/hooks/useCardCompanions';
import { useCardDetails } from '@/hooks/useCardDetails';
import { AZURE_BLOB_CONTAINER_URL } from '@/constants/cardSearchConstants';
import './cardCompanions.css';

// One section: a title and a grid of cards with "in X% of decks".
function CompanionGrid({ title, entries, cardsById }) {
    if (entries.length === 0) return null;                        // blank 1: nothing to show

    return (
        <div className="cc-section">
            <h6 className="cc-title terminal-font">{title}</h6>
            <div className="cc-grid">
                {entries.map((entry) => {
                    const card = cardsById[entry.cardId];               // blank 2
                    return (
                        <div key={entry.cardId} className="cc-card" title={card?.name ?? entry.cardId}>   {/* blank 3 */}
                            <img
                                src={`${AZURE_BLOB_CONTAINER_URL}/${entry.cardId}.jpg`}
                                alt={card?.name ?? 'Card'}
                                loading="lazy"
                                onError={(e) => {
                                    const fallback = `https://images.ygoprodeck.com/images/cards_small/${entry.cardId}.jpg`;
                                    if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                                }}
                            />
                            <span className="cc-name">{card?.name ?? '…'}</span>
                            <span className="cc-pct terminal-font">{entry.percent}%</span>   {/* blank 4 */}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function CardCompanionsPanel({ cardId }) {
    const { data, isLoading, hasError } = useCardCompanions(cardId);      // blank 5

    // Every companion id (both lists), so we can look up names and images in one go.
    const ids = useMemo(
        () => [...data.companions, ...data.sideCompanions].map((entry) => entry.cardId),   // blank 6
        [data]
    );
    const { cardsById } = useCardDetails(ids);

    if (isLoading) return <p className="text-white-50 small terminal-font m-0">LOADING META DATA…</p>;   // blank 7
    if (hasError) return <p className="text-danger small terminal-font m-0">COULD NOT LOAD META DATA.</p>;
    if (data.companions.length === 0 && data.sideCompanions.length === 0) {
        return <p className="text-white-50 small terminal-font m-0">NOT ENOUGH META DECK DATA FOR THIS CARD YET.</p>;
    }

    return (
        <div className="cc-panel">
            <p className="text-white-50 small m-0 mb-2">Based on {data.deckCount} meta decks that play this card.</p>
            <CompanionGrid title="OFTEN PLAYED WITH" entries={data.companions} cardsById={cardsById} />
            <CompanionGrid title="COMMONLY SIDED" entries={data.sideCompanions} cardsById={cardsById} />   {/* blank 8 */}
        </div>
    );
}