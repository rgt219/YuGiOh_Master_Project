import React from 'react';
import { Button, Form, Spinner, OverlayTrigger, Tooltip } from 'react-bootstrap';

export default function DeckHeader({ 
    deckName, dispatch, updateDeckName, isImporting, 
    fileInputRef, handleImportYDK, handleExportYDK, 
    handleClearDeck, user, handleSave, setShowAiModal 
}) {
    return (
        <div className="mb-4 text-white" style={{ backgroundColor: '#0a0d14', border: '1px solid rgba(0, 210, 255, 0.3)', borderRadius: '6px', width: '100%', boxShadow: '0 0 20px rgba(0, 210, 255, 0.05)' }}>
            <div className="p-4">
                <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
                    <div className="d-flex align-items-center gap-3 flex-grow-1">
                        <h4 className="m-0 text-info terminal-font text-nowrap fw-bold">DECK BUILDER</h4>
                        <Form.Control 
                            className="terminal-font fw-bold fs-5 shadow-none flex-grow-1"
                            placeholder={isImporting ? "SYNCHRONIZING..." : "ENTER DECK NAME..."}
                            value={deckName} 
                            onChange={(e) => dispatch(updateDeckName(e.target.value))} 
                            disabled={isImporting}
                            style={{ maxWidth: '400px', letterSpacing: '1px', backgroundColor: '#121824', border: '1px solid rgba(0, 210, 255, 0.3)', color: '#ffffff' }}
                        />
                    </div>

                    <div className="d-flex align-items-center gap-2 flex-wrap">
                        <Button variant="warning" className="terminal-font text-dark fw-bold text-nowrap" onClick={() => setShowAiModal(true)}>AI HELPER</Button>
                        <div className="vr opacity-25 d-none d-sm-block mx-1" style={{ height: '24px', backgroundColor: '#00d2ff' }}></div>
                        <Button variant="outline-info" disabled={isImporting} className="terminal-font fw-bold text-nowrap" onClick={() => fileInputRef.current?.click()}>
                            {isImporting ? <Spinner size="sm" animation="border" /> : "IMPORT YDK"}
                        </Button>
                        <Button variant="outline-info" className="terminal-font fw-bold text-nowrap" onClick={handleExportYDK}>EXPORT YDK</Button>
                        <div className="vr opacity-25 d-none d-sm-block mx-1" style={{ height: '24px', backgroundColor: '#00d2ff' }}></div>
                        <Button variant="outline-danger" className="terminal-font fw-bold text-nowrap px-3" onClick={handleClearDeck}>CLEAR</Button>
                        <div className="vr opacity-25 d-none d-sm-block mx-1" style={{ height: '24px', backgroundColor: '#00d2ff' }}></div>
                        {!user ? (
                            <OverlayTrigger placement="top" overlay={<Tooltip>Must be logged in to save</Tooltip>}>
                                <span className="d-inline-block"><Button variant="outline-info" className="text-nowrap fw-bold terminal-font" disabled style={{ pointerEvents: 'none' }}>SAVE DECK</Button></span>
                            </OverlayTrigger>
                        ) : (
                            <Button variant="outline-info" className="text-nowrap fw-bold terminal-font" onClick={handleSave} disabled={isImporting}>SAVE DECK</Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}