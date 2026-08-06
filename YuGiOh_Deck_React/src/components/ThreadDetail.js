import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Form, Button, Badge, Spinner } from 'react-bootstrap';
import { API_URLS } from '../config';
import '../mdstyles.css';

export default function ThreadDetail() {
    const { id } = useParams();
    const [thread, setThread] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    // Get current user from session
    const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");
    const username = currentUser.userName;

    useEffect(() => {
        fetchThreadDetails();
    }, [id]);

    const fetchThreadDetails = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URLS.FORUMS}/api/forums/threads/${id}`);
            if (response.ok) {
                const data = await response.json();
                setThread(data);
            }
        } catch (err) {
            console.error("Error fetching thread details:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // ⚡ Vote handler with Auth Guard & 1-vote limit
    const handleVote = async (voteType) => {
        if (!username) {
            alert("⚠️ You must be logged in to vote on threads!");
            return;
        }

        try {
            const response = await fetch(`${API_URLS.FORUMS}/api/forums/threads/${id}/vote`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, voteType })
            });

            if (response.ok) {
                fetchThreadDetails(); // Refresh thread state & vote counts
            }
        } catch (err) {
            console.error("Failed to vote:", err);
        }
    };

    // ⚡ Comment handler with Auth Guard
    const handleAddComment = async (e) => {
        e.preventDefault();
        
        if (!username) {
            alert("⚠️ You must be logged in to leave a reply!");
            return;
        }

        if (!newComment.trim()) return;

        setIsSubmittingComment(true);

        const commentPayload = {
            author: username,
            text: newComment
        };

        try {
            const response = await fetch(`${API_URLS.FORUMS}/api/forums/threads/${id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(commentPayload)
            });

            if (response.ok) {
                setNewComment("");
                fetchThreadDetails();
            }
        } catch (err) {
            console.error("Error submitting comment:", err);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    if (isLoading) return <Spinner animation="border" variant="info" className="d-block mx-auto my-5" />;
    if (!thread) return <div className="text-white text-center p-5">Thread Not Found</div>;

    const hasUpvoted = thread.upvotedBy?.includes(username);
    const hasDownvoted = thread.downvotedBy?.includes(username);

    return (
        <div className="md-theme-bg min-vh-100 text-white" style={{ paddingTop: '95px', paddingBottom: '60px' }}>
            <div className="container" style={{ maxWidth: '900px' }}>
                <Link to="/general-discussion" className="text-info text-decoration-none terminal-font small mb-3 d-inline-block">
                    ← RETURN_TO_FORUM
                </Link>

                {/* THREAD CARD */}
                <div className="p-4 rounded-3 bg-dark border border-info border-opacity-25 shadow-lg mb-4">
                    <div className="d-flex align-items-center gap-2 mb-2">
                        <Badge bg="info" className="text-dark terminal-font">{thread.tag || "GENERAL"}</Badge>
                        <span className="text-info small terminal-font">@{thread.author}</span>
                        <span className="text-white-50 small">• {new Date(thread.createdAt).toLocaleString()}</span>
                    </div>

                    <h2 className="fw-bold text-white mb-3">{thread.title}</h2>
                    <p className="text-white-50 fs-6 mb-4">{thread.content}</p>

                    {/* VOTE BAR */}
                    <div className="d-flex align-items-center gap-2 pt-3 border-top border-secondary border-opacity-25">
                        <Button 
                            variant={hasUpvoted ? "info" : "outline-info"} 
                            size="sm"
                            className="terminal-font fw-bold"
                            onClick={() => handleVote("up")}
                        >
                            ▲ UPVOTE ({thread.upvotes})
                        </Button>
                        <Button 
                            variant={hasDownvoted ? "danger" : "outline-danger"} 
                            size="sm"
                            className="terminal-font fw-bold"
                            onClick={() => handleVote("down")}
                        >
                            ▼ DOWNVOTE
                        </Button>
                        <span className="text-white-50 terminal-font small ms-3">
                            💬 {thread.commentCount || 0} Replies
                        </span>
                    </div>
                </div>

                {/* COMMENT FORM */}
                <div className="p-4 rounded-3 bg-dark border border-secondary border-opacity-25 mb-4">
                    <h5 className="text-info terminal-font mb-3">LEAVE_A_REPLY</h5>
                    {username ? (
                        <Form onSubmit={handleAddComment}>
                            <Form.Group className="mb-3">
                                <Form.Control 
                                    as="textarea"
                                    rows={3}
                                    placeholder="Share your thoughts..."
                                    className="md-input-field"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    required
                                />
                            </Form.Group>
                            <Button type="submit" className="md-btn-primary px-4" disabled={isSubmittingComment}>
                                {isSubmittingComment ? <Spinner animation="border" size="sm" /> : "POST REPLY"}
                            </Button>
                        </Form>
                    ) : (
                        <div className="p-3 bg-black bg-opacity-50 rounded border border-warning text-warning terminal-font small">
                            🔒 You must be logged in to leave a reply or vote on threads.
                        </div>
                    )}
                </div>

                {/* COMMENTS LIST */}
                <h5 className="text-white terminal-font mb-3">DISCUSSION_LOGS</h5>
                <div className="d-flex flex-column gap-3">
                    {thread.comments?.map((comment) => (
                        <div key={comment.id} className="p-3 rounded-3 bg-dark border border-info border-opacity-10">
                            <div className="d-flex justify-content-between mb-1">
                                <span className="text-info terminal-font small fw-bold">@{comment.author}</span>
                                <span className="text-white-50 small">{new Date(comment.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-white-50 mb-0 small">{comment.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}