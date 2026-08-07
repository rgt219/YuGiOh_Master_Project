import React, { useState, useEffect, useRef } from "react";
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';
import { Link } from 'react-router-dom';
import DecksGrid from "./DecksGrid";
import TrendingCards from "./TrendingCards";
import Footer from "./Footer";
import LiveTicker from "./LiveTicker";
import '../mdstyles.css';

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
                        preload="metadata"
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

// 👾 Full-Stack Tech Stack Slides mapped to Code Talker monsters with Unique VRAINS Colors
const techStackSlides = [
    {
        tech: "React 18 & Redux Toolkit",
        badge: "FRONTEND",
        badgeBg: "info",
        cardName: "Decode Talker",
        cardId: "1861629",
        shortName: "Decode",
        themeColor: "#00f2ff", // Neon Cyan
        bgGradient: "radial-gradient(circle at 80% 20%, rgba(0, 242, 255, 0.25) 0%, rgba(8, 12, 22, 0.96) 75%)",
        desc: "Architected with modular functional React components, custom hooks, and centralized Redux Toolkit state management for instant deck building and real-time state synchronization."
    },
    {
        tech: "C# .NET 9 Web API",
        badge: "BACKEND",
        badgeBg: "primary",
        cardName: "Encode Talker",
        cardId: "6622715",
        shortName: "Encode",
        themeColor: "#3b82f6", // Royal Blue
        bgGradient: "radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.25) 0%, rgba(8, 12, 22, 0.96) 75%)",
        desc: "Asynchronous ASP.NET Core RESTful controllers handling CORS policies, business logic validation, MongoDB BSON mappings, and high-speed JSON payload serialization."
    },
    {
        tech: "Apache Kafka (Azure Event Hubs)",
        badge: "STREAMING",
        badgeBg: "warning",
        cardName: "Transcode Talker",
        cardId: "46947713",
        shortName: "Transcode",
        themeColor: "#eab308", // Cyber Amber/Gold
        bgGradient: "radial-gradient(circle at 80% 20%, rgba(234, 179, 8, 0.25) 0%, rgba(8, 12, 22, 0.96) 75%)",
        desc: "High-throughput event-driven topic streaming using Azure Event Hubs Kafka API to decouple data ingestion from core domain services during peak community activity."
    },
    {
        tech: "ASP.NET Core SignalR",
        badge: "REALTIME",
        badgeBg: "danger",
        cardName: "Decode Talker Heatsoul",
        cardId: "61245672",
        shortName: "Heatsoul",
        themeColor: "#ef4444", // Crimson Pulse Red
        bgGradient: "radial-gradient(circle at 80% 20%, rgba(239, 68, 68, 0.25) 0%, rgba(8, 12, 22, 0.96) 75%)",
        desc: "Low-latency WebSocket hubs broadcasting live community deck creations, duelist status feeds, and interactive notifications instantly across active connected clients."
    },
    {
        tech: "MongoDB & Azure Cosmos DB",
        badge: "DATABASE",
        badgeBg: "success",
        cardName: "Excode Talker",
        cardId: "40669071",
        shortName: "Excode",
        themeColor: "#10b981", // Emerald Green
        bgGradient: "radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.25) 0%, rgba(8, 12, 22, 0.96) 75%)",
        desc: "Cloud document database architecture with Cosmos DB vCore clusters persisting user profiles, published decklists, and aggregated meta card metrics."
    },
    {
        tech: "Docker & Azure Container Apps",
        badge: "MICROSERVICES",
        badgeBg: "info",
        cardName: "Allied Code Talker @Ignister",
        cardId: "39138610",
        shortName: "Allied",
        themeColor: "#06b6d4", // Electric Cyan
        bgGradient: "radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.25) 0%, rgba(8, 12, 22, 0.96) 75%)",
        desc: "Serverless containerized microservices hosted on Azure Container Apps with Envoy proxy ingress routing and automated GitHub Actions deployment pipelines."
    },
    {
        tech: "Azure Blob Storage (DLQ)",
        badge: "RELIABILITY",
        badgeBg: "secondary",
        cardName: "Accesscode Talker",
        cardId: "86066372",
        shortName: "Accesscode",
        themeColor: "#a855f7", // Deep Cyber Purple
        bgGradient: "radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.25) 0%, rgba(8, 12, 22, 0.96) 75%)",
        desc: "Dead Letter Queue (DLQ) storage and Azure Blob Storage CDN hosting high-resolution card artwork and media attachment payloads with image fallback handling."
    },
    {
        tech: "Go (Golang) Microservice",
        badge: "CONCURRENCY",
        badgeBg: "pink",
        cardName: "Powercode Talker",
        cardId: "15844566",
        shortName: "Powercode",
        themeColor: "#ec4899", // Neon Magenta/Pink
        bgGradient: "radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.25) 0%, rgba(8, 12, 22, 0.96) 75%)",
        desc: "High-speed Go background microservice utilizing parallel Goroutine worker pools to offload streaming YDK web scraping and image CDN synchronization."
    },
];

