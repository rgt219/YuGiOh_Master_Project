'use client';

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; 
import { Form, Button, Modal } from 'react-bootstrap';
import { API_URLS } from "../config";
import "../mdstyles.css";

export default function Register() {
    const [email, setEmail] = useState("");
    const [userName, setuserName] = useState("");
    const [fName, setFName] = useState("");
    const [lName, setLName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmedPassword, setConfirmedPassword] = useState("");
    const [validated, setValidated] = useState(false);

    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();

        const form = e.currentTarget;

        if (form.checkValidity() === false || password !== confirmedPassword) {
            e.stopPropagation();
            setValidated(true);

            if (password !== confirmedPassword) alert("PASSWORDS_DO_NOT_MATCH");
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

        try {
            const baseUrl = API_URLS?.IDENTITY || "";
            const response = await fetch(`${baseUrl}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                console.log("DATABASE_UPLINK_SUCCESSFUL");
                setShowSuccessModal(true);
            } else {
                const error = await response.json();
                console.error("UPLINK_DENIED: ", error.message);
            }
        } catch (error) {
            console.error("SYSTEM_OFFLINE: ", error);
        }
    };

    return (
        <div className="md-theme-bg d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
            <div className="login-terminal-panel">
                <div className="terminal-header">
                    <div className="terminal-dot red"></div>
                    <div className="terminal-dot yellow"></div>
                    <div className="terminal-dot green"></div>
                    <span className="terminal-title">ENCRYPTED_REGISTRATION</span>
                </div>

                <Form noValidate validated={validated} onSubmit={handleSubmit} className="login-form">
                    <h2 className="login-branding">ErreGeTe <span className="text-info">YGO</span></h2>

                    {/* First Name Field */}
                    <Form.Group className="input-hud-group mb-4">
                        <Form.Label className="hud-label">FIRST NAME</Form.Label>
                        <Form.Control
                            required
                            type="text"
                            className="md-input-field"
                            placeholder="FIRST_NAME"
                            value={fName}
                            onChange={(e) => setFName(e.target.value)}
                        />
                    </Form.Group>

                    {/* Last Name Field */}
                    <Form.Group className="input-hud-group mb-4">
                        <Form.Label className="hud-label">LAST NAME</Form.Label>
                        <Form.Control
                            required
                            type="text"
                            className="md-input-field"
                            placeholder="LAST_NAME"
                            value={lName}
                            onChange={(e) => setLName(e.target.value)}
                        />
                    </Form.Group>

                    {/* Username Field */}
                    <Form.Group className="input-hud-group mb-4">
                        <Form.Label className="hud-label">USERNAME</Form.Label>
                        <Form.Control
                            required
                            type="text"
                            className="md-input-field"
                            placeholder="USERNAME"
                            value={userName}
                            onChange={(e) => setuserName(e.target.value)}
                        />
                    </Form.Group>
                    
                    {/* Identifier Field */}
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
                        <Form.Control.Feedback type="invalid" className="terminal-error">
                            ! ERROR: INVALID_IDENTIFIER_FORMAT
                        </Form.Control.Feedback>
                    </Form.Group>

                    {/* Password Field */}
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
                        <Form.Control.Feedback type="invalid" className="terminal-error">
                            ! ERROR: CODE_MIN_LENGTH_8
                        </Form.Control.Feedback>
                    </Form.Group>

                    {/* Confirm Password */}
                    <Form.Group className="input-hud-group mb-4" controlId="validationConfirmPassword">
                        <Form.Label className="hud-label">CONFIRM PASSWORD</Form.Label>
                        <Form.Control 
                            required 
                            type="password" 
                            className="md-input-field"
                            placeholder="********"
                            value={confirmedPassword} 
                            onChange={(e) => setConfirmedPassword(e.target.value)}
                            minLength={8}
                        />
                    </Form.Group>

                    <Button type="submit" className="md-btn-primary mt-4 w-100">
                        REGISTER
                    </Button>

                    <div className="login-footer mt-4">
                        <Link href="/" className="terminal-link">HOME PAGE</Link>
                        <span className="terminal-divider">|</span>
                        <Link href="/contact" className="terminal-link">CONTACT</Link>
                    </div>
                </Form>
            </div>

            {/* ⚡ Registration Success Modal */}
            <Modal 
                show={showSuccessModal} 
                onHide={() => router.push("/login")} 
                centered
                backdrop="static"
                contentClassName="bg-dark text-white border border-info shadow-lg"
            >
                <Modal.Header className="border-secondary bg-black bg-opacity-50">
                    <Modal.Title className="text-info terminal-font fw-bold fs-6">
                        SYSTEM_UPLINK_SUCCESS
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body className="text-center py-4">
                    <div className="fs-1 mb-2">🎉</div>
                    <h4 className="fw-bold text-white mb-2">Successfully registered!</h4>
                    <p className="text-white-50 small mb-0">
                        Your account has been created. Click below to sign into the system.
                    </p>
                </Modal.Body>

                <Modal.Footer className="border-secondary bg-black bg-opacity-50 justify-content-center">
                    <Button 
                        className="md-btn-primary px-4" 
                        onClick={() => router.push("/login")}
                    >
                        PROCEED TO LOGIN
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}