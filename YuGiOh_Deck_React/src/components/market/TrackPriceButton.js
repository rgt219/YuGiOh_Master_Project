'use client';

import Link from 'next/link';
import { Button } from 'react-bootstrap';
import { useWatchList } from '@/hooks/useWatchList';

/**
 * "Track price" button for one printing of a card (one TCGplayer product id).
 * Tracking it means you get a notification when its price drops.
 *
 *   <TrackPriceButton productId={123456} cardName="Ash Blossom & Joyous Spring" setName="Maximum Crisis" rarity="Ultra Rare" />
 */
export default function TrackPriceButton({ productId, cardName, setName, rarity }) {
    const { status, error, isWatching, setWatching } = useWatchList();

    if (!productId) return null;

    // Not logged in: send them to the login page instead of showing a button that cannot work.
    if (status === 'signedOut') {
        return (
            <Button as={Link} href="/login" variant="outline-info" size="sm">
                LOG IN TO TRACK THIS PRICE
            </Button>
        );
    }

    const watching = isWatching(productId);
    const loading = status === 'idle' || status === 'loading';

    return (
        <div className="d-flex flex-column align-items-start gap-1">
            <Button
                variant={watching ? 'info' : 'outline-info'}
                size="sm"
                disabled={loading}
                aria-pressed={watching}
                onClick={() => setWatching(productId, !watching, { cardName, setName, rarity })}
            >
                {loading ? 'LOADING...' : watching ? 'TRACKING PRICE' : 'TRACK PRICE'}
            </Button>
            {error && <small className="text-warning" role="alert">{error}</small>}
        </div>
    );
}