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
        // 🚀 1. Fetch initial 5 most recent items from MongoDB on page load
        fetch(`${API_BASE_URL}/api/analytics/recent-activity?limit=5`)
            .then(res => res.ok ? res.json() : [])
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    const mappedData = data.map(item => ({
                        username: item.username || item.userName || "Duelist",
                        action: item.action || "published",
                        title: item.title || "New Deck",
                        mainDeck: item.mainDeck || [],
                        extraDeck: item.extraDeck || []
                    }));
                    setActivities(mappedData);
                }
            })
            .catch(err => console.warn('Could not load activity history from DB:', err));

        // 🚀 2. Connect SignalR for incoming real-time broadcasts
        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(`${API_BASE_URL}/activityHub`)
            .withAutomaticReconnect()
            .build();

        newConnection.start()
            .then(() => {
                console.log("Global SignalR Connected!");

                newConnection.on("ReceiveActivity", (activity) => {
                    if (!activity) return;

                    console.log("Global Realtime Event Received:", activity);

                    const newActivity = {
                        username: activity.username || activity.userName || "Duelist",
                        action: activity.action || "published",
                        title: activity.title || "New Deck",
                        mainDeck: activity.mainDeck || [],
                        extraDeck: activity.extraDeck || []
                    };

                    // Prepend new activity and cap at top 5 items
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