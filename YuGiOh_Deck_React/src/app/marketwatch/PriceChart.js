'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatPrice, formatAxisPrice } from '@/components/market/marketFormat';

// Defined at module level: a component declared inside another component is re-created on every render.
function PriceTooltip({ active, payload, label }) {
    if (!active || !payload || payload.length === 0) return null;
    return (
        <div
            className="p-3 rounded shadow-lg border border-info border-opacity-50"
            style={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', fontFamily: "'Cascadia Mono', monospace" }}
        >
            <p className="text-white-50 mb-1 border-bottom border-secondary pb-1">{label}</p>
            {payload.map((entry) => (
                <p key={entry.dataKey} className="fw-bold mb-0" style={{ color: entry.color }}>
                    {entry.name}: {formatPrice(entry.value)}
                </p>
            ))}
        </div>
    );
}

const AXIS_TEXT = { fill: 'rgba(255,255,255,0.6)', fontSize: 12 };

/**
 * The Recharts line chart. It lives in its own file so MarketWatch can load it with next/dynamic:
 * the charting library (a large dependency) is then downloaded only when a price chart is actually shown.
 */
export default function PriceChart({ data }) {
    return (
        <div style={{ width: '100%', height: '350px' }}>
            <ResponsiveContainer>
                <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis dataKey="displayDate" stroke="rgba(255,255,255,0.5)" tick={AXIS_TEXT} tickLine={false} minTickGap={24} />
                    <YAxis domain={['auto', 'auto']} stroke="rgba(255,255,255,0.5)" tick={AXIS_TEXT} tickLine={false} tickFormatter={formatAxisPrice} width={60} />
                    <Tooltip content={<PriceTooltip />} />
                    <Legend formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>{value}</span>} />
                    <Line
                        name="Market price"
                        type="monotone"
                        dataKey="marketPrice"
                        stroke="#00d2ff"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6, fill: '#00d2ff', stroke: '#fff' }}
                        connectNulls
                    />
                    <Line
                        name="Listed median"
                        type="monotone"
                        dataKey="listedMedian"
                        stroke="#ffc107"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        activeDot={false}
                        connectNulls
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
