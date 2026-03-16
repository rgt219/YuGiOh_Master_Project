import React, { useState, useRef, useEffect } from 'react';
import '../styles.css';
import { SplitPane, Pane } from 'react-split-pane';

export default function ImagePopup({archetype, image, effect, yugipedia})
{
    // State to manage whether the popup is shown or not
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef(null);
  const popupRef = useRef(null);
  let cardEffect=effect;
  let str = "blah•blah•blah";

  let strArr = str.split("\u2022");
  console.log(strArr);

    return (
      
    <div
      className="image-container"
      onMouseEnter={() => setIsHovered(true)} // Set state to true on hover in
      onMouseLeave={() => setIsHovered(false)} // Set state to false on hover out
      ref={containerRef}
    >
      <a href={yugipedia} alt="https://google.com">
      <img src={image} alt="" className="main-image" />
      </a>
      

      {/* Conditionally render the popup only if isHovered is true */}
      {isHovered && (
        <div className="popup-details">
          <SplitPane style={{height: "auto", width: "auto"}}>
            <div className="left-content" style={{width: '200px'}}>
              <img class="card_details" src={image} alt=""/>
            </div>
            <div className="right-content" style={{width: "100%"}}>
              <SplitPane>
                <div className="left-content" style={{width: "40%", textWrap: "wrap"}}>
                  <p style={{textAlign: "left", paddingLeft:"15px", paddingTop: "5px", paddingBottom: "-20px"}}><b>{archetype.cardName}</b></p>
                </div>
                <div className="right-content" style={{width: "70%", height: "30%", textWrap: "wrap"}}>
                  <p style={{paddingRight: "185px"}}>
                    <img src={`/images/${archetype.attributeIcon}`} alt="Attribute" style={{width: '20px', height: '20px', paddingTop: "5px"}}/> <b>{archetype.attribute}</b>
                    {
                      (archetype.level > 0) 
                      ? <><img src="/images/level.png" alt="Attribute" style={{width: '20px', height: '20px', paddingTop: "5px", paddingLeft: "5px"}}/><b>{archetype.level} </b></>
                      : <></>
                    }
                    
                  </p>
                </div>
              </SplitPane>
              <div class="text-container">
                <div class="card" bg-color="#2f6a9d" style={{width: "80%", paddingTop: "-100px"}}>
                  <SplitPane>
                    <div class="left-content">
                      <p style={{paddingBottom: "5px"}}><b>[ {archetype.cardType} / {archetype.cardSuperType} ]</b></p>
                    </div>
                    <div class="right-content">
                     {
                        (archetype.attack >= 0 || archetype.defense >= 0) ? <p style={{textAlign: "right"}}><b>ATK/{archetype.attack}  DEF/{archetype.defense}</b></p> : <></>
                     }
                     
                    </div>
                  </SplitPane>
                  
                  <p>{cardEffect}</p>
                </div>
                <div class="card" bg-color="#812fde" style={{width: "80%"}}>
                  <p style={{paddingBottom: "5px"}}><b>[ {archetype.cardType} / {archetype.cardSuperType} ]</b></p>
                </div>
                
              </div>
              
            </div>
          </SplitPane>
          
        </div>
      )}
    </div>
  );
}