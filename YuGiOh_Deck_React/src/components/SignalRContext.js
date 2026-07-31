import React, { createContext, useContext, useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.happybush-e43d89b2.eastus.azurecontainerapps.io';
const SignalRContext = createContext();

export const SignalRProvider = ({ children }) => {
    const [activities, setActivities] = useState([]);
    const [connection, setConnection] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [latestActivity, setLatestActivity] = useState(null);

    useEffect(() => {
        // 1. Fetch initial 5 activity items from backend history
        fetch(`${API_BASE_URL}/api/analytics/recent-activity?limit=5`)
            .then(res => res.ok ? res.json() : [])
            .then(data => {
                if (Array.isArray(data)) {
                    setActivities(data.slice(0, 5));
                }
            })
            .catch(err => console.warn('Could not load activity history:', err));

        // 2. Setup SignalR Connection
        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(`${API_BASE_URL}/activityHub`)
            .withAutomaticReconnect()
            .build();

        newConnection.start()
            .then(() => {
                console.log("Global SignalR Connected!");

                newConnection.on("ReceiveActivity", (activity) => {
                    if (!activity) return;

                    console.log("Global Data Received:", activity);

                    const newActivity = {
                        username: activity.userName || activity.username || "Duelist",
                        action: activity.action || activity.Action || "published",
                        title: activity.title || activity.Title || "New Deck",
                        mainDeck: activity.mainDeck || activity.MainDeck || [],
                        extraDeck: activity.extraDeck || activity.ExtraDeck || []
                    };

                    setActivities(prev => [newActivity, ...prev].slice(0, 5));
                    setLatestActivity(newActivity);
                    setShowToast(true);
                });
            })
            .catch(err => console.error("SignalR Connection Error: ", err));

        setConnection(newConnection);

        return () => {
            if (newConnection) newConnection.stop();
        };
    }, []);

    return (
        <SignalRContext.Provider value={{
            activities,
            connection,
            showToast,
            setShowToast,
            latestActivity
        }}>
            {children}
        </SignalRContext.Provider>
    );
};

export const useSignalR = () => useContext(SignalRContext);