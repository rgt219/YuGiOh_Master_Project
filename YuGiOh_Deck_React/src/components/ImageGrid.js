import React from "react";
import '../styles.css';
import {useState, useEffect, useContext} from 'react';
import { DecksContext } from "./DecksContext";
import { Tooltip } from "react-tooltip";
import 'react-tooltip/dist/react-tooltip.css'
import { SplitPane } from 'react-split-pane';
import ImagePopup from "./ImagePopup";
import ImageOverlay from "./ImageOverlay";



export default function ImageGrid({archetype, yugipedia})
{

    return (
        <>
        <div className="custom-deck-container">
      <h3 className="text-white mb-3" style={{ fontFamily: "Cascadia Mono" }}>
        {archetype.name || "Main Deck"}
      </h3>
      
      {/* This wrapper provides the dark background and scrolling */}
      <div className="deck-scroll-area">
        <div className="gallery" style={{ overflowX: 'visible' }}>
          {archetype.deckList.main.map((x, index) => (
            <div className="gallery__item" key={index}>
              <ImageOverlay 
                archetype={x} 
                image={`/images/${x.image}`} 
                effect={x.effect} 
                yugipedia={x.yugipedia} 
              />
            </div>
          ))}
        </div>
      </div>
    </div>

</>
        
    )
}
