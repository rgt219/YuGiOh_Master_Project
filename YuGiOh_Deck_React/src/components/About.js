import React from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import "../mdstyles.css"; // Reuse the master duel stylesheet

export default function About() {
    // 1. Unified Cyber-Duelist Profile Data Structure
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

    return (
        <div className="md-theme-bg p-5" style={{ minHeight: "100vh" }}>
            <Container>
                {/* --- HEADER BLOCK (PROSE SANITIZED) --- */}
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
                        <h4 className="text-muted fw-bold">SYSTEM_ARCHITECT // {profileData.realName.toUpperCase()}</h4>
                        <div className="md-divider-purple mt-3 mb-3"></div>
                        <p className="md-text-terminal lead">{profileData.aboutText}</p>
                        
                        {/* Education Node */}
                        <div className="mt-3 d-flex align-items-center text-white">
                            <span className="fs-4 me-2">{profileData.education.icon}</span>
                            <span className="fw-semibold text-purple">{profileData.education.degree}</span>
                            <span className="mx-2 text-muted">|</span>
                            <span className="text-muted">{profileData.education.institution}</span>
                        </div>
                    </Col>
                </Row>

                <Row>
                    {/* LEFT COLUMN: TECH DECK & CURRENT RUNTIME PROJECT */}
                    <Col lg={4} className="mb-4">
                        {/* TECH MASTERIES PANEL */}
                        <Card className="login-terminal-panel mb-4 md-border-purple">
                            <Card.Header className="terminal-header bg-purple-dark">
                                <span className="terminal-title text-purple">TECH_DECK_RECIPE</span>
                            </Card.Header>
                            <Card.Body className="md-input-field p-3">
                                {profileData.skillsDeck.map((deck, idx) => (
                                    <div key={idx} className="mb-4">
                                        <small className="text-muted d-block mb-2 fw-bold">// {deck.category}</small>
                                        <div className="d-flex flex-wrap gap-1">
                                            {deck.items.map((skill, i) => (
                                                <Badge key={i} bg="dark" className="p-2 md-border-info fs-7 text-info">
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </Card.Body>
                        </Card>

                        {/* THIS APPLICATION SCRIPT OVERVIEW */}
                        <Card className="login-terminal-panel md-border-info">
                            <Card.Header className="terminal-header">
                                <span className="terminal-dot red me-2"></span>
                                <span className="terminal-dot yellow me-2"></span>
                                <span className="terminal-dot green me-2"></span>
                                <span className="terminal-title text-info">PLATFORM_SPECIFICATIONS (ERREGETEYGO.COM)</span>
                            </Card.Header>
                            <Card.Body className="md-input-field text-white fs-7">
                                <ul className="ps-3 mb-0">
                                    {profileData.platformSpecs.map((spec, index) => (
                                        <li key={index} className="mb-2 border-bottom border-dark pb-2 last-border-0">
                                            {spec}
                                        </li>
                                    ))}
                                </ul>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* RIGHT COLUMN: CAMPAIGN LOGS (WORK EXPERIENCE) */}
                    <Col lg={8}>
                        <Card className="login-terminal-panel mb-4">
                            <Card.Header className="terminal-header d-flex align-items-center">
                                <span className="terminal-title text-hot-orange">PROFESSIONAL_DEPLOYMENT_HISTORY</span>
                            </Card.Header>
                            <Card.Body className="md-input-field p-0">
                                {profileData.deploymentHistory.map((job, index) => (
                                    <div key={index} className="p-4 border-bottom border-dark text-white">
                                        <Row className="align-items-start">
                                            <Col xs={12} md={8}>
                                                <h4 className="text-info md-text-glitch mb-1">{job.company}</h4>
                                                <h5 className="text-hot-orange fw-semibold fs-6">{job.role}</h5>
                                            </Col>
                                            <Col xs={12} md={4} className="text-md-end text-muted small">
                                                <div className="fw-bold text-purple">{job.duration}</div>
                                                <div>{job.location}</div>
                                            </Col>
                                        </Row>
                                        
                                        <p className="mt-2 text-muted fst-italic fs-7">{job.summary}</p>
                                        
                                        <ul className="mt-3 text-light-gray fs-7 custom-terminal-bullets">
                                            {job.highlights.map((bullet, bIdx) => (
                                                <li key={bIdx} className="mb-2">
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