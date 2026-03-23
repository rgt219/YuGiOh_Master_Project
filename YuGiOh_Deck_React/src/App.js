import logo from './logo.svg';
import './App.css';
import './styles.css';
import Header from './components/Header';
import Footer from './components/Footer';
import DecksGrid from './components/DecksGrid';
import DeckList from './components/DeckList';
import DeckDetails from './components/DeckDetails';
import BlueEyes from './components/BlueEyes';
import CardApi from './components/CardApi';
import { DecksProvider } from './components/DecksContext';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import React, {useState, useEffect} from 'react';
import TestComponent from './components/TestComponent';
import 'bootstrap/dist/css/bootstrap.min.css';
import Carousel from 'react-bootstrap/Carousel';
import { Card, Button, Container, Row, Col } from 'react-bootstrap';
import DeckBuilder from './components/DeckBuilder';
import Login from './components/Login';
import NavbarYGO from './components/NavbarYGO';
import Home from './components/Home'
import Register from './components/Register';
import UserProfile from './components/UserProfile';
import DeckProfileDetails from './components/DeckProfileDetails';
import TrendingCards from './components/TrendingCards';
import { SignalRProvider } from './components/SignalRContext';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("erregete");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem(user.userName);
    setUser(null);
  }
  return (
    <Router>
      <SignalRProvider>
        <NavbarYGO user={user} onLogout={handleLogout} /> 
        <DecksProvider>
          <Routes>
            {/* Home handles its own state internally */}
            <Route path="/" element={<Home user={user}/>} />
            
            {/* Login is now standalone! No Carousel here. */}
            <Route path="/login" element={<Login setUser={setUser}/>} />
            
            {/* DeckBuilder is also standalone */}
            <Route path="/deckbuilder" element={<DeckBuilder user={user}/>} />
            
            <Route path="/decklist" element={<DeckList/>} />
            <Route path="/decks/:deckId" element={<DeckDetails />} />
            <Route path="/register" element={<Register />}/>
            <Route path="/profile" element={<UserProfile user={user}/>}/>
            <Route path="/deckprofiledetails/:deckId" element={<DeckProfileDetails />} />
          </Routes>
        </DecksProvider>
      </SignalRProvider>
    </Router>
  );
}

export default App;
