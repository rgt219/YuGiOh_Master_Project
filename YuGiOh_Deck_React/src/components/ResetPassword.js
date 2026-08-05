import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Form, Button, Spinner } from 'react-bootstrap';
import { API_URLS } from '../config';
import '../mdstyles.css';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const email = searchParams.get("email") || "";
    const token = searchParams.get("token") || "";

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [statusMessage, setStatusMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleReset = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setStatusMessage("! ERROR: PASSWORDS_DO_NOT_MATCH");
            return;
        }

        setIsLoading(true);
        setStatusMessage("");

        try {
            const response = await fetch(`${API_URLS.IDENTITY}/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, token, newPassword }),
            });

            if (response.ok) {
                setIsSuccess(true);
                setStatusMessage("CREDENTIALS_SUCCESSFULLY_UPDATED. REDIRECTING...");
                setTimeout(() => navigate("/login"), 2000);
            } else {
                const error = await response.json();
                setStatusMessage(`! ERROR: ${error.message || "EXPIRED_OR_INVALID_TOKEN"}`);
            }
        } catch (err) {
            setStatusMessage("! ERROR: SYSTEM_OFFLINE");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="md-theme-bg d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
            <div className="login-terminal-panel">
                <div className="terminal-header">
                    <span className="terminal-title">SECURITY_RECOVERY_TERMINAL</span>
                </div>

                <Form onSubmit={handleReset} className="login-form p-4">
                    <h3 className="text-info terminal-font mb-3">NEW ACCESS CODE</h3>
                    
                    {statusMessage && (
                        <div className={`alert ${isSuccess ? 'alert-info' : 'alert-danger'} small mb-3 terminal-font`}>
                            {statusMessage}
                        </div>
                    )}

                    <Form.Group className="mb-3">
                        <Form.Label className="hud-label">NEW PASSWORD</Form.Label>
                        <Form.Control
                            type="password"
                            required
                            minLength={8}
                            className="md-input-field"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </Form.Group>

                    <Form.Group className="mb-4">
                        <Form.Label className="hud-label">CONFIRM NEW PASSWORD</Form.Label>
                        <Form.Control
                            type="password"
                            required
                            minLength={8}
                            className="md-input-field"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </Form.Group>

                    <Button type="submit" className="md-btn-primary w-100" disabled={isLoading || isSuccess}>
                        {isLoading ? <Spinner animation="border" size="sm" /> : "UPDATE CREDENTIALS"}
                    </Button>
                </Form>
            </div>
        </div>
    );
}