import React from 'react';
import { Button, Form, Spinner, OverlayTrigger, Tooltip } from 'react-bootstrap';

export default function DeckHeader({ 
    deckName, dispatch, updateDeckName, isImporting, 
    fileInputRef, handleImportYDK, handleExportYDK, 
    handleClearDeck, user, handleSave, setShowAiModal 
}) {
    return (
        <div className="mb-4 text-white p-4" style={{ background: 'transparent', width: '100%' }}>
            {/* Top Tier: Page Title & Clear Deck Name Input */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 pb-3 border-bottom border-info border-opacity-25">
                <div>
                    <h2 className="fw-bold text-info terminal-font m-0 d-flex align-items-center gap-2" style={{ letterSpacing: '1px', textShadow: '0 0 12px rgba(0, 210, 255, 0.4)' }}>
                        DECK BUILDER
                    </h2>
                    <span className="text-white-50 small terminal-font">
                        CUSTOM DECK STUDIO & MANAGEMENT
                    </span>
                </div>

                <div className="d-flex align-items-center gap-2 flex-grow-1 justify-content-md-end" style={{ maxWidth: '450px' }}>
                    <span className="text-info small terminal-font text-nowrap fw-bold">DECK NAME:</span>
                    <Form.Control 
                        className="terminal-font fw-bold shadow-none text-white"
                        placeholder={isImporting ? "SYNCHRONIZING..." : "ENTER DECK TITLE..."}
                        value={deckName} 
                        onChange={(e) => dispatch(updateDeckName(e.target.value))} 
                        disabled={isImporting}
                        style={{ letterSpacing: '1px', backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid rgba(0, 210, 255, 0.4)', fontSize: '0.9rem' }}
                    />
                </div>
            </div>

            {/* Bottom Tier: Grouped Action & Utility Buttons */}
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-3">
                {/* Left Group: Tools & File Operations */}
                <div className="d-flex align-items-center gap-2 flex-wrap">
                    <Button variant="outline-info" size="sm" className="terminal-font fw-bold px-3 py-2" onClick={() => setShowAiModal(true)}>
                        AI Assistant (Beta)
                    </Button>
                    <Button variant="outline-secondary" size="sm" disabled={isImporting} className="terminal-font fw-bold px-3 py-2 text-white" onClick={() => fileInputRef.current?.click()}>
                        {isImporting ? <Spinner size="sm" animation="border" /> : "📁 Import .YDK"}
                    </Button>
                    <Button variant="outline-secondary" size="sm" className="terminal-font fw-bold px-3 py-2 text-white" onClick={handleExportYDK}>
                        💾 Export .YDK
                    </Button>
                </div>

                {/* Right Group: Workspace Management & Persistence */}
                <div className="d-flex align-items-center gap-2 flex-wrap">
                    <Button variant="outline-danger" size="sm" className="terminal-font fw-bold px-3 py-2" onClick={handleClearDeck}>
                        CLEAR DECK
                    </Button>
                    
                    {!user ? (
                        <OverlayTrigger placement="top" overlay={<Tooltip>Must be logged in to save</Tooltip>}>
                            <span className="d-inline-block">
                                <Button variant="info" size="sm" className="terminal-font fw-bold text-dark px-4 py-2" disabled style={{ pointerEvents: 'none' }}>
                                    SAVE DECK
                                </Button>
                            </span>
                        </OverlayTrigger>
                    ) : (
                        <Button variant="info" size="sm" className="terminal-font fw-bold text-dark px-4 py-2 shadow-sm" onClick={handleSave} disabled={isImporting}>
                            SAVE DECK
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}