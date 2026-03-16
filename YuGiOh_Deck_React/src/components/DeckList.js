import React from "react";
import "../styles.css"
import DeckBoss from "./DeckBoss";
export default function DeckList({decks, decklist, toggleDeckList}) {
    return (
        <div>
            <h1 className="title">My DeckList</h1>
            <div className="watchlist">
                {/* {
                    decklist.map(id => {
                        const deck = decks.find(deck => deck.id == id);
                        return <DeckBoss 
                            key={id} 
                            deck={deck} 
                            toggleDeckList={toggleDeckList} 
                            isDeckListed={true}></DeckBoss>
                    })
                } */}
            </div>
        </div>
    )
}