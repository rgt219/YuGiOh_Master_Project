import React, { createContext, useContext, useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';

const SignalRContext = createContext();

export const SignalRProvider = ({ children }) => {
    const [activities, setActivities] = useState([]);
    const [connection, setConnection] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [latestActivity, setLatestActivity] = useState(null);

    useEffect(() => {
        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl("https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/activityHub")
            .withAutomaticReconnect()
            .build();

        newConnection.start()
            .then(() => {
                console.log("Global SignalR Connected!");
                
                newConnection.on("ReceiveActivity", (activity) => {
                    if (!activity) return; 
                    
                    console.log("Global Data Received:", activity);
                    
                    const newActivity = {
                        username: activity.username || activity.Username || "Duelist",
                        action: activity.action || activity.Action || "published",
                        title: activity.title || activity.Title || "New Deck"
                    };

                    // Keep the activity list updated
                    setActivities(prev => [newActivity, ...prev].slice(0, 10));

                    // --- ADD THESE TWO LINES ---
                    setLatestActivity(newActivity); // Set the specific data for the Toast
                    setShowToast(true);             // Pop the Toast up
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