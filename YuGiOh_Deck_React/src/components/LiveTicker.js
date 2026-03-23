import React from 'react';
import { Card } from 'react-bootstrap';
import { useSignalR } from './SignalRContext.js';// Path to your context

const LiveTicker = () => {
    const { activities } = useSignalR(); // Just grab the data from global state

    return (
        <Card className="master-duel-card">
            <Card.Header className="master-duel-card-header">
                <h6 className="mb-0 text-white fw-bold">📡 Live Activity</h6>
            </Card.Header>
            <Card.Body className="p-2 bg-black-gradient">
                <ul className="list-unstyled mb-0">
                    {activities.length > 0 ? (
                        activities.map((a, i) => (
                            <li key={i} className="master-duel-ticker-item">
                                <span style={{ color: '#00f2ff', fontWeight: 'bold' }}>{a.username || a.Username}</span> 
                                <span className="text-white-50"> {a.action || a.Action || "published"} </span> 
                                <span className="text-white" style={{ fontStyle: 'italic' }}>{a.title || a.Title}</span>
                            </li>
                        ))
                    ) : (
                        <div className="text-muted small p-2">Waiting for duelists...</div>
                    )}
                </ul>
            </Card.Body>
        </Card>
    );
};

export default LiveTicker;