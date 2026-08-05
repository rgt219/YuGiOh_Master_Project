import React from 'react';
import { Container, Card, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import '../mdstyles.css';

export default function ComingSoon({ featureName = "THIS FEATURE" }) {
    // Master Duel Cyber-Laser Frame Styling
    const masterDuelLaserCardStyle = {
        background: 'radial-gradient(circle at 50% 0%, rgba(31, 18, 53, 0.95) 0%, rgba(10, 13, 20, 0.98) 100%)',
        border: '1px solid #00f2ff',
        boxShadow: '0 0 25px rgba(0, 242, 255, 0.25), inset 0 0 15px rgba(0, 242, 255, 0.08)',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
        maxWidth: '850px'
    };

    const textStyleCyan = { 
        color: '#00f2ff', 
        textShadow: '0 0 12px rgba(0,242,255,0.45)' 
    };

    return (
        <div style={{ backgroundColor: '#0a0d14', minHeight: "85vh" }} className="d-flex align-items-center justify-content-center py-5">
            <Container className="px-3">
                <Card className="mx-auto text-center p-4 p-md-5 text-white shadow-lg border-0" style={masterDuelLaserCardStyle}>
                    <Card.Body>
                        {/* Status Badges */}
                        <div className="d-flex justify-content-center gap-2 mb-3 flex-wrap">
                            <Badge bg="dark" className="border border-info text-info terminal-font px-3 py-2">
                                SPELL CARD // FUTURE_UPDATE
                            </Badge>
                            <Badge bg="dark" className="border border-warning text-warning terminal-font px-3 py-2">
                                STATUS: UNDER CONSTRUCTION
                            </Badge>
                        </div>

                        {/* Master Duel Holographic Card Back Preview */}
                        <div className="my-4 position-relative d-inline-block">
                            <img 
                                src="https://images.ygoprodeck.com/images/cards/back_high.jpg" 
                                alt="Yu-Gi-Oh Card Back" 
                                className="img-fluid rounded border border-info border-opacity-50 shadow-lg"
                                style={{ 
                                    maxHeight: '220px', 
                                    objectFit: 'contain',
                                    boxShadow: '0 0 25px rgba(0, 242, 255, 0.3)' 
                                }}
                            />
                            
                        </div>

                        {/* Dynamic Title & Cyberse Flavor Text */}
                        <h2 className="display-6 fw-bold terminal-font mb-2" style={textStyleCyan}>
                            {featureName.toUpperCase()} IS COMING SOON!
                        </h2>
                        
                        <p className="lead text-white-50 mx-auto mb-4 fs-6" style={{ maxWidth: '580px', lineHeight: '1.6' }}>
                            Our Cyberse engineers are currently compiling and deploying this module to Azure serverless containers. Check back soon for full integration!
                        </p>

                        <hr style={{ borderColor: '#00f2ff', opacity: 0.25 }} className="my-4" />

                        {/* Call To Action Buttons */}
                        <div className="d-flex justify-content-center gap-3 flex-wrap">
                            <Link 
                                to="/" 
                                className="btn btn-cyber-outline btn-lg fw-bold px-4 shadow-sm"
                            >
                                Return to Home
                            </Link>
                            <Link to="/deckbuilder" className="btn btn-outline-light btn-lg px-4">
                                Open Deck Builder
                            </Link>
                        </div>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
}