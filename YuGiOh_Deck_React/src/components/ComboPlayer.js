import React, { useState } from 'react';
import { Container, Row, Col, Button, ProgressBar } from 'react-bootstrap';
import { FaPlay, FaStepForward, FaStepBackward, FaRobot } from 'react-icons/fa';
import '../mdstyles.css';

export default function ComboPlayer({ comboData }) {
    const [currentStep, setCurrentStep] = useState(0);
    const totalSteps = comboData.steps.length;

    const nextStep = () => {
        if (currentStep < totalSteps - 1) setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        if (currentStep > 0) setCurrentStep(currentStep - 1);
    };

    const step = comboData.steps[currentStep];

    return (
        <Container className="mt-5">
            <div className="md-panel p-4 border-info bg-dark">
                {/* --- HEADER & PROGRESS --- */}
                <Row className="mb-4 align-items-center">
                    <Col>
                        <h2 className="text-info md-text-glitch">{comboData.title}</h2>
                        <ProgressBar 
                            now={((currentStep + 1) / totalSteps) * 100} 
                            variant="info" 
                            className="md-progress-bar mt-2" 
                        />
                    </Col>
                    <Col xs="auto">
                        <span className="text-muted fw-bold">STEP {currentStep + 1} / {totalSteps}</span>
                    </Col>
                </Row>

                <Row>
                    {/* --- THE VIRTUAL FIELD (Visual Simulation) --- */}
                    <Col lg={8} className="position-relative">
                        <div className="md-field-grid">
                            {/* Placeholder for your Master Duel Grid Layout */}
                            <div className="field-zone-overlay">
                                <div className={`highlight-zone ${step.zone}`}>
                                    <img 
                                        src={`/images/cards/${step.cardId}.jpg`} 
                                        className="sim-card-active" 
                                        alt="Active Card"
                                    />
                                </div>
                            </div>
                            <img src="/images/field_bg.png" className="w-100 opacity-50" alt="Field" />
                        </div>
                    </Col>

                    {/* --- AI AGENT SIDEBAR (The "Narrator") --- */}
                    <Col lg={4}>
                        <div className="ai-narrative-box p-3 md-border-purple h-100">
                            <div className="d-flex align-items-center mb-3">
                                <FaRobot className="text-purple me-2 fs-4" />
                                <span className="fw-bold text-white">DUEL_STRATEGIST_v1.0</span>
                            </div>
                            <div className="md-text-terminal small mb-4">
                                <p className="text-info fw-bold">{step.instruction}</p>
                                <hr className="border-secondary" />
                                <p className="text-light italic">"{step.aiCommentary}"</p>
                            </div>
                            
                            {/* CONTROLS */}
                            <div className="d-flex gap-2 justify-content-center mt-auto">
                                <Button variant="outline-info" onClick={prevStep} disabled={currentStep === 0}>
                                    <FaStepBackward />
                                </Button>
                                <Button variant="info" onClick={nextStep} disabled={currentStep === totalSteps - 1}>
                                    {currentStep === totalSteps - 1 ? "FINISH" : <FaStepForward />}
                                </Button>
                            </div>
                        </div>
                    </Col>
                </Row>
            </div>
        </Container>
    );
}