import React, {useContext} from 'react';
import {useParams} from 'react-router-dom';
import {DecksContext} from './DecksContext';
import { SplitPane } from 'react-split-pane';
import ImageGrid from './ImageGrid';
import ImagePopup from './ImagePopup';
import ComboPlayer from './ComboPlayer';

// Import combo data
import { whiteForestCenturIonMain } from './WhiteForestCenturIonCombo';
import { dracotailMainCombo } from './DracotailCombo';

export default function DeckDetails() {
    const { deckId } = useParams();
    const decks = useContext(DecksContext);
    const id = parseInt(deckId);
    const deck = decks.find(d => d.id === id);

    const comboRegistry = {
        1: dracotailMainCombo,
        3: whiteForestCenturIonMain,
    };

    const selectedCombo = comboRegistry[id];

    if(!deck) return <div className="text-center mt-5 text-danger terminal-font">! ERROR: ARCHETYPE_NOT_FOUND</div>

    return (
        <div className="md-theme-bg container-fluid py-4 mt-5">
            {/* HUD HEADER */}
            <div className="d-flex justify-content-between align-items-end mb-4 border-bottom border-info border-opacity-50 pb-2">
                <div>
                    <span className="text-info small terminal-font d-block">// ARCHETYPE_DATABASE</span>
                    <h1 className="display-5 text-uppercase fw-bold m-0" style={{fontFamily: "Cascadia Mono", color: "#fff", textShadow: "0 0 10px #00d4ff"}}>
                        {deck.title}
                    </h1>
                </div>
                <div className="text-end">
                    <span className="text-muted small terminal-font">SYSTEM_STATUS: <span className="text-success">ONLINE</span></span>
                </div>
            </div>

            {/* KEY CARDS - Master Duel "Gallery" Style */}
            <div className="md-glass-panel mb-4 p-3" style={{ borderLeft: "4px solid #00d4ff" }}>
                <h2 className="h6 text-info mb-3 terminal-font">CORE_RESOURCES</h2>
                <div className="d-flex justify-content-start align-items-center flex-wrap gap-4">
                    {[deck.keyCard1, deck.keyCard2, deck.keyCard3, deck.keyCard4].map((card, i) => (
                        <div key={i} className="card-frame">
                            <img 
                                src={`/images/${card}`} 
                                alt="Key Card" 
                                className="md-card-img"
                            />
                            <div className="card-glow"></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* MAIN INTERFACE */}
            <div style={{ height: "70vh", border: "1px solid rgba(0, 212, 255, 0.2)" }}>
                <SplitPane split="vertical" defaultSize="55%" minSize={300}>
                    {/* LEFT PANEL: DATA GRID */}
                    <div className="pe-2 h-100">
                        <div className="md-sub-panel h-100 overflow-auto">
                            <div className="panel-label">DATABASE_GRID</div>
                            <ImageGrid archetype={deck} />
                        </div>
                    </div>
                    
                    {/* RIGHT PANEL: COMBO SIMULATOR */}
                    <div className="ps-2 h-100">
                        <div className="md-sub-panel h-100 bg-black bg-opacity-70 overflow-auto">
                            <div className="panel-label">COMBINATION_PLAYER_V2</div>
                            {selectedCombo ? (
                                <ComboPlayer comboData={selectedCombo}/>
                            ) : (
                                <div className="d-flex align-items-center justify-content-center h-100">
                                    <div className="text-center terminal-font">
                                        <div className="spinner-border text-info mb-3" role="status"></div>
                                        <h3 className="text-muted">NO_DATA_STREAM</h3>
                                        <p className="small text-secondary">Awaiting combo sequence input...</p>
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