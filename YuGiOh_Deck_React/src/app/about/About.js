'use client'; 

import React from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import "@/mdstyles.css";

export default function About() {
    const profileData = {
        userName: "ErreGeTe", 
        realName: "Ryan Thomas",
        profileIcon: "/images/YCS_Orlando.JPG", 
        aboutText: "A Results-driven Software Engineer with over 6 years of experience specializing in scalable architectures, real-time microservices, and mission-critical cloud deployments. I approach complex system design with the same strategic precision as a Tier 0 Duelist.",
        
        education: {
            degree: "Bachelor of Science - Computer Engineering",
            institution: "Florida State University",
            icon: ""
        },

        skillsDeck: [
            { 
                category: "CORE LANGUAGES", 
                items: ["C# (.NET 8/9)", "C++", "Java", "Python", "TypeScript", "JavaScript", "SQL", "HTML5/CSS3", "PowerShell", "JSON/BSON"] 
            },
            { 
                category: "TOOLS & FRAMEWORKS", 
                items: ["React 18", "ASP.NET Core Web API", "SignalR (WebSockets)", "Redux Toolkit", "React-Bootstrap", "SpringBoot", "Qt", "VxWorks", "Unreal Engine 5", "Unity"] 
            },
            { 
                category: "INFRASTRUCTURE & MESSAGING", 
                items: ["Apache Kafka", "Azure Event Hubs", "Azure Container Apps", "Azure Blob Storage (DLQ)", "Azure Cosmos DB", "MongoDB", "Docker", "RabbitMQ", "Linux (Red Hat 9)", "Envoy Ingress", "Git", "GitHub Actions CI/CD", "Jenkins", "Bamboo", "TCP/IP"] 
            }
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
            "Architected a multi-service Yu-Gi-Oh! Deck Builder platform using a React 18 + Redux Toolkit frontend and an asynchronous ASP.NET Core Web API backend.",
            "Engineered an event-driven data pipeline via Azure Event Hubs (Apache Kafka API) to decouple high-throughput deck publication events from API request threads.",
            "Integrated ASP.NET Core SignalR WebSockets to broadcast live community duelist activity to connected React clients with zero-latency push updates.",
            "Configured C# BackgroundWorker consumer services to aggregate real-time card usage metrics into MongoDB / Azure Cosmos DB collections.",
            "Implemented robust Dead Letter Queue (DLQ) failover mechanisms using Azure Blob Storage to isolate unprocessable event payloads.",
            "Executed database schema migrations and indexing policy optimizations (indexing path setups on timestamp fields) across Azure Cosmos DB vCore clusters.",
            "Managed containerized microservice infrastructure within Azure Container Apps utilizing Envoy proxy ingress routing, custom SSL certificates, and CORS security policies for erregeteygo.com.",
            "Automated continuous integration and deployment (CI/CD) pipelines using GitHub Actions to build Docker images and deploy to Azure Container Registry (ACR)."
        ]
    };

    const textStyleCyan = { color: '#00f2ff', textShadow: '0 0 8px rgba(0,242,255,0.4)' };
    const textStylePurple = { color: '#bd72ff' };
    const textStyleAmber = { color: '#ffaa00' };

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

    return (
        <div style={{ backgroundColor: '#06080c', minHeight: "100vh", fontFamily: "'Cascadia Mono', monospace" }} className="py-5 mt-5">
            <Container fluid className="px-4 px-xxl-5">
                
                {/* Hero Profile Banner */}
                <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.75)', backdropFilter: 'blur(0px)' }} className="border-secondary border-opacity-25 shadow-lg p-4 mb-4 md-panel">
                    <Card.Body className="p-2">
                        <Row className="align-items-center g-4">
                            <Col xs={12} md={3} className="text-center">
                                <div className="position-relative d-inline-block">
                                    <img 
                                        src={profileData.profileIcon} 
                                        alt="Avatar" 
                                        className="img-fluid rounded border border-secondary shadow-lg"
                                        style={{ 
                                            borderColor: 'rgba(255, 255, 255, 0.2)', 
                                            width: '320px', 
                                            height: '320px', 
                                            objectFit: 'cover'
                                        }}
                                    />
                                </div>
                            </Col>

                            <Col xs={12} md={9} className="text-start">
                                <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                                    <Badge bg="dark" className="border border-secondary text-info terminal-font" style={{ fontSize: '0.75rem' }}>
                                        ATTRIBUTE: C# / REACT / CLOUD
                                    </Badge>
                                    <Badge bg="dark" className="border border-secondary text-warning terminal-font" style={{ fontSize: '0.75rem' }}>
                                        EXP: 6+ YEARS
                                    </Badge>
                                </div>

                                <h2 className="display-6 fw-bold terminal-font mb-1" style={textStyleCyan}>
                                    {profileData.userName}
                                </h2>
                                <h5 className="fw-bold tracking-wider mb-3 terminal-font">
                                    {profileData.realName.toUpperCase()}
                                </h5>

                                <hr style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }} className="my-3" />

                                <p className="text-white-50 mb-3" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                                    {profileData.aboutText}
                                </p>
                                
                                <div className="p-2 rounded bg-black bg-opacity-50 border border-secondary border-opacity-30 d-inline-flex align-items-center text-white small">
                                    <span className="fs-5 me-2">{profileData.education.icon}</span>
                                    <span className="fw-bold me-2">{profileData.education.degree}</span>
                                    <span className="text-white-50 me-2">|</span>
                                    <span className="text-info">{profileData.education.institution}</span>
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Content Grid */}
                <Row className="g-4">
                    <Col lg={5} xs={12}>
                        {/* Software Skillset */}
                        <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.75)', backdropFilter: 'blur(0px)' }} className="border-secondary border-opacity-25 shadow-lg mb-4 md-panel">
                            <Card.Header className="bg-transparent border-bottom border-secondary border-opacity-25 py-3">
                                <h6 className="m-0 fw-bold tracking-widest terminal-font" style={textStyleCyan}>
                                    SOFTWARE SKILLSET
                                </h6>
                            </Card.Header>
                            <Card.Body className="p-4">
                                {profileData.skillsDeck.map((deck, idx) => (
                                    <div key={idx} className="mb-3 text-start">
                                        <small className="d-block mb-2 fw-bold text-uppercase terminal-font" style={{ fontSize: '0.72rem', color: '#a69cb5' }}>
                                            {deck.category}
                                        </small>
                                        <div className="d-flex flex-wrap gap-1">
                                            {deck.items.map((skill, i) => (
                                                <Badge 
                                                    key={i} 
                                                    bg="dark" 
                                                    className="p-2 border border-secondary border-opacity-50 fs-7 text-white shadow-sm" 
                                                    style={{ fontSize: '0.75rem' }}
                                                >
                                                    <span style={{ color: '#00f2ff' }}>{skill}</span>
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </Card.Body>
                        </Card>

                        {/* Platform Specifications */}
                        <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.75)', backdropFilter: 'blur(0px)' }} className="border-secondary border-opacity-25 shadow-lg md-panel">
                            <Card.Header className="bg-transparent border-bottom border-secondary border-opacity-25 py-3">
                                <h6 className="m-0 fw-bold tracking-widest terminal-font" style={textStyleCyan}>
                                    PLATFORM SPECIFICATIONS
                                </h6>
                            </Card.Header>
                            <Card.Body className="text-start p-4">
                                <ul style={forceVerticalListStyle} className="text-white">
                                    {profileData.platformSpecs.map((spec, index) => (
                                        <li 
                                            key={index} 
                                            className="mb-3 pb-2 border-bottom border-secondary border-opacity-25 lh-base text-white-50" 
                                            style={{ ...forceVerticalLiStyle, listStyleType: 'square', fontSize: '0.85rem' }}
                                        >
                                            {spec}
                                        </li>
                                    ))}
                                </ul>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={7} xs={12}>
                        {/* Professional Deployment History */}
                        <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.75)', backdropFilter: 'blur(0px)' }} className="border-secondary border-opacity-25 shadow-lg md-panel">
                            <Card.Header className="bg-transparent border-bottom border-secondary border-opacity-25 py-3">
                                <h6 className="m-0 fw-bold tracking-widest terminal-font" style={textStyleCyan}>
                                    PROFESSIONAL DEPLOYMENT HISTORY
                                </h6>
                            </Card.Header>
                            <Card.Body className="p-0 text-start">
                                {profileData.deploymentHistory.map((job, index) => (
                                    <div key={index} className="p-4 border-bottom border-secondary border-opacity-25 text-white">
                                        <Row className="align-items-start mb-2">
                                            <Col xs={12} md={8}>
                                                <h4 className="fw-bold mb-1" style={textStyleCyan}>{job.company}</h4>
                                                <h6 className="fw-semibold" style={textStyleAmber}>{job.role}</h6>
                                            </Col>
                                            <Col xs={12} md={4} className="text-md-end small mt-1 mt-md-0">
                                                <Badge bg="dark" className="border border-secondary text-purple terminal-font px-2 py-1" style={{ color: '#bd72ff', fontSize: '0.75rem' }}>
                                                    {job.duration}
                                                </Badge>
                                                <div className="text-white-50 small mt-1">{job.location}</div>
                                            </Col>
                                        </Row>
                                        
                                        <p className="fst-italic mb-3 text-white-50" style={{ fontSize: '0.88rem' }}>
                                            {job.summary}
                                        </p>
                                        
                                        <ul style={{ ...forceVerticalListStyle, color: 'rgba(255, 255, 255, 0.82)' }}>
                                            {job.highlights.map((bullet, bIdx) => (
                                                <li 
                                                    key={bIdx} 
                                                    className="mb-2 lh-base"
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