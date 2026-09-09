'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Button from 'react-bootstrap/Button';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../mdstyles.css'
import Link from 'next/link';
import { mdSound } from '../utils/mdSound';

export default function NavbarYGO() {
  const [sfxActive, setSfxActive] = useState(false);
  const [expanded, setExpanded] = useState(false);
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
      className="cyber-navbar py-2.5"
    >
      <Container fluid className="px-3 px-md-4">
        
        {/* LEFT: Brand */}
        <Navbar.Brand 
          as={Link} 
          href="/" 
          className="fw-bold cyber-brand me-lg-4 d-flex align-items-center gap-2"
          onMouseEnter={() => mdSound?.playHover?.()}
          onClick={() => { mdSound?.playClick?.(); closeNav(); }}
        >
          <span>ErreGeTe YGO</span>
        </Navbar.Brand>

        <Navbar.Toggle 
          aria-controls="basic-navbar-nav" 
          className="border-info border-opacity-50 text-info shadow-none ms-auto" 
        />

        <Navbar.Collapse id="basic-navbar-nav" className="mt-2 mt-lg-0 w-100">
          
          {/* CENTER: Main Links */}
          <Nav className="mx-auto justify-content-center gap-2 gap-lg-3 gap-xl-4 align-items-lg-center mt-2 mt-lg-0 w-100">
            <NavDropdown renderMenuOnMount={true} title={<span className="fw-bold">Info</span>} id="info-dropdown" onMouseEnter={() => mdSound?.playHover?.()} className="px-lg-2 hover-slide-dropdown">
              <NavDropdown.Item as={Link} href="/about" onClick={() => { mdSound?.playClick?.(); closeNav(); }}>About</NavDropdown.Item>
              <NavDropdown.Item as={Link} href="/contact" onClick={() => { mdSound?.playClick?.(); closeNav(); }}>Contact</NavDropdown.Item>
            </NavDropdown>

            <NavDropdown renderMenuOnMount={true} title={<span className="fw-bold">Decks</span>} id="decks-dropdown" onMouseEnter={() => mdSound?.playHover?.()} className="px-lg-2 hover-slide-dropdown">
              <NavDropdown.Item as={Link} href="/community" onClick={() => { mdSound?.playClick?.(); closeNav(); }}>Community Decks</NavDropdown.Item>
              <NavDropdown.Item as={Link} href="/meta-decks" onClick={() => { mdSound?.playClick?.(); closeNav(); }}>Meta Decks</NavDropdown.Item>
              <NavDropdown.Item as={Link} href="/deckbuilder" onClick={() => { mdSound?.playClick?.(); closeNav(); }}>Deck Builder</NavDropdown.Item>
            </NavDropdown>

            <NavDropdown renderMenuOnMount={true} title={<span className="fw-bold">Card Database</span>} id="card-database-dropdown" onMouseEnter={() => mdSound?.playHover?.()} className="px-lg-2 hover-slide-dropdown">
              <NavDropdown.Item as={Link} href="/cardsearch" onClick={() => { mdSound?.playClick?.(); closeNav(); }}>Card Search</NavDropdown.Item>
              <NavDropdown.Item as={Link} href="/banlist" onClick={() => { mdSound?.playClick?.(); closeNav(); }}>Ban List</NavDropdown.Item>
              <NavDropdown.Item as={Link} href="/market-listings" onClick={() => { mdSound?.playClick?.(); closeNav(); }}>Market Listings</NavDropdown.Item>
            </NavDropdown>

            <NavDropdown renderMenuOnMount={true} title={<span className="fw-bold">Forums</span>} id="forums-dropdown" onMouseEnter={() => mdSound?.playHover?.()} className="px-lg-2 hover-slide-dropdown">
              <NavDropdown.Item as={Link} href="/generaldiscussion" onClick={() => { mdSound?.playClick?.(); closeNav(); }}>General Discussion</NavDropdown.Item>
              <NavDropdown.Item as={Link} href="/competitivediscussion" onClick={() => { mdSound?.playClick?.(); closeNav(); }}>Competitive Discussion</NavDropdown.Item>
            </NavDropdown>

            <NavDropdown renderMenuOnMount={true} title={<span className="fw-bold">News</span>} id="news-dropdown" onMouseEnter={() => mdSound?.playHover?.()} className="px-lg-2 hover-slide-dropdown">
              <NavDropdown.Item as={Link} href="/news" onClick={() => { mdSound?.playClick?.(); closeNav(); }}>Articles</NavDropdown.Item>
            </NavDropdown>
          </Nav>

          {/* RIGHT: Auth Actions */}
          <Nav className="ms-lg-auto align-items-lg-center gap-2 mt-3 mt-lg-0 pt-2 pt-lg-0 border-top border-lg-0 border-secondary border-opacity-25 flex-shrink-0">
            {localUser ? (
              <div className="d-flex align-items-center">
                <NavDropdown 
                  renderMenuOnMount={true}
                  title={<span className="text-info fw-bold">[{localUser.userName || localUser.username || "USER"}]</span>} 
                  id="user-dropdown" 
                  align="end"
                  onMouseEnter={() => mdSound?.playHover?.()}
                  className="hover-slide-dropdown"
                >
                  <NavDropdown.Item 
                    as={Link} 
                    href="/profile"
                    onClick={() => { mdSound?.playClick?.(); closeNav(); }}
                  >
                    VIEW PROFILE
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout} className="text-danger">
                    LOGOUT
                  </NavDropdown.Item>
                </NavDropdown>
              </div>
            ) : (
              <div className="d-flex align-items-center gap-2 w-100 w-lg-auto">
                <Button 
                  as={Link} 
                  href="/login"
                  variant="outline"
                  className="cyber-btn-outline px-3 py-1.5"
                  onMouseEnter={() => mdSound?.playHover?.()}
                  onClick={() => { mdSound?.playClick?.(); closeNav(); }}
                >
                  LOGIN
                </Button>
                <Button 
                  as={Link} 
                  href="/register"
                  className="cyber-btn-solid px-3 py-1.5"
                  onMouseEnter={() => mdSound?.playHover?.()}
                  onClick={() => { mdSound?.playClick?.(); closeNav(); }}
                >
                  REGISTER
                </Button>
              </div>
            )}
          </Nav>
          
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}