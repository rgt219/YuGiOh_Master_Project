import React, { useState } from 'react';
import { Container, Row, Col, Button, ProgressBar } from 'react-bootstrap';
import { FaStepForward, FaStepBackward, FaRobot, FaInfoCircle } from 'react-icons/fa';
import '../mdstyles.css';

export default function ComboPlayer({ comboData }) {
    const [currentStep, setCurrentStep] = useState(0);
    const totalSteps = comboData.steps.length;

    // --- BOARD STATE CALCULATOR ---
    // This function looks at all steps UP TO the current index 
    // and determines which cards are currently on the field.
    const getBoardState = () => {
        const board = {}; // Format: { MMZ_1: { cardId: 'astellar', isNew: false }, ... }

        for (let i = 0; i <= currentStep; i++) {
            const s = comboData.steps[i];
            
            // Logic: If a card is summoned to a zone
            if (s.zone && s.zone !== "NONE") {
                board[s.zone] = { 
                    cardId: s.cardId, 
                    isNew: i === currentStep // Only the MOST RECENT step gets the animation
                };
            }

            // Logic: If a step mentions removing cards (like Synchro or Cost)
            // You can add a 'removesZones' array to your JSON steps later 
            // e.g., removesZones: ["MMZ_1", "MMZ_2"]
            if (s.removesZones) {
                s.removesZones.forEach(zone => delete board[zone]);
            }
        }
        return board;
    };

    const boardState = getBoardState();
    const step = comboData.steps[currentStep];

    return (
        <Container className="mt-5 pb-5">
            <div className="md-panel border-info bg-dark shadow-lg overflow-hidden">
                
                {/* --- HEADER --- */}
                <div className="p-4 border-bottom border-secondary bg-black">
                    <Row className="align-items-center">
                        <Col>
                            <h2 className="text-info md-text-glitch mb-0">{comboData.title}</h2>
                            <ProgressBar 
                                now={((currentStep + 1) / totalSteps) * 100} 
                                variant="info" 
                                className="mt-2" 
                                style={{height: '6px'}}
                            />
                        </Col>
                        <Col xs="auto" className="text-info fw-bold">
                            STEP_{currentStep + 1}/{totalSteps}
                        </Col>
                    </Row>
                </div>

                {/* --- THE VIRTUAL FIELD (PERSISTENT) --- */}
                <div className="md-field-viewport position-relative">
                    <div className="md-field-grid">
                        {['EMZ_1', 'MMZ_1', 'MMZ_2', 'MMZ_3', 'MMZ_4', 'MMZ_5', 'STZ_1', 'STZ_2', 'STZ_3', 'FSZ'].map((zoneId) => (
                            <div key={zoneId} className={`field-slot ${zoneId}`}>
                                {boardState[zoneId] && (
                                    <div 
                                        className={boardState[zoneId].isNew ? "card-animation-wrapper" : ""} 
                                        key={`${zoneId}-${boardState[zoneId].cardId}-${boardState[zoneId].isNew}`}
                                    >
                                        <img 
                                            src={`https://images.ygoprodeck.com/images/cards/${encodeURIComponent(boardState[zoneId].cardId)}.jpg`} 
                                            className="sim-card-active" 
                                            alt="Card"
                                        />
                                        {boardState[zoneId].isNew && <div className="summon-glow"></div>}
                                    </div>
                                )}
                            </div>
                        ))}
                        <img src="/images/field_bg.png" className="field-base-img" alt="Field" />
                    </div>
                </div>

                {/* --- AI AGENT FOOTER --- */}
                <div className="ai-footer-agent p-4 bg-black border-top border-info">
                    <Row>
                        <Col md={3} className="text-center border-end border-secondary">
                            <FaRobot className="text-purple mb-2" style={{fontSize: '2.5rem'}} />
                            <div className="text-purple small fw-bold">STRATEGIST_v1.0</div>
                        </Col>
                        <Col md={6} className="px-4">
                            <h6 className="text-info mb-2"><FaInfoCircle className="me-2"/>ACTION:</h6>
                            <p className="fw-bold text-white mb-2">{step.instruction}</p>
                            <p className="text-muted italic small">"{step.aiCommentary}"</p>
                        </Col>
                        <Col md={3} className="d-flex align-items-center justify-content-center gap-2">
                            <Button variant="outline-info" onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}>
                                <FaStepBackward />
                            </Button>
                            <Button variant="info" onClick={() => setCurrentStep(Math.min(totalSteps - 1, currentStep + 1))}>
                                <FaStepForward />
                            </Button>
                        </Col>
                    </Row>
                </div>
            </div>
        </Container>
    );
}