import React, { useState } from 'react';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Button from 'react-bootstrap/Button';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import { mdSound } from '../utils/mdSound'; // Ensure mdSound.js exists in src/utils/

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
          onMouseEnter={() => mdSound.playHover()}
          onClick={() => mdSound.playClick()}
        >
          ErreGeTe YGO
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />

        <Navbar.Collapse id="basic-navbar-nav">
          {/* LEFT NAVIGATION LINKS */}
          <Nav className="me-auto">
            <Nav.Link 
              as={Link} 
              to="/"
              onMouseEnter={() => mdSound.playHover()}
              onClick={() => mdSound.playClick()}
            >
              Home
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/about"
              onMouseEnter={() => mdSound.playHover()}
              onClick={() => mdSound.playClick()}
            >
              About
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/contact"
              onMouseEnter={() => mdSound.playHover()}
              onClick={() => mdSound.playClick()}
            >
              Contact
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/deckbuilder"
              onMouseEnter={() => mdSound.playHover()}
              onClick={() => mdSound.playClick()}
            >
              Build
            </Nav.Link>
            
            {/* 🚀 NEW COMMUNITY ARCHIVE LINK */}
            <Nav.Link 
              as={Link} 
              to="/community" 
              className="text-info fw-bold"
              onMouseEnter={() => mdSound.playHover()}
              onClick={() => mdSound.playClick()}
            >
              Community
            </Nav.Link>
          </Nav>

          {/* RIGHT SIDE OF NAVBAR */}
          <Nav className="align-items-center gap-2">
            {/* 🔊 MASTER DUEL SFX TOGGLE BUTTON */}
            <Button 
              variant={sfxActive ? "outline-info" : "outline-secondary"}
              size="sm"
              className="py-1 px-2 border-opacity-50"
              onClick={handleSfxToggle}
              title="Toggle Master Duel Audio Effects"
            >
              {sfxActive ? "🔊 SFX: ON" : "🔇 SFX: OFF"}
            </Button>

            {user ? (
              <div className="d-flex align-items-center">
                <NavDropdown 
                  title={`${user.userName}`} 
                  id="user-dropdown" 
                  align="end"
                  className="terminal-user-link"
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
                  onMouseEnter={() => mdSound.playHover()}
                  onClick={() => mdSound.playClick()}
                >
                  Login
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/register"
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