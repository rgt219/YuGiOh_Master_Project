'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCollection } from '@/hooks/useCollection';
import { useCardSets, useSetCards } from '@/hooks/useCardSets';
import { AZURE_BLOB_CONTAINER_URL } from '@/constants/cardSearchConstants';
import HoloCard from '@/components/collection/HoloCard';
import './binder.css';

const SLOTS_PER_PAGE = 9; // 3 x 3 pockets, like a real binder page
const FLIP_MS = 800;      // keep in sync with --flip-ms in binder.css
const DEFAULT_SET = 'Legend of Blue Eyes White Dragon';
const CARD_BACK = 'https://images.ygoprodeck.com/images/cards/back_high.jpg';

const chunk = (list, size) => {
    const pages = [];
    for (let i = 0; i < list.length; i += size) pages.push(list.slice(i, i + size));
    return pages;
};

/** true on screens wide enough to show two pages side by side. */
function useTwoPages() {
    const [twoPages, setTwoPages] = useState(true);
    useEffect(() => {
        const query = window.matchMedia('(min-width: 992px)');
        const update = () => setTwoPages(query.matches);
        update();
        query.addEventListener('change', update);
        return () => query.removeEventListener('change', update);
    }, []);
    return twoPages;
}

function Pocket({ slot, quantity, canEdit, onChange }) {
    const owned = quantity > 0;
    return (
        <div className={`cb-pocket${owned ? ' is-owned' : ' is-missing'}`}>
            <HoloCard className={owned ? 'holo--on' : 'holo--off'}>
                <img
                    className="cb-card"
                    src={`${AZURE_BLOB_CONTAINER_URL}/${slot.id}.jpg`}
                    alt={owned ? slot.name : `${slot.name} (not owned)`}
                    width="421"
                    height="614"
                    loading="lazy"
                    decoding="async"
                    draggable="false"
                    onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = CARD_BACK;
                    }}
                />
            </HoloCard>

            <span className="cb-code">{slot.code}</span>
            {quantity > 1 && <span className="cb-qty" aria-label={`${quantity} copies`}>×{quantity}</span>}

            {canEdit && (
                <div className="cb-controls">
                    <button type="button" aria-label={`Remove one copy of ${slot.name}`} disabled={!owned} onClick={() => onChange(slot.id, quantity - 1)}>−</button>
                    <button type="button" aria-label={`Add one copy of ${slot.name}`} onClick={() => onChange(slot.id, quantity + 1)}>+</button>
                </div>
            )}
        </div>
    );
}

/** One page of the binder: up to nine pockets (empty pockets fill the rest). */
function BinderPage({ cards, pageNumber, owned, canEdit, onChange }) {
    if (!cards) return <div className="cb-page cb-page--blank" aria-hidden="true" />;
    return (
        <div className="cb-page">
            <div className="cb-grid">
                {Array.from({ length: SLOTS_PER_PAGE }, (_, i) => {
                    const slot = cards[i];
                    return slot
                        ? <Pocket key={slot.id} slot={slot} quantity={owned[String(slot.id)] || 0} canEdit={canEdit} onChange={onChange} />
                        : <div key={`empty-${i}`} className="cb-pocket cb-pocket--empty" aria-hidden="true" />;
                })}
            </div>
            <span className="cb-pageno">{pageNumber}</span>
        </div>
    );
}

