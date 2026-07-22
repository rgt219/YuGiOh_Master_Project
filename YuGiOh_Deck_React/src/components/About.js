import React from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import "../mdstyles.css"; // Reuse the master duel stylesheet

export default function About() {
    const textStyleMutedPastel = { color: '#a69cb5' }; 

    const textStyleSoftCyan = { color: '#8cdce6' };
    // 1. Unified Cyber-Duelist Profile Data Structure [cite: 1]
    const profileData = {
        userName: "ErreGeTe", 
        realName: "Ryan Thomas",
        profileIcon: "/images/YCS_Orlando.JPG", 
        aboutText: "A Results-driven Software Engineer with over 6 years of experience specializing in scalable architectures, real-time microservices, and mission-critical cloud deployments. I approach complex system design with the same strategic precision as a Tier 0 Duelist.",
        
        education: {
            degree: "Bachelor of Science - Computer Engineering",
            institution: "Florida State University",
            icon: "🎓"
        },

        skillsDeck: [
            { category: "CORE_LANGUAGES", items: ["C# (.NET 9)", "C++", "Java", "Python", "JavaScript", "SQL", "PowerShell"] },
            { category: "ENGINES_&_FRAMEWORKS", items: ["React", ".NET Core", "SpringBoot", "Qt", "VxWorks", "Unreal Engine 5", "Unity"] },
            { category: "INFRASTRUCTURE_&_MESSAGING", items: ["Azure", "AWS", "Docker", "Kafka", "RabbitMQ", "Linux (Red Hat 9)", "Git", "Jenkins", "Bamboo", "TCP/IP"] }
        ],

        deploymentHistory: [
            {
                company: "Northrop Grumman",
                role: "Software Engineer",
                duration: "Sep 2023 - Present",
                location: "Orlando, FL",
                summary: "Development & design of E-2D Advanced Hawkeye aircraft, PCMS, and WRMS software systems.",
                highlights: [
                    "Designed scalable, readable, object-oriented code in .NET/Core C#, C++, and Java within Red Hat 9 OS environments.",
                    "Programmed with React to build full-bodied REST APIs for real-time displaying of critical wireless signal data.",
                    "Reduced query search time of signal data in SQL Server by 4 minutes using table join consolidation and query optimization.",
                    "Incorporated Kafka & RabbitMQ for signal topic partitioning, streamlining message orchestration across independent subsystems.",
                    "Utilized Qt framework for building reliable computer display layouts mapped directly to aircraft hardware architecture.",
                    "Integrated multi-threading paradigms and robust unit tests into each subsystem to guarantee software runtime efficiency."
                ]
            },
            {
                company: "Coleman Aerospace",
                role: "Software Engineer",
                duration: "Feb 2019 - August 2023",
                location: "Orlando, FL",
                summary: "Development and distribution of propulsion and power systems for launch vehicles, satellites, and missile defense configurations.",
                highlights: [
                    "Built, compiled, and deployed C/C++ tactical simulation code across VxWorks and RedHat Linux OS platforms.",
                    "Developed technical specifications and comprehensive design documentation associated with avionics test equipment software.",
                    "Implemented localized RedHat Linux updates to align legacy lab support equipment with modern hardware infrastructure.",
                    "Enforced rigid internal company coding standards for highly readable and scalable object-oriented C++ codebases."
                ]
            }
        ],

        platformSpecs: [
            "Architected a multi-service Yu-Gi-Oh! Deck Builder platform using a React frontend and an asynchronous .NET API backend.",
            "Engineered an event-driven data pipeline via Azure Event Hubs (Kafka API) to decouple data ingestion and drive background synergy calculations.",
            "Executed a database migration from MongoDB to an Azure Cosmos DB vCore cluster, handling data hydration and secure networking policies.",
            "Managed containerized infrastructure within Azure Container Apps utilizing custom domain routing for erregeteygo.com.",
            "Implemented CI/CD automation using GitHub Actions pipelines to streamline builds and deployments to Azure Container Registry."
        ]
    };

    // Master Duel Laser styles to force override default white card issues
    const masterDuelLaserCardStyle = {
        background: 'linear-gradient(135deg, #150d22 0%, #1f1235 100%)',
        border: '1px solid #00e5ff',
        boxShadow: '0 0 15px rgba(0, 229, 255, 0.25), inset 0 0 10px rgba(0, 229, 255, 0.1)',
        borderRadius: '4px',
        overflow: 'hidden'
    };

    // Explicitly overrides and resets any leaking flex layouts or column counts from mdstyles.css
    const forceVerticalListStyle = {
        display: 'block',
        columnCount: 'auto',
        columns: 'auto',
        flexDirection: 'column',
        width: '100%',
        paddingLeft: '1.25rem',
        margin: 0
    };

    const forceVerticalLiStyle = {
        display: 'list-item',
        width: '100%',
        float: 'none',
        whiteSpace: 'normal'
    };

    const textStyleCyan = { color: '#00e5ff' };
    const textStylePurple = { color: '#bd72ff' };

    return (
        <div style={{ backgroundColor: '#0b0614', minHeight: "100vh" }} className="p-4 p-md-5">
            <Container fluid="xl">
                
                {/* --- MAIN HEADER PROFILE BLOCK --- */}
                <Row className="mb-5 align-items-center p-4 rounded" style={masterDuelLaserCardStyle}>
                    <Col xs={12} md={3} className="text-center mb-3 mb-md-0">
                        <img 
                            src={profileData.profileIcon} 
                            alt="Avatar" 
                            className="img-fluid border border-2"
                            style={{ borderColor: '#00e5ff', width: '300px', height: '300px', objectFit: 'cover' }}
                        />
                    </Col>
                    <Col xs={12} md={9}>
                        <h1 className="fw-bold md-text-glitch" style={textStyleCyan}>{profileData.userName}</h1>
                        <h5 className="fw-bold tracking-wider" style={textStylePurple}>SYSTEM_ARCHITECT // {profileData.realName.toUpperCase()}</h5>
                        <hr style={{ backgroundColor: '#00e5ff', height: '2px', opacity: 0.5 }} />
                        <p className="text-white opacity-90 lead fs-6">{profileData.aboutText}</p>
                        
                        {/* Education Node */}
                        <div className="mt-3 d-flex flex-wrap align-items-center text-white small">
                            <span className="fs-5 me-2">{profileData.education.icon}</span>
                            <span className="fw-semibold" style={textStylePurple}>{profileData.education.degree}</span>
                            <span className="mx-2 text-muted d-none d-sm-inline">|</span>
                            <span style={textStyleSoftCyan}>{profileData.education.institution}</span>
                        </div>
                    </Col>
                </Row>

                {/* --- 2-COLUMN MACRO MATRIX GRID --- */}
                <Row className="g-4">
                    
                    {/* LEFT SIDE COLUMN (Width: 4/12) -> Inventory Recipes & Platform Specifications */}
                    <Col lg={4} xs={12}>
                        
                        {/* TECH DECK RECIPE */}
                        <Card className="mb-4" style={masterDuelLaserCardStyle}>
                            <Card.Header className="border-bottom border-dark py-3" style={{ background: 'rgba(0, 0, 0, 0.2)' }}>
                                <span className="fw-bold tracking-widest" style={textStylePurple}>TECH_DECK_RECIPE</span>
                            </Card.Header>
                            <Card.Body>
                                {profileData.skillsDeck.map((deck, idx) => (
                                    <div key={idx} className="mb-3">
                                        <small className="d-block mb-2 fw-bold text text-uppercase" style={{ fontSize: '0.75rem', color: '#a69cb5' }}>
                                            // {deck.category}
                                        </small>
                                        <div className="d-flex flex-wrap gap-1">
                                            {deck.items.map((skill, i) => (
                                                <Badge key={i} bg="transparent" className="p-2 border fs-7" style={{ borderColor: 'rgba(0, 229, 255, 0.4)', color: '#00e5ff' }}>
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </Card.Body>
                        </Card>

                        {/* PLATFORM SPECIFICATIONS */}
                        <Card style={masterDuelLaserCardStyle}>
                            <Card.Header className="border-bottom border-dark py-3" style={{ background: 'rgba(0, 0, 0, 0.2)' }}>
                                <span className="fw-bold tracking-widest" style={textStyleCyan}>PLATFORM_SPECIFICATIONS</span>
                            </Card.Header>
                            <Card.Body className="text-white">
                                <ul style={forceVerticalListStyle}>
                                    {profileData.platformSpecs.map((spec, index) => (
                                        <li 
                                            key={index} 
                                            className="mb-3 pb-2 border-bottom border-dark border-opacity-20 lh-base text-light" 
                                            style={{ ...forceVerticalLiStyle, listStyleType: 'square', fontSize: '0.85rem' }}
                                        >
                                            {spec}
                                        </li>
                                    ))}
                                </ul>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* RIGHT SIDE COLUMN (Width: 8/12) -> Professional Deployment Logs */}
                    <Col lg={8} xs={12}>
                        <Card style={masterDuelLaserCardStyle}>
                            <Card.Header className="border-bottom border-dark py-3" style={{ background: 'rgba(0, 0, 0, 0.2)' }}>
                                <span className="fw-bold tracking-widest" style={{ color: '#ffaa00' }}>PROFESSIONAL_DEPLOYMENT_HISTORY</span>
                            </Card.Header>
                            <Card.Body className="p-0">
                                {profileData.deploymentHistory.map((job, index) => (
                                    <div key={index} className="p-4 border-bottom border-dark text-white">
                                        <Row className="align-items-start mb-2">
                                            <Col xs={12} md={8}>
                                                <h4 className="fw-bold mb-1" style={textStyleCyan}>{job.company}</h4>
                                                <h5 className="fw-semibold fs-6" style={{ color: '#ffaa00' }}>{job.role}</h5>
                                            </Col>
                                            <Col xs={12} md={4} className="text-md-end small">
                                                <div className="fw-bold" style={textStylePurple}>{job.duration}</div>
                                                <div className="text-muted">{job.location}</div>
                                            </Col>
                                        </Row>
                                        
                                        <p className="text fst-italic mb-3" style={{ fontSize: '0.85rem', color: '#a69cb5' }}>{job.summary}</p>
                                        
                                        <ul style={{ ...forceVerticalListStyle, color: 'rgba(255, 255, 255, 0.75)' }}>
                                            {job.highlights.map((bullet, bIdx) => (
                                                <li 
                                                    key={bIdx} 
                                                    className="mb-2 text-light lh-base"
                                                    style={{ ...forceVerticalLiStyle, listStyleType: 'disc', fontSize: '0.85rem' }}
                                                >
                                                    {bullet}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </Card.Body>
                        </Card>
                    </Col>

                </Row>
            </Container>
        </div>
    );
}