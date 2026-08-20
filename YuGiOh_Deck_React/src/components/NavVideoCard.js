'use client';

import React, { useState, useRef } from "react";
import Card from 'react-bootstrap/Card';
import Link from 'next/link';

export default function NavVideoCard({ link }) {
    const videoRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseEnter = () => {
        setIsHovered(true);
        if (videoRef.current) {
            videoRef.current.currentTime = 0; 
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) playPromise.catch(() => {});
        }
    };

    const handleMouseLeave = () => {
        setIsHovered(false); 
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    };

    return (
        <Card 
            as={Link} 
            href={link.path} 
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="md-nav-card flex-grow-1 flex-sm-grow-0 overflow-hidden border-0 shadow-lg"
            style={{ width: '100%', maxWidth: '300px', textDecoration: 'none', cursor: 'pointer', backgroundColor: '#0a0d14' }}
        >
            <div className="md-card-img-container" style={{ position: 'relative', width: '100%', aspectRatio: '1/1', backgroundColor: '#0a0d14' }}>
                <Card.Img src={link.img} style={{ width: '100%', height: "100%", objectFit: "cover", opacity: 0.8 }} />
                {link.video && (
                    <video
                        ref={videoRef}
                        src={link.video}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        style={{ 
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                            objectFit: 'cover', opacity: isHovered ? 1 : 0, transition: 'opacity 0.25s ease-in-out', pointerEvents: 'none'
                        }}
                    />
                )}
            </div>
            <Card.Body className="p-0">
                <div className="md-card-overlay-text text-center py-2 text-info terminal-font fw-bold border-top border-info border-opacity-50" style={{ backgroundColor: 'rgba(10, 13, 20, 0.9)' }}>
                    {link.label}
                </div>
            </Card.Body>
        </Card>
    );
}