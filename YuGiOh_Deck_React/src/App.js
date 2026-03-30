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
import UserProfile from './components/UserProfile';
import DeckProfileDetails from './components/DeckProfileDetails';
import { SignalRProvider } from './components/SignalRContext.js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GlobalToast from './components/GlobalToast';
import ProtectedRoute from './components/ProtectedRoute.js';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("erregete");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem(user.userName);
    setUser(null);
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
              {/* Home handles its own state internally */}
              <Route path="/" element={<Home user={user}/>} />
              
              {/* Login is now standalone! No Carousel here. */}
              <Route path="/login" element={<Login setUser={setUser}/>} />
              
              
              
              <Route path="/decklist" element={<DeckList/>} />
              <Route path="/decks/:deckId" element={<DeckDetails />} />
              <Route path="/register" element={<Register />}/>
              
              <Route element={<ProtectedRoute user={user} />}>
                {/* DeckBuilder is also standalone */}
                <Route path="/deckbuilder" element={<DeckBuilder user={user}/>} />
                <Route path="/profile" element={<UserProfile user={user}/>}/>
                <Route path="/deckprofiledetails/:deckId" element={<DeckProfileDetails />} />
              </Route>
            </Routes>
          </DecksProvider>
        </SignalRProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
