import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Form, Button } from 'react-bootstrap';
import { API_URLS } from "../config";
import "../mdstyles.css";

export default function Login({ setUser }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [validated, setValidated] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");

        // Only redirect if BOTH token and user object exist
        if (token && savedUser) {
            navigate("/"); 
        }
    }, [navigate]);

    const handleSubmit = async (e) => {

        e.preventDefault();

        const form = e.currentTarget;
        
        if (form.checkValidity() === false) {
            e.stopPropagation();
            setValidated(true);
            return
        } else {
            console.log("Terminal Access Granted");
        }
        
        const credentials = { email, password }

        try{
            const response = await fetch(`${API_URLS.IDENTITY}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(credentials)
            });
            const data = await response.json();
            if(response.ok) {
                console.log("UPLINK_ESTABLISHED:", data.userName);
                
                // 1. Store the token as a string (for API headers)
                localStorage.setItem("token", data.token);
                
                // 2. Store the user profile as a stringified object (for UI display)
                // We use the key "user" so we can find it easily later
                localStorage.setItem("user", JSON.stringify({
                    userName: data.userName,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    id: data.id
                }));

                // 3. Update the global state
                setUser(data);
                
                // 4. Redirect to home
                navigate("/");
            }

        } catch (error) {
            console.error("CONNECTION_FAILURE: ", error);
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
                    <h2 className="login-branding">ErreGeTe <span className="text-info">YGO</span></h2>
                    
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
            </div>
        </div>
    );
}