import { useState, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || 
  'https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api';

export function useMetaDecks() {
  const [metaDecks, setMetaDecks] = useState([]);
  const [activeFormat, setActiveFormat] = useState('TCG'); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setCurrentPage(1); 

    fetch(`${API_BASE_URL}/metadecks?format=${encodeURIComponent(activeFormat)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch ${activeFormat} tournament meta decks`);
        return res.json();
      })
      .then((data) => {
        setMetaDecks(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [activeFormat]);

  return {
    metaDecks,
    activeFormat,
    setActiveFormat,
    loading,
    error,
    currentPage,
    setCurrentPage
  };
}