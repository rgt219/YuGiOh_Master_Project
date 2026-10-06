'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Button from 'react-bootstrap/Button';
import { mdSound } from '../utils/mdSound';
import NotificationBell from './notifications/NotificationBell';
import './navbar.css';

// NOTE: 'bootstrap/dist/css/bootstrap.min.css' and '../mdstyles.css' should be
// imported once in app/layout.js, not here.

// Flip to true if you want the hover sound back.
const HOVER_SOUNDS = false;

// One source of truth for the menu. Adding a page = adding one line.
const NAV = [
  { id: 'info', label: 'Info', items: [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ] },
  { id: 'decks', label: 'Decks', items: [
    { label: 'Community Decks', href: '/community' },
    { label: 'Meta Decks', href: '/meta-decks' },
    { label: 'Deck Builder', href: '/deckbuilder' },
  ] },
  { id: 'card-database', label: 'Card Database', items: [
    { label: 'Card Search', href: '/cardsearch' },
    { label: 'Ban List', href: '/banlist' },
    { label: 'Market Listings', href: '/market-listings' },
    { label: 'Card Creator', href: '/card-creator' },
  ] },
  { id: 'forums', label: 'Forums', items: [
    { label: 'General Discussion', href: '/generaldiscussion' },
    { label: 'Competitive Discussion', href: '/competitivediscussion' },
  ] },
  { id: 'news', label: 'News', items: [
    { label: 'Articles', href: '/news' },
  ] },
];

const playHover = () => { if (HOVER_SOUNDS) mdSound?.playHover?.(); };
const playClick = () => mdSound?.playClick?.();

const matches = (pathname, href) =>
  pathname === href || pathname.startsWith(`${href}/`);

// undefined = not read yet, null = logged out, object = logged in.
function useStoredUser(pathname) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('user');
      setUser(raw ? JSON.parse(raw) : null);
    } catch {
      setUser(null);
    }
  }, [pathname]);

  return [user, setUser];
}

export default function NavbarYGO() {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname() || '/';
  const router = useRouter();
  const [user, setUser] = useStoredUser(pathname);

  const closeNav = useCallback(() => setExpanded(false), []);
  const onNavigate = useCallback(() => { playClick(); closeNav(); }, [closeNav]);

  const handleLogout = () => {
    playClick();
    closeNav();
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  const userName = user?.userName || user?.username || 'USER';

  return (
    <Navbar
      bg="dark"
      data-bs-theme="dark"
      fixed="top"
      expand="lg"
      expanded={expanded}
      onToggle={setExpanded}
      className="cyber-navbar"
    >
      <Container fluid className="ygo-nav-inner px-3 px-md-4">
        <Navbar.Brand
          as={Link}
          href="/"
          className="fw-bold cyber-brand me-lg-4 d-flex align-items-center gap-2"
          onMouseEnter={playHover}
          onClick={onNavigate}
        >
          <span>ErreGeTe YGO</span>
        </Navbar.Brand>

        <Navbar.Toggle
          aria-controls="basic-navbar-nav"
          aria-label="Toggle navigation"
          className="border-info border-opacity-50 text-info shadow-none ms-auto"
        />

        <Navbar.Collapse id="basic-navbar-nav" className="mt-2 mt-lg-0">
          <Nav className="me-auto align-items-lg-center gap-1 gap-lg-2 gap-xl-3">
            {NAV.map((group) => {
              const active = group.items.some((item) => matches(pathname, item.href));
              return (
                <NavDropdown
                  key={group.id}
                  id={`${group.id}-dropdown`}
                  renderMenuOnMount
                  title={<span className="fw-bold">{group.label}</span>}
                  onMouseEnter={playHover}
                  className={`px-lg-2 hover-slide-dropdown ygo-nav-group${active ? ' is-active' : ''}`}
                >
                  {group.items.map((item) => (
                    <NavDropdown.Item
                      key={item.href}
                      as={Link}
                      href={item.href}
                      active={matches(pathname, item.href)}
                      aria-current={matches(pathname, item.href) ? 'page' : undefined}
                      onClick={onNavigate}
                    >
                      {item.label}
                    </NavDropdown.Item>
                  ))}
                </NavDropdown>
              );
            })}
          </Nav>

          {/* Right side: render nothing until the stored user has been read,
              so logged-in users never see a LOGIN/REGISTER flash. */}
          {user !== undefined && (
            <Nav className="ms-lg-auto align-items-lg-center gap-2 mt-3 mt-lg-0 pt-2 pt-lg-0 border-top border-lg-0 border-secondary border-opacity-25 flex-shrink-0">
              {/* Renders nothing when logged out, but must stay mounted so it can clear itself on logout. */}
              <NotificationBell user={user} />
              {user ? (
                <NavDropdown
                  id="user-dropdown"
                  renderMenuOnMount
                  align="end"
                  title={<span className="text-info fw-bold">[{userName}]</span>}
                  onMouseEnter={playHover}
                  className="hover-slide-dropdown"
                >
                  <NavDropdown.Item as={Link} href="/profile" onClick={onNavigate}>
                    VIEW PROFILE
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout} className="text-danger">
                    LOGOUT
                  </NavDropdown.Item>
                </NavDropdown>
              ) : (
                <div className="d-flex align-items-center gap-2">
                  <Button as={Link} href="/login" variant="outline" className="cyber-btn-outline ygo-nav-btn" onMouseEnter={playHover} onClick={onNavigate}>
                    LOGIN
                  </Button>
                  <Button as={Link} href="/register" className="cyber-btn-solid ygo-nav-btn" onMouseEnter={playHover} onClick={onNavigate}>
                    REGISTER
                  </Button>
                </div>
              )}
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}