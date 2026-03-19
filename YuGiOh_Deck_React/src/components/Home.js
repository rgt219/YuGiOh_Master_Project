import React, { useState, useEffect } from "react";
import Carousel from 'react-bootstrap/Carousel';
import Card from 'react-bootstrap/Card'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import DecksGrid from "./DecksGrid";
import DeckList from "./DeckList";
import DeckDetails from "./DeckDetails";
import Login from "./Login";
import DeckBuilder from "./DeckBuilder";
import { Container, Row, Col } from "react-bootstrap";
import TrendingCards from "./TrendingCards";
import Footer from "./Footer";
//import DecksGrid from "./components/DecksGrid";


export default function Home({user}) {
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
        )
    }
    return (
        <>
        <div className="md-theme-bg">
            <Carousel className="md-carousel border-bottom border-info" style={{ width: "100%", height: "515px" }}>
                <Carousel.Item>
                    <img className='d-block w-100' src='./images/ygoss1.jpg' alt="yugioh" style={{objectFit: 'cover', height: '515px'}} />
                    <Carousel.Caption className="bg-black bg-opacity-50 rounded">
                        <h3 className="text-info">Welcome to ErreGeTe YGO!</h3>
                        <p>Explore my public Yu-Gi-Oh! portfolio.</p>
                    </Carousel.Caption>
                </Carousel.Item>
                <Carousel.Item>
              <header class="absolute inset-x-0 top-0 z-50">
                  <img className='ygoss' src='./images/ygoss2.jpg' alt="yugioh" />
              </header>
            </Carousel.Item>

            <Carousel.Item>
              <header class="absolute inset-x-0 top-0 z-50">
                  <img className='ygoss' src='./images/ygoss3.jpg' alt="yugioh" />
              </header>
            </Carousel.Item>
            </Carousel>

            <div className="container md-content-panel">
                <nav className="mb-5">
                    <div className="d-flex justify-content-center gap-4 flex-wrap">
                        {[
                            { path: "/", label: "Home", img: "./images/lenatus_art.jpg" },
                            { path: "/decklist", label: "About (Coming Soon)", img: "./images/droplet_art.jpg" },
                            { path: "/deckbuilder", label: "Deck Builder", img: "./images/exodia.png" }
                        ].map((link) => {
                            // Check if this is the deckbuilder and if user is logged out
                            const isLocked = link.label === "Deck Builder" && !user;

                            return (
                                <Card 
                                    as={isLocked ? "div" : Link} // Render as a div if locked to prevent navigation
                                    to={isLocked ? null : link.path} 
                                    key={link.label} 
                                    className={`md-nav-card ${isLocked ? "md-card-disabled" : ""}`} 
                                    style={{ width: '18rem', textDecoration: 'none', cursor: isLocked ? 'not-allowed' : 'pointer' }}
                                >
                                    <div className="md-card-img-container" style={{ position: 'relative' }}>
                                        <Card.Img src={link.img} style={{ height: "160px", objectFit: "cover", opacity: isLocked ? 0.3 : 0.8 }} />
                                        {isLocked && (
                                            <div className="md-text-disabled">
                                                <span>MUST_BE_LOGGED_IN</span>
                                            </div>
                                        )}
                                    </div>
                                    <Card.Body className="p-0">
                                        <div className={`md-card-overlay-text text-center py-2 ${isLocked ? "md-text-disabled" : "text-white"}`}>
                                            {link.label}
                                        </div>
                                    </Card.Body>
                                </Card>
                            );
                        })}
                    </div>
                </nav>

                <hr className="border-info opacity-25 mb-5" />

                {/* Main Layout Row */}
                <Row>
                    {/* Left Side: Your main Decks Grid (80% width) */}
                    <Col lg={9} md={8}>
                        <DecksGrid decks={decks} decklist={decklist} toggleDeckList={toggleDeckList}/>
                    </Col>

                    {/* Right Side: Trending Cards (20% width) */}
                    <Col lg={3} md={4}>
                        <TrendingCards />
                    </Col>
                </Row>
            </div>
            
            <Footer />
        </div>

</>)
}