import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Form, Button, Spinner } from 'react-bootstrap';
import { API_URLS } from "../config";
import "../mdstyles.css";

export default function Login({ setUser }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [validated, setValidated] = useState(false);
    
    // --- 1. NEW STATES FOR LOADING AND API ERRORS ---
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    
    const navigate = useNavigate();

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        const savedUser = sessionStorage.getItem("user");

        if (token && savedUser) {
            navigate("/"); 
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage(""); // Reset previous error state

        const form = e.currentTarget;
        
        if (form.checkValidity() === false) {
            e.stopPropagation();
            setValidated(true);
            return;
        }

        const credentials = { email, password };

        // --- 2. TRIGGER LOADING STATE ---
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URLS.IDENTITY}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(credentials)
            });
            
            const data = await response.json();

            if (response.ok) {
                console.log("UPLINK_ESTABLISHED:", data.userName);
                
                sessionStorage.setItem("token", data.token);
                sessionStorage.setItem("user", JSON.stringify({
                    userName: data.userName,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    id: data.id
                }));

                setUser(data);
                navigate("/");
            } else {
                // Handle 401 / Bad credentials
                setErrorMessage(data.message || "! ERROR: AUTHENTICATION_REFUSED");
                setIsLoading(false);
            }

        } catch (error) {
            console.error("CONNECTION_FAILURE: ", error);
            setErrorMessage("! ERROR: MAINFRAME_OFFLINE_OR_TIMEOUT");
            setIsLoading(false);
        }
    };

    return (
        <div className="md-theme-bg d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
            <div className="login-terminal-panel">
                
                {/* Terminal Window Top Bar */}
                <div className="terminal-header">
                    <div className="terminal-dot red"></div>
                    <div className="terminal-dot yellow"></div>
                    <div className="terminal-dot green"></div>
                    <span className="terminal-title">ENCRYPTED_SIGN_IN</span>
                </div>

                {/* Branding Title */}
                <h2 className="login-branding text-center mt-3 mb-4">
                    ErreGeTe <span className="text-info">YGO</span>
                </h2>

                {/* --- 3. CONDITIONAL RENDER: LOADING VS FORM --- */}
                {isLoading ? (
                    <div className="text-center py-5 my-3">
                        <Spinner 
                            animation="border" 
                            variant="info" 
                            style={{ width: "3rem", height: "3rem" }} 
                            className="mb-4"
                        />
                        <h5 className="text-info tracking-wider fw-bold">
                            ESTABLISHING_SECURE_UPLINK...
                        </h5>
                        <p className="text-white-50 small fst-italic mt-2">
                            AUTHENTICATING CREDENTIALS WITH AZURE IDENTITY GATEWAY
                        </p>
                    </div>
                ) : (
                    <Form noValidate validated={validated} onSubmit={handleSubmit} className="login-form">
                        
                        {/* API Error Message Alert */}
                        {errorMessage && (
                            <div className="terminal-error mb-4 p-2 text-center border border-danger rounded" style={{ background: "rgba(255, 0, 0, 0.1)" }}>
                                {errorMessage}
                            </div>
                        )}

                        {/* Identifier Field */}
                        <Form.Group className="input-hud-group mb-4" controlId="validationEmail">
                            <Form.Label className="hud-label">USER_IDENTIFIER</Form.Label>
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

                        {/* Access Code Field */}
                        <Form.Group className="input-hud-group mb-4" controlId="validationPassword">
                            <Form.Label className="hud-label">ACCESS_CODE</Form.Label>
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

                        <Button type="submit" className="md-btn-primary mt-4 w-100">
                            EXECUTE_LOGIN
                        </Button>

                        <div className="login-footer mt-4">
                            <Link to="/" className="terminal-link">RETURN_TO_BASE</Link>
                            <span className="terminal-divider">|</span>
                            <Link to="/register" className="terminal-link">NEW_USER_REG</Link>
                        </div>
                    </Form>
                )}

            </div>
        </div>
    );
}