export default function CollectionBinder({ cardsById = {} }) {
    const { owned, status, setQuantity } = useCollection();
    const canEdit = status !== 'signedOut';
    const twoPages = useTwoPages();

    const [setName, setSetName] = useState('');
    const [spread, setSpread] = useState(0);
    const [flip, setFlip] = useState(null); // { dir: 'next' | 'prev', to: number } while a page is turning
    const timer = useRef(null);

    const setsQuery = useCardSets();
    const cardsQuery = useSetCards(setName);

    // Sets you own at least one card from, biggest first.
    const mySets = useMemo(() => {
        const counts = new Map();
        Object.entries(owned).forEach(([id, quantity]) => {
            if (!(quantity > 0)) return;
            (cardsById[id]?.sets || []).forEach((name) => counts.set(name, (counts.get(name) || 0) + 1));
        });
        return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    }, [owned, cardsById]);

    // Pick a starting set once there is something to pick from.
    useEffect(() => {
        if (setName) return;
        if (mySets.length) setSetName(mySets[0].name);
        else if (setsQuery.data) setSetName(setsQuery.data.some((s) => s.name === DEFAULT_SET) ? DEFAULT_SET : setsQuery.data[0]?.name || '');
    }, [setName, mySets, setsQuery.data]);

    const slots = cardsQuery.data || [];
    const pages = useMemo(() => chunk(slots, SLOTS_PER_PAGE), [slots]);
    const perSpread = twoPages ? 2 : 1;
    const spreadCount = Math.max(1, Math.ceil(pages.length / perSpread));

    const ownedInSet = slots.filter((slot) => (owned[String(slot.id)] || 0) > 0).length;
    const percent = slots.length ? Math.round((ownedInSet / slots.length) * 100) : 0;

    // Back to the first page whenever the set or the layout changes.
    useEffect(() => { setSpread(0); setFlip(null); }, [setName, twoPages]);
    useEffect(() => () => clearTimeout(timer.current), []);

    const go = useCallback((direction) => {
        if (flip) return;
        const to = spread + (direction === 'next' ? 1 : -1);
        if (to < 0 || to >= spreadCount) return;

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!twoPages || reduceMotion) { setSpread(to); return; }

        setFlip({ dir: direction, to });
        timer.current = setTimeout(() => { setSpread(to); setFlip(null); }, FLIP_MS);
    }, [flip, spread, spreadCount, twoPages]);

    const handleKey = (event) => {
        if (event.key === 'ArrowRight') go('next');
        if (event.key === 'ArrowLeft') go('prev');
    };

    // Which pages (by index) are on show. During a turn, what is underneath changes and a "leaf" turns over the top.
    const leftIndex = (s) => s * perSpread;
    const rightIndex = (s) => s * perSpread + 1;

    let leftI = leftIndex(spread);
    let rightI = rightIndex(spread);
    let leaf = null; // { dir, frontI, backI }
    if (flip?.dir === 'next') {
        rightI = rightIndex(flip.to);
        leaf = { dir: 'next', frontI: rightIndex(spread), backI: leftIndex(flip.to) };
    } else if (flip?.dir === 'prev') {
        leftI = leftIndex(flip.to);
        leaf = { dir: 'prev', frontI: leftIndex(spread), backI: rightIndex(flip.to) };
    }

    const pageProps = { owned, canEdit, onChange: setQuantity };
    const shownSpread = flip ? flip.to : spread;
    const firstPage = leftIndex(shownSpread) + 1;
    const lastPage = Math.min(pages.length, twoPages ? rightIndex(shownSpread) + 1 : firstPage);

    return (
        <section className="cb-wrap" aria-label="Collection binder" onKeyDown={handleKey}>
            <div className="cb-toolbar">
                <label className="cb-select">
                    <span className="terminal-font text-info small">SET</span>
                    <select className="form-select form-select-sm bg-black text-info border-secondary terminal-font" value={setName} onChange={(event) => setSetName(event.target.value)}>
                        {mySets.length > 0 && (
                            <optgroup label="SETS YOU OWN CARDS FROM">
                                {mySets.map((s) => <option key={`mine-${s.name}`} value={s.name}>{s.name} ({s.count})</option>)}
                            </optgroup>
                        )}
                        <optgroup label="ALL SETS">
                            {(setsQuery.data || []).map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
                        </optgroup>
                    </select>
                </label>

                <div className="cb-progress terminal-font" aria-live="polite">
                    {cardsQuery.isSuccess && slots.length > 0 ? (
                        <>
                            <span className="text-info fw-bold">{ownedInSet} / {slots.length}</span>
                            <span className="text-white-50"> CARDS • {percent}% COMPLETE</span>
                            <div className="cb-bar" aria-hidden="true"><div className="cb-bar__fill" style={{ width: `${percent}%` }} /></div>
                        </>
                    ) : null}
                </div>
            </div>

            {cardsQuery.isError || setsQuery.isError ? (
                <p className="text-white-50 terminal-font text-center p-4">COULD NOT LOAD THAT SET. TRY ANOTHER, OR REFRESH.</p>
            ) : !setName || cardsQuery.isPending ? (
                <p className="text-white-50 terminal-font text-center p-5">OPENING BINDER…</p>
            ) : slots.length === 0 ? (
                <p className="text-white-50 terminal-font text-center p-5">NO CARDS FOUND FOR THIS SET.</p>
            ) : (
                <>
                    <div className="cb-book" tabIndex={0} aria-label="Binder pages. Use the left and right arrow keys to turn pages.">
                        <div className={`cb-spread${twoPages ? ' cb-spread--two' : ''}`}>
                            <BinderPage cards={pages[leftI]} pageNumber={leftI + 1} {...pageProps} />
                            {twoPages && <BinderPage cards={pages[rightI]} pageNumber={rightI + 1} {...pageProps} />}

                            {leaf && (
                                <div className={`cb-leaf cb-leaf--${leaf.dir}`} aria-hidden="true">
                                    <div className="cb-leaf__face cb-leaf__front">
                                        <BinderPage cards={pages[leaf.frontI]} pageNumber={leaf.frontI + 1} {...pageProps} />
                                    </div>
                                    <div className="cb-leaf__face cb-leaf__back">
                                        <BinderPage cards={pages[leaf.backI]} pageNumber={leaf.backI + 1} {...pageProps} />
                                    </div>
                                </div>
                            )}

                            {twoPages && (
                                <div className="cb-rings" aria-hidden="true"><span /><span /><span /></div>
                            )}
                        </div>
                    </div>

                    <div className="cb-nav terminal-font">
                        <button type="button" className="btn btn-outline-info btn-sm fw-bold" disabled={spread === 0 || Boolean(flip)} onClick={() => go('prev')}>◄ PREV</button>
                        <span className="text-white-50 small">
                            {twoPages && lastPage > firstPage ? `PAGES ${firstPage}–${lastPage}` : `PAGE ${firstPage}`} OF {pages.length}
                        </span>
                        <button type="button" className="btn btn-outline-info btn-sm fw-bold" disabled={spread >= spreadCount - 1 || Boolean(flip)} onClick={() => go('next')}>NEXT ►</button>
                    </div>
                </>
            )}
        </section>
    );
}