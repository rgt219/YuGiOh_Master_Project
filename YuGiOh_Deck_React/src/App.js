import './App.css';
import './styles.css';
import DeckList from './components/DeckList';
import DeckDetails from './components/DeckDetails';
import { DecksProvider } from './components/DecksContext';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import React, {useState, useEffect} from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import DeckBuilder from './components/DeckBuilder';
import Login from './components/Login';
import NavbarYGO from './components/NavbarYGO';
import Home from './components/Home'
import Register from './components/Register';
import About from './components/About';
import UserProfile from './components/UserProfile';
import DeckProfileDetails from './components/DeckProfileDetails';
import { SignalRProvider } from './components/SignalRContext.js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GlobalToast from './components/GlobalToast';
import ProtectedRoute from './components/ProtectedRoute.js';
import ComboDisplay from './components/ComboDisplay.js';
import { whiteForestAzaminaCombo } from './components/WhiteForestAzaminaCombo.js';
import ComboPlayerSandbox from './components/ComboPlayerSandbox.js';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login"; 
  }

  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <SignalRProvider>
          <GlobalToast />
          <NavbarYGO user={user} onLogout={handleLogout} /> 
          <DecksProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home user={user}/>} />
              <Route path="/login" element={<Login setUser={setUser}/>} />
              <Route path="/about" element={<About />} />
              <Route path="/decklist" element={<DeckList/>} />
              <Route path="/decks/:deckId" element={<DeckDetails />} />
              <Route path="/register" element={<Register />}/>
              
              {/* 🚀 DeckBuilder is now PUBLIC so guests can use it & export YDK */}
              <Route path="/deckbuilder" element={<DeckBuilder user={user}/>} />

              {/* Protected Routes (Log in required) */}
              <Route element={<ProtectedRoute user={user} />}>
                <Route path="/profile" element={<UserProfile user={user}/>}/>
                <Route path="/deckprofiledetails/:deckId" element={<DeckProfileDetails />} />
              </Route>
            </Routes>
          </DecksProvider>
        </SignalRProvider>
      </Router>

      {/* <ComboPlayerSandbox 
          combo={whiteForestAzaminaCombo} 
      /> */}
    </QueryClientProvider>
  );
}

export default App;