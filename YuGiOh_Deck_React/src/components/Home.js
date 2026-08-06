import React, { useState, useEffect, useRef } from "react";
import Carousel from 'react-bootstrap/Carousel';
import Card from 'react-bootstrap/Card';
import { Link } from 'react-router-dom';
import DecksGrid from "./DecksGrid";
import TrendingCards from "./TrendingCards";
import Footer from "./Footer";
import LiveTicker from "./LiveTicker";

// 🚀 Dedicated Video Nav Card with Instant Hover & Fast Page Load
function NavVideoCard({ link }) {
    const videoRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseEnter = () => {
        setIsHovered(true);
        if (videoRef.current) {
            videoRef.current.currentTime = 0; // Rewind video to start
            const playPromise = videoRef.current.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    // Ignore fast hover interruptions
                });
            }
        }
    };

    const handleMouseLeave = () => {
        setIsHovered(false); // Hides video layer, revealing thumbnail underneath
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    };

    return (
        <Card 
            as={Link} 
            to={link.path} 
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="md-nav-card flex-grow-1 flex-sm-grow-0 overflow-hidden"
            style={{ 
                width: '100%', 
                maxWidth: '16rem', 
                textDecoration: 'none', 
                cursor: 'pointer' 
            }}
        >
            <div className="md-card-img-container" style={{ position: 'relative', width: '100%', height: '200px' }}>
                {/* LAYER 1: Always-visible Static Artwork */}
                <Card.Img 
                    src={link.img} 
                    style={{ 
                        width: '100%', 
                        height: "200px", 
                        objectFit: "cover", 
                        opacity: 0.8 
                    }} 
                />

                {/* LAYER 2: Overlay Video (Instant Hover Playback via preload="metadata") */}
                {link.video && (
                    <video
                        ref={videoRef}
                        src={link.video}
                        muted
                        loop
                        playsInline
                        preload="metadata" // 👈 Prevents page stutter on load while keeping hover instant
                        style={{ 
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover',
                            opacity: isHovered ? 1 : 0, // Cross-fades between video and image
                            transition: 'opacity 0.25s ease-in-out',
                            pointerEvents: 'none'
                        }}
                    />
                )}
            </div>

            <Card.Body className="p-0">
                <div className="md-card-overlay-text text-center py-2 text-white fw-bold">
                    {link.label}
                </div>
            </Card.Body>
        </Card>
    );
}

// 👾 Full-Stack Tech Stack Slides mapped to Cyberse Code Talker monsters
const techStackSlides = [
    {
        tech: "React 18 & Redux Toolkit",
        badge: "FRONTEND",
        badgeBg: "info",
        cardName: "Decode Talker",
        cardId: "1861629",
        desc: "Modular UI components, custom hooks, and centralized Redux Toolkit state management for instant deck building."
    },
    {
        tech: "C# .NET 8 Web API",
        badge: "BACKEND",
        badgeBg: "primary",
        cardName: "Encode Talker",
        cardId: "6622715",
        desc: "RESTful ASP.NET Core endpoints handling CORS policies, MongoDB queries, and business logic mapping."
    },
    {
        tech: "Apache Kafka (Azure Event Hubs)",
        badge: "STREAMING",
        badgeBg: "warning",
        cardName: "Transcode Talker",
        cardId: "46947713",
        desc: "High-throughput asynchronous event topic streaming deck publications across microservice workers."
    },
    {
        tech: "ASP.NET Core SignalR",
        badge: "REALTIME",
        badgeBg: "danger",
        cardName: "Decode Talker Heatsoul",
        cardId: "61245672",
        desc: "Low-latency WebSocket connections broadcasting live community duelist updates across active clients."
    },
    {
        tech: "MongoDB & Azure Cosmos DB",
        badge: "DATABASE",
        badgeBg: "success",
        cardName: "Excode Talker",
        cardId: "40669071",
        desc: "Cloud document database persisting user profiles, published decklists, and aggregated card usage metrics."
    },
    {
        tech: "Docker & Azure Container Apps",
        badge: "MICROSERVICES",
        badgeBg: "info",
        cardName: "Allied Code Talker @Ignister",
        cardId: "39138610",
        desc: "Serverless containerized microservices hosted on Azure Container Apps with Envoy proxy ingress routing."
    },
    {
        tech: "Azure Blob Storage (DLQ)",
        badge: "RELIABILITY",
        badgeBg: "secondary",
        cardName: "Accesscode Talker",
        cardId: "86066372",
        desc: "Dead Letter Queue storage isolating unprocessable event payloads to guarantee data integrity."
    },
    {
        tech: "Go (Golang) Microservice",
        badge: "CONCURRENCY",
        badgeBg: "pink",
        cardName: "Powercode Talker",
        cardId: "15844566",
        desc: "High-speed Goroutine worker pool executing streaming YDK deck scraping and parallel Azure Blob image syncs."
    },
];

