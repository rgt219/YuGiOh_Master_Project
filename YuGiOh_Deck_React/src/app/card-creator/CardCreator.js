'use client';

import React, { useState, useRef } from 'react';
import { Row, Col, Card, Form, Button } from 'react-bootstrap';
import html2canvas from 'html2canvas';

export default function CardCreator() {
    const cardRef = useRef(null);
    const [isExporting, setIsExporting] = useState(false);

    const [cardData, setCardData] = useState({
        template: 'Synchro',
        name: 'Cosmic Blazar Dragon',
        attribute: 'WIND', 
        property: 'Normal', 
        level: 12,
        effectText: '1 Tuner Synchro Monster + 2+ non-Tuner Synchro Monsters\nMust be Synchro Summoned. (Quick Effect): You can banish this card until the End Phase to activate 1 of these effects;\n● When your opponent activates a card or effect: Negate the activation, and if you do, destroy that card.\n● When your opponent would Summon a monster(s): Negate the Summon, and if you do, destroy that monster(s).\n● When an opponent\'s monster declares an attack: Negate the attack, then end the Battle Phase.',
        atk: '4000',
        def: '4000',
        typeLine: 'Dragon / Synchro / Effect',
        imagePreview: null,
        arrows: {
            topLeft: false, topCenter: false, topRight: false,
            middleLeft: false, middleRight: false,
            bottomLeft: false, bottomCenter: false, bottomRight: false
        }
    });

    const handleTemplateChange = (e) => {
        const val = e.target.value;
        setCardData(prev => {
            let newAttr = prev.attribute;
            if (val === 'Spell') newAttr = 'SPELL';
            else if (val === 'Trap') newAttr = 'TRAP';
            else if (prev.attribute === 'SPELL' || prev.attribute === 'TRAP') newAttr = 'LIGHT'; 

            return { ...prev, template: val, attribute: newAttr };
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCardData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCardData(prev => ({ ...prev, imagePreview: reader.result }));
            };
            reader.readAsDataURL(file); 
        }
    };

    const toggleArrow = (position) => {
        setCardData(prev => {
            const activeCount = Object.values(prev.arrows).filter(Boolean).length;
            if (!prev.arrows[position] && activeCount >= 8) return prev;
            return {
                ...prev,
                arrows: { ...prev.arrows, [position]: !prev.arrows[position] }
            };
        });
    };

    const handleExport = async () => {
        if (!cardRef.current) return;
        setIsExporting(true);
        
        try {
            const canvas = await html2canvas(cardRef.current, {
                useCORS: true,
                allowTaint: true,
                scale: 2, 
                backgroundColor: null
            });
            
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `${cardData.name.replace(/\s+/g, '_').toLowerCase()}_custom.png`;
            link.click();
        } catch (error) {
            console.error("EXPORT_FAILURE:", error);
        } finally {
            setIsExporting(false);
        }
    };

    const linkRating = Object.values(cardData.arrows).filter(Boolean).length;
    const isSpellTrap = cardData.template === 'Spell' || cardData.template === 'Trap';
    const isXYZ = cardData.template.includes('XYZ');
    const effectLength = cardData.effectText.length;

    const getTemplateBg = () => {
        switch (cardData.template) {
            case 'Normal': return '/images/templates/normal_template.jpg';
            case 'Effect': return '/images/templates/effect_template.png';
            case 'Fusion': return '/images/templates/fusion_template.png';
            case 'Synchro': return '/images/templates/synchro_template.png';
            case 'XYZ': return '/images/templates/xyz_template.png';
            case 'Link': return '/images/templates/link_template.jpg';
            case 'Pendulum': return '/images/templates/pendulum_template.png';
            case 'Fusion Pendulum': return '/images/templates/fusion_pendulum_template.png';
            case 'Synchro Pendulum': return '/images/templates/synchro_pendulum_template.png';
            case 'XYZ Pendulum': return '/images/templates/xyz_pendulum_template.png';
            case 'Spell': return '/images/templates/spell_template.png';
            case 'Trap': return '/images/templates/trap_template.png';
            default: return '/images/templates/effect_template.png';
        }
    };

    const getPropertyIconName = (prop) => {
        if (prop === 'Normal') return null;
        if (prop === 'Quick-Play') return 'quickplay';
        return prop.toLowerCase();
    };

    return (
        <Row className="g-4">
            <style>{`
                .terminal-input:focus {
                    background-color: rgba(0, 0, 0, 0.8) !important;
                    border-color: #00f2ff !important;
                    box-shadow: 0 0 12px rgba(0, 242, 255, 0.25) !important;
                    color: #fff !important;
                }
                .sticky-preview { position: sticky; top: 100px; }
                
                .ygo-card-container {
                    width: 100%;
                    max-width: 421px;
                    aspect-ratio: 421 / 610;
                    position: relative;
                    margin: 0 auto;
                    box-shadow: 0 15px 35px rgba(0,0,0,0.6);
                    background: #000;
                    overflow: hidden;
                }
                
                .ygo-bg {
                    position: absolute; top: 0; left: 0;
                    width: 100%; height: 100%; z-index: 2;
                    pointer-events: none;
                }

                .ygo-artwork {
                    position: absolute;
                    top: 18.2%; left: 11.5%;
                    width: 77%; height: 54%;
                    z-index: 1; 
                    object-fit: cover;
                }

                .ygo-name {
                    position: absolute;
                    top: 4.8%; left: 7.5%;
                    width: ${cardData.name.length > 20 ? '85%' : '72%'};
                    z-index: 3;
                    font-family: 'YGO-Matrix-Regular', 'Matrix', 'Times New Roman', serif;
                    font-size: ${cardData.name.length > 25 ? '1.65rem' : '1.95rem'};
                    color: ${isXYZ ? '#fff' : '#000'};
                    letter-spacing: 0.2px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-transform: capitalize;
                    text-shadow: ${isXYZ ? '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 2px 2px 3px rgba(0,0,0,0.9)' : 'none'};
                    transform: ${cardData.name.length > 18 ? 'scaleX(0.85)' : 'none'};
                    transform-origin: left center;
                }

                .ygo-attribute-img {
                    position: absolute;
                    top: 4.8%; right: 6.6%;
                    width: 7.6%;
                    z-index: 3;
                    filter: drop-shadow(0 2px 3px rgba(0,0,0,0.5));
                }

                .ygo-stars-container {
                    position: absolute;
                    top: 12.3%;
                    left: 11.5%;
                    width: 77%; 
                    z-index: 3;
                    display: flex;
                    flex-direction: ${isXYZ ? 'row' : 'row-reverse'};
                    justify-content: flex-start;
                    gap: 2.5px;
                }
                .ygo-star-img {
                    width: 23px;
                    height: 23px;
                    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.8));
                }

                .ygo-st-type {
                    position: absolute;
                    top: 11.6%; right: 7%;
                    z-index: 3;
                    display: flex; align-items: center; justify-content: flex-end;
                    font-family: 'YGO-Stone-Serif', 'Palatino Linotype', serif;
                    font-weight: bold;
                    font-size: 1.4rem; 
                    letter-spacing: 1px;
                }
                .ygo-st-icon {
                    height: 22px; margin-left: 6px; margin-bottom: 2px;
                    filter: drop-shadow(0 1px 1px rgba(0,0,0,0.3));
                }

                .ygo-text-box {
                    position: absolute;
                    bottom: 5.6%; left: 6.8%;
                    width: 86.4%; height: 19.5%;
                    z-index: 3;
                    padding: 1px 5px 2px 6px;
                    display: flex; flex-direction: column;
                    color: #000;
                }
                
                .ygo-type-line {
                    font-family: 'YGO-Stone-Serif', 'Palatino Linotype', 'Book Antiqua', serif;
                    font-weight: 900;
                    font-size: 0.95rem;
                    margin-bottom: 0px; 
                    line-height: 1.1;
                    letter-spacing: -0.3px;
                }
                
                /* AGGRESSIVE SCALING BASED ON CHARACTER COUNT */
                .ygo-effect {
                    font-family: 'YGO-Stone-Serif', 'Palatino Linotype', 'Book Antiqua', serif;
                    font-size: ${effectLength > 400 ? '0.53rem' : effectLength > 300 ? '0.58rem' : effectLength > 200 ? '0.65rem' : '0.75rem'};
                    line-height: ${effectLength > 400 ? '1' : '1.05'};
                    text-align: justify;
                    flex-grow: 1; 
                    white-space: pre-wrap;
                    letter-spacing: -0.1px;
                    overflow: hidden; 
                    padding-top: 1px;
                    margin-bottom: 2px;
                }
                
                /* INCREASED PADDING TO PREVENT LINE HUGGING */
                .ygo-stats-wrapper {
                    margin-top: auto; 
                    display: flex;
                    justify-content: flex-end;
                    width: 100%;
                    padding-top: 3px;
                    border-top: 1px solid #000;
                }
                .ygo-stats {
                    font-family: 'YGO-Matrix-Bold', 'Matrix', 'Times New Roman', serif;
                    font-size: 0.95rem;
                    letter-spacing: 0px;
                    padding-right: 2px;
                }

                .link-arrow { position: absolute; z-index: 4; background-color: #ff2a2a; box-shadow: 0 0 6px rgba(255, 42, 42, 0.8), inset 0 0 3px rgba(255,255,255,0.6); }
                .link-arrow.top-center { top: 16%; left: 45%; width: 10%; height: 3.5%; clip-path: polygon(50% 0%, 0% 100%, 100% 100%); }
                .link-arrow.bottom-center { bottom: 25.5%; left: 45%; width: 10%; height: 3.5%; clip-path: polygon(50% 100%, 0% 0%, 100% 0%); }
                .link-arrow.middle-left { top: 41.5%; left: 7%; width: 4.5%; height: 8%; clip-path: polygon(0% 50%, 100% 0%, 100% 100%); }
                .link-arrow.middle-right { top: 41.5%; right: 7%; width: 4.5%; height: 8%; clip-path: polygon(100% 50%, 0% 0%, 0% 100%); }
                .link-arrow.top-left { top: 16.5%; left: 8.5%; width: 5.5%; height: 4.5%; clip-path: polygon(0 0, 100% 0, 0 100%); }
                .link-arrow.top-right { top: 16.5%; right: 8.5%; width: 5.5%; height: 4.5%; clip-path: polygon(0 0, 100% 0, 100% 100%); }
                .link-arrow.bottom-left { bottom: 26%; left: 8.5%; width: 5.5%; height: 4.5%; clip-path: polygon(0 0, 0 100%, 100% 100%); }
                .link-arrow.bottom-right { bottom: 26%; right: 8.5%; width: 5.5%; height: 4.5%; clip-path: polygon(100% 0, 100% 100%, 0 100%); }
                
                .arrow-btn { width: 40px; height: 40px; background: #111; border: 1px solid #333; color: #555; transition: all 0.2s; }
                .arrow-btn.active { background: rgba(255, 51, 51, 0.2); border-color: #ff3333; color: #ff3333; box-shadow: 0 0 10px rgba(255,51,51,0.3); }
            `}</style>

            <Col md={6} lg={5}>
                <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', backdropFilter: 'blur(10px)' }} className="border-info border-opacity-50 shadow-lg p-4 rounded-4 md-panel h-100">
                    <h5 className="text-info fw-bold mb-4 cascadia-font border-bottom border-info border-opacity-25 pb-2">
                        CARD CHARACTERISTICS
                    </h5>

                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label className="text-white-50 terminal-font small fw-bold mb-1" style={{ fontSize: '0.75rem' }}>CARD TEMPLATE</Form.Label>
                            <Form.Select 
                                name="template" value={cardData.template} onChange={handleTemplateChange}
                                className="bg-black text-white border-secondary terminal-font py-2 terminal-input"
                            >
                                <option>Normal</option>
                                <option>Effect</option>
                                <option>Fusion</option>
                                <option>Synchro</option>
                                <option>XYZ</option>
                                <option>Link</option>
                                <option>Pendulum</option>
                                <option>Fusion Pendulum</option>
                                <option>Synchro Pendulum</option>
                                <option>XYZ Pendulum</option>
                                <option>Spell</option>
                                <option>Trap</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label className="text-white-50 terminal-font small fw-bold mb-1" style={{ fontSize: '0.75rem' }}>ARTWORK UPLINK</Form.Label>
                            <Form.Control 
                                type="file" accept="image/*" onChange={handleImageUpload}
                                className="bg-black text-white border-secondary terminal-font terminal-input"
                            />
                        </Form.Group>

                        {cardData.template === 'Link' && (
                            <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <Form.Label className="text-white-50 terminal-font small fw-bold mb-0" style={{ fontSize: '0.75rem' }}>LINK ARROWS</Form.Label>
                                    <span className="text-danger terminal-font fw-bold" style={{ fontSize: '0.8rem' }}>LINK-{linkRating}</span>
                                </div>
                                <div className="d-flex flex-column align-items-center gap-1 bg-black border border-secondary p-3 rounded">
                                    <div className="d-flex gap-1">
                                        <button type="button" className={`arrow-btn rounded ${cardData.arrows.topLeft ? 'active' : ''}`} onClick={() => toggleArrow('topLeft')}>↖</button>
                                        <button type="button" className={`arrow-btn rounded ${cardData.arrows.topCenter ? 'active' : ''}`} onClick={() => toggleArrow('topCenter')}>↑</button>
                                        <button type="button" className={`arrow-btn rounded ${cardData.arrows.topRight ? 'active' : ''}`} onClick={() => toggleArrow('topRight')}>↗</button>
                                    </div>
                                    <div className="d-flex gap-1">
                                        <button type="button" className={`arrow-btn rounded ${cardData.arrows.middleLeft ? 'active' : ''}`} onClick={() => toggleArrow('middleLeft')}>←</button>
                                        <div style={{ width: '40px', height: '40px' }} className="d-flex align-items-center justify-content-center text-secondary small">ART</div>
                                        <button type="button" className={`arrow-btn rounded ${cardData.arrows.middleRight ? 'active' : ''}`} onClick={() => toggleArrow('middleRight')}>→</button>
                                    </div>
                                    <div className="d-flex gap-1">
                                        <button type="button" className={`arrow-btn rounded ${cardData.arrows.bottomLeft ? 'active' : ''}`} onClick={() => toggleArrow('bottomLeft')}>↙</button>
                                        <button type="button" className={`arrow-btn rounded ${cardData.arrows.bottomCenter ? 'active' : ''}`} onClick={() => toggleArrow('bottomCenter')}>↓</button>
                                        <button type="button" className={`arrow-btn rounded ${cardData.arrows.bottomRight ? 'active' : ''}`} onClick={() => toggleArrow('bottomRight')}>↘</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Label className="text-white-50 terminal-font small fw-bold mb-1" style={{ fontSize: '0.75rem' }}>CARD NAME</Form.Label>
                            <Form.Control 
                                name="name" type="text" value={cardData.name} onChange={handleInputChange}
                                className="bg-black text-white border-secondary terminal-font py-2 terminal-input"
                            />
                        </Form.Group>

                        <Row className="g-2 mb-3">
                            <Col xs={isSpellTrap || cardData.template === 'Link' ? 12 : 6}>
                                <Form.Group>
                                    <Form.Label className="text-white-50 terminal-font small fw-bold mb-1" style={{ fontSize: '0.75rem' }}>ATTRIBUTE</Form.Label>
                                    <Form.Select 
                                        name="attribute" value={cardData.attribute} onChange={handleInputChange} disabled={isSpellTrap}
                                        className="bg-black text-white border-secondary terminal-font py-2 terminal-input"
                                    >
                                        <option value="DARK">DARK</option><option value="LIGHT">LIGHT</option><option value="EARTH">EARTH</option>
                                        <option value="WATER">WATER</option><option value="FIRE">FIRE</option><option value="WIND">WIND</option><option value="DIVINE">DIVINE</option>
                                        <option value="SPELL">SPELL</option><option value="TRAP">TRAP</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            
                            {!isSpellTrap && cardData.template !== 'Link' && (
                                <Col xs={6}>
                                    <Form.Group>
                                        <Form.Label className="text-white-50 terminal-font small fw-bold mb-1" style={{ fontSize: '0.75rem' }}>
                                            {isXYZ ? 'RANK' : 'LEVEL'}
                                        </Form.Label>
                                        <Form.Control 
                                            name="level" type="number" min="1" max="12" value={cardData.level} onChange={handleInputChange}
                                            className="bg-black text-white border-secondary terminal-font py-2 terminal-input"
                                        />
                                    </Form.Group>
                                </Col>
                            )}

                            {isSpellTrap && (
                                <Col xs={12}>
                                    <Form.Group>
                                        <Form.Label className="text-white-50 terminal-font small fw-bold mb-1 mt-2" style={{ fontSize: '0.75rem' }}>PROPERTY / ICON</Form.Label>
                                        <Form.Select 
                                            name="property" value={cardData.property} onChange={handleInputChange}
                                            className="bg-black text-white border-secondary terminal-font py-2 terminal-input"
                                        >
                                            <option>Normal</option><option>Continuous</option><option>Equip</option>
                                            <option>Field</option><option>Quick-Play</option><option>Ritual</option><option>Counter</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            )}
                        </Row>

                        {!isSpellTrap && (
                            <Form.Group className="mb-3">
                                <Form.Label className="text-white-50 terminal-font small fw-bold mb-1" style={{ fontSize: '0.75rem' }}>TYPE LINE</Form.Label>
                                <Form.Control 
                                    name="typeLine" type="text" value={cardData.typeLine} onChange={handleInputChange}
                                    className="bg-black text-white border-secondary terminal-font py-2 terminal-input"
                                    placeholder="e.g. Spellcaster / Effect"
                                />
                            </Form.Group>
                        )}

                        <Form.Group className="mb-3">
                            <div className="d-flex justify-content-between">
                                <Form.Label className="text-white-50 terminal-font small fw-bold mb-1" style={{ fontSize: '0.75rem' }}>EFFECT / DESCRIPTION</Form.Label>
                                <span className="text-info terminal-font small" style={{ fontSize: '0.7rem' }}>{effectLength} CHARS</span>
                            </div>
                            <Form.Control 
                                as="textarea" name="effectText" rows={4} value={cardData.effectText} onChange={handleInputChange}
                                className="bg-black text-white border-secondary terminal-font py-2 terminal-input" style={{ resize: 'none' }}
                            />
                        </Form.Group>

                        {!isSpellTrap && (
                            <Row className="g-2 mb-4">
                                <Col xs={6}>
                                    <Form.Group>
                                        <Form.Label className="text-white-50 terminal-font small fw-bold mb-1" style={{ fontSize: '0.75rem' }}>ATK</Form.Label>
                                        <Form.Control name="atk" type="text" value={cardData.atk} onChange={handleInputChange} className="bg-black text-white border-secondary terminal-font py-2 terminal-input" />
                                    </Form.Group>
                                </Col>
                                <Col xs={6}>
                                    <Form.Group>
                                        <Form.Label className="text-white-50 terminal-font small fw-bold mb-1" style={{ fontSize: '0.75rem' }}>DEF</Form.Label>
                                        <Form.Control name="def" type="text" value={cardData.def} onChange={handleInputChange} className="bg-black text-white border-secondary terminal-font py-2 terminal-input" disabled={cardData.template === 'Link'} />
                                    </Form.Group>
                                </Col>
                            </Row>
                        )}
                    </Form>
                </Card>
            </Col>

            {/* RIGHT COLUMN: Live Hologram & Canvas Export */}
            <Col md={6} lg={7}>
                <div className="sticky-preview">
                    
                    <div className="mb-4 d-flex justify-content-center w-100">
                        <div className="ygo-card-container" id="card-export-target" ref={cardRef}>
                            
                            {cardData.imagePreview ? (
                                <img src={cardData.imagePreview} alt="Artwork" className="ygo-artwork" />
                            ) : (
                                <div className="ygo-artwork d-flex align-items-center justify-content-center bg-dark text-white-50 p-4 text-center terminal-font small">
                                    AWAITING ARTWORK UPLINK...
                                </div>
                            )}

                            <img src={getTemplateBg()} alt="Template" className="ygo-bg" crossOrigin="anonymous" />
                            
                            {cardData.template === 'Link' && (
                                <>
                                    {cardData.arrows.topLeft && <div className="link-arrow top-left"></div>}
                                    {cardData.arrows.topCenter && <div className="link-arrow top-center"></div>}
                                    {cardData.arrows.topRight && <div className="link-arrow top-right"></div>}
                                    {cardData.arrows.middleLeft && <div className="link-arrow middle-left"></div>}
                                    {cardData.arrows.middleRight && <div className="link-arrow middle-right"></div>}
                                    {cardData.arrows.bottomLeft && <div className="link-arrow bottom-left"></div>}
                                    {cardData.arrows.bottomCenter && <div className="link-arrow bottom-center"></div>}
                                    {cardData.arrows.bottomRight && <div className="link-arrow bottom-right"></div>}
                                </>
                            )}

                            <div className="ygo-name">{cardData.name}</div>
                            
                            <img 
                                src={`/images/attributes/${cardData.attribute.toLowerCase()}.webp`} 
                                alt={cardData.attribute} 
                                className="ygo-attribute-img" 
                                crossOrigin="anonymous" 
                                onError={(e) => e.target.style.display = 'none'}
                            />

                            {isSpellTrap ? (
                                <div className="ygo-st-type">
                                    [{cardData.template.toUpperCase()} CARD
                                    {cardData.property !== 'Normal' && (
                                        <img 
                                            src={`/images/icons/${getPropertyIconName(cardData.property)}.webp`} 
                                            alt={cardData.property} 
                                            className="ygo-st-icon" 
                                            crossOrigin="anonymous"
                                            onError={(e) => e.target.style.display = 'none'}
                                        />
                                    )}]
                                </div>
                            ) : (
                                cardData.template !== 'Link' && (
                                    <div className="ygo-stars-container">
                                        {[...Array(Number(cardData.level) || 0)].map((_, i) => (
                                            <img 
                                                key={i} 
                                                src={isXYZ ? "/images/attributes/rank.webp" : "/images/attributes/level.png"} 
                                                alt={isXYZ ? "Rank" : "Level"} 
                                                className="ygo-star-img"
                                                crossOrigin="anonymous" 
                                            />
                                        ))}
                                    </div>
                                )
                            )}

                            <div className="ygo-text-box">
                                {!isSpellTrap && <div className="ygo-type-line">[{cardData.typeLine}]</div>}
                                
                                <div className="ygo-effect">
                                    {cardData.effectText}
                                </div>
                                
                                {!isSpellTrap && (
                                    <div className="ygo-stats-wrapper">
                                        <div className="ygo-stats">
                                            ATK/{cardData.atk} {cardData.template !== 'Link' ? ` DEF/${cardData.def}` : ` LINK-${linkRating}`}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="text-center px-lg-5">
                        <Button 
                            variant="outline-info" 
                            className="w-100 fw-bold terminal-font py-3 shadow-lg" 
                            style={{ letterSpacing: '2px', fontSize: '1.1rem' }}
                            onClick={handleExport}
                            disabled={isExporting}
                        >
                            {isExporting ? 'EXPORTING HOLOGRAPHIC DATA...' : ' EXPORT CUSTOM CARD '}
                        </Button>
                    </div>

                </div>
            </Col>
        </Row>
    );
}