import React, { useState } from 'react';
import { NavLink } from 'react-router-dom'; // Requires react-router-dom
import styles from '../Navbar.module.css';
// You might use an icon library like react-icons, lucide-react, or Material-UI icons for visual flair
//import { MenuIcon, XIcon } from 'lucide-react'; // Example using lucide-react

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Features', path: '/features' },
  { name: 'Pricing', path: '/pricing' },
  { name: 'About', path: '/about' },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className={styles.header}>
      <nav className={styles.navbar}>
        <NavLink to="/" className={styles.logo}>
          StylishLogo
        </NavLink>
        
        {/* Desktop Navigation Links */}
        <ul className={styles.navLinks}>
          {navLinks.map((link) => (
            <li key={link.name}>
              <NavLink 
                to={link.path} 
                className={({ isActive }) => 
                  isActive ? styles.activeLink : styles.link
                }
              >
                {link.name}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Mobile Menu Toggle Button (Hamburger) */}
        {/* <button className={styles.menuButton} onClick={toggleMenu}>
          {isMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
        </button> */}
      </nav>

      {/* Mobile Navigation Menu (visible when isMenuOpen is true) */}
      {isMenuOpen && (
        <ul className={styles.mobileMenu}>
          {navLinks.map((link) => (
            <li key={link.name} onClick={() => setIsMenuOpen(false)}>
              <NavLink to={link.path} className={styles.mobileLink}>
                {link.name}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
};
