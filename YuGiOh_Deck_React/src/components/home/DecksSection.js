'use client';

import React, { useCallback, useEffect, useState } from 'react';
import DecksGrid from '@/components/DecksGrid';

/** Owns the deck list and the "added to my list" selection, so toggling a deck re-renders only this section. */
export default function DecksSection() {
    const [decks, setDecks] = useState([]);
    const [decklist, setDeckList] = useState([]);

    useEffect(() => {
        const controller = new AbortController();
        fetch('/decks.json', { signal: controller.signal })
            .then((response) => (response.ok ? response.json() : []))
            .then((data) => setDecks(data))
            .catch((err) => { if (err.name !== 'AbortError') console.warn('Could not load decks.json:', err); });
        return () => controller.abort();
    }, []);

    const toggleDeckList = useCallback((deckId) => {
        setDeckList((prev) => (prev.includes(deckId) ? prev.filter((id) => id !== deckId) : [...prev, deckId]));
    }, []);

    return (
        <section className="mb-4" aria-label="Featured decks">
            <DecksGrid decks={decks} decklist={decklist} toggleDeckList={toggleDeckList} />
        </section>
    );
}