export default function Home({ user }) {
    const [decks, setDecks] = useState([]);
    const [decklist, setDeckList] = useState([]);

    useEffect(() => {
        fetch("decks.json")
            .then(response => response.json())
            .then(data => setDecks(data));
    }, []);

    const toggleDeckList = (deckId) => {
        setDeckList(prev => 
            prev.includes(deckId) 
                ? prev.filter(id => id !== deckId) 
                : [...prev, deckId]
        );
    };

    return (
        <div className="md-theme-bg">
            {/* HERO SECTION - Explicit 95px Top Clearance for Fixed Navbar */}
            <div className="container pb-2 px-3" style={{ paddingTop: '95px' }}>
                <section 
                    className="position-relative p-3 p-md-5 text-white rounded-3 bg-dark border border-info border-opacity-25 shadow-lg mx-auto" 
                    style={{
                        background: 'radial-gradient(circle at 80% 20%, rgba(0, 242, 255, 0.12) 0%, rgba(10, 13, 20, 0.95) 75%)',
                        maxWidth: '1300px'
                    }}
                >
                    <div className="row align-items-center py-1 py-md-2">
                        {/* LEFT COLUMN: Welcome + Pitch + Action Buttons */}
                        <div className="col-lg-7 text-start mb-4 mb-lg-0">
                            {/* Welcome Tagline */}
                            <h1 className="text-info terminal-font fw-bold mb-2 fs-4 fs-md-3" style={{ letterSpacing: '1.5px', textShadow: '0 0 8px rgba(0,242,255,0.3)' }}>
                                WELCOME TO ERREGETEYGO!
                            </h1>

                            {/* Main Title - Responsive Scaling */}
                            <h1 className="fw-bold text-white mb-3 fs-2 fs-md-1 display-lg-5" style={{ letterSpacing: '0.5px' }}>
                                Build, Analyze & Stream <span style={{ color: '#00f2ff', textShadow: '0 0 12px rgba(0,242,255,0.4)' }}>Yu-Gi-Oh!</span> Decks
                            </h1>

                            <p className="lead text-white-50 mb-4 fs-6" style={{ maxWidth: '600px' }}>
                                A full-stack, event-driven deckbuilding platform. Track real-time duelist activity, explore trending meta analytics, and test custom deck builds in real time.
                            </p>

                            {/* Action Buttons */}
                            <div className="d-flex flex-column flex-sm-row gap-3">
                                <Link 
                                    to="/deckbuilder" 
                                    className="btn btn-cyber-outline btn-lg fw-bold px-4 shadow-sm w-100 w-sm-auto text-center"
                                >
                                    ⚔️ Open Deck Builder
                                </Link>
                                <Link 
                                    to="/about" 
                                    className="btn btn-outline-light btn-lg px-4 w-100 w-sm-auto text-center"
                                >
                                    📖 System Architecture
                                </Link>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Feature Mini-Carousel */}
                        <div className="col-lg-5 text-center">
                            <div 
                                className="p-3 rounded-4 bg-black bg-opacity-75 border border-info border-opacity-40 shadow-lg position-relative mx-auto w-100"
                                style={{ backdropFilter: 'blur(8px)', maxWidth: '380px' }}
                            >
                                <div className="d-flex justify-content-between align-items-center mb-2 px-1 text-info small fw-bold">
                                    <span>👾 SYSTEM ARCHITECTURE</span>
                                    <span className="badge bg-info text-dark">CODE TALKERS</span>
                                </div>

                                <Carousel indicators={false} controls={true} interval={4000} fade className="md-tech-carousel">
                                    {techStackSlides.map((slide, idx) => (
                                        <Carousel.Item key={idx}>
                                            <div className="text-center px-1">
                                                <img 
                                                    src={`https://images.ygoprodeck.com/images/cards_cropped/${slide.cardId}.jpg`} 
                                                    alt={slide.cardName} 
                                                    className="img-fluid rounded border border-info border-opacity-50 shadow-sm mb-2"
                                                    style={{ maxHeight: '240px', width: '100%', objectFit: 'cover' }}
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = 'https://images.ygoprodeck.com/images/cards/back_high.jpg';
                                                    }}
                                                />
                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                    <span className="fw-bold text-white small">{slide.tech}</span>
                                                    <span 
                                                        className={`badge ${slide.badgeBg === 'pink' ? 'text-dark' : `bg-${slide.badgeBg} text-dark`}`} 
                                                        style={{ 
                                                            fontSize: '0.65rem',
                                                            backgroundColor: slide.badgeBg === 'pink' ? '#ff69b4' : undefined // Neon Cyber Pink
                                                        }}
                                                    >
                                                        {slide.badge}
                                                    </span>
                                                </div>
                                                <div className="text-start" style={{ minHeight: '60px' }}>
                                                    <small className="text-white-50 d-block" style={{ fontSize: '0.78rem', lineHeight: '1.3' }}>
                                                        {slide.desc}
                                                    </small>
                                                    <small className="text-info fst-italic mt-1 d-block" style={{ fontSize: '0.7rem' }}>
                                                        Link Monster: {slide.cardName}
                                                    </small>
                                                </div>
                                            </div>
                                        </Carousel.Item>
                                    ))}
                                </Carousel>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <div className="container md-content-panel px-3">
                {/* QUICK NAVIGATION CARDS */}
                <nav className="mb-4 mb-md-5">
                    <div className="d-flex justify-content-center flex-wrap gap-2 gap-md-3">
                        {[
                            { path: "/about", label: "About", img: "./images/thunderbolt.png", video: "./videos/thunderbolt.mp4" },
                            { path: "/contact", label: "Contact", img: "./images/aluber.png", video: "./videos/aluber.mp4" },
                            { path: "/deckbuilder", label: "Deck Builder", img: "./images/albaz.jpg", video: "./videos/albaz.mp4" },
                            { path: "/community", label: "Community", img: "./images/bystialLubellion.png", video: "./videos/bystialLubellion.mp4" },
                            { path: "/meta-decks", label: "Meta Decks", img: "./images/mirrorjade.jpg", video: "./videos/mirrorjade.mp4" },
                            { path: "/cardsearch", label: "Card Search", img: "./images/darkdragon.jpg", video: "./videos/darkdragon.mp4" },
                            { path: "/comingsoon", label: "Ban List", img: "./images/blazing.png", video: "./videos/blazing.mp4" },
                            { path: "/generaldiscussion", label: "Forums", img: "./images/sanctifire.png", video: "./videos/sanctifire.mp4" },
                        ].map((link, idx) => (
                            <NavVideoCard key={idx} link={link} />
                        ))}
                    </div>
                </nav>

                <hr className="border-info opacity-25 mb-4 mb-md-5" />

                <section className="mb-4 mb-md-5">
                    <LiveTicker />
                </section>

                {/* DECKS GRID SECTION */}
                <section className="mb-4 mb-md-5">
                    <DecksGrid decks={decks} decklist={decklist} toggleDeckList={toggleDeckList} />
                </section>

                <hr className="border-info opacity-25 mb-4 mb-md-5" />

                {/* TRENDING CARDS SECTION */}
                <section className="mb-4">
                    <TrendingCards />
                </section>
            </div>
            
            <Footer />
        </div>
    );
}