export default function Home({ user }) {
    const [decks, setDecks] = useState([]);
    const [decklist, setDeckList] = useState([]);
    
    // ⚡ Active Tech Slide State & Auto-Rotation Timer
    const [activeIndex, setActiveIndex] = useState(0);
    const activeTech = techStackSlides[activeIndex];

    useEffect(() => {
        fetch("decks.json")
            .then(response => response.json())
            .then(data => setDecks(data));
    }, []);

    // ⚡ Auto-rotate slides every 5.5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex(prev => (prev + 1) % techStackSlides.length);
        }, 5500);
        return () => clearInterval(interval);
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
                    className="vrains-hero-container p-3 p-md-5 text-white bg-dark border border-info border-opacity-25 shadow-lg mx-auto" 
                    style={{
                        maxWidth: '1300px',
                        boxShadow: `0 0 35px ${activeTech.themeColor}33`,
                        transition: 'box-shadow 0.8s ease-in-out'
                    }}
                >
                    {/* ⚡ STACKED BACKGROUND GRADIENT LAYERS (Smooth Cross-Fade) */}
                    {techStackSlides.map((slide, idx) => (
                        <div
                            key={idx}
                            className="vrains-hero-bg-layer"
                            style={{
                                background: slide.bgGradient,
                                opacity: activeIndex === idx ? 1 : 0
                            }}
                        />
                    ))}

                    {/* Animated Cyber Grid Canvas Overlay */}
                    <div className="vrains-hero-grid-overlay"></div>

                    <div className="row align-items-center py-1 py-md-2 position-relative z-index-2">
                        
                        {/* 🎮 LEFT COLUMN: WELCOME TITLE + SMALLER POWERED-BY SUBTITLE */}
                        <div className="col-lg-7 text-start mb-4 mb-lg-0">
                            
                            {/* 1) LARGER HERO MAIN TITLE */}
                            <h2 
                                className="fw-extrabold text-white mb-2 display-4 fs-1-md" 
                                style={{ 
                                    letterSpacing: '1.5px', 
                                    textShadow: '0 0 16px rgba(0,242,255,0.4)',
                                    fontWeight: 800
                                }}
                            >
                                WELCOME TO ERREGETEYGO!
                            </h2>

                            {/* 1) SMALLER DYNAMIC SUBTITLE */}
                            <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
                                <h4 className="fw-bold mb-0 font-monospace fs-5 fs-md-4" style={{ color: activeTech.themeColor, textShadow: `0 0 10px ${activeTech.themeColor}`, transition: 'color 0.6s ease' }}>
                                    Powered by {activeTech.tech}
                                </h4>
                            </div>


                            {/* Dynamic In-Depth Description Box */}
                            <div 
                                className="p-3 rounded-3 bg-black bg-opacity-60 border mb-4 position-relative"
                                style={{ 
                                    backdropFilter: 'blur(8px)', 
                                    borderColor: activeTech.themeColor,
                                    maxWidth: '620px', 
                                    minHeight: '95px',
                                    transition: 'border-color 0.6s ease'
                                }}
                            >
                                {/* HUD Corner Brackets */}
                                <div className="vrains-corner vrains-corner-tl" style={{ borderColor: activeTech.themeColor, transition: 'border-color 0.6s ease' }}></div>
                                <div className="vrains-corner vrains-corner-tr" style={{ borderColor: activeTech.themeColor, transition: 'border-color 0.6s ease' }}></div>
                                <div className="vrains-corner vrains-corner-bl" style={{ borderColor: activeTech.themeColor, transition: 'border-color 0.6s ease' }}></div>
                                <div className="vrains-corner vrains-corner-br" style={{ borderColor: activeTech.themeColor, transition: 'border-color 0.6s ease' }}></div>

                                <p className="text-white-50 mb-0 fs-6" style={{ lineHeight: '1.5', fontSize: '0.92rem' }}>
                                    {activeTech.desc}
                                </p>
                            </div>

                            {/* 🎯 CODE TALKER INTERACTIVE SELECTOR PILLS */}
                            <div className="mb-4">
                                <div className="d-flex flex-wrap gap-1">
                                    {techStackSlides.map((slide, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveIndex(idx)}
                                            className={`btn btn-sm terminal-font px-2 py-1 font-monospace ${activeIndex === idx ? 'fw-bold text-dark' : 'btn-outline-secondary text-white-50'}`}
                                            style={{ 
                                                fontSize: '0.68rem', 
                                                transition: 'all 0.3s ease',
                                                backgroundColor: activeIndex === idx ? slide.themeColor : 'transparent',
                                                borderColor: activeIndex === idx ? slide.themeColor : 'rgba(255,255,255,0.2)',
                                                boxShadow: activeIndex === idx ? `0 0 12px ${slide.themeColor}` : 'none'
                                            }}
                                        >
                                            {slide.shortName}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 🎮 RIGHT COLUMN: STACKED CARD ARTWORK (Smooth Opacity Cross-Fade) */}
                        <div className="col-lg-5 text-center">
                            <div 
                                className="vrains-full-card-frame mx-auto position-relative" 
                                style={{ 
                                    maxWidth: '290px', 
                                    height: '410px', 
                                    borderColor: activeTech.themeColor,
                                    transition: 'border-color 0.6s ease'
                                }}
                            >
                                {/* HUD Corner Brackets */}
                                <div className="vrains-corner vrains-corner-tl" style={{ borderColor: activeTech.themeColor, transition: 'border-color 0.6s ease' }}></div>
                                <div className="vrains-corner vrains-corner-tr" style={{ borderColor: activeTech.themeColor, transition: 'border-color 0.6s ease' }}></div>
                                <div className="vrains-corner vrains-corner-bl" style={{ borderColor: activeTech.themeColor, transition: 'border-color 0.6s ease' }}></div>
                                <div className="vrains-corner vrains-corner-br" style={{ borderColor: activeTech.themeColor, transition: 'border-color 0.6s ease' }}></div>

                                {/* ⚡ STACKED CARD IMAGES (Cross-Fades on activeIndex Change) */}
                                <div className="vrains-card-glow-wrapper w-100 h-100 position-relative">
                                    {techStackSlides.map((slide, idx) => (
                                        <img 
                                            key={idx}
                                            src={`https://images.ygoprodeck.com/images/cards/${slide.cardId}.jpg`} 
                                            alt={slide.cardName} 
                                            className="vrains-card-crossfade-img rounded shadow-lg"
                                            style={{ 
                                                opacity: activeIndex === idx ? 1 : 0
                                            }}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://images.ygoprodeck.com/images/cards/back_high.jpg';
                                            }}
                                        />
                                    ))}
                                </div>

                            </div>
                        </div>

                    </div>
                </section>
            </div>

            {/* RESTORED ALL 8 QUICK NAVIGATION VIDEO CARDS */}
            <div className="container md-content-panel px-3">
                <nav className="mb-4 mb-md-5">
                    <div className="d-flex justify-content-center flex-wrap gap-2 gap-md-3">
                        {[
                            { path: "/about", label: "About", img: "./images/thunderbolt.png", video: "./videos/thunderbolt.mp4" },
                            { path: "/contact", label: "Contact", img: "./images/aluber.png", video: "./videos/aluber.mp4" },
                            { path: "/deckbuilder", label: "Deck Builder", img: "./images/albaz.jpg", video: "./videos/albaz.mp4" },
                            { path: "/community", label: "Community", img: "./images/bystialLubellion.png", video: "./videos/bystialLubellion.mp4" },
                            { path: "/meta-decks", label: "Meta Decks", img: "./images/mirrorjade.jpg", video: "./videos/mirrorjade.mp4" },
                            { path: "/cardsearch", label: "Card Search", img: "./images/darkdragon.jpg", video: "./videos/darkdragon.mp4" },
                            { path: "/banlist", label: "Ban List", img: "./images/blazing.png", video: "./videos/blazing.mp4" },
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