'use client';

import React, { useMemo, useState } from 'react';
import { useCollection } from '@/hooks/useCollection';
import { computeGap } from '@/lib/collectionGap';
import CollectionStepper from '@/components/collection/CollectionStepper';
import './collectionGap.css';

/**
 * "What do I need to build this deck?"
 * `cards` is one flat list with one entry per copy (main + extra + side), the same list DeckPriceWidget gets.
 */
export default function CollectionGapPanel({ cards = [], loading = false }) {
    const { owned, status } = useCollection();
    const [showAll, setShowAll] = useState(false);

    const gap = useMemo(() => computeGap(cards, owned), [cards, owned]);

    let body;
    if (status === 'signedOut') {
        body = <p className="text-white-50 small m-0">SIGN IN TO COMPARE THIS DECK WITH YOUR COLLECTION.</p>;
    } else if (status === 'error') {
        body = <p className="text-danger small m-0">COULD NOT LOAD YOUR COLLECTION.</p>;
    } else if (status !== 'ready' || loading) {
        body = <p className="text-white-50 small m-0">CHECKING YOUR COLLECTION…</p>;
    } else {
        const rows = showAll ? gap.rows : gap.rows.filter((row) => row.missing > 0);
        body = (
            <>
                <div className="d-flex justify-content-between align-items-baseline mb-1 terminal-font">
                    <span className="text-info fw-bold">{gap.ownedCopies} / {gap.totalCopies} CARDS OWNED</span>
                    <span className="text-white-50">{gap.percent}%</span>
                </div>
                <div className="cg-bar mb-3" aria-hidden="true">
                    <div className={`cg-bar__fill${gap.complete ? ' cg-bar__fill--done' : ''}`} style={{ width: `${gap.percent}%` }} />
                </div>

                {gap.complete ? (
                    <p className="text-success fw-bold terminal-font m-0">✔ YOU OWN EVERYTHING THIS DECK NEEDS.</p>
                ) : (
                    <p className="m-0 mb-2">
                        <span className="text-white-50 terminal-font">MISSING {gap.missingCopies} {gap.missingCopies === 1 ? 'COPY' : 'COPIES'} • EST. COST </span>
                        <strong className="text-success terminal-font">${gap.missingCost.toFixed(2)}</strong>
                        <small className="d-block text-white-50">TCGPlayer prices. Cards without a listed price count as $0.</small>
                    </p>
                )}

                {rows.length > 0 && (
                    <ul className="cg-list">
                        {rows.map((row) => (
                            <li key={row.id} className={`cg-row${row.missing === 0 ? ' cg-row--done' : ''}`}>
                                <span className="cg-row__name" title={row.name}>{row.name}</span>
                                <span className="cg-row__count terminal-font">
                                    <span className={row.missing > 0 ? 'text-warning' : 'text-success'}>{row.owned}</span>
                                    <span className="text-white-50"> / {row.needed}</span>
                                </span>
                                <CollectionStepper cardId={row.id} cardName={row.name} />
                            </li>
                        ))}
                    </ul>
                )}

                {gap.rows.length > 0 && !gap.complete && (
                    <button type="button" className="btn btn-link btn-sm text-info p-0 mt-2 terminal-font" onClick={() => setShowAll((value) => !value)}>
                        {showAll ? 'SHOW ONLY MISSING' : 'SHOW ALL CARDS'}
                    </button>
                )}
            </>
        );
    }

    return (
        <section className="mdp-panel cg-panel" aria-labelledby="cg-title">
            <h2 id="cg-title" className="h6 text-info terminal-font fw-bold mb-3">WHAT DO I NEED?</h2>
            {body}
        </section>
    );
}