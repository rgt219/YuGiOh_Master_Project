import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Form, Button } from 'react-bootstrap';
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

    //navigate programmatically in the browser in response to user interactions or effects
    const navigate = useNavigate();

    const handleSubmit = async (e) => 
    {

        //used to stop the browser's default behavior for a given event
        e.preventDefault();

        //returns the element whose event listener triggered the event
        const form = e.currentTarget;

        if(form.checkValidity() === false || password !== confirmedPassword)
        {
            //prevent an event from propagating (moving up or down) the Document Object Model (DOM) tree
            e.stopPropagation();

            setValidated(true);

            if(password !== confirmedPassword) alert("PASSWORDS_DO_NOT_MATCH");
            return;
        }

        //data for registering user
        const formData = {
            id: (Math.floor(Math.random() * (1000000 - 1 + 1)) + 1),
            userName: userName,
            email: email,
            firstName: fName,
            lastName: lName,
            password: password
        }

        console.log(`${API_URLS.IDENTITY}/register`);

        try 
        {
            const response = await fetch(`${API_URLS.IDENTITY}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if(response.ok)
            {
                console.log("DATABASE_UPLINK_SUCCESSFUL");
                navigate("/login");
            } else {
                const error = await response.json();
                console.error("UPLINK_DENIED: ", error.message);
            }
        }
        catch (error)
        {
            console.error("SYSTEM_OFFLINE: ", error);
        }
        console.log("Accessing terminal with:", email);


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

                    {/* First Name Field*/}
                    <Form.Group className="input-hud-group mb-4">
                        <Form.Label className="hud-label">FIRST_NAME</Form.Label>
                        <Form.Control
                            required
                            type="text"
                            className="md-input-field"
                            placeholder="FIRST_NAME"
                            value={fName}
                            onChange={(e) => setFName(e.target.value)}/>
                    </Form.Group>

                    {/* First Name Field*/}
                    <Form.Group className="input-hud-group mb-4">
                        <Form.Label className="hud-label">LAST_NAME</Form.Label>
                        <Form.Control
                            required
                            type="text"
                            className="md-input-field"
                            placeholder="LAST_NAME"
                            value={lName}
                            onChange={(e) => setLName(e.target.value)}/>
                    </Form.Group>

                    {/* Username Field*/}
                    <Form.Group className="input-hud-group mb-4">
                        <Form.Label className="hud-label">USER_IDENTIFIER</Form.Label>
                        <Form.Control
                            required
                            type="text"
                            className="md-input-field"
                            placeholder="USER_IDENTIFIER"
                            value={userName}
                            onChange={(e) => setuserName(e.target.value)}/>
                    </Form.Group>
                    
                    {/* Identifier Field */}
                    <Form.Group className="input-hud-group mb-4" controlId="validationEmail">
                        <Form.Label className="hud-label">USER_EMAIL</Form.Label>
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

                    {/* Confirm Password */}
                    <Form.Group className="input-hud-group mb-4" controlId="validationConfirmPassword">
                        <Form.Label className="hud-label">CONFIRM_ACCESS_CODE</Form.Label>
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
                        INITIALIZE_REGISTRATION
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