import React from 'react';
import { Card } from 'react-bootstrap';

export default function MetaDeckGrid({ title, borderColor, textColor, deckIds, cardMap, pinnedCardData, handleCardHover, handleCardClick }) {
  if (!deckIds || deckIds.length === 0) return null;

  return (
    <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', backdropFilter: 'blur(10px)' }} text="white" className={`${borderColor} shadow-lg p-3 mb-4 md-panel`}>
      <Card.Header className={`bg-transparent border-bottom ${borderColor} border-opacity-25 pb-2 mb-3 d-flex justify-content-between align-items-center`}>
        <h5 className={`m-0 ${textColor} terminal-font fw-bold`}>
          {title} ({deckIds.length})
        </h5>
      </Card.Header>
      <Card.Body className="p-1">
        <div className="d-flex flex-wrap gap-2 justify-content-start">
          {deckIds.map((cardId, index) => {
            const cardData = cardMap[cardId.toString()];
            const imgUrl = cardData?.card_images?.[0]?.image_url_small || `https://images.ygoprodeck.com/images/cards_small/${cardId}.jpg`;
            const isPinned = pinnedCardData?.id === cardData?.id;

            return (
              <div
                key={`deck-${cardId}-${index}`}
                className="position-relative card-thumbnail-wrap"
                style={{ 
                  cursor: 'pointer', 
                  transition: 'transform 0.15s ease, filter 0.15s ease',
                  transform: isPinned ? 'scale(1.08)' : 'scale(1)',
                  zIndex: isPinned ? 2 : 1
                }}
                onMouseEnter={() => handleCardHover(cardData)}
                onClick={() => handleCardClick(cardData)}
              >
                <img
                  src={imgUrl}
                  alt={cardData?.name || cardId}
                  className={`rounded border ${isPinned ? 'border-info border-2 shadow-lg' : 'border-secondary'}`}
                  style={{ width: '62px', height: '90px', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.ygoprodeck.com/images/cards/back_high.jpg';
                  }}
                />
              </div>
            );
          })}
        </div>
      </Card.Body>
    </Card>
  );
}