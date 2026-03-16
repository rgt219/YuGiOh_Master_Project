import React from "react";
import Button from 'react-bootstrap/Button';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import Card from 'react-bootstrap/Card';
import 'bootstrap/dist/css/bootstrap.min.css';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

export default function ImageOverlay({archetype, image, effect, yugipedia}) {
    return (
        <OverlayTrigger
          key='right'
          placement='right'
          overlay={
            
                <Card style={{ width: '36rem' }} bg="dark" text="white">
                    <Card.Body>
                        <Container style={{margin: 0}}>
                            <Row>
                                <Col>
                                    <Card.Title style={{fontFamily: "Cascadia Mono"}}>
                                        {/* <img 
                                            src={`/images/${archetype.image}`} 
                                            alt="" 
                                            style={{width: "65px", height: "75px", paddingRight: 10}}/> */}
                                        {archetype.cardName}
                                    </Card.Title>
                                </Col>
                                <Col xs lg="2">
                                    <img src={`/images/${archetype.attributeIcon}`} alt="" style={{width: "15px", height: "15px"}}/>{archetype.attribute}
                                    <img src={"/images/level.png"} alt="" style={{width: "15px", height: "15px"}}/>{archetype.level}
                                </Col>
                            </Row>
                        </Container>
                        <Card.Subtitle className="mb-2 text-grey">{archetype.cardType} / {archetype.cardSuperType}</Card.Subtitle>
                        <Card.Text bg="dark">
                        {archetype.effect}
                        </Card.Text>
                    </Card.Body>
                </Card>
          }
        >
            <img class="card_details" src={image} alt=""/>


        </OverlayTrigger>
    )
}