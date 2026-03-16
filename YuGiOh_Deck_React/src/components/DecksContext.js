import React, {useState, useEffect, createContext} from 'react';

export const DecksContext = createContext();

export const DecksProvider = ({children}) => {
    const [decks, setDecks] = useState([]);

    useEffect(() => {
        fetch("/decks.json")
        .then(response => response.json())
        .then(data => setDecks(data))
        .catch(err => console.error(err))
    }, []);

    return (
        <DecksContext.Provider value={decks}>
            {children}
        </DecksContext.Provider>
    )
};