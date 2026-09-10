'use client'; 

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Form, Button, Spinner, Modal, Card } from 'react-bootstrap';
import { API_URLS } from "@/config";
import "@/mdstyles.css";

export default function Login({ setUser }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [validated, setValidated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetStatus, setResetStatus] = useState("");
    const [isResetSending, setIsResetSending] = useState(false);
    const router = useRouter(); 

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        const savedUser = sessionStorage.getItem("user");

        if (token && savedUser) {
            router.push("/"); 
        }
    }, [router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");

        const form = e.currentTarget;
        if (form.checkValidity() === false) {
            e.stopPropagation();
            setValidated(true);
            return;
        }

        const credentials = { email, password };
        setIsLoading(true);

        try {
            const baseUrl = API_URLS?.IDENTITY || "";
            const response = await fetch(`${baseUrl}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(credentials),
            });

            if (response.ok) {
                const data = await response.json();
                
                const token = data.token || data.accessToken || data.jwt;
                
                if (!token) {
                    setErrorMessage("AUTHENTICATION_FAILED: INVALID_TOKEN_RECEIVED");
                    setIsLoading(false);
                    return;
                }

                sessionStorage.setItem("token", token);
                sessionStorage.setItem("user", JSON.stringify(data));
                
                if (setUser) setUser(data);
                
                router.push("/");
            } else {
                const errorData = await response.json();
                setErrorMessage(errorData.message || "AUTHENTICATION_FAILED");
            }
        } catch (error) {
            setErrorMessage("SYSTEM_OFFLINE: UNABLE_TO_REACH_SERVER");
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPasswordSubmit = async (e) => {
        e.preventDefault();
        setIsResetSending(true);
        setResetStatus("");

        try {
            const baseUrl = API_URLS?.IDENTITY || "";
            const response = await fetch(`${baseUrl}/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: resetEmail }),
            });

            if (response.ok) {
                setResetStatus("UPLINK_SENT: Check your inbox for reset instructions.");
            } else {
                setResetStatus("! ERROR: Unable to process reset request.");
            }
        } catch (err) {
            setResetStatus("! ERROR: SYSTEM_OFFLINE");
        } finally {
            setIsResetSending(false);
        }
    };

    return (
        <div className="md-theme-bg d-flex align-items-center justify-content-center px-3" style={{ minHeight: "100vh", fontFamily: "'Cascadia Mono', monospace" }}>
            <style>{`
                .terminal-input:focus {
                    background-color: rgba(0, 0, 0, 0.8) !important;
                    border-color: #00f2ff !important;
                    box-shadow: 0 0 12px rgba(0, 242, 255, 0.25) !important;
                    color: #fff !important;
                }
            `}</style>

            <div style={{ width: '100%', maxWidth: '440px' }}>
                <Card style={{ backgroundColor: 'rgba(10, 13, 20, 0.75)', backdropFilter: 'blur(0px)' }} className="border-info border-opacity-50 shadow-lg p-4 p-md-5 rounded-4 md-panel">
                    
                    <div className="text-center mb-4">
                        <span className="badge bg-black bg-opacity-60 border border-info border-opacity-50 text-info px-3 py-1 mb-3 terminal-font" style={{ fontSize: '0.65rem', letterSpacing: '2px' }}>
                            VRAINS AUTHENTICATON GATEWAY
                        </span>
                        <h2 className="fw-bold text-white m-0 cascadia-font" style={{ fontSize: '1.75rem', letterSpacing: '1px', textShadow: '0 0 15px rgba(0,210,255,0.3)' }}>
                            ErreGeTe <span className="text-info">YGO</span>
                        </h2>
                        <p className="text-white-50 small mt-1 terminal-font" style={{ fontSize: '0.75rem' }}>
                            Enter credentials to access duelist network
                        </p>
                    </div>

                    {errorMessage && (
                        <div className="alert alert-danger bg-black bg-opacity-75 border border-danger text-danger py-2 px-3 small terminal-font rounded-2 mb-4" role="alert" style={{ fontSize: '0.8rem' }}>
                            ⚠️ {errorMessage}
                        </div>
                    )}

                    <Form noValidate validated={validated} onSubmit={handleSubmit}>
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

                        <Form.Group className="mb-4" controlId="validationPassword">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <Form.Label className="text-info terminal-font small fw-bold m-0" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
                                    PASSWORD
                                </Form.Label>
                                <button 
                                    type="button" 
                                    onClick={() => setShowForgotModal(true)} 
                                    className="text-white-50 bg-transparent border-0 p-0 terminal-font text-decoration-underline"
                                    style={{ fontSize: '0.7rem' }}
                                >
                                    Forgot?
                                </button>
                            </div>
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

                        <Button type="submit" variant="outline-info" className="w-100 fw-bold terminal-font py-2.5 shadow-sm" style={{ letterSpacing: '1px', fontSize: '0.95rem' }} disabled={isLoading}>
                            {isLoading ? <Spinner animation="border" size="sm" /> : "LOGIN"}
                        </Button>
                    </Form>

                    <div className="mt-4 pt-3 border-top border-secondary border-opacity-25 d-flex justify-content-between align-items-center terminal-font" style={{ fontSize: '0.75rem' }}>
                        <Link href="/" className="text-white-50 text-decoration-none">HOME PAGE</Link>
                        <span className="text-secondary">•</span>
                        <Link href="/register" className="text-info text-decoration-none fw-bold">CREATE ACCOUNT</Link>
                    </div>
                </Card>
            </div>

            <Modal 
                show={showForgotModal} 
                onHide={() => setShowForgotModal(false)} 
                centered
                contentClassName="bg-dark text-white border border-info shadow-lg rounded-3"
                style={{ backgroundColor: 'rgba(10, 13, 20, 0.85)', backdropFilter: 'blur(8px)' }}
            >
                <Modal.Header closeButton closeVariant="white" className="border-secondary bg-black bg-opacity-70 py-2">
                    <Modal.Title className="text-info terminal-font fw-bold fs-6">
                        ACCOUNT RECOVERY
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleForgotPasswordSubmit}>
                    <Modal.Body className="p-4 bg-dark bg-opacity-75">
                        <p className="text-white-50 small mb-3 terminal-font" style={{ fontSize: '0.82rem' }}>
                            Enter your account email to dispatch a secure access token reset link.
                        </p>
                        {resetStatus && (
                            <div className="alert alert-info bg-black border border-info text-info py-2 small terminal-font mb-3">
                                {resetStatus}
                            </div>
                        )}
                        <Form.Group>
                            <Form.Label className="text-info terminal-font small fw-bold mb-1" style={{ fontSize: '0.75rem' }}>EMAIL ADDRESS</Form.Label>
                            <Form.Control 
                                required
                                type="email"
                                placeholder="duelist@domain.com"
                                className="bg-black text-white border-secondary terminal-font py-2 terminal-input"
                                style={{ backgroundColor: 'rgba(0,0,0,0.6)', fontSize: '0.9rem' }}
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer className="border-secondary bg-black bg-opacity-70 py-2">
                        <Button variant="outline-info" size="sm" type="submit" className="terminal-font fw-bold px-3 py-2" disabled={isResetSending}>
                            {isResetSending ? <Spinner animation="border" size="sm" /> : "SEND PASSWORD RESET LINK"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}