import React, { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { Card } from 'react-bootstrap'; // Import Card to match TrendingCards

const LiveTicker = () => {
    const [activities, setActivities] = useState([]);

    useEffect(() => {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl("https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/activityHub") 
            .withAutomaticReconnect()
            .build();

        console.log("CONNECTION: " + connection);

        connection.start()
            .then(() => console.log("Connected to Live Ticker!"))
            .catch(err => console.error("SignalR Connection Error: ", err));

        connection.on("ReceiveActivity", (activity) => {
            console.log("RAW DATA RECEIVED:", activity); 
            alert("YAY");
            setActivities(prev => [activity, ...prev].slice(0, 5));
        });

        return () => { if (connection) connection.stop(); };
    }, []);

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
                                {/* Check for both casing styles just to be safe */}
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