import React, { memo, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { IMAGE_BASE } from '@/lib/cardData';
import { formatDate } from '@/utils/metaDeckHelpers';
import { useOverflow } from '@/hooks/useOverflow';

const CARD_BACK = 'https://images.ygoprodeck.com/images/cards/back_high.jpg';

/** One of the three fanned cards. Lazy-loaded, has a size (so the page does not jump), falls back to a card back. */
function FanCard({ id, position }) {
    // Your image host first, then YGOPRODeck (some Master Duel cards are not on your host), then a card back.
    const sources = useMemo(() => (!/^\d+$/.test(String(id)) ? [CARD_BACK] : [
        `${IMAGE_BASE}/${id}.jpg`,
        `https://images.ygoprodeck.com/images/cards_small/${id}.jpg`,
        CARD_BACK,
    ]), [id]);
    const [stage, setStage] = useState(0);
    return (
        <img
            className={`mdc-fan__card mdc-fan__card--${position}`}
            src={sources[stage]}
            alt=""
            width="117"
            height="170"
            loading="lazy"
            decoding="async"
            onError={() => setStage((n) => Math.min(n + 1, sources.length - 1))}
        />
    );
}

/** Text that shows "..." when too long, and slides sideways on hover to reveal the rest. */
function MarqueeText({ text, className = '' }) {
    const ref = useRef(null);
    const overflow = useOverflow(ref, text);
    return (
        <span
            ref={ref}
            className={`mdc-marquee ${overflow > 1 ? 'is-overflowing' : ''} ${className}`}
            style={{ '--mdc-shift': `-${overflow}px` }}
            title={overflow > 1 ? text : undefined}
        >
            <span className="mdc-marquee__inner">{text}</span>
        </span>
    );
}

/**
 * One deck tile on the archive page. The whole tile is a single link (the title's "stretched link"),
 * so it is clickable anywhere and has exactly one keyboard stop.
 */
function MetaDeckCard({ deck, mdSound }) {
    const [left, center, right] = deck.fanned;

    return (
        <article className="mdc-deck" onMouseEnter={() => mdSound?.playHover?.()}>
            <header className="mdc-deck__head">
                <h3 className="mdc-deck__title" title={deck.archetype}>
                    <Link href={`/meta-decks/${deck.id}`} className="stretched-link" onClick={() => mdSound?.playClick?.()}>
                        {deck.archetype}
                    </Link>
                </h3>
                <MarqueeText className="mdc-deck__placement" text={deck.placement || 'Tournament placement'} />
            </header>

            <div className="mdc-fan" aria-hidden="true">
                <span className="mdc-fan__glow" />
                <FanCard id={left} position="left" />
                <FanCard id={right} position="right" />
                <FanCard id={center} position="center" />
            </div>

            <div className="mdc-deck__body">
                {deck.pilot && <MarqueeText className="mdc-deck__pilot" text={`PILOT: ${deck.pilot}`} />}

                <p className="mdc-deck__counts" aria-label={`${deck.counts.main} main, ${deck.counts.extra} extra, ${deck.counts.side} side cards`}>
                    <span className="is-main">{deck.counts.main} MAIN</span>
                    <span className="is-extra">{deck.counts.extra} EXTRA</span>
                    <span className="is-side">{deck.counts.side} SIDE</span>
                </p>

                <div className="mdc-deck__foot">
                    <span className="mdc-deck__updated">UPDATED {formatDate(deck.updatedAt)}</span>
                    {/* Looks like a button, but the title link above is the real (single) link. */}
                    <span className="mdc-deck__cta" aria-hidden="true">VIEW DECK PROFILE →</span>
                </div>
            </div>
        </article>
    );
}

export default memo(MetaDeckCard);
