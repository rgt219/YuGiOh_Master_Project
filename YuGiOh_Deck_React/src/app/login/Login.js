'use client'; 

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Form, Button, Spinner, Modal } from 'react-bootstrap';
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
        <div className="md-theme-bg d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
            <div className="login-terminal-panel">
                <div className="terminal-header">
                    <div className="terminal-dot red"></div>
                    <div className="terminal-dot yellow"></div>
                    <div className="terminal-dot green"></div>
                    <span className="terminal-title">ENCRYPTED_SIGN_IN</span>
                </div>

                <Form noValidate validated={validated} onSubmit={handleSubmit} className="login-form">
                    <h2 className="login-branding">ErreGeTe YGO</h2>

                    {errorMessage && (
                        <div className="alert alert-danger py-2 text-center terminal-font small" role="alert">
                            ! ERROR: {errorMessage}
                        </div>
                    )}

                    <Form.Group className="input-hud-group mb-4" controlId="validationEmail">
                        <Form.Label className="hud-label">EMAIL</Form.Label>
                        <Form.Control 
                            required
                            type="email" 
                            placeholder="NAME@DOMAIN.COM"
                            className="md-input-field"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </Form.Group>

                    <Form.Group className="input-hud-group mb-4" controlId="validationPassword">
                        <Form.Label className="hud-label">PASSWORD</Form.Label>
                        <Form.Control 
                            required
                            type="password" 
                            placeholder="********"
                            className="md-input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={8}
                        />
                    </Form.Group>

                    <Button type="submit" className="md-btn-primary mt-4 w-100" disabled={isLoading}>
                        {isLoading ? <Spinner animation="border" size="sm" /> : "LOGIN"}
                    </Button>

                    <div className="login-footer mt-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <Link href="/" className="terminal-link">HOME PAGE</Link>
                        <span className="terminal-divider">|</span>
                        <Link href="/register" className="terminal-link">REGISTER</Link>
                        <span className="terminal-divider">|</span>
                        <button 
                            type="button" 
                            onClick={() => setShowForgotModal(true)} 
                            className="terminal-link bg-transparent border-0 p-0 text-info"
                        >
                            FORGOT PASSWORD?
                        </button>
                    </div>
                </Form>
            </div>

            <Modal 
                show={showForgotModal} 
                onHide={() => setShowForgotModal(false)} 
                centered
                contentClassName="bg-dark text-white border border-info shadow-lg"
            >
                <Modal.Header closeButton closeVariant="white" className="border-secondary bg-black bg-opacity-50">
                    <Modal.Title className="text-info terminal-font fw-bold fs-6">
                        RECOVERY_UPLINK
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleForgotPasswordSubmit}>
                    <Modal.Body className="py-4">
                        <p className="text-white-50 small mb-3">
                            Enter your account email. We will send a secure link to reset your access code.
                        </p>
                        {resetStatus && (
                            <div className="alert alert-info py-2 small terminal-font mb-3">
                                {resetStatus}
                            </div>
                        )}
                        <Form.Group>
                            <Form.Label className="hud-label">EMAIL ADDRESS</Form.Label>
                            <Form.Control 
                                required
                                type="email"
                                placeholder="NAME@DOMAIN.COM"
                                className="md-input-field"
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer className="border-secondary bg-black bg-opacity-50">
                        <Button 
                            type="submit" 
                            className="md-btn-primary px-4"
                            disabled={isResetSending}
                        >
                            {isResetSending ? <Spinner animation="border" size="sm" /> : "SEND RESET LINK"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}