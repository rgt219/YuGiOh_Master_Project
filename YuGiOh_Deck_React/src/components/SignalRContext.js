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
                    console.log("Global Data Received:", activity);
                    // Add to the top of the list, keep last 10
                    setActivities(prev => [activity, ...prev].slice(0, 10));
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