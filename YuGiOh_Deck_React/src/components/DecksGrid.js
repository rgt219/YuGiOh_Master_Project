import React, { useState } from 'react';
import DeckBoss from './DeckBoss';
import '../md-deck-grid.css';

export default function DecksGrid({ decks = [], decklist = [], toggleDeckList }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [extraDeckType, setExtraDeckType] = useState("All Extra Deck Types");
    const [rating, setRating] = useState("All");

    const matchesSearchTerm = (deck) => deck.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesExtraDeckType = (deck) => {
        if (extraDeckType === "All Extra Deck Types") return true;
        return deck.extraDeckType?.toLowerCase() === extraDeckType.toLowerCase();
    };

    const matchesRating = (deck) => {
        switch(rating) {
            case "Good": return deck.rating >= 8;
            case "Ok": return deck.rating >= 5 && deck.rating < 8;
            case "Bad": return deck.rating < 5;
            default: return true;
        }
    };

    const filteredDecks = decks.filter(deck => 
        matchesExtraDeckType(deck) && matchesRating(deck) && matchesSearchTerm(deck)
    );

    return (
        <div className="container-fluid px-4 py-3">
            {/* Header Header */}
            <div className="d-flex align-items-center justify-content-between mb-3">
                <h3 className="text-info terminal-font m-0" style={{ letterSpacing: '2px', fontFamily: 'Rajdhani, sans-serif' }}>
                    FEATURED_ARCHETYPES // TCG_SELECTIONS
                </h3>
                <span className="text-white-50 small" style={{ fontFamily: 'Share Tech Mono, monospace' }}>
                    TOTAL_INDEXED: [{filteredDecks.length}]
                </span>
            </div>

            {/* Cyber Filter Bar */}
            <div className="md-filter-panel">
                <div className="row g-3 align-items-center">
                    {/* Search Input */}
                    <div className="col-md-6">
                        <input 
                            type="text"
                            className="form-control md-search-field"
                            placeholder="SEARCH_ARCHETYPE_OR_CARD..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Extra Deck Filter */}
                    <div className="col-md-3">
                        <select 
                            className="form-select md-select-field" 
                            value={extraDeckType} 
                            onChange={(e) => setExtraDeckType(e.target.value)}
                        >
                            <option value="All Extra Deck Types">ALL EXTRA DECKS</option>
                            <option value="Fusion">FUSION</option>
                            <option value="Synchro">SYNCHRO</option>
                            <option value="XYZ">XYZ</option>
                            <option value="Link">LINK</option>
                        </select>
                    </div>

                    {/* Rating Filter */}
                    <div className="col-md-3">
                        <select 
                            className="form-select md-select-field" 
                            value={rating} 
                            onChange={(e) => setRating(e.target.value)}
                        >
                            <option value="All">ALL TIER RATINGS</option>
                            <option value="Good">TIER 1 / GOOD (8+)</option>
                            <option value="Ok">TIER 2 / OK (5-7)</option>
                            <option value="Bad">ROGUE / CASUAL (&lt;5)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Decks Grid */}
            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4">
                {filteredDecks.map(deck => (
                    <div className="col" key={deck.id}>
                        <DeckBoss
                            deck={deck}
                            toggleDeckList={toggleDeckList}
                            isDeckListed={decklist.includes(deck.id)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}