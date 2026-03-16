import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Navbar, Form, FormControl, NavDropdown, Nav, Card, Spinner } from 'react-bootstrap';

export const deckList = {
    mainDeck: [], // This will now store ID strings, not card objects
    extraDeck: [],
    sideDeck: [],
    id: '',
    title: '',
    userId: ''
};


export default function CardApi({ onAddCard, onDeleteCard, cardList }) 
{
    const [cards, setCards] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedFrame, setSelectedFrame] = useState('all');
    const [cardLevel, setCardLevel] = useState();
    const [attack, setAttack] = useState();
    const [defense, setDefense] = useState();
    const [attribute, setAttribute] = useState();
    const [hoveredCardData, setHoveredCardData] = useState(null);

    const handleMouseEnter = async (cardId) => {
    // If we already have the data for this card, don't fetch again
      if (hoveredCardData && hoveredCardData.id === cardId) return;

          try {
              const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${cardId}`);
              const result = await res.json();
              setHoveredCardData(result.data[0]);
          } catch (error) {
              console.error("FAILED_TO_FETCH_DESCRIPTION:", error);
          }
      };

    // 1. Fetch data from YGOPRODeck API [3]
    useEffect(() => {
    const fetchAndCache = async () => {
        try {
            const cached = sessionStorage.getItem("YGOMasterCache");
            if (cached) {
                setCards(JSON.parse(cached));
                setLoading(false);
                return;
            }

            const response = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php');
            const data = await response.json();

            // THINNING: Keep only the essentials for the Editor
            const thinCards = data.data.map(card => ({
                id: card.id,
                name: card.name,
                type: card.type,
                frameType: card.frameType,
                desc: card.desc,
                atk: card.atk,
                def: card.def,
                level: card.level,
                race: card.race,
                attribute: card.attribute,
                image: card.card_images[0].image_url_small // We need this for the .image_url_small
            }));

            // Save the 2MB version instead of the 10MB version
            try {
                sessionStorage.setItem("YGOMasterCache", JSON.stringify(thinCards));
            } catch (e) {
                console.warn("Storage full, continuing in-memory only.");
            }

            setCards(thinCards);
            setLoading(false);
        } catch (error) {
            console.error("FAILED_TO_LOAD_CARDS:", error);
        }
    };

    fetchAndCache();
}, []);


    const frameTypes = ["all", ...new Set(cards.map(card => card.frameType))];
    const cardLevels = ['', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const attributes = ['', ...new Set(cards.map(card => card.attribute))];

    const filteredCards = React.useMemo(() => {
    const results = cards.filter(card => {
            // Fix: Use lowercase 'all' consistently
            const matchesFrame = selectedFrame === 'all' || card.frameType === selectedFrame;
            
            const matchesText = !searchTerm || 
                card.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                card.desc.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesLevel = !cardLevel || card.level === parseInt(cardLevel);
            const matchesAttribute = !attribute || card.attribute === attribute;

            return matchesText && matchesFrame && matchesLevel && matchesAttribute;
        });

        // PERF FIX: Only render the first 50-100 cards. 
        // This removes the "DOM lag" entirely.
        return results.slice(0, 60); 
    }, [cards, searchTerm, selectedFrame, cardLevel, attribute]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="md-api-container">
      <Form>
      {/* Search Input Row */}
      <Row className="mb-3">
        <Col>
          <Form.Group controlId="cardSearch">
            <Form.Control
              type="search"
              placeholder="SYSTEM_SEARCH: ENTER CARD NAME..."
              className="md-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Form.Group>
        </Col>
      </Row>

      {/* Filter Row */}
      <Row className="g-2 mb-4">
        <Col md={4}>
          <Form.Select 
            className="md-select-box"
            onChange={(e) => setSelectedFrame(e.target.value)} 
            value={selectedFrame}
          >
            <option value="all">FRAME_TYPE</option>
            {frameTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </Form.Select>
        </Col>

        <Col md={3}>
          <Form.Select 
            className="md-select-box"
            onChange={(e) => setCardLevel(e.target.value)} 
            value={cardLevel}
          >
            <option value="">LEVEL</option>
            {cardLevels.map(lvl => (
              <option key={lvl} value={lvl}>{lvl}</option>
            ))}
          </Form.Select>
        </Col>

        <Col md={5}>
          <Form.Select 
            className="md-select-box"
            onChange={(e) => setAttribute(e.target.value)} 
            value={attribute}
          >
            <option value="">ATTRIBUTE</option>
            {attributes.map(attr => (
              <option key={attr} value={attr}>{attr}</option>
            ))}
          </Form.Select>
        </Col>
      </Row>
    </Form>
      
      
      
      <div class="gallery" style={{overflowX: 'visible'}}>
        {filteredCards.map(card => (
            <div className="gallery__item">
          <div key={card.id} 
            className="card-container">

            <OverlayTrigger
                key={card.id}
                placement="left"
                onEnter={() => handleMouseEnter(card.id)} // Triggers when hover starts
                overlay={
                  <Card style={{ width: '36rem' }} bg="dark" text="white" className="border-info">
                    <Card.Body>
                      {hoveredCardData && String(hoveredCardData.id) === String(card.id) ? (
                        <>
                          <Container style={{ margin: 0 }}>
                            <Row>
                              <Col>
                                <Card.Title style={{ fontFamily: "Cascadia Mono" }}>
                                  {hoveredCardData.name}
                                </Card.Title>
                              </Col>
                              <Col xs lg="3">
                                {hoveredCardData.attribute} | 
                                <img src={"/images/level.png"} alt="" style={{ width: "15px", height: "15px" }} />
                                {hoveredCardData.level}
                              </Col>
                            </Row>
                          </Container>
                          <Card.Subtitle className="mb-2 text-muted">
                            {hoveredCardData.race} / {hoveredCardData.type}
                          </Card.Subtitle>
                          <Card.Text>
                            {hoveredCardData.desc}
                          </Card.Text>
                        </>
                      ) : (
                        <div className="text-center p-3">
                          <Spinner animation="border" size="sm" variant="info" className="me-2" />
                          <span className="text-info">ACCESSING_DATABASE...</span>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                }
              >
                <img className="card_details" src={card.image} alt="" />
              </OverlayTrigger>
              <Button onClick={() => {
                onDeleteCard(card.id);
              }
              
              } variant="outline-danger" size="sm" className="md-btn-delete w-100">Delete</Button>
              <div className="d-flex flex-column gap-1 mt-2">
              <Button onClick={() => {
                  const extraDeckFrames = ['fusion', 'synchro', 'xyz', 'link', 'fusion_pendulum', 'synchro_pendulum', 'xyz_pendulum'];
                  const isExtraDeck = extraDeckFrames.includes(card.frameType?.toLowerCase());

                  // Just pass the card properties directly
                  const newCard = {
                      ...card, // This spreads all the thinned properties (id, name, desc, image, etc.)
                      isExtraDeck: isExtraDeck 
                  };

                  onAddCard(newCard);
                  console.log(`Added to ${isExtraDeck ? 'EXTRA' : 'MAIN'} DECK:`, newCard.name);
              }} variant="outline-success" size="sm" className="md-btn-add w-100">Add</Button>
                </div>
            
          </div>
          </div>
        ))}
      </div>

      
    </div>
  );
}