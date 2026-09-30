import React, { useEffect, useState } from 'react';
import { Badge, Button } from 'react-bootstrap';

const SLICES = [
    { key: 'monsters', label: 'MONSTERS', color: '#eab308', text: 'text-warning' },
    { key: 'spells', label: 'SPELLS', color: '#10b981', text: 'text-success' },
    { key: 'traps', label: 'TRAPS', color: '#ec4899', text: 'text-danger' },
];

export default function MetaDeckHeader({ deck, cardCounts, onExportYDK, onOpenInBuilder, canOpenInBuilder, replacesDeck }) {
    // Two-step button: if the builder already holds a deck, the first click asks, the second one replaces it.
    const [confirming, setConfirming] = useState(false);
    useEffect(() => {
        if (!confirming) return undefined;
        const timer = setTimeout(() => setConfirming(false), 5000);
        return () => clearTimeout(timer);
    }, [confirming]);

    const handleOpen = () => {
        if (replacesDeck && !confirming) { setConfirming(true); return; }
        setConfirming(false);
        onOpenInBuilder();
    };

    const total = cardCounts.monsters + cardCounts.spells + cardCounts.traps || deck.counts.main || 1;
    const monsterPct = Math.round((cardCounts.monsters / total) * 100);
    const spellPct = Math.round((cardCounts.spells / total) * 100);
    const trapPct = Math.max(0, 100 - (monsterPct + spellPct));
    const percents = { monsters: monsterPct, spells: spellPct, traps: trapPct };

    const monsterDeg = (monsterPct / 100) * 360;
    const spellDeg = monsterDeg + (spellPct / 100) * 360;

    return (
        <section className="mdp-panel mdp-header" aria-labelledby="mdp-deck-title">
            <div className="mdp-header__top">
                <h1 id="mdp-deck-title" className="mdp-header__title">{deck.archetype}</h1>
                <div className="mdp-header__actions">
                    <Button variant="info" className="fw-bold text-nowrap" disabled={!canOpenInBuilder} onClick={handleOpen}>
                        {confirming ? 'REPLACE YOUR CURRENT DECK? CLICK AGAIN' : canOpenInBuilder ? 'OPEN IN DECK BUILDER' : 'LOADING CARDS...'}
                    </Button>
                    <Button variant="outline-secondary" className="fw-bold text-white text-nowrap" onClick={onExportYDK}>
                        EXPORT .YDK
                    </Button>
                </div>
            </div>

            <div className="d-flex gap-2 flex-wrap mb-3">
                {deck.pilot && <Badge bg="success" className="mdp-badge text-dark">PILOT: {deck.pilot}</Badge>}
                <Badge bg="dark" className="mdp-badge border border-secondary">PLACEMENT: {deck.placement || 'Unknown'}</Badge>
                <Badge bg="info" className="mdp-badge text-dark">FORMAT: {deck.format}</Badge>
            </div>

            <div className="mdp-composition">
                <h2 className="mdp-composition__title">MAIN DECK COMPOSITION</h2>
                <div className="mdp-composition__body">
                    <div
                        className="mdp-donut"
                        role="img"
                        aria-label={`${cardCounts.monsters} monsters, ${cardCounts.spells} spells, ${cardCounts.traps} traps`}
                        style={{ '--m': `${monsterDeg}deg`, '--s': `${spellDeg}deg` }}
                    >
                        <div className="mdp-donut__hole">
                            <small>TOTAL</small>
                            <strong>{deck.counts.main || total}</strong>
                        </div>
                    </div>

                    <ul className="mdp-legend">
                        {SLICES.map((slice) => (
                            <li key={slice.key} style={{ '--c': slice.color }}>
                                <span><i aria-hidden="true" /> {slice.label}</span>
                                <b className={slice.text}>{cardCounts[slice.key]} ({percents[slice.key]}%)</b>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}
