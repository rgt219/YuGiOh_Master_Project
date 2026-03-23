import React, { createContext, useContext, useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';

const SignalRContext = createContext();

export const SignalRProvider = ({ children }) => {
    const [activities, setActivities] = useState([]);
    const [connection, setConnection] = useState(null);

    useEffect(() => {
        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl("https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/activityHub")
            .withAutomaticReconnect()
            .build();

        newConnection.start()
            .then(() => {
                console.log("Global SignalR Connected!");
                
                newConnection.on("ReceiveActivity", (activity) => {
                    if (!activity) return; // Don't process empty messages
                    
                    console.log("Global Data Received:", activity);
                    
                    // Normalize the data so the UI doesn't break if fields are missing
                    const newActivity = {
                        username: activity.username || activity.Username || "Duelist",
                        action: activity.action || activity.Action || "published",
                        title: activity.title || activity.Title || "New Deck"
                    };

                    setActivities(prev => [newActivity, ...prev].slice(0, 10));
                });
            })
            .catch(err => console.error("SignalR Connection Error: ", err));

        setConnection(newConnection);

        return () => {
            if (newConnection) newConnection.stop();
        };
    }, []);

    return (
        <SignalRContext.Provider value={{ activities }}>
            {children}
        </SignalRContext.Provider>
    );
};

export const useSignalR = () => useContext(SignalRContext);