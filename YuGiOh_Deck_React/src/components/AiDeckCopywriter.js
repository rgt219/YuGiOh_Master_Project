import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Form, Modal, Button, Spinner, Badge, Nav, Alert } from 'react-bootstrap';

export default function AiDeckCopywriter({ show, onHide, deckName = "Untitled Deck", mainDeck = [], extraDeck = [] }) {
    const [activeTab, setActiveTab] = useState('formatted'); // 'formatted' | 'markdown'
    const [loading, setLoading] = useState(false);
    const [articleData, setArticleData] = useState(null);
    const [copied, setCopied] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Call backend Azure proxy endpoint
    const handleGenerateWriteup = async () => {
        setLoading(true);
        setErrorMsg('');
        setArticleData(null);

        const mainNames = mainDeck.map(c => c.name || c.Name).filter(Boolean);
        const extraNames = extraDeck.map(c => c.name || c.Name).filter(Boolean);

        if (mainNames.length === 0) {
            setErrorMsg("Deck is empty! Add cards to your deck before generating a profile write-up.");
            setLoading(false);
            return;
        }

        const systemPrompt = `You are a Professional Yu-Gi-Oh! TCG Journalist and Competitive Deck Profile Writer.

Analyze this deck list:
Deck Title: "${deckName}"
Main Deck (${mainNames.length} cards): [${mainNames.join(", ")}]
Extra Deck (${extraNames.length} cards): [${extraNames.join(", ")}]

Task: Generate an engaging, professional Deck Profile Write-up.

Output JSON ONLY in this exact structure:
{
  "headline": "Catchy Journalist Headline (e.g. Unlocking the Full Synergy of White Forest & Centur-Ion)",
  "overview": "2-3 sentence executive summary explaining the deck's primary identity and win strategy.",
  "playstyleTag": "Combo / Control / Aggro / Midrange",
  "engineBreakdown": [
    { "engineName": "Core Engine Name", "explanation": "2 sentences on how this engine functions in the deck" }
  ],
  "keyWinConditions": [
    "Win condition point 1",
    "Win condition point 2"
  ],
  "budgetSubstitutions": [
    { "expensiveCard": "Card Name", "budgetOption": "Budget Card Name", "reason": "Why it works as a budget sub" }
  ],
  "markdownExport": "Full Reddit/Discord formatted markdown string of the entire article including the card list"
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
            setArticleData(parsedData);
        } catch (err) {
            console.error("COPYWRITER_ERROR:", err);
            setErrorMsg(err.message || "Failed to generate deck profile write-up.");
        } finally {
            setLoading(false);
        }
    };

    const handleCopyMarkdown = () => {
        if (!articleData?.markdownExport) return;
        navigator.clipboard.writeText(articleData.markdownExport);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered contentClassName="md-modal border-info">
            <Modal.Header closeButton className="border-info bg-dark text-info">
                <Modal.Title className="terminal-font">✍️ AI_DECK_COPYWRITER // PUBLISHING_SUITE</Modal.Title>
            </Modal.Header>

            <Modal.Body className="bg-dark text-white p-4">
                {/* INITIAL GENERATE CALLOUT */}
                {!articleData && !loading && (
                    <div className="text-center py-4">
                        <h5 className="text-info terminal-font mb-2">GENERATE A PROFESSIONAL DECK PROFILE</h5>
                        <p className="text-white-50 small mb-4" style={{ maxWidth: '550px', margin: '0 auto' }}>
                            The AI will analyze your saved card choices, extract core engine synergies, map out win conditions, and write a complete article ready for Reddit, Discord, or tournament logs.
                        </p>
                        <Button variant="info" className="terminal-font fw-bold text-dark px-4 py-2" onClick={handleGenerateWriteup}>
                            GENERATE PROFILE WRITE-UP ⚡
                        </Button>
                    </div>
                )}

                {/* LOADING SPINNER */}
                {loading && (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="info" className="mb-3" />
                        <div className="terminal-font text-info small">ANALYZING ENGINE SYNERGIES & DRAFTING ARTICLE...</div>
                    </div>
                )}

                {errorMsg && <Alert variant="danger" className="terminal-font small my-3">{errorMsg}</Alert>}

                {/* ARTICLE RESULTS */}
                {articleData && !loading && (
                    <>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <Nav variant="pills" activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="bg-black p-1 rounded border border-secondary">
                                <Nav.Item>
                                    <Nav.Link eventKey="formatted" className="terminal-font py-1 px-3 small">
                                        📰 FORMATTED_ARTICLE
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="markdown" className="terminal-font py-1 px-3 small">
                                        📋 RAW_MARKDOWN (REDDIT/DISCORD)
                                    </Nav.Link>
                                </Nav.Item>
                            </Nav>

                            <Button 
                                variant={copied ? "success" : "outline-info"} 
                                size="sm" 
                                className="terminal-font fw-bold"
                                onClick={handleCopyMarkdown}
                            >
                                {copied ? "✓ COPIED TO CLIPBOARD!" : "📋 COPY MARKDOWN"}
                            </Button>
                        </div>

                        {/* TAB 1: FORMATTED ARTICLE VIEW */}
                        {activeTab === 'formatted' && (
                            <div className="bg-black p-4 rounded border border-info border-opacity-40">
                                <div className="d-flex align-items-center gap-2 mb-2">
                                    <Badge bg="info" className="text-dark terminal-font text-uppercase">
                                        {articleData.playstyleTag || "Competitive"}
                                    </Badge>
                                    <small className="text-muted terminal-font">{deckName}</small>
                                </div>

                                <h4 className="text-white terminal-font fw-bold mb-3">{articleData.headline}</h4>
                                <p className="text-white-50 leading-relaxed mb-4">{articleData.overview}</p>

                                {/* ENGINE BREAKDOWN */}
                                {articleData.engineBreakdown?.length > 0 && (
                                    <div className="mb-4">
                                        <h6 className="text-info terminal-font border-bottom border-secondary pb-2 mb-3">
                                            🧱 CORE_ENGINE_BREAKDOWN
                                        </h6>
                                        <div className="d-flex flex-column gap-2">
                                            {articleData.engineBreakdown.map((eng, i) => (
                                                <div key={i} className="p-3 bg-dark rounded border border-secondary border-opacity-50">
                                                    <strong className="text-warning terminal-font d-block mb-1">{eng.engineName}</strong>
                                                    <span className="text-white-50 small">{eng.explanation}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* WIN CONDITIONS */}
                                {articleData.keyWinConditions?.length > 0 && (
                                    <div className="mb-4">
                                        <h6 className="text-success terminal-font border-bottom border-secondary pb-2 mb-2">
                                            🏆 PRIMARY_WIN_CONDITIONS
                                        </h6>
                                        <ul className="text-white-50 small ps-3 m-0">
                                            {articleData.keyWinConditions.map((win, i) => (
                                                <li key={i} className="mb-1">{win}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* BUDGET SUBSTITUTIONS */}
                                {articleData.budgetSubstitutions?.length > 0 && (
                                    <div>
                                        <h6 className="text-warning terminal-font border-bottom border-secondary pb-2 mb-3">
                                            💡 BUDGET_ALTERNATIVES
                                        </h6>
                                        <div className="d-flex flex-column gap-2">
                                            {articleData.budgetSubstitutions.map((sub, i) => (
                                                <div key={i} className="p-2 bg-dark rounded border border-secondary small d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <span className="text-danger text-decoration-line-through me-2">{sub.expensiveCard}</span>
                                                        <span className="text-success fw-bold">➔ {sub.budgetOption}</span>
                                                    </div>
                                                    <small className="text-muted">{sub.reason}</small>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 2: RAW MARKDOWN VIEW */}
                        {activeTab === 'markdown' && (
                            <div className="bg-black p-3 rounded border border-secondary">
                                <Form.Control
                                    as="textarea"
                                    rows={12}
                                    value={articleData.markdownExport}
                                    readOnly
                                    className="bg-dark text-info terminal-font small border-0"
                                    style={{ fontFamily: 'monospace' }}
                                />
                            </div>
                        )}
                    </>
                )}
            </Modal.Body>
        </Modal>
    );
}