import React from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import "../mdstyles.css"; // Reuse the master duel stylesheet

export default function About() {
    // 1. Data Structure (Keep your actual text out of the JSX)
    const profileData = {
        userName: "ErreGeTe", // Your title
        profileIcon: "/images/YCS_Orlando.JPG", // <--- PLACEHOLDER: Use a YGO avatar
        aboutText: "A developer specializing in Full Stack architecture (.NET 9 / React / Azure) and microservice orchestration. I approach code with the same strategic mindset as a Tier 0 Duelist.",
        
        accomplishments: [
            { icon: "🏆", text: "Deployed multi-container apps to Azure ACA" },
            { icon: "📡", text: "Integrated real-time SignalR Global Hub" },
            { icon: "🛡️", text: "Architected BCrypt/JWT Identity System" },
            { icon: "💾", text: "Optimized Cosmos DB Data Persistence" }
        ],
        
        hobbies: [
            "TCG Strategy & Deck Optimization",
            "Azure Cloud Engineering",
            "Cybersecurity & IAM Architecture",
            "Open Source Contribution"
        ],
        
        specialtyCards: [
            { name: ".NET 9", level: "Lv 9 / Divine" },
            { name: "React", level: "Lv 8 / Light" },
            { name: "CosmosDB", level: "Lv 8 / Dark" }
        ]
    };

    return (
        // 2. Main Background with the 'Teal Grid' effect
        <div className="md-theme-bg p-5" style={{ minHeight: "100vh" }}>
            <Container>
                {/* --- HEADER BLOCK --- */}
                <Row className="mb-5 align-items-center terminal-header-block p-4">
                    <Col xs={12} md={3} className="text-center">
                        <img 
                            src={profileData.profileIcon} 
                            alt="Avatar" 
                            className="profile-avatar-circle md-border-info"
                        />
                    </Col>
                    <Col xs={12} md={9}>
                        <h1 className="md-text-glitch text-info">{profileData.userName}</h1>
                        <h4 className="text-muted fw-bold">SYSTEM_ARCHITECT // FULL_STACK_DEV</h4>
                        <div className="md-divider-purple mt-3 mb-3"></div>
                        <p className="md-text-terminal lead">{profileData.aboutText}</p>
                    </Col>
                </Row>

                {/* --- DATA PANELS --- */}
                <Row>
                    {/* LEFT COLUMN: Accomplishments & Hobbies */}
                    <Col md={8}>
                        {/* Accomplishments Panel */}
                        <Card className="login-terminal-panel mb-4">
                            <Card.Header className="terminal-header d-flex align-items-center">
                                <span className="terminal-dot red me-2"></span>
                                <span className="terminal-dot yellow me-2"></span>
                                <span className="terminal-dot green me-2"></span>
                                <span className="terminal-title text-hot-orange">CHRONICLE_OF_ACCOMPLISHMENTS</span>
                            </Card.Header>
                            <Card.Body className="md-input-field text-hot-orange">
                                {profileData.accomplishments.map((acc, index) => (
                                    <div key={index} className="p-3 border-bottom border-dark d-flex align-items-center">
                                        <span className="fs-3 me-3">{acc.icon}</span>
                                        <span className="md-text-glitch fs-5 text-info">{acc.text}</span>
                                    </div>
                                ))}
                            </Card.Body>
                        </Card>

                        {/* Hobbies Panel */}
                        <Card className="login-terminal-panel">
                            <Card.Header className="terminal-header">
                                <span className="terminal-title text-hot-orange">RECREATIONAL_PROTOCOL</span>
                            </Card.Header>
                            <Card.Body className="md-input-field text-white">
                                <div className="d-flex flex-wrap gap-2">
                                    {profileData.hobbies.map((hobby, index) => (
                                        <Badge key={index} bg="dark" className="p-3 md-border-purple fs-6">
                                            {hobby}
                                        </Badge>
                                    ))}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* RIGHT COLUMN: Specialty Cards (Representing your Stack) */}
                    <Col md={4}>
                        <Card className="login-terminal-panel md-border-purple text-center">
                            <Card.Header className="terminal-header bg-purple-dark">
                                <span className="terminal-title text-purple">ACTIVE_STACK_OVERVIEW</span>
                            </Card.Header>
                            <Card.Body className="md-input-field p-4">
                                {profileData.specialtyCards.map((card, index) => (
                                    <div key={index} className="p-3 mb-3 md-border-info md-theme-bg rounded">
                                        <h5 className="text-info md-text-glitch">{card.name}</h5>
                                        <small className="text-muted">{card.level}</small>
                                    </div>
                                ))}
                                <Badge bg="dark" className="w-100 p-3 mt-4 md-border-info">T1_ARCHITECT</Badge>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}