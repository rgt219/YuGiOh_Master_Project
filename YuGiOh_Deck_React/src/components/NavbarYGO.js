'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Button from 'react-bootstrap/Button';
import 'bootstrap/dist/css/bootstrap.min.css';
import Link from 'next/link';
import { mdSound } from '../utils/mdSound';

export default function NavbarYGO() {
  const [sfxActive, setSfxActive] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  // ⚡ 1. Local user state managed by the Navbar
  const [localUser, setLocalUser] = useState(null);
  
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (mdSound) setSfxActive(mdSound.enabled);

      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        try {
          setLocalUser(JSON.parse(storedUser));
        } catch {
          setLocalUser(null);
        }
      } else {
        setLocalUser(null);
      }
    }
  }, [pathname]);

  // const handleSfxToggle = () => {
  //   if (mdSound?.toggleSound) {
  //     const newState = mdSound.toggleSound();
  //     setSfxActive(newState);
  //   }
  // };

  const closeNav = () => setExpanded(false);

  const handleLogout = () => {
    mdSound?.playClick?.();
    closeNav();
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setLocalUser(null);
    router.push('/login'); 
  };

  return (
    <Navbar 
      bg="dark" 
      data-bs-theme="dark" 
      fixed="top" 
      expand="lg"
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
        <Navbar.Brand 
          as={Link} 
          href="/" 
          className="fw-bold text-info me-3 d-flex align-items-center gap-2"
          onMouseEnter={() => mdSound?.playHover?.()}
          onClick={() => { mdSound?.playClick?.(); closeNav(); }}
        >
          <span style={{ color: '#00f2ff', textShadow: '0 0 8px rgba(0,242,255,0.5)' }}>ErreGeTe YGO</span>
        </Navbar.Brand>

        <Navbar.Toggle 
          aria-controls="basic-navbar-nav" 
          className="border-info border-opacity-50 text-info shadow-none" 
        />

        <Navbar.Collapse id="basic-navbar-nav" className="mt-2 mt-lg-0">
          <Nav className="me-auto gap-1 gap-lg-2 align-items-lg-center">
            <NavDropdown title={<span className="fw-bold">Info</span>} id="info-dropdown" onMouseEnter={() => mdSound?.playHover?.()} className="px-2">
              <NavDropdown.Item as={Link} href="/about" className="fw-bold" onClick={() => { mdSound?.playClick?.(); closeNav(); }}>About</NavDropdown.Item>
              <NavDropdown.Item as={Link} href="/contact" className="fw-bold" onClick={() => { mdSound?.playClick?.(); closeNav(); }}>Contact</NavDropdown.Item>
            </NavDropdown>

            <NavDropdown title={<span className="fw-bold">Decks</span>} id="decks-dropdown" onMouseEnter={() => mdSound?.playHover?.()} className="px-2">
              <NavDropdown.Item as={Link} href="/community" className="fw-bold" onClick={() => { mdSound?.playClick?.(); closeNav(); }}>Community Decks</NavDropdown.Item>
              <NavDropdown.Item as={Link} href="/meta-decks" className="fw-bold" onClick={() => { mdSound?.playClick?.(); closeNav(); }}>Meta Decks</NavDropdown.Item>
              <NavDropdown.Item as={Link} href="/deckbuilder" className="fw-bold" onClick={() => { mdSound?.playClick?.(); closeNav(); }}>Deck Builder</NavDropdown.Item>
            </NavDropdown>

            <NavDropdown title={<span className="fw-bold">Card Database</span>} id="card-database-dropdown" onMouseEnter={() => mdSound?.playHover?.()} className="px-2">
              <NavDropdown.Item as={Link} href="/cardsearch" className="fw-bold" onClick={() => { mdSound?.playClick?.(); closeNav(); }}>Card Search</NavDropdown.Item>
              <NavDropdown.Item as={Link} href="/banlist" className="fw-bold" onClick={() => { mdSound?.playClick?.(); closeNav(); }}>Ban List</NavDropdown.Item>
            </NavDropdown>

            <NavDropdown title={<span className="fw-bold">Forums</span>} id="forums-dropdown" onMouseEnter={() => mdSound?.playHover?.()} className="px-2">
              <NavDropdown.Item as={Link} href="/generaldiscussion" className="fw-bold" onClick={() => { mdSound?.playClick?.(); closeNav(); }}>General Discussion</NavDropdown.Item>
              <NavDropdown.Item as={Link} href="/competitivediscussion" className="fw-bold" onClick={() => { mdSound?.playClick?.(); closeNav(); }}>Competitive Discussion</NavDropdown.Item>
            </NavDropdown>
          </Nav>

          <Nav className="align-items-lg-center gap-2 mt-3 mt-lg-0 pt-2 pt-lg-0 border-top border-lg-0 border-secondary border-opacity-25">
            {/* <Button 
              variant={sfxActive ? "outline-info" : "outline-secondary"}
              size="sm"
              className="py-1 px-3 border-opacity-50 fw-bold w-100 w-lg-auto mb-2 mb-lg-0"
              onClick={handleSfxToggle}
              title="Toggle Master Duel Audio Effects"
            >
              {sfxActive ? "🔊 SFX: ON" : "🔇 SFX: OFF"}
            </Button> */}

            {/* ⚡ 4. Render conditional UI based on localUser instead of props */}
            {localUser ? (
              <div className="d-flex align-items-center">
                <NavDropdown 
                  title={<span className="terminal-user-link fw-bold">{localUser.userName || localUser.username || "USER"}</span>} 
                  id="user-dropdown" 
                  align="end"
                  onMouseEnter={() => mdSound?.playHover?.()}
                >
                  <NavDropdown.Item 
                    as={Link} 
                    href="/profile"
                    onClick={() => { mdSound?.playClick?.(); closeNav(); }}
                  >
                    VIEW PROFILE
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    LOGOUT
                  </NavDropdown.Item>
                </NavDropdown>
                <div className="empty-avatar ms-2"></div>
              </div>
            ) : (
              <div className="d-flex align-items-center gap-2 w-100 w-lg-auto">
                <Nav.Link 
                  as={Link} 
                  href="/login"
                  className="text-info fw-bold px-3 py-1 btn btn-outline-info btn-sm text-center w-100"
                  onMouseEnter={() => mdSound?.playHover?.()}
                  onClick={() => { mdSound?.playClick?.(); closeNav(); }}
                >
                  Login
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  href="/register"
                  className="text-warning fw-bold px-3 py-1 btn btn-outline-warning btn-sm text-center w-100"
                  onMouseEnter={() => mdSound?.playHover?.()}
                  onClick={() => { mdSound?.playClick?.(); closeNav(); }}
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