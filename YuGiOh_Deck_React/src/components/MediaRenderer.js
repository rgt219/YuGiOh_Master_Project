import React from 'react';

export default function MediaRenderer({ urls = [] }) {
    if (!urls || urls.length === 0) return null;

    // Helper to check if URL is YouTube
    const getYouTubeEmbedUrl = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) 
            ? `https://www.youtube.com/embed/${match[2]}` 
            : null;
    };

    return (
        <div className="d-flex flex-column gap-3 my-3">
            {urls.map((url, index) => {
                const ytEmbed = getYouTubeEmbedUrl(url);

                if (ytEmbed) {
                    return (
                        <div key={index} className="ratio ratio-16x9 rounded overflow-hidden border border-info border-opacity-25">
                            <iframe 
                                src={ytEmbed} 
                                title={`embedded-video-${index}`} 
                                allowFullScreen 
                            />
                        </div>
                    );
                }

                // Direct video link (.mp4, .webm)
                if (url.match(/\.(mp4|webm|ogg)$/i)) {
                    return (
                        <video key={index} controls className="w-100 rounded border border-info border-opacity-25" style={{ maxHeight: '450px' }}>
                            <source src={url} />
                            Your browser does not support video playback.
                        </video>
                    );
                }

                // Default: Image link (.png, .jpg, .gif, .webp)
                return (
                    <img 
                        key={index} 
                        src={url} 
                        alt="Forum attachment" 
                        className="img-fluid rounded border border-info border-opacity-25 shadow-sm" 
                        style={{ maxHeight: '500px', objectFit: 'contain' }}
                        onError={(e) => { e.target.style.display = 'none'; }} // Hide broken images gracefully
                    />
                );
            })}
        </div>
    );
}