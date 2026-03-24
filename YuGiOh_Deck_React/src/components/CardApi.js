import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, OverlayTrigger, Container, Row, Col, Form, Card, Spinner } from 'react-bootstrap';
// FIX: Corrected the typo from 'tansack' to 'tanstack'
import { useQuery } from 'react-query';

export const deckList = {
    mainDeck: [], 
    extraDeck: [],
    sideDeck: [],
    id: '',
    title: '',
    userId: ''
};

// 1. Fetcher moved outside. Note: We use the 'thinning' logic here inside the fetcher.
const fetchYgoCards = async () => {
    const response = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php');
    if (!response.ok) throw new Error('NETWORK_ERROR');
    const data = await response.json();

    return data.data.map(card => ({
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
        image: card.card_images[0].image_url_small
    }));
};

export default function CardApi({ onAddCard, onDeleteCard, cardList }) {
    // 2. The useQuery Hook replaces your useEffect and the manual 'cards'/'loading' states.
    const { 
        data: cards = [], 
        isLoading: queryLoading, 
        isError 
    } = useQuery({
        queryKey: ['ygoCards'],
        queryFn: fetchYgoCards,
        staleTime: 1000 * 60 * 60, // Keep in memory for 1 hour
        cacheTime: 1000 * 60 * 60 * 2, // Keep the cache alive for 2 hours
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFrame, setSelectedFrame] = useState('all');
    const [cardLevel, setCardLevel] = useState('');
    const [attribute, setAttribute] = useState('');
    const [hoveredCardData, setHoveredCardData] = useState(null);

    const handleMouseEnter = async (cardId) => {
        if (hoveredCardData && String(hoveredCardData.id) === String(cardId)) return;
        try {
            const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${cardId}`);
            const result = await res.json();
            setHoveredCardData(result.data[0]);
        } catch (error) {
            console.error("FAILED_TO_FETCH_DESCRIPTION:", error);
        }
    };

    // 3. Derived values for filters (now using the 'cards' from React Query)
    const frameTypes = ["all", ...new Set(cards.map(card => card.frameType))];
    const cardLevels = ['', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const attributes = ['', ...new Set(cards.map(card => card.attribute))];

    const filteredCards = React.useMemo(() => {
        const results = cards.filter(card => {
            const matchesFrame = selectedFrame === 'all' || card.frameType === selectedFrame;
            const matchesText = !searchTerm || 
                card.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                card.desc.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesLevel = !cardLevel || card.level === parseInt(cardLevel);
            const matchesAttribute = !attribute || card.attribute === attribute;

            return matchesText && matchesFrame && matchesLevel && matchesAttribute;
        });
        return results.slice(0, 60); 
    }, [cards, searchTerm, selectedFrame, cardLevel, attribute]);

    // 4. Handle Loading and Error states
    if (queryLoading) return (
        <div className="text-center p-5">
            <Spinner animation="border" variant="info" />
            <div className="text-info mt-2">ACCESSING_MASTER_DATABASE...</div>
        </div>
    );

    if (isError) return <div className="text-danger p-5">ERROR: DATABASE_OFFLINE</div>;

    return (
        <div className="md-api-container">
            <Form>
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

                <Row className="g-2 mb-4">
                    <Col md={4}>
                        <Form.Select className="md-select-box" onChange={(e) => setSelectedFrame(e.target.value)} value={selectedFrame}>
                            <option value="all">FRAME_TYPE</option>
                            {frameTypes.map(type => <option key={type} value={type}>{type}</option>)}
                        </Form.Select>
                    </Col>
                    <Col md={3}>
                        <Form.Select className="md-select-box" onChange={(e) => setCardLevel(e.target.value)} value={cardLevel}>
                            <option value="">LEVEL</option>
                            {cardLevels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                        </Form.Select>
                    </Col>
                    <Col md={5}>
                        <Form.Select className="md-select-box" onChange={(e) => setAttribute(e.target.value)} value={attribute}>
                            <option value="">ATTRIBUTE</option>
                            {attributes.map(attr => <option key={attr} value={attr}>{attr}</option>)}
                        </Form.Select>
                    </Col>
                </Row>
            </Form>

            <div className="gallery" style={{overflowX: 'visible'}}>
                {filteredCards.map(card => (
                    <div key={card.id} className="gallery__item">
                        <div className="card-container">
                            <OverlayTrigger
                                placement="left"
                                onEnter={() => handleMouseEnter(card.id)}
                                overlay={
                                    <Card style={{ width: '36rem' }} bg="dark" text="white" className="border-info">
                                        <Card.Body>
                                            {hoveredCardData && String(hoveredCardData.id) === String(card.id) ? (
                                                <>
                                                    <Container style={{ margin: 0 }}>
                                                        <Row>
                                                            <Col>
                                                                <Card.Title style={{ fontFamily: "Cascadia Mono" }}>{hoveredCardData.name}</Card.Title>
                                                            </Col>
                                                            <Col xs lg="3">
                                                                {hoveredCardData.attribute} | 
                                                                <img src={"/images/level.png"} alt="" style={{ width: "15px", height: "15px" }} />
                                                                {hoveredCardData.level}
                                                            </Col>
                                                        </Row>
                                                    </Container>
                                                    <Card.Subtitle className="mb-2 text-muted">{hoveredCardData.race} / {hoveredCardData.type}</Card.Subtitle>
                                                    <Card.Text>{hoveredCardData.desc}</Card.Text>
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
                                <img className="card_details" src={card.image} alt={card.name} />
                            </OverlayTrigger>
                            <Button onClick={() => onDeleteCard(card.id)} variant="outline-danger" size="sm" className="md-btn-delete w-100">Delete</Button>
                            <div className="d-flex flex-column gap-1 mt-2">
                                <Button onClick={() => {
                                    const extraDeckFrames = ['fusion', 'synchro', 'xyz', 'link', 'fusion_pendulum', 'synchro_pendulum', 'xyz_pendulum'];
                                    const isExtraDeck = extraDeckFrames.includes(card.frameType?.toLowerCase());
                                    onAddCard({ ...card, isExtraDeck });
                                }} variant="outline-success" size="sm" className="md-btn-add w-100">Add</Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}