import React, { useState, useEffect, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button, Spinner, Badge, Alert, Card } from 'react-bootstrap';

export default function AiComboPlaybook({ show, onHide, deckName = "Untitled Deck", mainDeck = [], extraDeck = [] }) {
    const [drawnHand, setDrawnHand] = useState([]);
    const [loading, setLoading] = useState(false);
    const [comboData, setComboData] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    const drawHand = useCallback(() => {
        if (!mainDeck || mainDeck.length < 5) return;

        const shuffled = [...mainDeck];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        const hand = shuffled.slice(0, 5);
        setDrawnHand(hand);
        setComboData(null);
        setErrorMsg('');
    }, [mainDeck]);

    useEffect(() => {
        if (show) {
            drawHand();
        }
    }, [show, drawHand]);

    const handleAnalyzeHand = async () => {
        if (drawnHand.length < 5) {
            setErrorMsg("Your deck needs at least 5 cards to simulate an opening hand.");
            return;
        }

        setLoading(true);
        setErrorMsg('');
        setComboData(null);

        const handNames = drawnHand.map(c => c.name || c.Name).filter(Boolean);
        const mainNames = mainDeck.map(c => c.name || c.Name).filter(Boolean);
        const extraNames = extraDeck.map(c => c.name || c.Name).filter(Boolean);

        const systemPrompt = `You are a World-Class Yu-Gi-Oh! TCG Combo Theorist and Strategic Coach.

Deck Title: "${deckName}"
Full Main Deck (${mainNames.length} cards): [${mainNames.join(", ")}]
Full Extra Deck (${extraNames.length} cards): [${extraNames.join(", ")}]

USER DRAWN 5-CARD OPENING HAND: [${handNames.join(", ")}]

TASK:
1. Determine if this 5-card hand is playable or a brick.
2. Grade the hand (S, A, B, C, or Brick).
3. Write out the optimal step-by-step combo sequence to establish the strongest possible turn 1 end-board.
4. Detail the expected final end-board disruptions (negates, pops, floodgates).
5. Identify hand trap chokepoints (where Ash Blossom, Nibiru, or Infinite Impermanence hurts this hand most).

Output JSON ONLY in this exact structure:
{
  "handGrade": "A",
  "isPlayable": true,
  "endBoardSummary": "2 Monster Negates (Red Zone + Supernova) + 1 Board Pop",
  "comboSteps": [
    { "step": 1, "action": "Normal Summon Soul Resonator. Activate effect to search Vision Resonator." },
    { "step": 2, "action": "Special Summon Vision Resonator from hand..." }
  ],
  "chokepoints": [
    { "handTrap": "Ash Blossom & Joyous Spring", "riskLevel": "High", "mitigation": "If Soul Resonator is Ash'd, set Crimson Gaia and pass." }
  ],
  "nibiruSafety": "Summons 5th monster on step 4. Can make Red Dragon Archfiend before Nibiru threshold."
}`;

        try {
            const response = await fetch(
                `https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api/Ai/suggest`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ systemPrompt })
                }
            );

            if (!response.ok) {
                const errJson = await response.json().catch(() => ({}));
                throw new Error(errJson?.error || errJson?.details || `Backend Error (${response.status})`);
            }

            const data = await response.json();
            let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

            const parsedData = JSON.parse(rawText);
            setComboData(parsedData);
        } catch (err) {
            console.error("COMBO_PLAYBOOK_ERROR:", err);
            setErrorMsg(err.message || "Failed to generate combo playbook.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="xl" centered contentClassName="md-modal border-info">
            <Modal.Header closeButton className="border-info bg-dark text-info">
                <Modal.Title className="terminal-font">HAND SIMULATOR</Modal.Title>
            </Modal.Header>

            <Modal.Body className="bg-dark text-white p-4">
                <div className="mb-4 p-3 bg-black bg-opacity-70 rounded border border-info border-opacity-40">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <h6 className="text-info terminal-font m-0">OPENING HAND</h6>
                            <small className="text-muted">Simulated turn 1 draw from {mainDeck.length}-card deck</small>
                        </div>
                        <div className="d-flex gap-2">
                            <Button variant="outline-warning" size="sm" className="terminal-font fw-bold" onClick={drawHand} disabled={loading}>
                                REDRAW HAND
                            </Button>
                            <Button variant="info" size="sm" className="terminal-font fw-bold text-dark" onClick={handleAnalyzeHand} disabled={loading || drawnHand.length < 5}>
                                {loading ? <Spinner size="sm" animation="border" /> : "EXECUTE COMBO ANALYSIS"}
                            </Button>
                        </div>
                    </div>

                    <div className="row g-2 justify-content-center">
                        {drawnHand.map((card, idx) => (
                            <div key={idx} className="col-6 col-sm-4 col-md-2">
                                <Card className="bg-dark border-secondary h-100 text-center p-1">
                                    <img 
                                        src={card.image || card.card_images?.[0]?.image_url} 
                                        alt={card.name} 
                                        style={{ width: '100%', borderRadius: '4px', objectFit: 'cover' }} 
                                    />
                                    <div className="mt-1">
                                        <small className="text-white terminal-font d-block text-truncate" style={{ fontSize: '0.75rem' }}>
                                            {card.name}
                                        </small>
                                    </div>
                                </Card>
                            </div>
                        ))}
                    </div>
                </div>

                {errorMsg && <Alert variant="danger" className="terminal-font small my-3">{errorMsg}</Alert>}

                {comboData && !loading && (
                    <div className="bg-black p-4 rounded border border-info border-opacity-50">
                        <div className="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom border-secondary">
                            <div>
                                <Badge bg={comboData.handGrade === 'S' || comboData.handGrade === 'A' ? 'success' : comboData.handGrade === 'Brick' ? 'danger' : 'warning'} className="fs-6 me-2 terminal-font">
                                    HAND GRADE: {comboData.handGrade}
                                </Badge>
                                <span className="terminal-font text-info small">
                                    {comboData.isPlayable ? "PLAYABLE HAND" : "UNPLAYABLE / BRICK"}
                                </span>
                            </div>
                            <div className="text-end">
                                <small className="text-muted d-block terminal-font">EXPECTED END BOARD</small>
                                <strong className="text-warning small">{comboData.endBoardSummary}</strong>
                            </div>
                        </div>

                        <div className="row g-4">
                            <div className="col-lg-7">
                                <h6 className="text-info terminal-font mb-3">STEP-BY-STEP COMBO SEQUENCE</h6>
                                <div className="d-flex flex-column gap-2">
                                    {comboData.comboSteps?.map((s, i) => (
                                        <div key={i} className="p-2 px-3 bg-dark rounded border border-secondary border-opacity-50 d-flex gap-3 align-items-start">
                                            <Badge bg="info" className="text-dark terminal-font mt-1">STEP {s.step}</Badge>
                                            <span className="text-white-50 small leading-normal">{s.action}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="col-lg-5">
                                <h6 className="text-danger terminal-font mb-3">INTERRUPTIONS & CHOKEPOINTS</h6>
                                <div className="d-flex flex-column gap-2 mb-3">
                                    {comboData.chokepoints?.map((c, i) => (
                                        <div key={i} className="p-3 bg-dark rounded border border-danger border-opacity-40">
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <strong className="text-warning small terminal-font">{c.handTrap}</strong>
                                                <Badge bg={c.riskLevel === 'High' ? 'danger' : 'warning'}>{c.riskLevel} Risk</Badge>
                                            </div>
                                            <p className="text-white-50 small m-0" style={{ fontSize: '0.8rem' }}>
                                                {c.mitigation}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {comboData.nibiruSafety && (
                                    <div className="p-3 bg-dark rounded border border-warning border-opacity-40">
                                        <strong className="text-warning small terminal-font d-block mb-1">NIBIRU SAFETY EVALUATION</strong>
                                        <p className="text-white-50 small m-0" style={{ fontSize: '0.8rem' }}>
                                            {comboData.nibiruSafety}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal.Body>
        </Modal>
    );
}