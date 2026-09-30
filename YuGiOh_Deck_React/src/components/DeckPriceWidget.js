import React, { useMemo, useState } from 'react';
import { Badge, Button, Form, Modal, Spinner, Table } from 'react-bootstrap';
import '../mdstyles.css';

const PROVIDERS = {
    tcgplayer_price: { label: 'TCGPlayer ($)', symbol: '$' },
    cardmarket_price: { label: 'Cardmarket (€)', symbol: '€' },
    ebay_price: { label: 'eBay ($)', symbol: '$' },
};

const EXPENSIVE_UNIT_PRICE = 15;

// Hand-written suggestions. A card that is not listed gets an honest "no suggestion yet" instead of a random guess.
const BUDGET_SWAPS = [
    { match: 'S:P Little Knight', swap: 'Knightmare Unicorn (~$1.50)' },
    { match: 'Forbidden Droplet', swap: 'Book of Eclipse (~$0.50)' },
    { match: 'Triple Tactics Thrust', swap: 'Enemy Controller (~$0.25)' },
];

const priceOf = (card, provider) => {
    const prices = card?.card_prices?.[0] || card?.card_prices || card?.cardPrices || {};
    const value = parseFloat(prices[provider]);
    return Number.isFinite(value) ? value : 0;
};

/**
 * Deck price box.
 *
 * It used to download the card prices again itself, and because its props were brand-new arrays on every
 * render of the page, it re-downloaded them on EVERY card hover. The prices are already inside the card
 * details the page loaded once, so this component now does no network calls at all: it only adds numbers up.
 * `cards` is one flat list with one entry per copy (main + extra + side).
 */
export default function DeckPriceWidget({ cards = [], loading = false }) {
    const [provider, setProvider] = useState('tcgplayer_price');
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const { symbol } = PROVIDERS[provider];

    const { total, topCards, expensive } = useMemo(() => {
        const byName = new Map();
        let sum = 0;
        cards.forEach((card) => {
            const price = priceOf(card, provider);
            sum += price;
            const entry = byName.get(card.name) || { name: card.name, count: 0, unitPrice: price, totalPrice: 0 };
            entry.count += 1;
            entry.totalPrice += price;
            entry.unitPrice = price;
            byName.set(card.name, entry);
        });
        const list = [...byName.values()];
        return {
            total: sum,
            topCards: [...list].sort((a, b) => b.totalPrice - a.totalPrice).slice(0, 5).filter((c) => c.totalPrice > 0),
            expensive: list.filter((c) => c.unitPrice >= EXPENSIVE_UNIT_PRICE),
        };
    }, [cards, provider]);

    return (
        <section className="mdp-panel mdp-price" aria-labelledby="mdp-price-title">
            <div className="mdp-price__head">
                <div>
                    <h2 id="mdp-price-title" className="mdp-price__title">DECK PRICE</h2>
                    <small className="mdp-price__sub">PRICES FROM YGOPRODECK</small>
                </div>
                <Form.Select
                    size="sm"
                    aria-label="Price source"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="bg-dark text-info border-info terminal-font"
                    style={{ width: '170px' }}
                >
                    {Object.entries(PROVIDERS).map(([value, { label }]) => <option key={value} value={value}>{label}</option>)}
                </Form.Select>
            </div>

            <div className="mdp-price__total">
                <div>
                    <small className="d-block text-white-50">ESTIMATED DECK TOTAL</small>
                    {loading ? (
                        <span className="d-flex align-items-center gap-2 mt-1">
                            <Spinner size="sm" animation="border" variant="success" />
                            <small className="text-success">LOADING PRICES...</small>
                        </span>
                    ) : (
                        <strong className="mdp-price__amount">{symbol}{total.toFixed(2)}</strong>
                    )}
                </div>
                {expensive.length > 0 && !loading && (
                    <Button variant="outline-warning" className="fw-bold" onClick={() => setShowBudgetModal(true)}>
                        BUDGET OPTIMIZER
                    </Button>
                )}
            </div>

            {!loading && topCards.length > 0 && (
                <>
                    <h3 className="mdp-price__label">TOP CARD PRICES</h3>
                    <Table size="sm" variant="dark" responsive className="m-0">
                        <thead>
                            <tr className="text-white-50">
                                <th scope="col">CARD</th>
                                <th scope="col" className="text-center">QTY</th>
                                <th scope="col" className="text-end">UNIT</th>
                                <th scope="col" className="text-end">TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topCards.map((c) => (
                                <tr key={c.name}>
                                    <td className="text-white fw-bold text-truncate" style={{ maxWidth: '200px' }}>{c.name}</td>
                                    <td className="text-center text-info">x{c.count}</td>
                                    <td className="text-end text-white-50">{symbol}{c.unitPrice.toFixed(2)}</td>
                                    <td className="text-end text-success fw-bold">{symbol}{c.totalPrice.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </>
            )}

            <Modal show={showBudgetModal} onHide={() => setShowBudgetModal(false)} size="lg" centered contentClassName="md-modal border-warning">
                <Modal.Header closeButton closeVariant="white" className="bg-dark text-warning border-warning">
                    <Modal.Title className="terminal-font">⚡ BUDGET OPTIMIZER</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-dark text-white p-4">
                    <p className="text-white-50 mb-3">
                        These cards cost {symbol}{EXPENSIVE_UNIT_PRICE}+ each. Suggested cheaper swaps:
                    </p>
                    <div className="d-flex flex-column gap-3">
                        {expensive.map((item) => {
                            const suggestion = BUDGET_SWAPS.find((s) => item.name.includes(s.match));
                            return (
                                <div key={item.name} className="p-3 bg-black rounded border border-secondary d-flex align-items-center justify-content-between flex-wrap gap-3">
                                    <div>
                                        <span className="text-danger fw-bold me-2">{item.name}</span>
                                        <Badge bg="danger">{symbol}{item.unitPrice.toFixed(2)} / ea</Badge>
                                        <small className="text-white-50 d-block mt-1">
                                            Total impact: {symbol}{item.totalPrice.toFixed(2)} ({item.count} {item.count === 1 ? 'copy' : 'copies'})
                                        </small>
                                    </div>
                                    <div className="text-end">
                                        <small className="text-success d-block mb-1">SUGGESTED SWAP</small>
                                        <span className="border border-success text-success rounded p-2 d-inline-block">
                                            {suggestion ? `💡 ${suggestion.swap}` : 'No suggestion yet'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Modal.Body>
            </Modal>
        </section>
    );
}
