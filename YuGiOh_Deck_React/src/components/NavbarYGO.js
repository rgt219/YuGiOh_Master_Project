import React, { useState } from 'react';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Button from 'react-bootstrap/Button';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import { mdSound } from '../utils/mdSound';

export default function NavbarYGO({ user, onLogout }) {
  const [sfxActive, setSfxActive] = useState(mdSound.enabled);
  const [expanded, setExpanded] = useState(false);

  const handleSfxToggle = () => {
    const newState = mdSound.toggleSound();
    setSfxActive(newState);
  };

  const closeNav = () => setExpanded(false);

  return (
    <Navbar 
      bg="dark" 
      data-bs-theme="dark" 
      fixed="top" 
      expand="lg" // 🚀 Fixes horizontal overflow & enables Hamburger Button on mobile
      expanded={expanded}
      onToggle={(isExpanded) => setExpanded(isExpanded)}
      className="border-bottom border-info border-opacity-25 shadow-lg"
      style={{ 
        fontFamily: "Cascadia Mono", 
        backdropFilter: "blur(12px)", 
        backgroundColor: "rgba(10, 13, 20, 0.95)" 
      }}
    >
      <Container fluid className="px-3 px-md-4">
        {/* BRAND LOGO */}
        <Navbar.Brand 
          as={Link} 
          to="/"
          className="fw-bold text-info me-3 d-flex align-items-center gap-2"
          onMouseEnter={() => mdSound.playHover()}
          onClick={() => { mdSound.playClick(); closeNav(); }}
        >
          <span style={{ color: '#00f2ff', textShadow: '0 0 8px rgba(0,242,255,0.5)' }}>ErreGeTe YGO</span>
        </Navbar.Brand>

        {/* 🍔 HAMBURGER BUTTON (Mobile / Tablet) */}
        <Navbar.Toggle 
          aria-controls="basic-navbar-nav" 
          className="border-info border-opacity-50 text-info shadow-none" 
        />

        <Navbar.Collapse id="basic-navbar-nav" className="mt-2 mt-lg-0">
          {/* LEFT NAVIGATION LINKS & DROPDOWNS */}
          <Nav className="me-auto gap-1 gap-lg-2 align-items-lg-center">
            {/* ℹ️ INFO SECTION */}
            <NavDropdown 
              title={<span className="fw-bold">Info</span>} 
              id="info-dropdown"
              onMouseEnter={() => mdSound.playHover()}
              className="px-2"
            >
              <NavDropdown.Item 
                as={Link} 
                to="/about"
                className="fw-bold"
                onClick={() => { mdSound.playClick(); closeNav(); }}
              >
                About
              </NavDropdown.Item>
              <NavDropdown.Item 
                as={Link} 
                to="/contact"
                className="fw-bold"
                onClick={() => { mdSound.playClick(); closeNav(); }}
              >
                Contact
              </NavDropdown.Item>
            </NavDropdown>

            {/* 🎴 DECKS SECTION */}
            <NavDropdown 
              title={<span className="fw-bold">Decks</span>} 
              id="decks-dropdown"
              onMouseEnter={() => mdSound.playHover()}
              className="px-2"
            >
              <NavDropdown.Item 
                as={Link} 
                to="/community"
                className="fw-bold"
                onClick={() => { mdSound.playClick(); closeNav(); }}
              >
                Community Decks
              </NavDropdown.Item>
              <NavDropdown.Item 
                as={Link} 
                to="/meta-decks"
                className="fw-bold"
                onClick={() => { mdSound.playClick(); closeNav(); }}
              >
                Meta Decks
              </NavDropdown.Item>
              <NavDropdown.Item
                as={Link} 
                to="/deckbuilder"
                className="fw-bold"
                onClick={() => { mdSound.playClick(); closeNav(); }}
              >
                Deck Builder
              </NavDropdown.Item>
            </NavDropdown>

            {/* 🛢 CARD DATABASE SECTION */}
            <NavDropdown 
              title={<span className="fw-bold">Card Database</span>} 
              id="card-database-dropdown"
              onMouseEnter={() => mdSound.playHover()}
              className="px-2"
            >
              <NavDropdown.Item
                as={Link} 
                to="/cardsearch"
                className="fw-bold"
                onClick={() => { mdSound.playClick(); closeNav(); }}
              >
                Card Search
              </NavDropdown.Item>
              <NavDropdown.Item
                as={Link} 
                to="/banlist"
                className="fw-bold"
                onClick={() => { mdSound.playClick(); closeNav(); }}
              >
                Ban List
              </NavDropdown.Item>
            </NavDropdown>

            {/* 📰 FORUMS SECTION */}
            <NavDropdown 
              title={<span className="fw-bold">Forums</span>} 
              id="forums-dropdown"
              onMouseEnter={() => mdSound.playHover()}
              className="px-2"
            >
              <NavDropdown.Item
                as={Link} 
                to="/generaldiscussion"
                className="fw-bold"
                onClick={() => { mdSound.playClick(); closeNav(); }}
              >
                General Discussion
              </NavDropdown.Item>
              <NavDropdown.Item
                as={Link} 
                to="/competitivediscussion"
                className="fw-bold"
                onClick={() => { mdSound.playClick(); closeNav(); }}
              >
                Competitive Discussion
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>

          {/* RIGHT SIDE: SFX TOGGLE & USER PROFILE / AUTH */}
          <Nav className="align-items-lg-center gap-2 mt-3 mt-lg-0 pt-2 pt-lg-0 border-top border-lg-0 border-secondary border-opacity-25">
            <Button 
              variant={sfxActive ? "outline-info" : "outline-secondary"}
              size="sm"
              className="py-1 px-3 border-opacity-50 fw-bold w-100 w-lg-auto mb-2 mb-lg-0"
              onClick={handleSfxToggle}
              title="Toggle Master Duel Audio Effects"
            >
              {sfxActive ? "🔊 SFX: ON" : "🔇 SFX: OFF"}
            </Button>

            {user ? (
              <div className="d-flex align-items-center">
                <NavDropdown 
                  title={<span className="terminal-user-link fw-bold">{user.userName}</span>} 
                  id="user-dropdown" 
                  align="end"
                  onMouseEnter={() => mdSound.playHover()}
                >
                  <NavDropdown.Item 
                    as={Link} 
                    to="/profile"
                    onClick={() => { mdSound.playClick(); closeNav(); }}
                  >
                    VIEW PROFILE
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item 
                    onClick={() => {
                      mdSound.playClick();
                      closeNav();
                      onLogout();
                    }}
                  >
                    LOGOUT
                  </NavDropdown.Item>
                </NavDropdown>
                <div className="empty-avatar ms-2"></div>
              </div>
            ) : (
              <div className="d-flex align-items-center gap-2 w-100 w-lg-auto">
                <Nav.Link 
                  as={Link} 
                  to="/login"
                  className="text-info fw-bold px-3 py-1 btn btn-outline-info btn-sm text-center w-100"
                  onMouseEnter={() => mdSound.playHover()}
                  onClick={() => { mdSound.playClick(); closeNav(); }}
                >
                  Login
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/register"
                  className="text-warning fw-bold px-3 py-1 btn btn-outline-warning btn-sm text-center w-100"
                  onMouseEnter={() => mdSound.playHover()}
                  onClick={() => { mdSound.playClick(); closeNav(); }}
                >
                  Register
                </Nav.Link>
              </div>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}