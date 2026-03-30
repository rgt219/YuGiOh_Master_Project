import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ user }) => {
    // Check if the user state exists OR if a token is in storage
    const token = localStorage.getItem("token");

    if (!user && !token) {
        // No passport? Kick them back to the login screen
        console.warn("ACCESS_DENIED: Redirecting to login terminal...");
        return <Navigate to="/login" replace />;
    }

    // Passport verified. Render the child components (the "Outlet")
    return <Outlet />;
};

export default ProtectedRoute;