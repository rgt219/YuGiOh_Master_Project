'use client';

import React, { useId } from 'react';
import { Row, Col, Card, Badge, Form, Button } from 'react-bootstrap';
import { AZURE_CDN_URL } from '@/utils/constants';
import TcgImage from '@/components/market/TcgImage';
import styles from '@/components/market/market.module.css';

const YGOPRODECK_IMAGE = (id) => `https://images.ygoprodeck.com/images/cards/${id}.jpg`;

/** ATK/DEF of -1 means "?" in the data. A missing value (spells, traps, Link monsters' DEF) means "don't show it". */
const formatStat = (value) => (value === -1 ? '?' : value);

/** The stat line under the badges: ATK / DEF / Level (or Rank, Link) / Pendulum Scale. Only stats the card really has. */
function buildStats(card) {
    if (!card) return [];
    const stats = [];
    if (card.atk != null) stats.push({ label: 'ATK', value: formatStat(card.atk), tone: 'text-warning' });
    if (card.def != null && card.def !== -1) stats.push({ label: 'DEF', value: card.def, tone: 'text-info' });
    if (card.linkval != null) stats.push({ label: 'LINK', value: card.linkval, tone: 'text-white' });
    else if (card.level != null) stats.push({ label: String(card.type || '').includes('XYZ') ? 'RANK' : 'LEVEL', value: card.level, tone: 'text-white' });
    if (card.scale != null) stats.push({ label: 'SCALE', value: card.scale, tone: 'text-white' });
    return stats;
}

/** Forbidden/Limited status per format, only if the card data includes it. */
function buildBanlist(card) {
    const info = card?.banlist_info;
    if (!info) return [];
    return [['TCG', info.ban_tcg], ['OCG', info.ban_ocg], ['MD', info.ban_masterduel]].filter(([, status]) => status);
}

export default function GameStatsCard({
    resolvedKonamiId,
    decodedCardName,
    cardDetails,
    selectedRarity,
    selectedSet,
    printingsMap = {},
    handleSetChange,
    handleRarityClick,
    tcgProductId,
    onOpenHolo,
}) {
    const setSelectId = useId();
    const availableRaritiesInSet = printingsMap[selectedSet] || [];
    const stats = buildStats(cardDetails);
    const banlist = buildBanlist(cardDetails);

    // Konami id known -> try our CDN, then YGOPRODeck. Unknown -> no request at all (it used to ask for ".../undefined.jpg").
    const imageSources = resolvedKonamiId ? [`${AZURE_CDN_URL}/${resolvedKonamiId}.jpg`, YGOPRODECK_IMAGE(resolvedKonamiId)] : [];

    return (
        <Card className={`border-0 shadow-lg ${styles.glass}`}>
            <Card.Body className="p-4">
                <Row className="g-4 align-items-center">
                    <Col xs={12} md={3} className="text-center">
                        <div className="position-relative mx-auto" style={{ width: '200px', height: '292px' }}>
                            <TcgImage sources={imageSources} alt={cardDetails?.name || decodedCardName} sizes="200px" />
                        </div>
                        {tcgProductId && (
                            <Button variant="outline-info" size="sm" className="mt-3 fw-bold" onClick={onOpenHolo}>
                                3D HOLO VIEW
                            </Button>
                        )}
                    </Col>
                    <Col xs={12} md={9}>
                        <h1 className="h2 text-white fw-bold mb-2">{cardDetails?.name || decodedCardName}</h1>
                        <div className="d-flex flex-wrap gap-2 mb-3">
                            {cardDetails?.attribute && <Badge bg="warning" className="text-dark fw-bold">{cardDetails.attribute}</Badge>}
                            {cardDetails?.type && <Badge bg="secondary">{cardDetails.type}</Badge>}
                            {cardDetails?.race && <Badge bg="dark" className="border border-info text-info">{cardDetails.race}</Badge>}
                            {banlist.map(([format, status]) => (
                                <Badge key={format} bg="dark" className="border border-danger text-danger">{format}: {status}</Badge>
                            ))}
                        </div>

                        <div className="mb-3 p-3 rounded bg-black bg-opacity-40 border border-secondary border-opacity-25">
                            <Row className="g-3 align-items-center">
                                <Col xs={12} lg={5}>
                                    <Form.Label htmlFor={setSelectId} className="text-info small mb-1 d-block">SELECT EXPANSION SET:</Form.Label>
                                    <Form.Select id={setSelectId} value={selectedSet} onChange={handleSetChange} className="bg-dark text-white border-secondary" style={{ fontSize: '0.85rem' }}>
                                        {Object.keys(printingsMap).map((setNameKey) => (
                                            <option key={setNameKey} value={setNameKey}>{setNameKey} ({printingsMap[setNameKey].length} printings)</option>
                                        ))}
                                    </Form.Select>
                                </Col>
                                <Col xs={12} lg={7}>
                                    <div className="text-info small mb-1">AVAILABLE RARITIES IN {String(selectedSet || '').toUpperCase()}:</div>
                                    <div className="d-flex flex-wrap gap-1">
                                        {availableRaritiesInSet.map((printing, index) => {
                                            const isActive = printing.set_rarity === selectedRarity;
                                            return (
                                                <Button
                                                    key={printing.set_code || index}
                                                    size="sm"
                                                    variant={isActive ? 'info' : 'outline-secondary'}
                                                    className={isActive ? 'text-dark fw-bold' : 'text-white-50'}
                                                    style={{ fontSize: '0.75rem' }}
                                                    aria-pressed={isActive}
                                                    onClick={() => handleRarityClick(printing)}
                                                >
                                                    {printing.set_rarity} ({printing.set_code})
                                                </Button>
                                            );
                                        })}
                                    </div>
                                </Col>
                            </Row>
                        </div>

                        {stats.length > 0 && (
                            <div className="d-flex flex-wrap gap-4 mb-3 text-white">
                                {stats.map((stat) => (
                                    <div key={stat.label}><strong>{stat.label}:</strong> <span className={stat.tone}>{stat.value}</span></div>
                                ))}
                            </div>
                        )}

                        <div
                            className="p-3 rounded bg-black bg-opacity-50 border border-secondary border-opacity-25 text-white-50 small"
                            style={{ whiteSpace: 'pre-line', maxHeight: '220px', overflowY: 'auto' }}
                        >
                            {cardDetails?.desc || 'No card effect text available.'}
                        </div>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
}
