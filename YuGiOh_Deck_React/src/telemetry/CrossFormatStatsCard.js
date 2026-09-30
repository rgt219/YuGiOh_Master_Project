import React from 'react';
import { Row, Col, Card, Badge } from 'react-bootstrap';
import styles from '@/components/market/market.module.css';

/** "2.10" -> 2.1, "16.0" -> 16: no trailing zeros, at most `digits` decimals. */
const tidy = (value, digits) => {
    const n = Number(value);
    return Number.isFinite(n) ? Number(n.toFixed(digits)) : 0; // a missing value shows 0, never "NaN"
};

export default function CrossFormatStatsCard({ formatStats = [] }) {
    // Every bar is scaled against the format with the highest inclusion rate, so the bars are comparable with each other.
    const maxRate = Math.max(0, ...formatStats.map((stat) => Number(stat.inclusionRate) || 0));

    return (
        <Card className={`border-0 shadow-lg ${styles.glass}`}>
            <Card.Header className="bg-transparent border-bottom border-info border-opacity-25 py-3">
                <h2 className="h5 text-white fw-bold m-0">DECK INCLUSION STATS</h2>
            </Card.Header>
            <Card.Body className="p-4">
                {formatStats.length > 0 ? (
                    <>
                        <Row className="g-3">
                            {formatStats.map((stat) => {
                                const rate = Number(stat.inclusionRate) || 0;
                                // The API has sent this field as both "totalDecksInFormat" and "TotalDecksInFormat".
                                const total = stat.totalDecksInFormat ?? stat.TotalDecksInFormat;
                                return (
                                    <Col xs={6} xxl={3} key={stat.format}>
                                        <div className="p-3 rounded bg-black bg-opacity-20 border border-secondary border-opacity-25 text-center h-100">
                                            <Badge bg="info" className="text-dark fw-bold mb-2">{String(stat.format || '?').toUpperCase()}</Badge>
                                            <div className="text-white fw-bold fs-4">
                                                {stat.deckCount}{' '}
                                                <span className="text-white-50 fs-6">{total != null ? `/ ${Number(total).toLocaleString()} Decks` : 'Decks'}</span>
                                            </div>
                                            {stat.deckCount > 0 ? (
                                                <>
                                                    <div className="text-info small mt-1">
                                                        Inclusion Rate: {tidy(rate, 1)}% ({tidy(stat.avgCopies, 2)}x avg)
                                                    </div>
                                                    <div className={`${styles.meter} mt-2`} aria-hidden="true">
                                                        <div className={styles.meterFill} style={{ width: `${maxRate > 0 ? (rate / maxRate) * 100 : 0}%` }} />
                                                    </div>
                                                </>
                                            ) : (
                                                <div className={`${styles.muted} small mt-1`}>No decks found</div>
                                            )}
                                        </div>
                                    </Col>
                                );
                            })}
                        </Row>
                        <div className={`${styles.muted} small mt-3`}>Bars are scaled to the format with the highest inclusion rate.</div>
                    </>
                ) : (
                    <div className="text-center text-white-50 py-3">NO DECK ANALYTICS ARCHIVED FOR THIS CARD YET</div>
                )}
            </Card.Body>
        </Card>
    );
}
