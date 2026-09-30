'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Offcanvas, Button } from 'react-bootstrap';
import TrendingCards from '@/components/TrendingCards';
import Footer from '@/components/Footer';
import LiveTicker from '@/components/LiveTicker';
import BackgroundVideos from '@/components/home/BackgroundVideos';
import HeroVideo from '@/components/home/HeroVideo';
import MotionToggle from '@/components/home/MotionToggle';
import FeaturePanel from '@/components/home/FeaturePanel';
import DecksSection from '@/components/home/DecksSection';
import { HERO_VIDEOS, PANELS } from '@/components/home/homeData';
import '@/mdstyles.css';
import '@/components/home/home.css';

/**
 * Home page. The heavy or fast-changing parts live in their own components so they re-render alone:
 *   BackgroundVideos  scroll-driven background (owns the scroll position)
 *   HeroVideo         the framed cross-fading video (owns its timer)
 *   DecksSection      the deck grid (owns the deck list)
 * This component only keeps the two drawers' open/closed state, so it almost never re-renders.
 *
 * Sections tagged data-bg="..." tell BackgroundVideos which video belongs to that part of the page.
 */
export default function Home() {
    const [showTickerDrawer, setShowTickerDrawer] = useState(false);
    const [showTrendingDrawer, setShowTrendingDrawer] = useState(false);

    return (
        <div className="md-theme-bg home-root">
            <BackgroundVideos />
            <MotionToggle />

            {/* Edge tabs (desktop) */}
            <Button
                variant="info"
                aria-label="Open live activity"
                className="home-edge-tab home-edge-tab--left position-fixed shadow-lg border border-info border-start-0 d-none d-md-block"
                onClick={() => setShowTickerDrawer(true)}
            >
                LIVE ACTIVITY ⏵
            </Button>
            <Button
                variant="warning"
                aria-label="Open trending cards"
                className="home-edge-tab home-edge-tab--right position-fixed shadow-lg border border-warning border-end-0 d-none d-md-block"
                onClick={() => setShowTrendingDrawer(true)}
            >
                ⏴ TRENDING CARDS
            </Button>

            <Offcanvas show={showTickerDrawer} onHide={() => setShowTickerDrawer(false)} placement="start" className="home-drawer home-drawer--left">
                <Offcanvas.Header closeButton closeVariant="white">
                    <Offcanvas.Title className="text-info fw-bold" style={{ letterSpacing: '1px' }}>LIVE ACTIVITY</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="p-3">
                    <LiveTicker />
                </Offcanvas.Body>
            </Offcanvas>

            <Offcanvas show={showTrendingDrawer} onHide={() => setShowTrendingDrawer(false)} placement="end" className="home-drawer home-drawer--right">
                <Offcanvas.Header closeButton closeVariant="white">
                    <Offcanvas.Title className="text-warning fw-bold" style={{ letterSpacing: '1px' }}>TRENDING METAGAME</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="p-0">
                    <TrendingCards />
                </Offcanvas.Body>
            </Offcanvas>

            {/* HERO */}
            <div data-bg="hero" className="home-hero container-fluid px-3 px-md-5 position-relative">
                <div className="row align-items-center mb-4 mb-md-5 mx-auto home-wrap">
                    <div className="col-lg-6 mb-4 mb-lg-0 pe-lg-5 text-center text-lg-start">
                        <h1 className="home-hero__title fw-bolder text-white mb-2">
                            Master the Meta with <br />
                            <span className="home-hero__brand">ErreGeTe YGO!</span>
                        </h1>

                        <p className="home-hero__lead text-white-50 mt-3 mb-4 fw-light">
                            Your <strong className="text-white border-bottom border-info border-2">Comprehensive Compendium</strong> of Yu-Gi-Oh Meta Strategies and Deck Building.
                        </p>

                        <div className="d-flex flex-column flex-sm-row justify-content-center justify-content-lg-start gap-3 mb-4">
                            <Button as={Link} href="/deckbuilder" variant="outline-info" size="lg" className="fw-bold terminal-font shadow-lg px-4 py-3" style={{ letterSpacing: '1px' }}>
                                START DECK BUILDER
                            </Button>
                            <Button as={Link} href="/meta-decks" variant="outline-light" size="lg" className="fw-bold terminal-font px-4 py-3 border-2" style={{ letterSpacing: '1px' }}>
                                VIEW TIER LIST
                            </Button>
                        </div>

                        {/* Phones have no edge tabs, so the drawers get buttons here */}
                        <div className="d-flex d-md-none justify-content-center gap-2 mb-4">
                            <Button variant="outline-info" className="terminal-font" onClick={() => setShowTickerDrawer(true)}>LIVE ACTIVITY</Button>
                            <Button variant="outline-warning" className="terminal-font" onClick={() => setShowTrendingDrawer(true)}>TRENDING CARDS</Button>
                        </div>

                        <ul className="list-unstyled d-flex flex-wrap justify-content-center justify-content-lg-start align-items-center gap-3 pt-3 mb-0 border-top border-secondary border-opacity-25">
                            {['Live Banlist', 'Live Prices', '12K+ Cards'].map((label) => (
                                <li key={label} className="text-white-50 small d-flex align-items-center gap-1">
                                    <span className="text-info" aria-hidden="true">✓</span> {label}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="col-lg-6">
                        <HeroVideo sources={HERO_VIDEOS} />
                    </div>
                </div>
            </div>

            {/* THREE-COLUMN FEATURE ROW */}
            <div data-bg="hero" className="home-features border-top border-bottom border-info border-opacity-25 bg-black bg-opacity-75 py-4 py-md-5 position-relative">
                <div className="home-wrap">
                    <div className="row text-white text-center text-md-start px-2 px-md-3">
                        <div className="home-feature col-md-4 px-3 mb-4 mb-md-0">
                            <h2 className="h5 text-info fw-bold">Join our community!</h2>
                            <p className="text-white-50 mt-2 small"><strong className="text-white">Connect in general chats</strong> to share strategies, discuss matchups, and find your tournament crew.</p>
                        </div>
                        <div className="home-feature col-md-4 px-3 mb-4 mb-md-0">
                            <h2 className="h5 text-warning fw-bold">Build like a Pro!</h2>
                            <p className="text-white-50 mt-2 small"><strong className="text-white">Use the interactive builder</strong> to construct, refine, and test your decklists effortlessly.</p>
                        </div>
                        <div className="home-feature col-md-4 px-3">
                            <h2 className="h5 text-primary fw-bold">Stay Up to Date!</h2>
                            <p className="text-white-50 mt-2 small"><strong className="text-white">Check the ban list page</strong> for real-time format shifts and restrictions across TCG/OCG.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* SCROLL PANELS */}
            <div className="home-wrap mt-4 mt-md-5 mb-5 position-relative home-layer">
                {PANELS.map((panel) => <FeaturePanel key={panel.id} panel={panel} />)}
            </div>

            {/* BOTTOM: opaque, so the background videos are switched off here */}
            <div data-bg="off" className="home-bottom mt-2 pt-4 pt-md-5 position-relative home-layer">
                <div className="home-wrap">
                    <hr className="border-info opacity-25 mb-4 mb-md-5" />
                    <DecksSection />
                    <Footer />
                </div>
            </div>
        </div>
    );
}
