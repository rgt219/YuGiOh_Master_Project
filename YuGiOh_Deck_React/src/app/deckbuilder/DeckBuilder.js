'use client'; 

import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Modal } from 'react-bootstrap';
import { 
    addCardToDeck, 
    removeCardFromDeck, 
    updateDeckName, 
    importYdkDeck,
    clearDeck 
} from "@/store/deckSlice";

import CardApi from "./CardApi";
import CustomDeck from "./CustomDeck";
import AiCardSuggester from "@/components/AiCardSuggester";
import DeckHeader from "@/components/DeckHeader";
import CardInspector from "@/components/CardInspector";
import { useDeckBuilder } from "@/hooks/useDeckBuilder";
import '@/mdstyles.css';

export default function DeckBuilder() {
    const {
        mainDeck, extraDeck, sideDeck, deckName, dispatch,
        showSaveModal, setShowSaveModal, showAiModal, setShowAiModal,
        isImporting, inspectedCard, setInspectedCard, pinnedCard, setPinnedCard,
        fileInputRef, user, handlePinCard, handleImportYDK, handleExportYDK,
        handleClearDeck, handleAddCard, handleDeleteCard, handleSave
    } = useDeckBuilder();

    return (
        <div className="md-theme-bg min-vh-100 py-5 mt-5" style={{ fontFamily: "'Cascadia Mono', monospace" }}>
            <style>{`
                * { font-family: 'Cascadia Mono', monospace !important; }
                .terminal-font { font-family: 'Cascadia Mono', monospace !important; }
            `}</style>
            
            <input type="file" accept=".ydk" ref={fileInputRef} style={{ display: "none" }} onChange={handleImportYDK} />

            <Container fluid className="px-2 px-xxl-4">
                <DeckHeader 
                    deckName={deckName} dispatch={dispatch} updateDeckName={updateDeckName}
                    isImporting={isImporting} fileInputRef={fileInputRef} handleImportYDK={handleImportYDK}
                    handleExportYDK={handleExportYDK} handleClearDeck={handleClearDeck} user={user}
                    handleSave={handleSave} setShowAiModal={setShowAiModal}
                />

                {/* --- STANDARD / LAPTOP LAYOUT --- */}
                <div className="d-xxl-none">
                    <CardInspector 
                        pinnedCard={pinnedCard} setPinnedCard={setPinnedCard}
                        inspectedCard={inspectedCard} mainDeck={mainDeck}
                        extraDeck={extraDeck} handlePinCard={handlePinCard}
                    />

                    <Row className="g-4 mt-2">
                        <Col lg={7}>
                            <CustomDeck 
                                mainDeck={mainDeck} extraDeck={extraDeck} sideDeck={sideDeck} onDeleteCard={handleDeleteCard}
                                onInspectCard={(card) => { if (!pinnedCard) setInspectedCard(card); }}
                                onPinCard={handlePinCard}
                            />
                        </Col>
                        <Col lg={5}>
                            <div style={{ 
                                position: 'sticky', 
                                top: '100px', 
                                maxHeight: 'calc(100vh - 120px)', 
                                overflowY: 'auto', 
                                overflowX: 'hidden',
                                zIndex: 10 
                            }}>
                                <CardApi 
                                    onAddCard={handleAddCard} onDeleteCard={handleDeleteCard}
                                    cardList={[...mainDeck, ...extraDeck, ...sideDeck]}
                                    onInspectCard={(card) => { if (!pinnedCard) setInspectedCard(card); }}
                                    onPinCard={handlePinCard}
                                />
                            </div>
                        </Col>
                    </Row>
                </div>

                {/* --- ULTRAWIDE 2-ROW LAYOUT --- */}
                <div className="d-none d-xxl-block">
                    {/* ROW 1: Inspector & Database Search (Set to align-items-stretch) */}
                    <Row className="g-4 mb-4 align-items-stretch">
                        <Col xxl={3}>
                            <div style={{ position: 'sticky', top: '100px', zIndex: 10 }}>
                                <CardInspector 
                                    pinnedCard={pinnedCard} setPinnedCard={setPinnedCard}
                                    inspectedCard={inspectedCard} mainDeck={mainDeck}
                                    extraDeck={extraDeck} handlePinCard={handlePinCard}
                                />
                            </div>
                        </Col>

                        <Col xxl={9}>
                            <CardApi 
                                onAddCard={handleAddCard} onDeleteCard={handleDeleteCard}
                                cardList={[...mainDeck, ...extraDeck, ...sideDeck]}
                                onInspectCard={(card) => { if (!pinnedCard) setInspectedCard(card); }}
                                onPinCard={handlePinCard}
                            />
                        </Col>
                    </Row>

                    {/* ROW 2: The Deck Sections */}
                    <Row className="g-4">
                        <Col xxl={12}>
                            <CustomDeck 
                                mainDeck={mainDeck} extraDeck={extraDeck} sideDeck={sideDeck} onDeleteCard={handleDeleteCard}
                                onInspectCard={(card) => { if (!pinnedCard) setInspectedCard(card); }}
                                onPinCard={handlePinCard}
                            />
                        </Col>
                    </Row>
                </div>
            </Container>

            <AiCardSuggester 
                show={showAiModal} onHide={() => setShowAiModal(false)} 
                mainDeck={mainDeck} extraDeck={extraDeck} sideDeck={sideDeck} onAddCard={handleAddCard} 
                onAutoBuildDeck={({ main, extra, name }) => {
                    dispatch(importYdkDeck({ main, extra, name }));
                    setShowAiModal(false);
                }}
            />

            <Modal show={showSaveModal} onHide={() => setShowSaveModal(false)} centered contentClassName="md-modal">
                <Modal.Header closeButton className="border-info bg-dark">
                    <Modal.Title className="text-info terminal-font">SYSTEM_NOTIFICATION</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-dark text-white text-center py-4">
                    <h5 className="terminal-font">DECK_SAVED_SUCCESSFULLY</h5>
                    <p className="text-muted small">Archived to erregeteygo cloud services.</p>
                </Modal.Body>
            </Modal>
        </div>
    );
}