'use client';

import React, { useState, useEffect, useRef, Link } from "react";
import { Offcanvas, Button } from 'react-bootstrap';
import NavVideoCard from "@/components/NavVideoCard";
import DecksGrid from "@/components/DecksGrid";
import TrendingCards from "@/components/TrendingCards";
import Footer from "@/components/Footer";
import LiveTicker from "@/components/LiveTicker";
import '@/mdstyles.css';

const CDN_BASE_URL = process.env.NEXT_PUBLIC_CDN_URL;

const panelsData = [
    {
        id: "deckbuilder", navPath: "/deckbuilder", navLabel: "DECK BUILDER", navImg: "/images/albaz.jpg", navVideo: "albaz.mp4", bgVideo: "encounter_short.mp4", bgPoster: "encounter_poster.png",
        title: <> Deck Builder </>,
        desc: "Construct, refine, and validate your custom decks instantly against live OCG and TCG banlists. Seamlessly import your YDK files, analyze card synergies, and optimize your overall strategy with our high-speed integrations.",
        subTitle: "Are you ready to test your meta breakers?", subDesc: "Jump in and start crafting your ultimate deck setup now.",
        imgRight: false
    },
    {
        id: "metadecks", navPath: "/meta-decks", navLabel: "META DECKS", navImg: "/images/mirrorjade.jpg", navVideo: "mirrorjade.mp4", bgVideo: "albion_short.mp4", bgPoster: "albion_poster.png",
        title: <> <span className="text-warning">Meta Decks</span></>,
        desc: "Analyze the current tournament tier lists, breakdown championship-winning ratios, and inspect core combo lines. Stay ahead of the shifting meta with precise statistical insights and optimal tech choices.",
        subTitle: "Ready to master the tier 1 strategies?", subDesc: "Explore top tournament lists and optimize your competitive matches.",
        imgRight: true
    },
    {
        id: "market-listings", 
        navPath: "/market-listings", 
        navLabel: "MARKET LISTINGS", 
        navImg: "/images/thunderbolt.png", 
        navVideo: "thunderbolt.mp4", 
        bgVideo: "brigrand_short.mp4", 
        bgPoster: "brigrand_poster.png",
        title: <>Live <span className="text-warning">Market Listings</span></>,
        desc: "Track real-time card prices, market fluctuations, and printing values across major exchanges. Whether you are optimizing a budget build or monitoring the value of your ultimate collection, our live pricing widgets ensure you never overpay for your tech cards.",
        subTitle: "Want to secure your staples before the next buyout?", 
        subDesc: "Analyze live pricing trends and build without breaking the bank.",
        imgRight: false
    },
    {
        id: "banlist", navPath: "/banlist", navLabel: "BAN LIST", navImg: "/images/blazing.png", navVideo: "blazing.mp4", bgVideo: "iris_short.mp4", bgPoster: "iris_poster.png",
        title: <> <span className="text-warning">Forbidden/Limited List</span></>,
        desc: "Keep your builds legal and tournament-ready with real-time updates for forbidden, limited, and semi-limited cards across both TCG and OCG formats. Never get caught off-guard by a format change again.",
        subTitle: "Check the latest restrictions before you duel?", subDesc: "Stay fully informed on current banlist fluctuations and adjustments.",
        imgRight: true
    },
    {
        id: "forums", navPath: "/generaldiscussion", navLabel: "FORUMS", navImg: "/images/sanctifire.png", navVideo: "sanctifire.mp4", bgVideo: "bond_short.mp4", bgPoster: "bond_poster.png",
        title: <>Duelist Forums</>,
        desc: "Engage in deep tactical discussions, share innovative deck cores, and connect with other builders. Post your custom replays, exchange side-deck tech ideas, and collaborate on cutting-edge strategies.",
        subTitle: "Have a brilliant deck strategy to share with everyone?", subDesc: "Jump into the discussion boards and exchange knowledge with fellow duelists.",
        imgRight: false
    },
    {
        id: "community", navPath: "/community", navLabel: "COMMUNITY", navImg: "/images/bystialLubellion.png", navVideo: "bystialLubellion.mp4", bgVideo: "nexus_short.mp4", bgPoster: "nexus_poster.png",
        title: <><span className="text-warning">Community</span></>,
        desc: "Connect with duelists from across the globe in our general forums, or test your skills in dedicated competitive discussions. Share rogue strategies, debate banlist impacts, and find your next tournament crew.",
        subTitle: "Ready to join the discussion and prove your meta knowledge?", subDesc: "Dive into the forums and collaborate with top duelists today.",
        imgRight: true
    },
    {
        id: "cardsearch", navPath: "/cardsearch", navLabel: "CARD SEARCH", navImg: "/images/darkdragon.jpg", navVideo: "darkdragon.mp4", bgVideo: "incredible_short.mp4", bgPoster: "incredible_poster.png",
        title: <>Card Search</>,
        desc: "Search through thousands of cards instantly using powerful filters for attributes, types, archetypes, and banlist statuses. Find exactly what you need to complete your masterpiece strategy.",
        subTitle: "Looking for the ultimate tech card?", subDesc: "Use our high-speed database search to discover hidden synergies.",
        imgRight: false
    },
    {
        id: "contact", navPath: "/contact", navLabel: "CONTACT", navImg: "/images/aluber.png", navVideo: "aluber.mp4", bgVideo: "shuraig_short.mp4", bgPoster: "shuraig_poster.png",
        title: <> <span className="text-warning">Contact & Support</span></>,
        desc: "Have questions about your deck integrations, API syncing, or need technical support with your environment? Whether you are reporting a bug or requesting a new feature, our team is here to ensure your Master Duel logic runs flawlessly.",
        subTitle: "Encountered a critical error or have a suggestion?", subDesc: "Reach out and let us help you optimize your experience.",
        imgRight: true
    }
];

