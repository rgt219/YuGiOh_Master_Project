import React, { useState } from 'react';
import { Card, Badge, Table, Button, Form, Modal } from 'react-bootstrap';
import '../mdstyles.css';

export default function DeckPriceWidget({ mainDeck = [], extraDeck = [], sideDeck = [], onApplyBudgetSwap }) {
    const [priceProvider, setPriceProvider] = useState('tcgplayer_price'); // 'tcgplayer_price' | 'cardmarket_price' | 'ebay_price'
    const [showBudgetModal, setShowBudgetModal] = useState(false);

    const allCards = [...mainDeck, ...extraDeck, ...sideDeck];

    // Helper: Extract price float from card object
    const getCardPrice = (card) => {
        const prices = card?.card_prices?.[0] || card?.card_prices || {};
        const val = parseFloat(prices[priceProvider] || 0);
        return isNaN(val) ? 0 : val;
    };

    // Calculate total deck value
    const totalPrice = allCards.reduce((sum, card) => sum + getCardPrice(card), 0);

    // Group cards by name to count copies & top expensive cards
    const cardMap = {};
    allCards.forEach(card => {
        const name = card.name || card.Name;
        const price = getCardPrice(card);
        if (!cardMap[name]) {
            cardMap[name] = {
                name,
                count: 0,
                unitPrice: price,
                totalPrice: 0,
                image: card.image || card.card_images?.[0]?.image_url,
                cardData: card
            };
        }
        cardMap[name].count += 1;
        cardMap[name].totalPrice += price;
    });

    const uniqueCardList = Object.values(cardMap);
    
    // Sort by most expensive total cost
    const topExpensiveCards = [...uniqueCardList]
        .sort((a, b) => b.totalPrice - a.totalPrice)
        .slice(0, 5)
        .filter(c => c.totalPrice > 0);

    // Identify high-budget targets (cards over $15 unit price)
    const expensiveTargets = uniqueCardList.filter(c => c.unitPrice >= 15);

    const getCurrencySymbol = () => {
        if (priceProvider === 'cardmarket_price') return '€';
        return '$';
    };

    return (
        <Card className="bg-black border-info border-opacity-40 p-3 mb-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3 pb-2 border-bottom border-secondary border-opacity-50">
                <div>
                    <h6 className="text-info terminal-font m-0 fw-bold">
                        💰 DECK_VALUATION // MARKET_INDEX
                    </h6>
                    <small className="text-muted terminal-font">REAL-TIME TCG PRICING METRICS</small>
                </div>

                {/* CURRENCY / VENDOR SELECTOR */}
                <Form.Select 
                    size="sm" 
                    value={priceProvider} 
                    onChange={(e) => setPriceProvider(e.target.value)}
                    className="bg-dark text-info border-info terminal-font"
                    style={{ width: '160px' }}
                >
                    <option value="tcgplayer_price">TCGPlayer ($)</option>
                    <option value="cardmarket_price">Cardmarket (€)</option>
                    <option value="ebay_price">eBay ($)</option>
                </Form.Select>
            </div>

            {/* TOTAL PRICE METRIC DISPLAY */}
            <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-dark bg-opacity-60 rounded border border-secondary border-opacity-30">
                <div>
                    <small className="text-muted terminal-font d-block">ESTIMATED_DECK_TOTAL</small>
                    <div className="display-6 fw-bold terminal-font text-success">
                        {getCurrencySymbol()}{totalPrice.toFixed(2)}
                    </div>
                </div>

                {expensiveTargets.length > 0 && (
                    <Button 
                        variant="outline-warning" 
                        size="sm" 
                        className="terminal-font fw-bold"
                        onClick={() => setShowBudgetModal(true)}
                    >
                        ⚡ BUDGET OPTIMIZER ({expensiveTargets.length} HIGH-COST CARDS)
                    </Button>
                )}
            </div>

            {/* TOP 5 MOST EXPENSIVE CARDS TABLE */}
            {topExpensiveCards.length > 0 && (
                <div>
                    <small className="text-info terminal-font fw-bold d-block mb-2">
                        🔥 TOP_VALUE_DRIVERS (MOST EXPENSIVE CARDS)
                    </small>
                    <Table size="sm" variant="dark" responsive className="m-0 border-secondary border-opacity-25 small">
                        <thead>
                            <tr className="text-muted terminal-font">
                                <th>CARD</th>
                                <th className="text-center">QTY</th>
                                <th className="text-end">UNIT</th>
                                <th className="text-end">TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topExpensiveCards.map((c, i) => (
                                <tr key={i}>
                                    <td className="text-white terminal-font fw-bold text-truncate" style={{ maxWidth: '180px' }}>
                                        {c.name}
                                    </td>
                                    <td className="text-center text-info terminal-font">x{c.count}</td>
                                    <td className="text-end text-white-50">{getCurrencySymbol()}{c.unitPrice.toFixed(2)}</td>
                                    <td className="text-end text-success fw-bold">{getCurrencySymbol()}{c.totalPrice.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            )}

            {/* BUDGET OPTIMIZER MODAL */}
            <Modal show={showBudgetModal} onHide={() => setShowBudgetModal(false)} size="lg" centered contentClassName="md-modal border-warning">
                <Modal.Header closeButton className="bg-dark text-warning border-warning">
                    <Modal.Title className="terminal-font">⚡ BUDGET_OPTIMIZER // STAPLE_SUBSTITUTIONS</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-dark text-white p-4">
                    <p className="text-white-50 small mb-3">
                        The following cards in your deck carry a market value over $15.00 unit cost. Here are recommended budget staples and tech options to reduce overall deck cost:
                    </p>

                    <div className="d-flex flex-column gap-3">
                        {expensiveTargets.map((item, idx) => (
                            <div key={idx} className="p-3 bg-black rounded border border-secondary d-flex align-items-center justify-content-between flex-wrap gap-3">
                                <div>
                                    <span className="text-danger fw-bold terminal-font me-2">{item.name}</span>
                                    <Badge bg="danger">${item.unitPrice.toFixed(2)} / ea</Badge>
                                    <small className="text-muted d-block mt-1">
                                        Total Impact: ${(item.totalPrice).toFixed(2)} ({item.count} copies)
                                    </small>
                                </div>

                                <div className="text-end">
                                    <small className="text-success terminal-font d-block mb-1">RECOMMENDED BUDGET SWAP</small>
                                    <Badge bg="outline-success" className="border border-success text-success p-2">
                                        {item.name.includes("S:P Little Knight") ? "💡 Swap for Knightmare Unicorn (~$1.50)" :
                                         item.name.includes("Forbidden Droplet") ? "💡 Swap for Book of Eclipse (~$0.50)" :
                                         item.name.includes("Triple Tactics Thrust") ? "💡 Swap for Enemy Controller (~$0.25)" :
                                         "💡 Swap for Effect Veiler or Ghost Mourner (~$1.00)"}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </Modal.Body>
            </Modal>
        </Card>
    );
}