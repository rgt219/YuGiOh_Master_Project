'use client'; 

import React from 'react';
import Link from 'next/link';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Card, Spinner, Button } from 'react-bootstrap';
import { useMetaDeckProfile } from '@/hooks/useMetaDeckProfile';
import MetaDeckHeader from '@/components/MetaDeckHeader';
import MetaDeckInspector from '@/components/MetaDeckInspector';
import MetaDeckGrid from '@/components/MetaDeckGrid';
import DeckPriceWidget from '@/components/DeckPriceWidget';
import '@/mdstyles.css';

export default function MetaDeckProfile() {
  const {
    deck, loading, error, cardMap, cardCounts,
    hoveredCardData, pinnedCardData, setPinnedCardData,
    handleCardHover, handleCardClick
  } = useMetaDeckProfile();

  if (loading) {
    return (
      <div className="md-theme-bg min-vh-100 d-flex justify-content-center align-items-center mt-5">
        <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', backdropFilter: 'blur(10px)', maxWidth: '30rem' }} className="border-info p-4 text-center md-panel shadow-lg">
          <Card.Body>
            <Spinner animation="border" variant="info" className="mb-3" style={{ width: '3rem', height: '3rem' }} />
            <h5 className="text-info terminal-font fw-bold m-0" style={{ letterSpacing: '2px' }}>LOADING DECK PROFILE...</h5>
          </Card.Body>
        </Card>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="md-theme-bg min-vh-100 d-flex justify-content-center align-items-center mt-5">
        <Card style={{ backgroundColor: 'rgba(20, 8, 8, 0.95)', backdropFilter: 'blur(10px)', maxWidth: '32rem' }} className="border-danger p-4 text-center md-panel shadow-lg text-white">
          <Card.Body>
            <h4 className="text-danger terminal-font fw-bold mb-3">⚠️ PROFILE NOT FOUND</h4>
            <p className="text-white-50">{error || 'Deck could not be retrieved.'}</p>
            <Button as={Link} href="/meta-decks" variant="outline-danger" className="terminal-font fw-bold">
              RETURN TO ARCHIVE
            </Button>
          </Card.Body>
        </Card>
      </div>
    );
  }

  const archetype = deck?.archetype || deck?.Archetype || 'TOURNAMENT META DECK';
  const sampleDeck = deck?.sampleDeck || deck?.SampleDeck;
  const mainDeckIds = sampleDeck?.mainDeck || sampleDeck?.MainDeck || [];
  const extraDeckIds = sampleDeck?.extraDeck || sampleDeck?.ExtraDeck || [];
  const sideDeckIds = sampleDeck?.sideDeck || sampleDeck?.SideDeck || [];

  const mainDeckCards = mainDeckIds.map((cId) => cardMap[cId.toString()]).filter(Boolean);
  const extraDeckCards = extraDeckIds.map((cId) => cardMap[cId.toString()]).filter(Boolean);
  const sideDeckCards = sideDeckIds.map((cId) => cardMap[cId.toString()]).filter(Boolean);

  const activeCard = pinnedCardData || hoveredCardData || {
    name: archetype,
    type: 'TOURNAMENT DECK',
    desc: 'Click or hover over any card thumbnail in the decklists below to view its full stats, level, ATK/DEF, and card effect text.',
    card_images: [{ image_url: `https://images.ygoprodeck.com/images/cards/${mainDeckIds[0] || 'back_high'}.jpg` }]
  };

  const handleExportYDK = () => {
    let ydkContent = `#created by erregeteygo meta archive\n#main\n`;
    mainDeckIds.forEach(id => { ydkContent += `${id}\n`; });
    ydkContent += `\n#extra\n`;
    extraDeckIds.forEach(id => { ydkContent += `${id}\n`; });
    ydkContent += `\n!side\n`;
    sideDeckIds.forEach(id => { ydkContent += `${id}\n`; });

    const blob = new Blob([ydkContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${archetype.toLowerCase().replace(/[^a-z0-9]/g, '_')}_meta.ydk`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="md-theme-bg min-vh-100 py-5 mt-5">
      <Container fluid className="px-4 px-xxl-5">
        <div className="mb-3">
          <Button as={Link} href="/meta-decks" variant="outline-info" size="sm" className="terminal-font fw-bold">
            ← BACK TO META ARCHIVE
          </Button>
        </div>

        <Row className="g-4 mb-4 align-items-stretch">
          <Col xs={12} xxl={8}>
            <MetaDeckHeader deck={deck} cardCounts={cardCounts} mainDeckIds={mainDeckIds} onExportYDK={handleExportYDK} />
          </Col>
          
          <Col xs={12} xxl={4} className="d-none d-xxl-block">
            <DeckPriceWidget 
              mainDeck={mainDeckCards} 
              extraDeck={extraDeckCards} 
              sideDeck={sideDeckCards} 
            />
          </Col>
        </Row>

        <Row className="g-4">
          <Col lg={5} xxl={4} className="order-lg-1">
            <div style={{ position: 'sticky', top: '90px' }}>
              <MetaDeckInspector 
                activeCard={activeCard} 
                pinnedCardData={pinnedCardData} 
                setPinnedCardData={setPinnedCardData} 
              />
              
              <div className="d-xxl-none mt-4">
                <DeckPriceWidget 
                  mainDeck={mainDeckCards} 
                  extraDeck={extraDeckCards} 
                  sideDeck={sideDeckCards} 
                />
              </div>
            </div>
          </Col>

          {/* 🚀 FIXED: Wrapped the Deck Grids inside a nested Row structure */}
          <Col lg={7} xxl={8} className="order-lg-2">
            <Row className="g-4">
                
              {/* Main Deck takes 100% width on standard screens, 7 columns on ultrawide */}
              <Col xs={12} xxl={7}>
                <MetaDeckGrid 
                  title="MAIN DECK" 
                  borderColor="border-info border-opacity-50" 
                  textColor="text-info" 
                  deckIds={mainDeckIds} 
                  cardMap={cardMap} 
                  pinnedCardData={pinnedCardData} 
                  handleCardHover={handleCardHover} 
                  handleCardClick={handleCardClick} 
                />
              </Col>

              {/* Extra & Side Decks stack vertically, taking 5 columns on ultrawide */}
              <Col xs={12} xxl={5} className="d-flex flex-column gap-4">
                <MetaDeckGrid 
                  title="EXTRA DECK" 
                  borderColor="border-warning border-opacity-50" 
                  textColor="text-warning" 
                  deckIds={extraDeckIds} 
                  cardMap={cardMap} 
                  pinnedCardData={pinnedCardData} 
                  handleCardHover={handleCardHover} 
                  handleCardClick={handleCardClick} 
                />

                <MetaDeckGrid 
                  title="SIDE DECK" 
                  borderColor="border-success border-opacity-50" 
                  textColor="text-success" 
                  deckIds={sideDeckIds} 
                  cardMap={cardMap} 
                  pinnedCardData={pinnedCardData} 
                  handleCardHover={handleCardHover} 
                  handleCardClick={handleCardClick} 
                />
              </Col>

            </Row>
          </Col>
        </Row>
      </Container>
    </div>
  );
}