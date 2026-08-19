import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button, Form, Spinner, Card, Badge, Nav, ProgressBar, Alert } from 'react-bootstrap';

export default function AiCardSuggester({ show, onHide, mainDeck = [], extraDeck = [], onAddCard, onAutoBuildDeck }) {
    const [activeTab, setActiveTab] = useState('suggester'); // 'suggester' | 'autobuild' | 'analyzer'
    const [promptText, setPromptText] = useState('');
    const [autoBuildPrompt, setAutoBuildPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [auditData, setAuditData] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [skippedCards, setSkippedCards] = useState([]);

    const [formats, setFormats] = useState({
        TCG: true,
        OCG: false,
        MasterDuel: false,
        Genesys: false
    });

    const quickChips = [
        { label: "🛡️ Hand Traps", prompt: "Suggest 3 staple hand traps that fit this deck strategy." },
        { label: "🎯 Consistency", prompt: "Suggest 3 consistency boosters or searchers for this deck." },
        { label: "💥 Board Breakers", prompt: "Suggest 3 go-second board breakers for this setup." },
        { label: "🃏 Extra Deck Staples", prompt: "Suggest 3 generic Extra Deck monsters that complement this engine." },
    ];

    const handleFormatChange = (formatKey) => {
        setFormats(prev => ({ ...prev, [formatKey]: !prev[formatKey] }));
    };

    const callGeminiApi = async (systemPrompt) => {
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
            throw new Error(errJson?.error || errJson?.details || `Backend API Error (${response.status})`);
        }

        const data = await response.json();
        let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(rawText);
    };

    const handleAutoBuild = async (e) => {
        e.preventDefault();
        if (!autoBuildPrompt.trim()) return;

        setLoading(true);
        setErrorMsg('');
        setSkippedCards([]);
        setLoadingProgress('Analyzing archetype mechanics, enablers & summoning pathways...');

        const activeFormats = Object.keys(formats).filter(k => formats[k]);
        const formatConstraint = activeFormats.length > 0 ? activeFormats.join(", ") : "Standard TCG";

        const systemPrompt = `You are a Yu-Gi-Oh! TCG Master Deck Architect and Competitive Game Theory Engine.

User Request: "${autoBuildPrompt}"
Target Formats: [${formatConstraint}]

ALGORITHMIC DECK BUILDING RULES:
1. SUMMONING PATHWAYS & DEPENDENCIES:
   - For every Extra Deck boss monster, you MUST include its required summoning bridges or enablers in the deck (e.g., "The Crimson Dragon" for level 12 synchros, Fusion Spells for fusions, Tuners for Synchros).
2. STRICT CARD COUNT REQUIREMENTS (CRITICAL):
   - The SUM OF ALL "count" VALUES IN mainDeck MUST EQUAL EXACTLY 40 CARDS.
     (Example distribution: 10 cards @ 3 copies + 5 cards @ 2 copies = 40 cards total).
   - The SUM OF ALL "count" VALUES IN extraDeck MUST EQUAL EXACTLY 15 CARDS.
     (Example distribution: 15 cards @ 1 copy each = 15 cards total).
   - Max 3 copies per card name across Main & Extra deck.
3. OUTPUT FORMAT:
   - Use official full TCG card names.
   - Do NOT include Forbidden cards in [${formatConstraint}].

Output JSON ONLY in this exact structure:
{
  "deckName": "UPPERCASE_DECK_NAME",
  "strategyExplanation": "Explain in 2 sentences how the engines interact and how the Extra Deck bosses are summoned",
  "mainDeck": [
    { "cardName": "Full Official Card Name", "count": 3 }
  ],
  "extraDeck": [
    { "cardName": "Full Extra Deck Card Name", "count": 1 }
  ]
}`;

        try {
            const parsedAi = await callGeminiApi(systemPrompt);

            if (!parsedAi.mainDeck?.length) {
                throw new Error("AI failed to return a valid deck blueprint.");
            }

            setLoadingProgress('Synchronizing card database & artwork...');

            const failedList = [];

            const hydrateDeckSection = async (cardList) => {
                const hydratedCards = [];
                for (const item of cardList) {
                    try {
                        const ygoRes = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(item.cardName)}`);
                        if (!ygoRes.ok) {
                            failedList.push(item.cardName);
                            continue;
                        }

                        const ygoData = await ygoRes.json();
                        
                        if (ygoData.data?.[0]) {
                            const cardInfo = ygoData.data[0];
                            const copies = Math.min(Math.max(item.count || 1, 1), 3);
                            
                            for (let i = 0; i < copies; i++) {
                                hydratedCards.push({
                                    id: cardInfo.id,
                                    name: cardInfo.name,
                                    type: cardInfo.type,
                                    frameType: cardInfo.frameType,
                                    desc: cardInfo.desc,
                                    atk: cardInfo.atk,
                                    def: cardInfo.def,
                                    level: cardInfo.level,
                                    race: cardInfo.race,
                                    attribute: cardInfo.attribute,
                                    image: cardInfo.card_images[0].image_url,
                                    instanceId: Math.random()
                                });
                            }
                        } else {
                            failedList.push(item.cardName);
                        }
                    } catch (err) {
                        failedList.push(item.cardName);
                    }
                }
                return hydratedCards;
            };

            let [hydratedMain, hydratedExtra] = await Promise.all([
                hydrateDeckSection(parsedAi.mainDeck),
                hydrateDeckSection(parsedAi.extraDeck || [])
            ]);

            if (hydratedMain.length > 0 && hydratedMain.length < 40) {
                const nameCounts = {};
                hydratedMain.forEach(c => { nameCounts[c.name] = (nameCounts[c.name] || 0) + 1; });

                for (const card of [...hydratedMain]) {
                    if (hydratedMain.length >= 40) break;
                    if (nameCounts[card.name] < 3) {
                        hydratedMain.push({ ...card, instanceId: Math.random() });
                        nameCounts[card.name]++;
                    }
                }
            }

            if (hydratedExtra.length > 0 && hydratedExtra.length < 15) {
                const extraCounts = {};
                hydratedExtra.forEach(c => { extraCounts[c.name] = (extraCounts[c.name] || 0) + 1; });

                for (const card of [...hydratedExtra]) {
                    if (hydratedExtra.length >= 15) break;
                    if (extraCounts[card.name] < 3) {
                        hydratedExtra.push({ ...card, instanceId: Math.random() });
                        extraCounts[card.name]++;
                    }
                }
            }

            if (failedList.length > 0) {
                setSkippedCards(failedList);
            }

            if (hydratedMain.length === 0) {
                throw new Error("Could not hydrate card database. Please verify your prompt.");
            }

            if (onAutoBuildDeck) {
                onAutoBuildDeck({
                    main: hydratedMain,
                    extra: hydratedExtra,
                    name: parsedAi.deckName || "AI_GENERATED_DECK"
                });
            }

            setLoading(false);
            if (failedList.length === 0) {
                onHide();
            }
        } catch (err) {
            console.error("AUTO_BUILD_ERROR:", err);
            setErrorMsg(err.message || "Failed to auto-build deck.");
            setLoading(false);
        }
    };

    const handleAskAi = async (customPrompt = null, isAutoComplete = false) => {
        const query = customPrompt || promptText;
        if (!query.trim() && !isAutoComplete) return;

        setLoading(true);
        setErrorMsg('');
        setSuggestions([]);

        const mainNames = mainDeck.map(c => c.name || c.Name).filter(Boolean);
        const extraNames = extraDeck.map(c => c.name || c.Name).filter(Boolean);
        const neededCount = isAutoComplete ? Math.max(1, 40 - mainNames.length) : 3;

        const activeFormats = Object.keys(formats).filter(k => formats[k]);
        const formatConstraint = activeFormats.length > 0 ? activeFormats.join(", ") : "Standard TCG";

        const systemPrompt = `You are a Yu-Gi-Oh! Master Deck Building Assistant.
Current Main Deck (${mainNames.length} cards): [${mainNames.join(", ")}]
Current Extra Deck (${extraNames.length} cards): [${extraNames.join(", ")}]

User Request: "${isAutoComplete ? `Auto-complete this deck by filling remaining ${neededCount} slots.` : query}"

CRITICAL FORMAT RULES:
1. Target Format(s): [${formatConstraint}].
2. Suggested cards MUST be legal in ${formatConstraint}.
3. Suggest up to ${neededCount} official Yu-Gi-Oh! cards with 1-sentence technical synergy reasons.

Output JSON ONLY:
{
  "recommendations": [
    { "cardName": "Full Official Card Name", "reason": "1-sentence synergy reason" }
  ]
}`;

        try {
            const parsedAi = await callGeminiApi(systemPrompt);
            if (!parsedAi.recommendations?.length) throw new Error("No recommendations returned by AI.");

            const hydratedList = await Promise.all(
                parsedAi.recommendations.map(async (rec) => {
                    try {
                        const ygoRes = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(rec.cardName)}`);
                        if (!ygoRes.ok) return null;

                        const ygoData = await ygoRes.json();
                        if (ygoData.data?.[0]) {
                            const cardInfo = ygoData.data[0];
                            return {
                                cardData: {
                                    id: cardInfo.id,
                                    name: cardInfo.name,
                                    type: cardInfo.type,
                                    frameType: cardInfo.frameType,
                                    desc: cardInfo.desc,
                                    atk: cardInfo.atk,
                                    def: cardInfo.def,
                                    level: cardInfo.level,
                                    race: cardInfo.race,
                                    attribute: cardInfo.attribute,
                                    image: cardInfo.card_images[0].image_url
                                },
                                reason: rec.reason
                            };
                        }
                    } catch (err) {
                        console.error("Hydration failed for:", rec.cardName);
                    }
                    return null;
                })
            );

            const validCards = hydratedList.filter(Boolean);
            if (validCards.length === 0) throw new Error("Could not find matching cards in database.");

            setSuggestions(validCards);
        } catch (err) {
            console.error(err);
            setErrorMsg(err.message || "Failed to generate recommendations.");
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyzeDeck = async () => {
        setLoading(true);
        setErrorMsg('');
        setAuditData(null);

        const mainNames = mainDeck.map(c => c.name || c.Name).filter(Boolean);
        const extraNames = extraDeck.map(c => c.name || c.Name).filter(Boolean);

        if (mainNames.length === 0) {
            setErrorMsg("Cannot analyze an empty deck. Add cards first!");
            setLoading(false);
            return;
        }

        const activeFormats = Object.keys(formats).filter(k => formats[k]);
        const formatConstraint = activeFormats.length > 0 ? activeFormats.join(", ") : "Standard TCG";

        const systemPrompt = `You are a Competitive Yu-Gi-Oh! Deck Auditor.
Analyze the following deck list against [${formatConstraint}]:
Main Deck (${mainNames.length} cards): [${mainNames.join(", ")}]
Extra Deck (${extraNames.length} cards): [${extraNames.join(", ")}]

Output JSON ONLY:
{
  "grade": "A",
  "starterPercentage": 75,
  "brickRisk": "Low",
  "strengths": ["Strength 1"],
  "weaknesses": ["Weakness 1"],
  "recommendations": ["Actionable improvement 1"]
}`;

        try {
            const auditResult = await callGeminiApi(systemPrompt);
            setAuditData(auditResult);
        } catch (err) {
            console.error(err);
            setErrorMsg(err.message || "Failed to analyze deck health.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered contentClassName="md-modal border-info">
            <Modal.Header closeButton className="border-info bg-dark text-info">
                <Modal.Title className="terminal-font">AI ASSISTANT</Modal.Title>
            </Modal.Header>

            <Modal.Body className="bg-dark text-white p-4">
                <Nav variant="pills" activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4 bg-black p-1 rounded border border-secondary">
                    <Nav.Item className="flex-fill text-center">
                        <Nav.Link eventKey="suggester" className="terminal-font py-2 small">
                            CARD SUGGESTIONS
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item className="flex-fill text-center">
                        <Nav.Link eventKey="autobuild" className="terminal-font py-2 small text-warning fw-bold">
                            AUTO BUILD
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item className="flex-fill text-center">
                        <Nav.Link eventKey="analyzer" className="terminal-font py-2 small">
                            DECK GRADER
                        </Nav.Link>
                    </Nav.Item>
                </Nav>

                <div className="mb-3 p-3 bg-black bg-opacity-60 rounded border border-info border-opacity-30">
                    <Form.Label className="terminal-font text-info small d-block mb-2">
                        Filter By Active Format
                    </Form.Label>
                    <div className="d-flex flex-wrap gap-4">
                        {[
                            { key: 'TCG', label: 'TCG (Global)' },
                            { key: 'OCG', label: 'OCG (Asia)' },
                            { key: 'MasterDuel', label: 'Master Duel' },
                            { key: 'Genesys', label: 'Genesys' }
                        ].map(({ key, label }) => (
                            <Form.Check 
                                key={key}
                                type="checkbox"
                                id={`format-chk-${key}`}
                                label={<span className="terminal-font small text-white">{label}</span>}
                                checked={formats[key]}
                                onChange={() => handleFormatChange(key)}
                                className="custom-control-inline"
                            />
                        ))}
                    </div>
                </div>

                {activeTab === 'suggester' && (
                    <>
                        <div className="mb-3">
                            <Form.Label className="terminal-font text-info small d-block">Presets</Form.Label>
                            <div className="d-flex flex-wrap gap-2">
                                {quickChips.map((chip, idx) => (
                                    <Button
                                        key={idx}
                                        variant="outline-info"
                                        size="sm"
                                        className="terminal-font rounded-pill border-opacity-50"
                                        style={{ fontSize: '0.78rem' }}
                                        onClick={() => {
                                            setPromptText(chip.prompt);
                                            handleAskAi(chip.prompt);
                                        }}
                                        disabled={loading}
                                    >
                                        {chip.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <Form onSubmit={(e) => { e.preventDefault(); handleAskAi(); }} className="mb-3">
                            <Form.Group className="mb-3">
                                <Form.Label className="terminal-font text-info small">Custom Prompt Input</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    placeholder="e.g., 'Suggest 3 staple hand traps or board breakers for my current setup'..."
                                    className="md-input"
                                    value={promptText}
                                    onChange={(e) => setPromptText(e.target.value)}
                                    disabled={loading}
                                />
                            </Form.Group>

                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                <Button
                                    variant="outline-warning"
                                    className="terminal-font fw-bold"
                                    onClick={() => handleAskAi(null, true)}
                                    disabled={loading || mainDeck.length >= 40}
                                >
                                    Auto Build Deck ({Math.max(0, 40 - mainDeck.length)} Slots)
                                </Button>

                                <Button type="submit" variant="info" className="terminal-font fw-bold text-dark" disabled={loading || !promptText.trim()}>
                                    {loading ? <Spinner size="sm" animation="border" /> : "ANALYZE"}
                                </Button>
                            </div>
                        </Form>

                        {errorMsg && <div className="alert alert-danger terminal-font small">{errorMsg}</div>}

                        {suggestions.length > 0 && (
                            <div className="mt-4 pt-3 border-top border-info border-opacity-25">
                                <h6 className="text-info terminal-font mb-3">RECOMMENDED_TECH_CHOICES ({suggestions.length})</h6>
                                <div className="d-flex flex-column gap-3">
                                    {suggestions.map(({ cardData, reason }) => (
                                        <Card key={cardData.id} className="bg-black bg-opacity-70 border-info border-opacity-50 p-3">
                                            <div className="d-flex gap-3 align-items-center flex-column flex-sm-row">
                                                <img src={cardData.image} alt={cardData.name} style={{ width: '75px', borderRadius: '4px' }} />
                                                <div className="flex-grow-1">
                                                    <div className="d-flex align-items-center gap-2 mb-1">
                                                        <h6 className="m-0 text-white terminal-font fw-bold">{cardData.name}</h6>
                                                        <Badge bg="dark" className="border border-secondary text-uppercase small">{cardData.type}</Badge>
                                                    </div>
                                                    <p className="text-white-50 small m-0" style={{ fontSize: '0.85rem' }}>
                                                        <strong className="text-info">SYNERGY:</strong> {reason}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="outline-success"
                                                    size="sm"
                                                    className="terminal-font text-nowrap align-self-sm-center"
                                                    onClick={() => {
                                                        const extraDeckFrames = ['fusion', 'synchro', 'xyz', 'link', 'fusion_pendulum', 'synchro_pendulum', 'xyz_pendulum'];
                                                        const isExtraDeck = extraDeckFrames.includes(cardData.frameType?.toLowerCase());
                                                        onAddCard({ ...cardData, isExtraDeck });
                                                    }}
                                                >
                                                    + ADD TO DECK
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'autobuild' && (
                    <Form onSubmit={handleAutoBuild} className="mb-3">
                        <Form.Group className="mb-3">
                            <Form.Label className="terminal-font text-warning small fw-bold">
                                DESCRIBE DESIRED DECK ARCHETYPE(S) & BOOSTER SETS
                            </Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="e.g., Build me a competitively-viable White Forest / Centur-Ion deck..."
                                className="md-input border-warning border-opacity-50 mb-3"
                                value={autoBuildPrompt}
                                onChange={(e) => setAutoBuildPrompt(e.target.value)}
                                disabled={loading}
                            />
                        </Form.Group>

                        {loading && (
                            <div className="my-3 text-center p-3 bg-black bg-opacity-50 rounded border border-warning border-opacity-30">
                                <Spinner animation="border" variant="warning" className="mb-2" />
                                <div className="terminal-font text-warning small">{loadingProgress}</div>
                            </div>
                        )}

                        {errorMsg && <div className="alert alert-danger terminal-font small">{errorMsg}</div>}

                        {skippedCards.length > 0 && (
                            <Alert variant="warning" className="terminal-font small border-warning">
                                <strong>⚠️ SYSTEM_NOTICE:</strong> The following card names were generated by AI but could not be found in the YGOProDeck database (skipped):
                                <ul className="m-0 mt-1 ps-3">
                                    {skippedCards.map((c, i) => <li key={i}>{c}</li>)}
                                </ul>
                            </Alert>
                        )}

                        <div className="d-flex justify-content-end mt-3">
                            <Button type="submit" variant="warning" className="terminal-font fw-bold text-dark px-4" disabled={loading || !autoBuildPrompt.trim()}>
                                Generate Deck
                            </Button>
                        </div>
                    </Form>
                )}

                {activeTab === 'analyzer' && (
                    <div>
                        <div className="d-flex justify-content-center mb-4">
                            <Button variant="info" className="terminal-font text-dark fw-bold px-4" onClick={handleAnalyzeDeck} disabled={loading}>
                                {loading ? <Spinner size="sm" animation="border" /> : "Run Deck Audit"}
                            </Button>
                        </div>

                        {errorMsg && <div className="alert alert-danger terminal-font small">{errorMsg}</div>}

                        {auditData && (
                            <div className="bg-black p-4 rounded border border-info border-opacity-50">
                                <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom border-secondary">
                                    <div>
                                        <h5 className="text-info terminal-font m-0">DECK_HEALTH_GRADE</h5>
                                        <small className="text-muted">Format: {Object.keys(formats).filter(k=>formats[k]).join(", ") || "TCG"}</small>
                                    </div>
                                    <div className={`display-4 fw-bold terminal-font ${
                                        auditData.grade === 'A' ? 'text-success' :
                                        auditData.grade === 'B' ? 'text-info' :
                                        auditData.grade === 'C' ? 'text-warning' : 'text-danger'
                                    }`}>
                                        GRADE: {auditData.grade}
                                    </div>
                                </div>

                                <div className="row g-3 mb-4">
                                    <div className="col-md-6">
                                        <div className="p-3 bg-dark rounded border border-secondary">
                                            <div className="d-flex justify-content-between mb-1">
                                                <small className="terminal-font text-info">OPENING_STARTER_CONSISTENCY</small>
                                                <small className="terminal-font text-white">{auditData.starterPercentage}%</small>
                                            </div>
                                            <ProgressBar variant="info" now={auditData.starterPercentage} style={{ height: '8px' }} />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="p-3 bg-dark rounded border border-secondary">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <small className="terminal-font text-info">BRICK_RISK_RATING</small>
                                                <Badge bg={auditData.brickRisk === 'Low' ? 'success' : auditData.brickRisk === 'Moderate' ? 'warning' : 'danger'}>
                                                    {auditData.brickRisk} Risk
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="row g-3 mb-3">
                                    <div className="col-md-6">
                                        <h6 className="text-success terminal-font">✅ DECK_STRENGTHS</h6>
                                        <ul className="small text-white-50 ps-3">
                                            {auditData.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                                        </ul>
                                    </div>
                                    <div className="col-md-6">
                                        <h6 className="text-warning terminal-font">⚠️ SYNERGY_GAPS</h6>
                                        <ul className="small text-white-50 ps-3">
                                            {auditData.weaknesses?.map((w, i) => <li key={i}>{w}</li>)}
                                        </ul>
                                    </div>
                                </div>

                                <div className="pt-2 border-top border-secondary">
                                    <h6 className="text-info terminal-font">💡 RECOMMENDED_CORRECTIONS</h6>
                                    <ul className="small text-white ps-3 m-0">
                                        {auditData.recommendations?.map((r, i) => <li key={i}>{r}</li>)}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal.Body>
        </Modal>
    );
}