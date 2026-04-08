import React, {useContext} from 'react';
import {useParams} from 'react-router-dom';
import {DecksContext} from './DecksContext';
import { SplitPane } from 'react-split-pane';
import ImageGrid from './ImageGrid';
import ImagePopup from './ImagePopup';
import ComboPlayer from './ComboPlayer';

// 1. Import your combo data files here
import { whiteForestCenturIonMain } from './WhiteForestCenturIonCombo';
import { dracotailMainCombo } from './DracotailCombo';

export default function DeckDetails() {
    const { deckId } = useParams();
    const decks = useContext(DecksContext);
    
    // Convert deckId to integer since useParams returns a string
    const id = parseInt(deckId);
    const deck = decks.find(d => d.id === id);

    // 2. COMBO REGISTRY
    // Map your Deck IDs to the imported combo objects
    const comboRegistry = {
        1: dracotailMainCombo,       // Assuming 2 is Dracotail
        3: whiteForestCenturIonMain, // Assuming 1 is White Forest
        // Add more mappings as you create files
    };

    // Get the specific combo for this deck, or null if none exists
    const selectedCombo = comboRegistry[id];

    if(!deck) return <div className="text-center mt-5 text-white">Deck not found.</div>

    return (
        <div className="container-fluid py-4 mt-5">
            {/* Title Section */}
            <div className="text-center mb-4">
                <h1 className="display-4 text-uppercase fw-bold" style={{fontFamily: "Cascadia Mono", color: "#00d4ff"}}>
                    {deck.title}
                </h1>
            </div>

            {/* Key Cards Section */}
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
                    <div className="pe-3">
                        <div className="glass-container h-100 overflow-auto">
                            <ImageGrid archetype={deck} />
                        </div>
                    </div>
                    <div className="ps-3">
                        <div className="glass-container h-100 bg-black bg-opacity-50 overflow-auto">
                            {/* 3. Render ComboPlayer only if combo data exists */}
                            {selectedCombo ? (
                                <ComboPlayer comboData={selectedCombo}/>
                            ) : (
                                <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                                    <div className="text-center">
                                        <h3 style={{fontFamily: "Cascadia Mono"}}>NO_COMBO_DATA</h3>
                                        <p>Simulation parameters for this archetype are not yet defined.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </SplitPane>
            </div>

            <ImagePopup />
        </div>
    );
}