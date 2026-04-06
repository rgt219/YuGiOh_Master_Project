import React, {useContext, useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {DecksContext} from './DecksContext';
import HoverVideoPlayer from 'react-hover-video-player';
import { SplitPane } from 'react-split-pane';
import ImageGrid from './ImageGrid';
import ImagePopup from './ImagePopup';
import CardApi from './CardApi';
import ComboPlayer from './ComboPlayer';
import exampleCombo from './WhiteForestCenturIonCombo';

export default function DeckDetails({archetype}) {
    const { deckId } = useParams();
    const decks = useContext(DecksContext);
    const deck = decks.find(d => d.id === parseInt(deckId));

    if(!deck) return <div className="text-center mt-5">Deck not found.</div>

    return (
        <div className="container-fluid py-4 mt-5"> {/* Main wrapper for padding */}
            
            {/* Title Section */}
            <div className="text-center mb-4">
                <h1 className="display-4 text-uppercase fw-bold" style={{fontFamily: "Cascadia Mono", color: "#00d4ff"}}>
                    {deck.title}
                </h1>
            </div>

            {/* Key Cards Section using Glassmorphism */}
            <div className="glass-container mb-4">
                <h2 className="h4 mb-3" style={{fontFamily: "Cascadia Mono"}}>Key Cards</h2>
                <div className="d-flex justify-content-around align-items-center flex-wrap gap-3">
                    {[deck.keyCard1, deck.keyCard2, deck.keyCard3, deck.keyCard4].map((card, i) => (
                        <img 
                            key={i}
                            src={`/images/${card}`} 
                            alt="Key Card" 
                            className="img-fluid rounded shadow-lg" 
                            style={{ 
                                width: "18%", 
                                transition: "transform 0.3s ease",
                                cursor: "pointer" 
                            }}
                            onMouseOver={e => e.currentTarget.style.transform = "scale(1.1)"}
                            onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
                        />
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div style={{ height: "70vh" }}>
                <SplitPane split="vertical" defaultSize="55%">
                    <div className="pe-3"> {/* Padding right for separation */}
                        <div className="glass-container h-100 overflow-auto">
                            <ImageGrid archetype={deck} />
                        </div>
                    </div>
                    <div className="ps-3"> {/* Padding left for separation */}
                        <div className="glass-container h-100 bg-black bg-opacity-50 overflow-auto">
                            <ComboPlayer comboData={exampleCombo}/>
                        </div>
                    </div>
                </SplitPane>
            </div>

            <ImagePopup />
        </div>
    );
}