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

  const handleSfxToggle = () => {
    const newState = mdSound.toggleSound();
    setSfxActive(newState);
  };

  return (
    <Navbar bg="dark" data-bs-theme="dark" fixed="top" style={{ fontFamily: "Cascadia Mono" }}>
      <Container fluid>
        {/* BRAND */}
        <Navbar.Brand 
          as={Link} 
          to="/"
          className="fw-bold text-info me-4"
          onMouseEnter={() => mdSound.playHover()}
          onClick={() => mdSound.playClick()}
        >
          ErreGeTe YGO
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />

        <Navbar.Collapse id="basic-navbar-nav">
          {/* LEFT NAVIGATION LINKS */}
          <Nav className="me-auto gap-2 align-items-center">
            {/* HOME LINK */}
            <Nav.Link 
              as={Link} 
              to="/"
              className="text-primary fw-bold"
              onMouseEnter={() => mdSound.playHover()}
              onClick={() => mdSound.playClick()}
            >
              🏠Home
            </Nav.Link>

            
            
            {/* ℹ️ INFO DROPDOWN (ABOUT & CONTACT) */}
            <NavDropdown 
              title={<span className="text-info fw-bold">ℹ️Info</span>} 
              id="info-dropdown"
              onMouseEnter={() => mdSound.playHover()}
            >
              <NavDropdown.Item 
                as={Link} 
                to="/about"
                className="text-light fw-bold"
                onClick={() => mdSound.playClick()}
              >
                📰About
              </NavDropdown.Item>
              <NavDropdown.Item 
                as={Link} 
                to="/contact"
                className="text-secondary fw-bold"
                onClick={() => mdSound.playClick()}
              >
                📇Contact
              </NavDropdown.Item>
            </NavDropdown>

            {/* 🃏 DECKS DROPDOWN (COMMUNITY & META DECKS) */}
            <NavDropdown 
              title={<span className="text-warning fw-bold">🎴Decks</span>} 
              id="decks-dropdown"
              onMouseEnter={() => mdSound.playHover()}
            >
              <NavDropdown.Item 
                as={Link} 
                to="/community"
                className="text-info fw-bold"
                onClick={() => mdSound.playClick()}
              >
                🗪Community Decks
              </NavDropdown.Item>
              <NavDropdown.Item 
                as={Link} 
                to="/meta-decks"
                className="text-warning fw-bold"
                onClick={() => mdSound.playClick()}
              >
                🕋Meta Decks
              </NavDropdown.Item>
              {/* BUILD LINK */}
            <NavDropdown.Item
              as={Link} 
              to="/deckbuilder"
              className="text-success fw-bold"
              onMouseEnter={() => mdSound.playHover()}
              onClick={() => mdSound.playClick()}
            >
              🧩Deck Builder
            </NavDropdown.Item>
            </NavDropdown>
          </Nav>

          {/* RIGHT SIDE OF NAVBAR */}
          <Nav className="align-items-center gap-2">
            {/* MASTER DUEL SFX TOGGLE BUTTON */}
            <Button 
              variant={sfxActive ? "outline-info" : "outline-secondary"}
              size="sm"
              className="py-1 px-2 border-opacity-50 fw-bold"
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
                    onClick={() => mdSound.playClick()}
                  >
                    VIEW PROFILE
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item 
                    onClick={() => {
                      mdSound.playClick();
                      onLogout();
                    }}
                  >
                    LOGOUT
                  </NavDropdown.Item>
                </NavDropdown>
                <div className="empty-avatar ms-2"></div>
              </div>
            ) : (
              <>
                <Nav.Link 
                  as={Link} 
                  to="/login"
                  className="text-info fw-bold"
                  onMouseEnter={() => mdSound.playHover()}
                  onClick={() => mdSound.playClick()}
                >
                  Login
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/register"
                  className="text-warning fw-bold"
                  onMouseEnter={() => mdSound.playHover()}
                  onClick={() => mdSound.playClick()}
                >
                  Register
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}