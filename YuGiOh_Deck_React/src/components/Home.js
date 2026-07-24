import React, { useState, useEffect } from "react";
import Carousel from 'react-bootstrap/Carousel';
import Card from 'react-bootstrap/Card';
import { Link } from 'react-router-dom';
import DecksGrid from "./DecksGrid";
import { Container, Row, Col } from "react-bootstrap";
import TrendingCards from "./TrendingCards";
import Footer from "./Footer";

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
            <Carousel className="md-carousel border-bottom border-info" style={{ width: "100%", height: "515px" }}>
                <Carousel.Item>
                    <img className='d-block w-100' src='./images/ygoss1.jpg' alt="yugioh" style={{ objectFit: 'cover', height: '515px' }} />
                    <Carousel.Caption className="bg-black bg-opacity-50 rounded">
                        <h3 className="text-info">Welcome to ErreGeTe YGO!</h3>
                        <p>Explore my public Yu-Gi-Oh! portfolio.</p>
                    </Carousel.Caption>
                </Carousel.Item>
                <Carousel.Item>
                    <header className="absolute inset-x-0 top-0 z-50">
                        <img className='ygoss' src='./images/ygoss2.jpg' alt="yugioh" />
                    </header>
                </Carousel.Item>
                <Carousel.Item>
                    <header className="absolute inset-x-0 top-0 z-50">
                        <img className='ygoss' src='./images/ygoss3.jpg' alt="yugioh" />
                    </header>
                </Carousel.Item>
            </Carousel>

            <div className="container md-content-panel">
                <nav className="mb-5">
                    <div className="d-flex justify-content-center gap-4 flex-wrap">
                        {[
                            { path: "/about", label: "About", img: "./images/droplet_art.jpg" },
                            { path: "/deckbuilder", label: "Deck Builder", img: "./images/exodia.png" },
                            { path: "/contact", label: "Contact", img: "./images/lenatus_art.jpg" },
                        ].map((link) => (
                            <Card 
                                as={Link} 
                                to={link.path} 
                                key={link.label} 
                                className="md-nav-card"
                                style={{ width: '18rem', textDecoration: 'none', cursor: 'pointer' }}
                            >
                                <div className="md-card-img-container" style={{ position: 'relative', width: '100%' }}>
                                    <Card.Img 
                                        src={link.img} 
                                        style={{ width: '100%', height: "160px", objectFit: "cover", opacity: 0.8 }} 
                                    />
                                </div>
                                <Card.Body className="p-0">
                                    <div className="md-card-overlay-text text-center py-2 text-white">
                                        {link.label}
                                    </div>
                                </Card.Body>
                            </Card>
                        ))}
                    </div>
                </nav>

                <hr className="border-info opacity-25 mb-5" />

                <Row>
                    <Col lg={9} md={8}>
                        <DecksGrid decks={decks} decklist={decklist} toggleDeckList={toggleDeckList}/>
                    </Col>
                    <Col lg={3} md={4}>
                        <TrendingCards />
                    </Col>
                </Row>
            </div>
            
            <Footer />
        </div>
    );
}