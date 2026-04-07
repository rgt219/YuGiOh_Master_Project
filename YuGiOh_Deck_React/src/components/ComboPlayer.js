import React, { useState } from 'react';
import { Container, Row, Col, Button, ProgressBar } from 'react-bootstrap';
import { FaStepForward, FaStepBackward, FaRobot, FaInfoCircle } from 'react-icons/fa';
import '../mdstyles.css';

export default function ComboPlayer({ comboData }) {
    const [currentStep, setCurrentStep] = useState(0);
    const totalSteps = comboData.steps.length;

    // --- MASTER DUEL ZONE DEFINITIONS ---
    const ALL_ZONES = [
        'EMZ_L', 'EMZ_R', 
        'MMZ_1', 'MMZ_2', 'MMZ_3', 'MMZ_4', 'MMZ_5', 
        'STZ_1', 'STZ_2', 'STZ_3', 'STZ_4', 'STZ_5', 
        'FSZ', 'GY', 'BANISH'
    ];

    // --- BOARD STATE CALCULATOR ---
    // --- BOARD STATE CALCULATOR ---
    const getBoardState = () => {
        const board = {};

        for (let i = 0; i <= currentStep; i++) {
            const s = comboData.steps[i];
            
            // 1. FIRST: Handle Removals
            if (s.removesZones) {
                s.removesZones.forEach(zone => {
                    delete board[zone];
                });
            }

            // 2. SECOND: Primary Addition
            if (s.zone && s.zone !== "NONE") {
                board[s.zone] = { 
                    cardId: s.cardId, 
                    isNew: i === currentStep 
                };
            }

            // 3. THIRD: Handle Extra Summons (New Logic)
            if (s.extraSummons) {
                s.extraSummons.forEach(extra => {
                    board[extra.zone] = {
                        cardId: extra.cardId,
                        isNew: i === currentStep
                    };
                });
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
                            <h2 className="text-info md-text-glitch mb-0 text-uppercase">{comboData.title}</h2>
                            <ProgressBar 
                                now={((currentStep + 1) / totalSteps) * 100} 
                                variant="info" 
                                className="mt-2" 
                                style={{height: '6px', borderRadius: '0'}}
                            />
                        </Col>
                        <Col xs="auto" className="text-info fw-bold" style={{fontFamily: 'Cascadia Mono'}}>
                            STEP_{String(currentStep + 1).padStart(2, '0')}/{totalSteps}
                        </Col>
                    </Row>
                </div>

                {/* --- FULL VIRTUAL FIELD --- */}
                <div className="md-field-viewport position-relative">
                    <div className="md-field-grid">
                        {ALL_ZONES.map((zoneId) => {
                            const activeCard = boardState[zoneId];
                            return (
                                <div key={zoneId} className={`field-slot ${zoneId}`}>
                                    {activeCard ? (
                                        <div 
                                            className={activeCard.isNew ? "card-animation-wrapper" : "card-static"} 
                                            key={`${zoneId}-${activeCard.cardId}-${activeCard.isNew}`}
                                        >
                                            <img 
                                                src={`https://images.ygoprodeck.com/images/cards/${encodeURIComponent(activeCard.cardId)}.jpg`} 
                                                className="sim-card-active" 
                                                alt="Card"
                                                onError={(e) => { e.target.src = "https://images.ygoprodeck.com/images/cards/46986414.jpg" }}
                                            />
                                            {activeCard.isNew && <div className="summon-glow"></div>}
                                            
                                            {/* Labels for special zones */}
                                            {(zoneId === 'GY' || zoneId === 'BANISH') && (
                                                <div className="zone-label-overlay">{zoneId}</div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="empty-zone-indicator">
                                            <span className="zone-id-tag">{zoneId}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        
                        {/* Field Background Overlay */}
                        <div className="field-grid-lines"></div>
                        <img src="/images/field_bg.png" className="field-base-img" alt="Field" />
                    </div>
                </div>

                {/* --- AI AGENT FOOTER --- */}
                <div className="ai-footer-agent p-4 bg-black border-top border-info">
                    <Row className="align-items-center">
                        <Col md={2} className="text-center border-end border-secondary py-2">
                            <FaRobot className="text-purple mb-2" style={{fontSize: '2.5rem'}} />
                            <div className="text-purple small fw-bold tracking-widest">DUEL_AI</div>
                            <div className="text-success x-small mt-1 animate-pulse">● ANALYZING</div>
                        </Col>
                        
                        <Col md={7} className="px-4">
                            <div className="md-text-terminal">
                                <h6 className="text-info mb-1" style={{fontSize: '0.8rem'}}><FaInfoCircle className="me-2"/>CURRENT_INPUT:</h6>
                                <p className="fw-bold text-white mb-2" style={{fontSize: '1.1rem'}}>{step.instruction}</p>
                                <div className="text-muted italic" style={{borderLeft: '2px solid #6f42c1', paddingLeft: '10px'}}>
                                    "{step.aiCommentary}"
                                </div>
                            </div>
                        </Col>

                        <Col md={3} className="d-flex align-items-center justify-content-center gap-3">
                            <Button 
                                variant="outline-info" 
                                className="md-btn-hex"
                                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} 
                                disabled={currentStep === 0}
                            >
                                <FaStepBackward />
                            </Button>
                            <Button 
                                variant="info" 
                                className="md-btn-hex active-btn"
                                onClick={() => setCurrentStep(Math.min(totalSteps - 1, currentStep + 1))} 
                                disabled={currentStep === totalSteps - 1}
                            >
                                <FaStepForward />
                            </Button>
                        </Col>
                    </Row>
                </div>
            </div>
        </Container>
    );
}