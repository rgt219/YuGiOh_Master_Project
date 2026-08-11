import React, { useState, useEffect } from 'react';
import { Card, Badge } from 'react-bootstrap';
import { useSignalR } from './SignalRContext.js';

const TickerItem = ({ activity }) => {
    const mainDeck = activity.mainDeck || [];
    const extraDeck = activity.extraDeck || [];

    // Extract first 2 unique main deck card IDs
    const uniqueMainIds = Array.from(new Set(mainDeck)).filter(id => id && id !== '0').slice(0, 2);
    // Extract first extra deck card ID
    const extraId = extraDeck.length > 0 && extraDeck[0] !== '0' ? extraDeck[0] : null;

    return (
        <li className="d-flex justify-content-between align-items-center p-2 rounded bg-dark bg-opacity-75 border border-secondary border-opacity-25 shadow-sm">
            {/* 👈 LEFT: Activity Message */}
            <div className="text-start pe-2">
                <span className="fw-bold" style={{ color: '#00f2ff' }}>
                    {activity.username || "Duelist"}
                </span>{" "}
                <span className="text-white-50">
                    {activity.action || "published"}
                </span>{" "}
                <span className="text-white fst-italic fw-semibold">
                    "{activity.title || "New Deck"}"
                </span>
            </div>

            {/* 👉 RIGHT: Counts + Card Art Thumbnails */}
            <div className="d-flex align-items-center gap-2 ms-auto flex-shrink-0">
                {/* Deck Counts */}
                <div className="d-flex flex-column text-end pe-1">
                    <Badge bg="dark" className="border border-info text-info mb-1" style={{ fontSize: '0.65rem' }}>
                        MAIN: {mainDeck.length}
                    </Badge>
                    <Badge bg="dark" className="border border-warning text-warning" style={{ fontSize: '0.65rem' }}>
                        EXTRA: {extraDeck.length}
                    </Badge>
                </div>

                {/* Card Images */}
                <div className="d-flex gap-1 align-items-center">
                    {/* First 2 Unique Main Deck Cards */}
                    {uniqueMainIds.map((id, idx) => (
                        <img
                            key={`main-${id}-${idx}`}
                            src={`https://images.ygoprodeck.com/images/cards_small/${id}.jpg`}
                            alt="Main Card"
                            title={`Main Card ID: ${id}`}
                            className="rounded border border-info shadow-sm"
                            style={{ width: '28px', height: '40px', objectFit: 'cover' }}
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://images.ygoprodeck.com/images/cards/back_high.jpg';
                            }}
                        />
                    ))}

                    {/* First Extra Deck Card */}
                    {extraId && (
                        <img
                            key={`extra-${extraId}`}
                            src={`https://images.ygoprodeck.com/images/cards_small/${extraId}.jpg`}
                            alt="Extra Card"
                            title={`Extra Card ID: ${extraId}`}
                            className="rounded border border-warning shadow-sm"
                            style={{ width: '28px', height: '40px', objectFit: 'cover' }}
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://images.ygoprodeck.com/images/cards/back_high.jpg';
                            }}
                        />
                    )}
                </div>
            </div>
        </li>
    );
};

const LiveTicker = () => {
    const { activities } = useSignalR();
    const displayActivities = (activities || []).slice(0, 5);

    return (
        <Card className="master-duel-card shadow-lg border-info border-opacity-30">
            <Card.Header className="master-duel-card-header bg-dark text-info d-flex justify-content-between align-items-center py-2 px-3">
                <h6 className="mb-0 fw-bold" style={{ letterSpacing: '1px' }}>
                    LIVE ACTIVITY
                </h6>
            </Card.Header>
            <Card.Body className="p-2 bg-black-gradient">
                {/* Vertical descending list */}
                <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                    {displayActivities.length > 0 ? (
                        displayActivities.map((activity, idx) => (
                            <TickerItem key={idx} activity={activity} />
                        ))
                    ) : (
                        <div className="text-muted small p-3 text-center">
                            Waiting for duelists to publish decklists...
                        </div>
                    )}
                </ul>
            </Card.Body>
        </Card>
    );
};

export default LiveTicker;