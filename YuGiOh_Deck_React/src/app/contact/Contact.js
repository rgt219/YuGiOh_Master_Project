'use client'; // 👈 Added for React-Bootstrap component hydration & image error fallback

import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import '@/mdstyles.css';

export default function Contact() {
    const contactInfo = {
        name: "Ryan Thomas",
        title: "FULL-STACK DEVELOPER",
        attribute: "",
        level: 7,
        email: "rgt@erregeteygo.com",
        resumeUrl: "/resume/erregeteresume.pdf", 
        atk: 3000,
        def: 2500,
        avatarUrl: "/images/headshot.jpg" // ⚡ Next.js resolves static images from root /public/
    };

    return (
        <div className="md-theme-bg min-vh-100 py-5 mt-5">
            <Container className="d-flex justify-content-center">
                {/* --- MASTER DUEL SECRET RARE CONTACT CARD --- */}
                <Card 
                    style={{ 
                        maxWidth: '52rem', 
                        backgroundColor: 'rgba(8, 12, 20, 0.98)', 
                        backdropFilter: 'blur(10px)' 
                    }} 
                    text="white" 
                    className="border-info shadow-lg p-4 md-panel"
                >
                    <Card.Header className="bg-transparent border-bottom border-info border-opacity-50 pb-3 mb-3">
                        <div className="d-flex justify-content-between align-items-center">
                            <h3 className="m-0 text-info terminal-font fw-bold" style={{ letterSpacing: '2px' }}>
                                DUELIST PROFILE
                            </h3>
                        </div>
                    </Card.Header>

                    <Card.Body>
                        <Row className="g-4 align-items-center">
                            {/* --- Left Column: Duelist / Card Image --- */}
                            <Col md={5} className="text-center">
                                <div className="position-relative d-inline-block">
                                    <img 
                                        src={contactInfo.avatarUrl} 
                                        alt={contactInfo.name} 
                                        className="img-fluid rounded border border-info border-opacity-50"
                                        style={{ 
                                            maxHeight: '380px', 
                                            objectFit: 'cover',
                                            boxShadow: '0 0 25px rgba(0, 240, 255, 0.3)' 
                                        }}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://images.ygoprodeck.com/images/cards/back_high.jpg';
                                        }}
                                    />
                                </div>
                            </Col>

                            {/* --- Right Column: Yu-Gi-Oh! Card Details & Effect Text --- */}
                            <Col md={7}>
                                {/* Card Title */}
                                <h3 className="fw-bold mb-2 text-white" style={{ fontFamily: "Cascadia Mono, monospace", letterSpacing: '1px' }}>
                                    {contactInfo.name}
                                </h3>

                                {/* Badges & Level */}
                                <div className="d-flex align-items-center mb-3 flex-wrap gap-2">
                                    <Badge bg="dark" className="border border-secondary text-uppercase fs-7">
                                        {contactInfo.title}
                                    </Badge>
                                    <Badge bg="warning" className="text-dark text-uppercase fs-7 fw-bold ms-auto">
                                        {contactInfo.attribute}
                                    </Badge>
                                </div>

                                <div className="mb-3 text-start">
                                    <span className="small text-white-50 fw-bold me-2">Level / Rank:</span>
                                    <span className="text-info fw-bold">{contactInfo.level} ★★★★★★★</span>
                                </div>

                                {/* ATK / DEF Stat Bar */}
                                <div className="d-flex align-items-center px-3 py-2 mb-3 rounded" style={{ backgroundColor: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                                    <span className="small text-white-50 fw-bold me-2">ATK /</span>
                                    <span className="text-white fw-bold me-4">{contactInfo.atk}</span>
                                    
                                    <span className="small text-white-50 fw-bold me-2">DEF /</span>
                                    <span className="text-white fw-bold me-auto">{contactInfo.def}</span>

                                    <span className="small text-info terminal-font">STATUS: ACTIVE</span>
                                </div>

                                {/* Card Effect / Contact Details Box */}
                                <div className="text-start p-3 rounded mb-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                                    <h6 className="small text-info fw-bold border-bottom border-info border-opacity-25 pb-2 mb-2">
                                        Card Effect / Description
                                    </h6>
                                    <p className="text-white-50 mb-2" style={{ fontSize: '0.88rem', lineHeight: '1.5' }}>
                                        When this card is Normal Summoned to your browser: You can target 1 [Email] below to initiate direct communication.
                                    </p>
                                    <hr className="border-secondary opacity-25 my-2" />
                                    <div className="small text-white">
                                        <div className="mb-1">
                                            <strong className="text-info">EMAIL:</strong> {contactInfo.email}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="d-flex flex-row flex-wrap gap-2 w-100">
                                    <Button 
                                        href={`mailto:${contactInfo.email}`} 
                                        variant="info"
                                        className="flex-fill fw-bold text-dark terminal-font text-nowrap py-2"
                                    >
                                        EMAIL
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
}