export default function Home({ user }) {
    const [decks, setDecks] = useState([]);
    const [decklist, setDeckList] = useState([]);
    const [showTickerDrawer, setShowTickerDrawer] = useState(false);
    const [showTrendingDrawer, setShowTrendingDrawer] = useState(false);

    // Global Video Controller State & Refs
    const [activePanelIndex, setActivePanelIndex] = useState(-1);
    const sectionRefs = useRef([]);
    const heroRef = useRef(null);
    const bgVideoRefs = useRef([]);
    const heroBgVideoRef = useRef(null); 
    
    // Hero Top Video Crossfade
    const heroVideos = [`${CDN_BASE_URL}/videos/mdgameplay.mp4`, `${CDN_BASE_URL}/videos/duelingbook.mp4`];
    const [activeHeroVideoIndex, setActiveHeroVideoIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveHeroVideoIndex(prev => (prev + 1) % heroVideos.length);
        }, 6000); 
        return () => clearInterval(interval);
    }, [heroVideos.length]);

    useEffect(() => {
        fetch("/decks.json") 
            .then(response => response.json())
            .then(data => setDecks(data))
            .catch(err => console.warn("Could not load decks.json:", err));
    }, []);

    // Intersection Observer to track which section is currently on screen
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const index = Number(entry.target.dataset.index);
                    if (!isNaN(index)) setActivePanelIndex(index);
                }
            });
        }, { threshold: 0.5 }); 

        sectionRefs.current.forEach(ref => { if (ref) observer.observe(ref); });
        if (heroRef.current) observer.observe(heroRef.current);

        return () => observer.disconnect();
    }, []);

    // Performance Optimization: ONLY play the video that is currently active
    useEffect(() => {
        if (heroBgVideoRef.current) {
            if (activePanelIndex === -1) {
                heroBgVideoRef.current.play().catch(() => {});
            } else {
                heroBgVideoRef.current.pause();
            }
        }

        bgVideoRefs.current.forEach((vid, idx) => {
            if (vid) {
                if (idx === activePanelIndex) {
                    vid.play().catch(() => {});
                } else {
                    vid.pause();
                }
            }
        });
    }, [activePanelIndex]);

    const toggleDeckList = (deckId) => {
        setDeckList(prev => prev.includes(deckId) ? prev.filter(id => id !== deckId) : [...prev, deckId]);
    };

    return (
        <div className="md-theme-bg" style={{ backgroundColor: '#06080c', minHeight: '100vh', overflowX: 'hidden', fontFamily: "'Cascadia Mono', monospace", position: 'relative' }}>
            
            {/* 🚀 HIDDEN PRELOADER FOR NAV VIDEO CARDS (Eliminates first-hover delay) */}
            <div style={{ display: 'none', position: 'absolute', width: 0, height: 0, overflow: 'hidden', zIndex: -1 }}>
                {panelsData.map((panel) => (
                    <video key={`preload-${panel.id}`} src={`${CDN_BASE_URL}/videos/${panel.navVideo}`} preload="auto" muted playsInline />
                ))}
            </div>

            {/* 🚀 GLOBAL BACKGROUND VIDEO CONTROLLER */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' }}>
                
                {/* HERO BACKGROUND VIDEO */}
                <video
                    ref={heroBgVideoRef}
                    src={`${CDN_BASE_URL}/videos/temple.mp4`}
                    muted
                    loop
                    playsInline
                    style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        objectFit: 'cover',
                        opacity: activePanelIndex === -1 ? 0.30 : 0, 
                        transition: 'opacity 1s ease-in-out'
                    }}
                />

                {/* DYNAMIC PANEL BACKGROUND VIDEOS */}
                {panelsData.map((panel, idx) => (
                    <video
                        key={panel.id}
                        ref={(el) => (bgVideoRefs.current[idx] = el)}
                        src={`${CDN_BASE_URL}/videos/${panel.bgVideo}`}
                        poster={`${CDN_BASE_URL}/videos/${panel.bgPoster}`}
                        muted
                        loop
                        playsInline
                        style={{
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                            objectFit: 'cover',
                            opacity: activePanelIndex === idx ? 0.30 : 0, 
                            transition: 'opacity 1s ease-in-out' 
                        }}
                    />
                ))}
            </div>

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

            <Offcanvas show={showTickerDrawer} onHide={() => setShowTickerDrawer(false)} placement="start" style={{ backgroundColor: '#0a0d14', borderRight: '1px solid #00f2ff', width: '50vw' }}>
                <Offcanvas.Header closeButton closeVariant="white">
                    <Offcanvas.Title className="text-info fw-bold" style={{ letterSpacing: '1px' }}>LIVE ACTIVITY</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="p-3">
                    <LiveTicker />
                </Offcanvas.Body>
            </Offcanvas>

            <Offcanvas show={showTrendingDrawer} onHide={() => setShowTrendingDrawer(false)} placement="end" style={{ backgroundColor: '#0a0d14', borderLeft: '1px solid #ffc107', width: '50vw' }}>
                <Offcanvas.Header closeButton closeVariant="white">
                    <Offcanvas.Title className="text-warning fw-bold" style={{ letterSpacing: '1px' }}>TRENDING METAGAME</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="p-0">
                    <TrendingCards />
                </Offcanvas.Body>
            </Offcanvas>

            {/* HERO SECTION */}
            <div ref={heroRef} data-index={-1} className="container-fluid px-4 px-md-5 position-relative" style={{ paddingTop: '120px', zIndex: 1 }}>
                <div className="row align-items-center mb-5 mx-auto" style={{ maxWidth: '1400px' }}>
                    
                    <div className="col-lg-6 mb-5 mb-lg-0 pe-lg-5">
                        <h1 className="fw-extrabold text-white mb-2" style={{ fontSize: 'clamp(3rem, 5vw, 5rem)', lineHeight: '1.1', letterSpacing: '-1px' }}>
                            Master the Meta with <br />
                            <span style={{ color: '#00d2ff', textShadow: '0 0 20px rgba(0, 210, 255, 0.4)' }}>ErreGeTe YGO!</span>
                        </h1>
                        
                        <h3 className="text-white-50 mt-4 mb-5 fw-light" style={{ fontSize: '1.5rem' }}>
                            Your <strong className="text-white border-bottom border-info border-2">Comprehensive Compendium</strong> of Yu-Gi-Oh Meta Strategies and Deck Building.
                        </h3>
                        
                        {/* 🚀 New CTA Buttons */}
                        <div className="d-flex flex-wrap gap-3 mb-5">
                            <Button as={Link} href={'/deckbuilder'} variant="outline-info" size="lg" className="fw-bold terminal-font shadow-lg px-4 py-3" style={{ letterSpacing: '1px' }}>
                                START DECK BUILDER
                            </Button>
                            <Button as={Link} href={'/meta-decks'} variant="outline-light" size="lg" className="fw-bold terminal-font px-4 py-3 border-2" style={{ letterSpacing: '1px' }}>
                                VIEW TIER LIST
                            </Button>
                        </div>

                        {/* 🚀 New Trust Signals */}
                        <div className="d-flex flex-wrap align-items-center gap-4 pt-4 border-top border-secondary border-opacity-25">
                            <div className="text-white-50 small d-flex align-items-center gap-2">
                                <span className="text-info fs-5">✓</span> Live Banlist Sync
                            </div>
                            <div className="text-white-50 small d-flex align-items-center gap-2">
                                <span className="text-info fs-5">✓</span> Real-Time Card Prices
                            </div>
                            <div className="text-white-50 small d-flex align-items-center gap-2">
                                <span className="text-info fs-5">✓</span> 12K+ Card Database
                            </div>
                        </div>
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
                                        objectFit: 'cover', opacity: activeHeroVideoIndex === idx ? 1 : 0, transition: 'opacity 1s ease-in-out'
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
            <div className="border-top border-bottom border-info border-opacity-25 bg-black bg-opacity-75 py-5 position-relative" style={{ zIndex: 1 }}>
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

            {/* DYNAMIC SCROLL PANELS */}
            <div className="container-fluid px-4 px-xxl-5 mt-5 position-relative" style={{ zIndex: 1 }}>
                <div className="row justify-content-center">
                    <div className="col-12 col-xl-11 col-xxl-10 mb-5">
                        
                        {panelsData.map((panel, idx) => (
                            <div 
                                key={panel.id}
                                ref={(el) => (sectionRefs.current[idx] = el)}
                                data-index={idx}
                                className="container-fluid md-content-panel position-relative d-flex align-items-center p-0 mb-5 shadow-lg" 
                                style={{ 
                                    borderRadius: '8px', 
                                    border: '1px solid rgba(0, 210, 255, 0.2)', 
                                    backgroundColor: 'rgba(10, 13, 20, 0.75)',
                                    backdropFilter: 'blur(8px)',
                                    overflow: 'hidden'
                                }}
                            >
                                <div className="container position-relative w-100 py-5 py-xl-6" style={{ maxWidth: '1400px' }}>
                                    <div className="row align-items-center mx-0 w-100">
                                        
                                        {!panel.imgRight ? (
                                            <>
                                                <div className="col-md-5 mb-4 mb-md-0 d-flex justify-content-center justify-content-md-start">
                                                    <div style={{ width: '100%', maxWidth: '400px' }}>
                                                        <NavVideoCard link={{ path: panel.navPath, label: panel.navLabel, img: panel.navImg, video: `${CDN_BASE_URL}/videos/${panel.navVideo}` }} />
                                                    </div>
                                                </div>
                                                <div className="col-md-6 offset-md-1 text-center text-md-start">
                                                    <h2 className="fw-bold mb-3" style={{ fontSize: '2.5rem', color: '#00d2ff', textShadow: '0 0 15px rgba(0,210,255,0.3)' }}>{panel.title}</h2>
                                                    <p className="text-white fs-5 mb-4" style={{ lineHeight: '1.6' }}>{panel.desc}</p>
                                                    <h5 className="text-white fw-bold mb-3 border-bottom border-info border-2 d-inline-block pb-2">{panel.subTitle}</h5>
                                                    <p className="text-white-50 small mt-1 mb-0">{panel.subDesc}</p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="col-md-6 text-center text-md-start mb-4 mb-md-0">
                                                    <h2 className="fw-bold mb-3" style={{ fontSize: '2.5rem', color: '#00d2ff', textShadow: '0 0 15px rgba(0,210,255,0.3)' }}>{panel.title}</h2>
                                                    <p className="text-white fs-5 mb-4" style={{ lineHeight: '1.6' }}>{panel.desc}</p>
                                                    <h5 className="text-white fw-bold mb-3 border-bottom border-info border-2 d-inline-block pb-2">{panel.subTitle}</h5>
                                                    <p className="text-white-50 small mt-1 mb-0">{panel.subDesc}</p>
                                                </div>
                                                <div className="col-md-5 offset-md-1 d-flex justify-content-center justify-content-md-end">
                                                    <div style={{ width: '100%', maxWidth: '400px' }}>
                                                        <NavVideoCard link={{ path: panel.navPath, label: panel.navLabel, img: panel.navImg, video: `${CDN_BASE_URL}/videos/${panel.navVideo}` }} />
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        
                                    </div>
                                </div>
                            </div>
                        ))}

                    </div>
                </div>
            </div>

            {/* BOTTOM SECTION: Decks Grid */}
            <div className="container-fluid px-4 px-xxl-5 mt-2 pt-5 position-relative" style={{ zIndex: 1, backgroundColor: '#06080c' }}>
                <hr className="border-info opacity-25 mb-5" />
                <section className="mb-4">
                    <DecksGrid decks={decks} decklist={decklist} toggleDeckList={toggleDeckList} />
                </section>
                <Footer />
            </div>
            
        </div>
    );
}