import React, {useState, useEffect} from 'react';
import '../styles.css';
import DeckBoss from './DeckBoss';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

export default function DecksGrid({decks, decklist, toggleDeckList}) 
{
    const [searchTerm, setSearchTerm] = useState("");
    const [extraDeckType, setExtraDeckType] = useState("All Extra Deck Types");
    const [rating, setRating] = useState("All");

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleExtraDeckTypeChange = (e) => {
        setExtraDeckType(e.target.value);
    };

    const handleRatingChange = (e) => {
        setRating(e.target.value);
    };

    const matchesSearchTerm = (deck, searchTerm) => {
        return deck.title.toLowerCase().includes(searchTerm.toLowerCase())    
    };

    const matchesExtraDeckType = (deck, extraDeckType) => {
        return extraDeckType === "All Extra Deck Types" || deck.extraDeckType.toLowerCase() === extraDeckType.toLowerCase();
    };

    const matchesRating = (deck, rating) => {
        switch(rating) {
            case "All":
                return true;

            case "Good":
                return deck.rating >= 8;

            case "Ok":
                return deck.rating >= 5 && deck.rating < 8;

            case "Bad":
                return deck.rating < 5;

            default:
                return false;
        }
    };

    const filteredDecks = decks.filter((deck) =>
        matchesExtraDeckType(deck, extraDeckType) && 
        matchesRating(deck, rating) &&
        matchesSearchTerm(deck, searchTerm)
    );



    return (
        <div>
            <h3 className="text-info">Below are a few of my favorite decks to play in the TCG. Click below for more info!</h3>
            <input 
                type="text"
                className="search-input"
                placeholder="Search decks..."
                value={searchTerm}
                onChange={handleSearchChange}>
                
            </input>

            <div className="filter-bar">
                <div className="filter-slot">
                    <label>Extra Deck Type</label>
                    <select className="filter-dropdown" value={extraDeckType} onChange={handleExtraDeckTypeChange}>
                        <option>All Extra Deck Types</option>
                        <option>Fusion</option>
                        <option>Synchro</option>
                        <option>XYZ</option>
                        <option>Link</option>
                    </select>
                </div>
                <div className="filter-slot">
                    <label>Rating</label>
                    <select className="filter-dropdown" value={rating} onChange={handleRatingChange}>
                        <option>All</option>
                        <option>Good</option>
                        <option>Ok</option>
                        <option>Bad</option>
                    </select>
                </div>
            </div>

            <div className='decks-grid'>
            {
                filteredDecks.map(deck => (
                    <DeckBoss
                        deck={deck}
                        toggleDeckList={toggleDeckList}
                        key={deck.id}
                        isDeckListed={decklist.includes(deck.id)}>
                    </DeckBoss>
                ))
            }    
            </div>
        </div>
        
    );
 }