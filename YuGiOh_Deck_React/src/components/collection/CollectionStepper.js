'use client';

import React from 'react';
import { Button } from 'react-bootstrap';
import { useCollection } from '@/hooks/useCollection';
import { MAX_QUANTITY } from '@/lib/collectionStore';

/** "− 2 +" buttons for how many copies of a card you own. Renders nothing when you are logged out. */
export default function CollectionStepper({ cardId, cardName = 'this card' }) {
    const { owned, status, setQuantity } = useCollection();

    if (status === 'signedOut') return null;

    const quantity = owned[String(cardId)] || 0;

    return (
        <div className="d-flex align-items-center justify-content-center gap-2 mt-1" role="group" aria-label={`Copies of ${cardName} you own`}>
            <Button
                variant="outline-info"
                size="sm"
                className="terminal-font fw-bold px-2 py-0"
                disabled={quantity === 0}
                onClick={() => setQuantity(cardId, quantity - 1)}
                aria-label={`Remove one copy of ${cardName}`}
            >
                −
            </Button>
            <span className="terminal-font text-white fw-bold" style={{ minWidth: '1.5em', textAlign: 'center' }} aria-live="polite">
                {quantity}
            </span>
            <Button
                variant="outline-info"
                size="sm"
                className="terminal-font fw-bold px-2 py-0"
                disabled={quantity >= MAX_QUANTITY}
                onClick={() => setQuantity(cardId, quantity + 1)}
                aria-label={`Add one copy of ${cardName}`}
            >
                +
            </Button>
        </div>
    );
}