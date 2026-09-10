'use client';

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; 
import { Form, Button, Modal, Card, Spinner, Row, Col } from 'react-bootstrap';
import { API_URLS } from "@/config";
import "@/mdstyles.css";

export default function Register() {
    const [email, setEmail] = useState("");
    const [userName, setuserName] = useState("");
    const [fName, setFName] = useState("");
    const [lName, setLName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmedPassword, setConfirmedPassword] = useState("");
    const [validated, setValidated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");

        const form = e.currentTarget;

        if (form.checkValidity() === false || password !== confirmedPassword) {
            e.stopPropagation();
            setValidated(true);

            if (password !== confirmedPassword) {
                setErrorMessage("PASSWORDS_DO_NOT_MATCH");
            }
            return;
        }

        const formData = {
            id: (Math.floor(Math.random() * (1000000 - 1 + 1)) + 1),
            userName: userName,
            email: email,
            firstName: fName,
            lastName: lName,
            password: password
        };

        setIsLoading(true);

        try {
            const baseUrl = API_URLS?.IDENTITY || "";
            const response = await fetch(`${baseUrl}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setShowSuccessModal(true);
            } else {
                const error = await response.json();
                setErrorMessage(error.message || "REGISTRATION_FAILED");
            }
        } catch (error) {
            setErrorMessage("SYSTEM_OFFLINE: UNABLE_TO_REACH_SERVER");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="md-theme-bg d-flex align-items-center justify-content-center px-3 py-5" style={{ minHeight: "100vh", fontFamily: "'Cascadia Mono', monospace" }}>
            <style>{`
                .terminal-input:focus {
                    background-color: rgba(0, 0, 0, 0.8) !important;
                    border-color: #00f2ff !important;
                    box-shadow: 0 0 12px rgba(0, 242, 255, 0.25) !important;
                    color: #fff !important;
                }
            `}</style>

            <div style={{ width: '100%', maxWidth: '480px' }}>
                <Card style={{ backgroundColor: 'rgba(10, 13, 20, 0.75)', backdropFilter: 'blur(8px)' }} className="border-info border-opacity-50 shadow-lg p-4 p-md-5 rounded-4 md-panel">
                    
                    <div className="text-center mb-4">
                        <span className="badge bg-black bg-opacity-60 border border-info border-opacity-50 text-info px-3 py-1 mb-3 terminal-font" style={{ fontSize: '0.65rem', letterSpacing: '2px' }}>
                            VRAINS REGISTRATION GATEWAY
                        </span>
                        <h2 className="fw-bold text-white m-0 cascadia-font" style={{ fontSize: '1.75rem', letterSpacing: '1px', textShadow: '0 0 15px rgba(0,210,255,0.3)' }}>
                            ErreGeTe <span className="text-info">YGO</span>
                        </h2>
                        <p className="text-white-50 small mt-1 terminal-font" style={{ fontSize: '0.75rem' }}>
                            Initialize your duelist profile credentials
                        </p>
                    </div>

                    {errorMessage && (
                        <div className="alert alert-danger bg-black bg-opacity-75 border border-danger text-danger py-2 px-3 small terminal-font rounded-2 mb-4" role="alert" style={{ fontSize: '0.8rem' }}>
                            ⚠️ {errorMessage}
                        </div>
                    )}

                    <Form noValidate validated={validated} onSubmit={handleSubmit}>
                        <Row className="g-2 mb-3">
                            <Col md={6}>
                                <Form.Label className="text-info terminal-font small fw-bold mb-1" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>
                                    FIRST NAME
                                </Form.Label>
                                <Form.Control
                                    required
                                    type="text"
                                    className="bg-black text-white border-secondary terminal-font py-2 terminal-input"
                                    style={{ backgroundColor: 'rgba(0,0,0,0.6)', fontSize: '0.85rem' }}
                                    placeholder="First Name"
                                    value={fName}
                                    onChange={(e) => setFName(e.target.value)}
                                />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="text-info terminal-font small fw-bold mb-1" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>
                                    LAST NAME
                                </Form.Label>
                                <Form.Control
                                    required
                                    type="text"
                                    className="bg-black text-white border-secondary terminal-font py-2 terminal-input"
                                    style={{ backgroundColor: 'rgba(0,0,0,0.6)', fontSize: '0.85rem' }}
                                    placeholder="Last Name"
                                    value={lName}
                                    onChange={(e) => setLName(e.target.value)}
                                />
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label className="text-info terminal-font small fw-bold mb-1" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
                                USERNAME
                            </Form.Label>
                            <Form.Control
                                required
                                type="text"
                                className="bg-black text-white border-secondary terminal-font py-2 terminal-input"
                                style={{ backgroundColor: 'rgba(0,0,0,0.6)', fontSize: '0.9rem' }}
                                placeholder="duelist_handle"
                                value={userName}
                                onChange={(e) => setuserName(e.target.value)}
                            />
                        </Form.Group>
                        
                        <Form.Group className="mb-3" controlId="validationEmail">
                            <Form.Label className="text-info terminal-font small fw-bold mb-1" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
                                EMAIL ADDRESS
                            </Form.Label>
                            <Form.Control 
                                required
                                type="email" 
                                placeholder="duelist@domain.com"
                                className="bg-black text-white border-secondary terminal-font py-2 terminal-input"
                                style={{ backgroundColor: 'rgba(0,0,0,0.6)', fontSize: '0.9rem' }}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="validationPassword">
                            <Form.Label className="text-info terminal-font small fw-bold mb-1" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
                                PASSWORD (MIN 8 CHARS)
                            </Form.Label>
                            <Form.Control 
                                required
                                type="password" 
                                placeholder="••••••••"
                                className="bg-black text-white border-secondary terminal-font py-2 terminal-input"
                                style={{ backgroundColor: 'rgba(0,0,0,0.6)', fontSize: '0.9rem' }}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={8}
                            />
                        </Form.Group>

                        <Form.Group className="mb-4" controlId="validationConfirmPassword">
                            <Form.Label className="text-info terminal-font small fw-bold mb-1" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
                                CONFIRM PASSWORD
                            </Form.Label>
                            <Form.Control 
                                required 
                                type="password" 
                                className="bg-black text-white border-secondary terminal-font py-2 terminal-input"
                                style={{ backgroundColor: 'rgba(0,0,0,0.6)', fontSize: '0.9rem' }}
                                placeholder="••••••••"
                                value={confirmedPassword} 
                                onChange={(e) => setConfirmedPassword(e.target.value)}
                                minLength={8}
                            />
                        </Form.Group>

                        <Button type="submit" variant="outline-info" className="w-100 fw-bold terminal-font py-2.5 shadow-sm" style={{ letterSpacing: '1px', fontSize: '0.95rem' }} disabled={isLoading}>
                            {isLoading ? <Spinner animation="border" size="sm" /> : "REGISTER UPLINK"}
                        </Button>
                    </Form>

                    <div className="mt-4 pt-3 border-top border-secondary border-opacity-25 d-flex justify-content-between align-items-center terminal-font" style={{ fontSize: '0.75rem' }}>
                        <Link href="/" className="text-white-50 text-decoration-none">HOME PAGE</Link>
                        <span className="text-secondary">•</span>
                        <Link href="/login" className="text-info text-decoration-none fw-bold">ALREADY REGISTERED? LOGIN</Link>
                    </div>
                </Card>
            </div>

            <Modal 
                show={showSuccessModal} 
                onHide={() => router.push("/login")} 
                centered
                backdrop="static"
                contentClassName="bg-dark text-white border border-info shadow-lg rounded-3"
                style={{ backgroundColor: 'rgba(10, 13, 20, 0.85)', backdropFilter: 'blur(8px)' }}
            >
                <Modal.Header className="border-secondary bg-black bg-opacity-70 py-2">
                    <Modal.Title className="text-info terminal-font fw-bold fs-6">
                        SYSTEM_UPLINK_SUCCESS
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body className="text-center py-4 bg-dark bg-opacity-75">
                    <div className="fs-1 mb-2">🎉</div>
                    <h4 className="fw-bold text-white mb-2 cascadia-font">Successfully registered!</h4>
                    <p className="text-white-50 small mb-0 terminal-font">
                        Your account has been created. Click below to sign into the system.
                    </p>
                </Modal.Body>

                <Modal.Footer className="border-secondary bg-black bg-opacity-70 justify-content-center py-2">
                    <Button 
                        variant="outline-info" 
                        size="sm" 
                        className="terminal-font fw-bold px-4 py-2" 
                        onClick={() => router.push("/login")}
                    >
                        PROCEED TO LOGIN
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}