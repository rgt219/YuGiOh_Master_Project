'use client';

import React, { useState, useEffect } from "react";
import { Offcanvas, Button } from 'react-bootstrap';
import NavVideoCard from "@/components/NavVideoCard";
import DecksGrid from "@/components/DecksGrid";
import TrendingCards from "@/components/TrendingCards";
import Footer from "@/components/Footer";
import LiveTicker from "@/components/LiveTicker";
import '@/mdstyles.css';

const CDN_BASE_URL = process.env.NEXT_PUBLIC_CDN_URL;

export default function Home({ user }) {
    const [decks, setDecks] = useState([]);
    const [decklist, setDeckList] = useState([]);
    const [showTickerDrawer, setShowTickerDrawer] = useState(false);
    const [showTrendingDrawer, setShowTrendingDrawer] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    const heroVideos = [
        `${CDN_BASE_URL}/videos/mdgameplay.mp4`,
        `${CDN_BASE_URL}/videos/duelingbook.mp4`
    ];
    const [activeVideoIndex, setActiveVideoIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveVideoIndex(prev => (prev + 1) % heroVideos.length);
        }, 6000); 
        return () => clearInterval(interval);
    }, [heroVideos.length]);

    useEffect(() => {
        fetch("/decks.json") 
            .then(response => response.json())
            .then(data => setDecks(data))
            .catch(err => console.warn("Could not load decks.json:", err));
    }, []);

    const toggleDeckList = (deckId) => {
        setDeckList(prev => prev.includes(deckId) ? prev.filter(id => id !== deckId) : [...prev, deckId]);
    };

    return (
        <div className="md-theme-bg" style={{ backgroundColor: '#06080c', minHeight: '100vh', overflowX: 'hidden', fontFamily: "'Cascadia Mono', monospace" }}>
            
            {/* 🚀 PERMANENT SLIDING DRAWERS (Set to exactly 50% screen width) */}
            {/* Left Edge Tab */}
            <Button 
                variant="info" 
                className="position-fixed shadow-lg border border-info border-start-0" 
                style={{ top: '50%', left: '0', transform: 'translateY(-50%)', zIndex: 1040, writingMode: 'vertical-rl', textOrientation: 'mixed', borderRadius: '0 8px 8px 0', padding: '15px 5px', letterSpacing: '2px', backgroundColor: 'rgba(8, 12, 20, 0.9)' }}
                onClick={() => setShowTickerDrawer(true)}
            >
                LIVE ACTIVITY ⏵
            </Button>

            {/* Right Edge Tab */}
            <Button 
                variant="warning" 
                className="position-fixed shadow-lg border border-warning border-end-0" 
                style={{ top: '50%', right: '0', transform: 'translateY(-50%) rotate(180deg)', zIndex: 1040, writingMode: 'vertical-rl', textOrientation: 'mixed', borderRadius: '0 8px 8px 0', padding: '15px 5px', letterSpacing: '2px', backgroundColor: 'rgba(8, 12, 20, 0.9)', color: '#ffc107' }}
                onClick={() => setShowTrendingDrawer(true)}
            >
                ⏴ TRENDING CARDS
            </Button>

            {/* The Animated Left Drawer (50vw width) */}
            <Offcanvas show={showTickerDrawer} onHide={() => setShowTickerDrawer(false)} placement="start" style={{ backgroundColor: '#0a0d14', borderRight: '1px solid #00f2ff', width: '50vw' }}>
                <Offcanvas.Header closeButton closeVariant="white">
                    <Offcanvas.Title className="text-info fw-bold" style={{ letterSpacing: '1px' }}>LIVE ACTIVITY</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="p-3">
                    <LiveTicker />
                </Offcanvas.Body>
            </Offcanvas>

            {/* The Animated Right Drawer (50vw width) */}
            <Offcanvas show={showTrendingDrawer} onHide={() => setShowTrendingDrawer(false)} placement="end" style={{ backgroundColor: '#0a0d14', borderLeft: '1px solid #ffc107', width: '50vw' }}>
                <Offcanvas.Header closeButton closeVariant="white">
                    <Offcanvas.Title className="text-warning fw-bold" style={{ letterSpacing: '1px' }}>TRENDING METAGAME</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="p-0">
                    <TrendingCards />
                </Offcanvas.Body>
            </Offcanvas>

            {/* HERO SECTION */}
            <div className="container-fluid px-4 px-md-5" style={{ paddingTop: '120px' }}>
                <div className="row align-items-center mb-5 mx-auto" style={{ maxWidth: '1400px' }}>
                    <div className="col-lg-6 mb-5 mb-lg-0 pe-lg-5">
                        <h1 className="fw-extrabold text-white mb-2" style={{ fontSize: 'clamp(3rem, 5vw, 5rem)', lineHeight: '1.1', letterSpacing: '-1px' }}>
                            Welcome to <br />
                            <span style={{ color: '#00d2ff', textShadow: '0 0 20px rgba(0, 210, 255, 0.4)' }}>ErreGeTe YGO!</span>
                        </h1>
                        <h3 className="text-white-50 mt-4 mb-4 fw-light" style={{ fontSize: '1.5rem' }}>
                            Your <strong className="text-white border-bottom border-info border-2">Comprehensive Compendium</strong> of Yu-Gi-Oh Meta Strategies and Deck Building.
                        </h3>
                    </div>

                    <div className="col-lg-6">
                        <div className="rounded-4 shadow-lg overflow-hidden position-relative" style={{ height: '350px', border: '1px solid rgba(0, 210, 255, 0.3)', backgroundColor: '#0a0d14' }}>
                            {heroVideos.map((videoSrc, idx) => (
                                <video
                                    key={idx}
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    style={{
                                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                        objectFit: 'cover', opacity: activeVideoIndex === idx ? 1 : 0, transition: 'opacity 1s ease-in-out'
                                    }}
                                >
                                    <source src={videoSrc} type="video/mp4" />
                                </video>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* THREE-COLUMN FEATURE ROW */}
            <div className="border-top border-bottom border-info border-opacity-25 bg-black bg-opacity-50 py-5">
                <div className="container mx-auto" style={{ maxWidth: '1400px' }}>
                    <div className="row text-white text-center text-md-start px-3">
                        <div className="col-md-4 px-4 mb-4 mb-md-0 border-end border-info border-opacity-25">
                            <h2 className="text-info fw-bold d-flex align-items-center justify-content-center justify-content-md-start gap-2">Join our community!</h2>
                            <p className="text-white-50 mt-3 small"><strong className="text-white">Connect in general and competitive chats</strong> to share strategies, discuss matchups, and find your next tournament team.</p>
                        </div>
                        <div className="col-md-4 px-4 mb-4 mb-md-0 border-end border-info border-opacity-25">
                            <h2 className="text-warning fw-bold d-flex align-items-center justify-content-center justify-content-md-start gap-2">Build like a Pro!</h2>
                            <p className="text-white-50 mt-3 small"><strong className="text-white">Use the interactive deck builder</strong> to construct, refine, and test your custom decklists against live lists effortlessly.</p>
                        </div>
                        <div className="col-md-4 px-4">
                            <h2 className="text-primary fw-bold d-flex align-items-center justify-content-center justify-content-md-start gap-2">Stay Up to Date!</h2>
                            <p className="text-white-50 mt-3 small"><strong className="text-white">Check the ban list page</strong> for real-time format shifts, restrictions, and updates across TCG and OCG formats.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🚀 GAP-FREE CENTERED VIDEO PANELS */}
            <div className="container-fluid px-4 px-xxl-5 mt-4">
                <div className="row justify-content-center">
                    
                    <div className="col-12 col-xl-10 col-xxl-8 mb-5">
                        
                        {/* 1. DECK BUILDER SECTION */}
                        <div className="container md-content-panel position-relative d-flex align-items-center p-0 mb-3 shadow-lg" style={{ backgroundColor: '#0a0d14', overflow: 'hidden', minHeight: '728px', borderRadius: '6px', border: '1px solid rgba(0, 210, 255, 0.3)', marginTop: "-25px"}}>
                            <video autoPlay muted loop playsInline poster={`${CDN_BASE_URL}/videos/encounter_poster.png`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0.35 }}>
                                <source src={`${CDN_BASE_URL}/videos/encounter_short.mp4`} type="video/mp4" />
                            </video>
                            <div className="container position-relative w-100 py-5" style={{ zIndex: 2, maxWidth: '1050px' }}>
                                <div className="row align-items-center mx-0 w-100">
                                    <div className="col-md-5 mb-4 mb-md-0 d-flex justify-content-center justify-content-md-start">
                                        <div style={{ width: '100%', maxWidth: '400px' }}>
                                            <NavVideoCard link={{ path: "/deckbuilder", label: "DECK BUILDER", img: "/images/albaz.jpg", video: `${CDN_BASE_URL}/videos/albaz.mp4` }} />
                                        </div>
                                    </div>
                                    <div className="col-md-6 offset-md-1 text-center text-md-start">
                                        <h2 className="fw-bold mb-3" style={{ fontSize: '2rem', color: '#00d2ff', textShadow: '0 0 15px rgba(0,210,255,0.3)' }}><span className="text-warning">Deck Builder</span></h2>
                                        <p className="text-white fs-6 mb-3" style={{ lineHeight: '1.6' }}>Construct, refine, and validate your custom decks instantly against live OCG and TCG banlists. Seamlessly import your YDK files, analyze card synergies, and optimize your overall strategy with our high-speed integrations.</p>
                                        <h5 className="text-white fw-bold mb-3 border-bottom border-info border-2 d-inline-block pb-2">Are you ready to test your meta breakers?</h5>
                                        <p className="text-white-50 small mt-1 mb-0">Jump in and start crafting your ultimate deck setup now.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                         {/* 2. META DECKS SECTION */}
                        <div className="container md-content-panel position-relative d-flex align-items-center p-0 mb-3 shadow-lg" style={{ backgroundColor: '#0a0d14', overflow: 'hidden', minHeight: '728px', borderRadius: '6px', border: '1px solid rgba(0, 210, 255, 0.3)' }}>
                            <video autoPlay muted loop playsInline poster={`${CDN_BASE_URL}/videos/albion_poster.png`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0.35 }}>
                                <source src={`${CDN_BASE_URL}/videos/albion_short.mp4`} type="video/mp4" />
                            </video>
                            <div className="container position-relative w-100 py-5" style={{ zIndex: 2, maxWidth: '1050px' }}>
                                <div className="row align-items-center mx-0 w-100">
                                    <div className="col-md-6 text-center text-md-start mb-4 mb-md-0">
                                        <h1 className="fw-bold mb-3" style={{ fontSize: '2rem', color: '#00d2ff', textShadow: '0 0 15px rgba(0,210,255,0.3)' }}><span className="text-warning">Meta Decks</span></h1>
                                        <p className="text-white fs-6 mb-3" style={{ lineHeight: '1.6' }}>Analyze the current tournament tier lists, breakdown championship-winning ratios, and inspect core combo lines. Stay ahead of the shifting meta with precise statistical insights and optimal tech choices.</p>
                                        <h5 className="text-white fw-bold mb-3 border-bottom border-info border-2 d-inline-block pb-2">Ready to master the tier 1 strategies?</h5>
                                        <p className="text-white-50 small mt-1 mb-0">Explore top tournament lists and optimize your competitive matches.</p>
                                    </div>
                                    <div className="col-md-5 offset-md-1 d-flex justify-content-center justify-content-md-end">
                                        <div style={{ width: '100%', maxWidth: '400px' }}>
                                            <NavVideoCard link={{ path: "/meta-decks", label: "META DECKS", img: "/images/mirrorjade.jpg", video: `${CDN_BASE_URL}/videos/mirrorjade.mp4` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. CARD SEARCH SECTION */}
                        <div className="container md-content-panel position-relative d-flex align-items-center p-0 mb-3 shadow-lg" style={{ backgroundColor: '#0a0d14', overflow: 'hidden', minHeight: '728px', borderRadius: '6px', border: '1px solid rgba(0, 210, 255, 0.3)' }}>
                            <video autoPlay muted loop playsInline poster={`${CDN_BASE_URL}/videos/incredible_poster.png`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0.35 }}>
                                <source src={`${CDN_BASE_URL}/videos/incredible_short.mp4`} type="video/mp4" />
                            </video>
                            <div className="container position-relative w-100 py-5" style={{ zIndex: 2, maxWidth: '1050px' }}>
                                <div className="row align-items-center mx-0 w-100">
                                    <div className="col-md-5 mb-4 mb-md-0 d-flex justify-content-center justify-content-md-start">
                                        <div style={{ width: '100%', maxWidth: '400px' }}>
                                            <NavVideoCard link={{ path: "/cardsearch", label: "CARD SEARCH", img: "/images/darkdragon.jpg", video: `${CDN_BASE_URL}/videos/darkdragon.mp4` }} />
                                        </div>
                                    </div>
                                    <div className="col-md-6 offset-md-1 text-center text-md-start">
                                        <h2 className="fw-bold mb-3" style={{ fontSize: '2rem', color: '#00d2ff', textShadow: '0 0 15px rgba(0,210,255,0.3)' }}><span className="text-warning">Card Search</span></h2>
                                        <p className="text-white fs-6 mb-3" style={{ lineHeight: '1.6' }}>Search through thousands of cards instantly using powerful filters for attributes, types, archetypes, and banlist statuses. Find exactly what you need to complete your masterpiece strategy.</p>
                                        <h5 className="text-white fw-bold mb-3 border-bottom border-info border-2 d-inline-block pb-2">Looking for the ultimate tech card?</h5>
                                        <p className="text-white-50 small mt-1 mb-0">Use our high-speed database search to discover hidden synergies.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4. BAN LIST SECTION */}
                        <div className="container md-content-panel position-relative d-flex align-items-center p-0 mb-3 shadow-lg" style={{ backgroundColor: '#0a0d14', overflow: 'hidden', minHeight: '728px', borderRadius: '6px', border: '1px solid rgba(0, 210, 255, 0.3)' }}>
                            <video autoPlay muted loop playsInline poster={`${CDN_BASE_URL}/videos/iris_poster.png`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0.35 }}>
                                <source src={`${CDN_BASE_URL}/videos/iris_short.mp4`} type="video/mp4" />
                            </video>
                            <div className="container position-relative w-100 py-5" style={{ zIndex: 2, maxWidth: '1050px' }}>
                                <div className="row align-items-center mx-0 w-100">
                                    <div className="col-md-6 text-center text-md-start mb-4 mb-md-0">
                                        <h2 className="fw-bold mb-3" style={{ fontSize: '2rem', color: '#00d2ff', textShadow: '0 0 15px rgba(0,210,255,0.3)' }}><span className="text-warning">Forbidden/Limited List</span></h2>
                                        <p className="text-white fs-6 mb-3" style={{ lineHeight: '1.6' }}>Keep your builds legal and tournament-ready with real-time updates for forbidden, limited, and semi-limited cards across both TCG and OCG formats. Never get caught off-guard by a format change again.</p>
                                        <h5 className="text-white fw-bold mb-3 border-bottom border-info border-2 d-inline-block pb-2">Check the latest restrictions before you duel?</h5>
                                        <p className="text-white-50 small mt-1 mb-0">Stay fully informed on current banlist fluctuations and adjustments.</p>
                                    </div>
                                    <div className="col-md-5 offset-md-1 d-flex justify-content-center justify-content-md-end">
                                        <div style={{ width: '100%', maxWidth: '400px' }}>
                                            <NavVideoCard link={{ path: "/banlist", label: "BAN LIST", img: "/images/blazing.png", video: `${CDN_BASE_URL}/videos/blazing.mp4` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 5. FORUMS SECTION */}
                        <div className="container md-content-panel position-relative d-flex align-items-center p-0 mb-3 shadow-lg" style={{ backgroundColor: '#0a0d14', overflow: 'hidden', minHeight: '728px', borderRadius: '6px', border: '1px solid rgba(0, 210, 255, 0.3)' }}>
                            <video autoPlay muted loop playsInline poster={`${CDN_BASE_URL}/videos/bond_poster.png`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0.35 }}>
                                <source src={`${CDN_BASE_URL}/videos/bond_short.mp4`} type="video/mp4" />
                            </video>
                            <div className="container position-relative w-100 py-5" style={{ zIndex: 2, maxWidth: '1050px' }}>
                                <div className="row align-items-center mx-0 w-100">
                                    <div className="col-md-5 mb-4 mb-md-0 d-flex justify-content-center justify-content-md-start">
                                        <div style={{ width: '100%', maxWidth: '400px' }}>
                                            <NavVideoCard link={{ path: "/generaldiscussion", label: "FORUMS", img: "/images/sanctifire.png", video: `${CDN_BASE_URL}/videos/sanctifire.mp4` }} />
                                        </div>
                                    </div>
                                    <div className="col-md-6 offset-md-1 text-center text-md-start">
                                        <h2 className="fw-bold mb-3" style={{ fontSize: '2rem', color: '#00d2ff', textShadow: '0 0 15px rgba(0,210,255,0.3)' }}>Duelist <span className="text-warning">Forums</span></h2>
                                        <p className="text-white fs-6 mb-3" style={{ lineHeight: '1.6' }}>Engage in deep tactical discussions, share innovative deck cores, and connect with other builders. Post your custom replays, exchange side-deck tech ideas, and collaborate on cutting-edge strategies.</p>
                                        <h5 className="text-white fw-bold mb-3 border-bottom border-info border-2 d-inline-block pb-2">Have a brilliant deck strategy to share with everyone?</h5>
                                        <p className="text-white-50 small mt-1 mb-0">Jump into the discussion boards and exchange knowledge with fellow duelists.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 6. COMMUNITY SECTION */}
                        <div className="container md-content-panel position-relative d-flex align-items-center p-0 mb-3 shadow-lg" style={{ backgroundColor: '#0a0d14', overflow: 'hidden', minHeight: '728px', borderRadius: '6px', border: '1px solid rgba(0, 210, 255, 0.3)' }}>
                            <video autoPlay muted loop playsInline poster={`${CDN_BASE_URL}/videos/nexus_poster.png`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0.35 }}>
                                <source src={`${CDN_BASE_URL}/videos/nexus_short.mp4`} type="video/mp4" />
                            </video>
                            <div className="container position-relative w-100 py-5" style={{ zIndex: 2, maxWidth: '1050px' }}>
                                <div className="row align-items-center mx-0 w-100">
                                    <div className="col-md-6 text-center text-md-start mb-4 mb-md-0">
                                        <h2 className="fw-bold mb-3" style={{ fontSize: '2rem', color: '#00d2ff', textShadow: '0 0 15px rgba(0,210,255,0.3)' }}>ErreGeTe <span className="text-warning">Community</span></h2>
                                        <p className="text-white fs-6 mb-3" style={{ lineHeight: '1.6' }}>Connect with duelists from across the globe in our general forums, or test your skills in dedicated competitive discussions. Share rogue strategies, debate banlist impacts, and find your next tournament crew.</p>
                                        <h5 className="text-white fw-bold mb-3 border-bottom border-info border-2 d-inline-block pb-2">Ready to join the discussion and prove your meta knowledge?</h5>
                                        <p className="text-white-50 small mt-1 mb-0">Dive into the forums and collaborate with top duelists today.</p>
                                    </div>
                                    <div className="col-md-5 offset-md-1 d-flex justify-content-center justify-content-md-end">
                                        <div style={{ width: '100%', maxWidth: '400px' }}>
                                            <NavVideoCard link={{ path: "/community", label: "COMMUNITY", img: "/images/bystialLubellion.png", video: `${CDN_BASE_URL}/videos/bystialLubellion.mp4` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 7. ABOUT SECTION */}
                        <div className="container md-content-panel position-relative d-flex align-items-center p-0 mb-3 shadow-lg" style={{ backgroundColor: '#0a0d14', overflow: 'hidden', minHeight: '728px', borderRadius: '6px', border: '1px solid rgba(0, 210, 255, 0.3)' }}>
                            <video autoPlay muted loop playsInline poster={`${CDN_BASE_URL}/videos/brigrand_poster.png`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0.35 }}>
                                <source src={`${CDN_BASE_URL}/videos/brigrand_short.mp4`} type="video/mp4" />
                            </video>
                            <div className="container position-relative w-100 py-5" style={{ zIndex: 2, maxWidth: '1050px' }}>
                                <div className="row align-items-center mx-0 w-100">
                                    <div className="col-md-5 mb-4 mb-md-0 d-flex justify-content-center justify-content-md-start">
                                        <div style={{ width: '100%', maxWidth: '400px' }}>
                                            <NavVideoCard link={{ path: "/about", label: "ABOUT", img: "/images/thunderbolt.png", video: `${CDN_BASE_URL}/videos/thunderbolt.mp4` }} />
                                        </div>
                                    </div>
                                    <div className="col-md-6 offset-md-1 text-center text-md-start">
                                        <h2 className="fw-bold mb-3" style={{ fontSize: '2rem', color: '#00d2ff', textShadow: '0 0 15px rgba(0,210,255,0.3)' }}><span className="text-warning">Behind the Developer</span></h2>
                                        <p className="text-white fs-6 mb-3" style={{ lineHeight: '1.6' }}>How long do you spend setting up your coding environment or manually looking up card banlist statuses without being happy? It's time to change that, learn the tricks, features, and meta integrations to speed up your workflow!</p>
                                        <h5 className="text-white fw-bold mb-3 border-bottom border-info border-2 d-inline-block pb-2">How often have you optimized your deck structures?</h5>
                                        <p className="text-white-50 small mt-1 mb-0">Is it time you improved how quickly you craft?</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 8. CONTACT SECTION */}
                        <div className="container md-content-panel position-relative d-flex align-items-center p-0 mb-3 shadow-lg" style={{ backgroundColor: '#0a0d14', overflow: 'hidden', minHeight: '728px', borderRadius: '6px', border: '1px solid rgba(0, 210, 255, 0.3)' }}>
                            <video autoPlay muted loop playsInline poster={`${CDN_BASE_URL}/videos/shuraig_poster.png`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0.35 }}>
                                <source src={`${CDN_BASE_URL}/videos/shuraig_short.mp4`} type="video/mp4" />
                            </video>
                            <div className="container position-relative w-100 py-5" style={{ zIndex: 2, maxWidth: '1050px' }}>
                                <div className="row align-items-center mx-0 w-100">
                                    <div className="col-md-6 text-center text-md-start mb-4 mb-md-0">
                                        <h2 className="fw-bold mb-3" style={{ fontSize: '2rem', color: '#00d2ff', textShadow: '0 0 15px rgba(0,210,255,0.3)' }}><span className="text-warning">Contact & Support</span></h2>
                                        <p className="text-white fs-6 mb-3" style={{ lineHeight: '1.6' }}>Have questions about your deck integrations, API syncing, or need technical support with your environment? Whether you are reporting a bug or requesting a new feature, our team is here to ensure your Master Duel logic runs flawlessly.</p>
                                        <h5 className="text-white fw-bold mb-3 border-bottom border-info border-2 d-inline-block pb-2">Encountered a critical error or have a suggestion?</h5>
                                        <p className="text-white-50 small mt-1 mb-0">Reach out and let us help you optimize your experience.</p>
                                    </div>
                                    <div className="col-md-5 offset-md-1 d-flex justify-content-center justify-content-md-end">
                                        <div style={{ width: '100%', maxWidth: '400px' }}>
                                            <NavVideoCard link={{ path: "/contact", label: "CONTACT", img: "/images/aluber.png", video: `${CDN_BASE_URL}/videos/aluber.mp4` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* BOTTOM SECTION: Decks Grid */}
            <div className="container-fluid px-4 px-xxl-5 mt-2">
                <hr className="border-info opacity-25 mb-4" />
                <section className="mb-4">
                    <DecksGrid decks={decks} decklist={decklist} toggleDeckList={toggleDeckList} />
                </section>
            </div>
            
            <Footer />
        </div>
    );
}