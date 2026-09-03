'use client';

import React from 'react';
import MarketWatch from './MarketWatch';

export default function MarketTestPage() {
    // Replace with a known ProductId from your Cosmos DB MarketMetrics collection
    const sampleProductId = 687213; 

    return (
        <main 
            className="d-flex justify-content-center align-items-center" 
            style={{ 
                backgroundColor: '#06080c', 
                minHeight: '100vh', 
                padding: '40px 20px',
                fontFamily: "'Cascadia Mono', monospace" 
            }}
        >
            <div style={{ width: '100%', maxWidth: '800px' }}>
                <h2 className="text-info fw-bold mb-4 text-center">
                    MARKET TELEMETRY TEST
                </h2>
                <MarketWatch productId={sampleProductId} />
            </div>
        </main>
    );
}