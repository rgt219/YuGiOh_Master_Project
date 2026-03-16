import React from 'react';
import HoverVideoPlayer from 'react-hover-video-player';
import '../styles.css'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';


export default function DeckBoss({deck, isDeckListed, toggleDeckList})
{
    const handleError = (e) => {
        e.target.src = "images/cardback.jpg";
    };

    const getRatingClass = (rating) => {
        if(rating >= 8) return 'rating-good';
        if(rating >= 5 && rating < 8) return 'rating-ok';
        if(rating < 5) return 'rating-bad';

    };

    return (
        <div className='deck-card-container'>
            <div key={deck.id} className='deck-boss'>
                <div className="video-container">
                    <HoverVideoPlayer
                        videoSrc={`videos/${deck.video}`}
                        pausedOverlay={
                            <img src={`images/${deck.image}`} alt="" 
                                 style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                        }
                        loop={true}
                        muted={true}
                    />
                </div>

                <div className="deck-info-overlay">
                    <h3 className='deck-title'>
                        <Link to={`/decks/${deck.id}`}>{deck.title}</Link>
                    </h3>
                    
                    <div className="deck-stats-row">
                        <span className='deck-genre'>{deck.extraDeckType}</span>
                        <span className={`deck-rating-badge ${getRatingClass(deck.rating)}`}>
                            {deck.rating}
                        </span>
                    </div>

                    <label className="md-switch">
                        <input 
                            type="checkbox" 
                            checked={isDeckListed} 
                            onChange={() => toggleDeckList(deck.id)} 
                        />
                        <div className="md-slider">
                            <div className="md-knob"></div>
                            <span className="md-label">
                                {isDeckListed ? "IN DECKLIST" : "ADD TO LIST"}
                            </span>
                        </div>
                    </label>
                </div>
            </div> 
        </div>
    );

}