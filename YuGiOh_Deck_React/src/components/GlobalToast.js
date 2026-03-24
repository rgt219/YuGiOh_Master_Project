import React from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { useSignalR } from './SignalRContext';

const GlobalToast = () => {
    const { showToast, setShowToast, latestActivity } = useSignalR();

    if (!latestActivity) return null;

    return (
        <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 9999 }}>
            <Toast 
                onClose={() => setShowToast(false)} 
                show={showToast} 
                delay={5000} 
                autohide
                bg="dark"
                className="border-info"
            >
                <Toast.Header closeButton={true} className="bg-info text-black">
                    <strong className="me-auto">📡 NEW ACTIVITY</strong>
                </Toast.Header>
                <Toast.Body className="text-white">
                    <span style={{ color: '#00f2ff' }}>{latestActivity.username}</span> 
                    {` ${latestActivity.action} `}
                    <span className="fw-bold">{latestActivity.title}</span>
                </Toast.Body>
            </Toast>
        </ToastContainer>
    );
};

export default GlobalToast;