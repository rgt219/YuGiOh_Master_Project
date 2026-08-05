import React, { useState, useEffect } from 'react';
import { Form, Button, Modal, Badge, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { API_URLS } from '../config';
import '../mdstyles.css';

export default function GeneralDiscussion() {
    const [threads, setThreads] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTag, setSelectedTag] = useState("ALL");

    // Modal state for creating new thread
    const [showModal, setShowModal] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");
    const [newTag, setNewTag] = useState("GENERAL");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch General Discussion Threads
    useEffect(() => {
        fetchThreads();
    }, []);

    const fetchThreads = async () => {
        setIsLoading(true);
        try {
            // Category "general" targets General Discussion
            const response = await fetch(`${API_URLS.FORUMS || API_URLS.DECK}/api/forum/threads?category=general`);
            if (response.ok) {
                const data = await response.json();
                setThreads(data);
            } else {
                // Fallback Mock Data for UI Testing if API endpoint isn't deployed yet
                setThreads(getMockThreads());
            }
        } catch (error) {
            console.warn("API Offline, loading mock forum data:", error);
            setThreads(getMockThreads());
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateThread = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const token = sessionStorage.getItem("token");
        const user = JSON.parse(sessionStorage.getItem("user") || "{}");

        const threadPayload = {
            category: "general",
            tag: newTag,
            title: newTitle,
            content: newContent,
            author: user.userName || "AnonymousDuelist",
            createdAt: new Date().toISOString()
        };

        try {
            const response = await fetch(`${API_URLS.FORUMS || API_URLS.DECK}/api/forums/threads`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(threadPayload)
            });

            if (response.ok) {
                const createdThread = await response.json();
                setThreads([createdThread, ...threads]);
            } else {
                // Local UI optimistic update fallback
                setThreads([{ ...threadPayload, id: Date.now().toString(), upvotes: 1, commentCount: 0 }, ...threads]);
            }
        } catch (err) {
            setThreads([{ ...threadPayload, id: Date.now().toString(), upvotes: 1, commentCount: 0 }, ...threads]);
        } finally {
            setIsSubmitting(false);
            setShowModal(false);
            setNewTitle("");
            setNewContent("");
        }
    };

    const handleUpvote = (threadId, e) => {
        e.preventDefault();
        setThreads(threads.map(t => t.id === threadId ? { ...t, upvotes: t.upvotes + 1 } : t));
    };

    const filteredThreads = threads.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              t.author.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTag = selectedTag === "ALL" || t.tag === selectedTag;
        return matchesSearch && matchesTag;
    });

    return (
        <div className="md-theme-bg min-vh-100 text-white" style={{ paddingTop: '95px', paddingBottom: '60px' }}>
            <div className="container" style={{ maxWidth: '1100px' }}>
                
                {/* FORUM HEADER PANEL */}
                <div className="p-4 rounded-3 bg-dark border border-info border-opacity-25 shadow-lg mb-4 position-relative overflow-hidden">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                        <div>
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <span className="text-info terminal-font small fw-bold">💬 COMMUNITY_TERMINAL</span>
                                <Badge bg="info" className="text-dark">GENERAL</Badge>
                            </div>
                            <h2 className="fw-bold text-white m-0" style={{ letterSpacing: '0.5px' }}>
                                General <span className="text-info">Discussion</span>
                            </h2>
                            <p className="text-white-50 small mb-0 mt-1">
                                Share deck ideas, discuss game mechanics, news, and meta casual talk.
                            </p>
                        </div>

                        <Button 
                            className="btn-cyber-outline fw-bold px-4 py-2 align-self-start align-self-md-center"
                            onClick={() => setShowModal(true)}
                        >
                            ✍️ CREATE THREAD
                        </Button>
                    </div>
                </div>

                {/* FILTER & SEARCH BAR */}
                <div className="row g-3 mb-4 align-items-center">
                    <div className="col-md-6">
                        <Form.Control 
                            type="text"
                            placeholder="🔍 Search threads by title or duelist..."
                            className="md-input-field"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="col-md-6 d-flex gap-2 flex-wrap justify-content-md-end">
                        {["ALL", "GENERAL", "NEWS", "MEMES", "RULINGS"].map((tag) => (
                            <Button
                                key={tag}
                                size="sm"
                                variant={selectedTag === tag ? "info" : "outline-secondary"}
                                className={`terminal-font ${selectedTag === tag ? "text-dark fw-bold" : "text-white-50"}`}
                                onClick={() => setSelectedTag(tag)}
                            >
                                {tag}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* THREAD LIST CONTAINER */}
                {isLoading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="info" />
                        <p className="text-info terminal-font mt-2 small">LOADING_FORUM_THREADS...</p>
                    </div>
                ) : filteredThreads.length === 0 ? (
                    <div className="text-center py-5 rounded-3 bg-dark border border-secondary border-opacity-25">
                        <p className="text-white-50 terminal-font mb-0">NO THREADS FOUND MATCHING QUERY</p>
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-3">
                        {filteredThreads.map((thread) => (
                            <div 
                                key={thread.id} 
                                className="p-3 rounded-3 bg-dark border border-info border-opacity-10 shadow-sm hover-border-info transition-all"
                                style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(6px)' }}
                            >
                                <div className="row align-items-center">
                                    {/* UPVOTE COLUMN */}
                                    <div className="col-auto text-center pe-0">
                                        <button 
                                            onClick={(e) => handleUpvote(thread.id, e)}
                                            className="btn btn-sm btn-outline-info border-0 d-flex flex-column align-items-center px-2 py-1"
                                            title="Upvote thread"
                                        >
                                            <span style={{ fontSize: '1.1rem', lineHeight: '1' }}>▲</span>
                                            <span className="fw-bold terminal-font small mt-1">{thread.upvotes}</span>
                                        </button>
                                    </div>

                                    {/* THREAD DETAILS */}
                                    <div className="col ms-2 ms-md-3">
                                        <div className="d-flex align-items-center gap-2 mb-1">
                                            <Badge bg="secondary" className="terminal-font" style={{ fontSize: '0.65rem' }}>
                                                {thread.tag || "GENERAL"}
                                            </Badge>
                                            <span className="text-info small terminal-font">@{thread.author}</span>
                                            <span className="text-white-50 small" style={{ fontSize: '0.75rem' }}>
                                                • {new Date(thread.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <Link 
                                            to={`/forum/thread/${thread.id}`} 
                                            className="text-white fw-bold text-decoration-none fs-5 d-block hover-text-info mb-1"
                                        >
                                            {thread.title}
                                        </Link>

                                        <p className="text-white-50 small mb-0 text-truncate" style={{ maxWidth: '750px' }}>
                                            {thread.content}
                                        </p>
                                    </div>

                                    {/* COMMENTS COUNT METRIC */}
                                    <div className="col-auto text-end d-none d-sm-block ms-auto">
                                        <Link 
                                            to={`/forum/thread/${thread.id}`} 
                                            className="btn btn-sm btn-outline-secondary text-white-50 border-0 terminal-font"
                                        >
                                            💬 {thread.commentCount || 0} Replies
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ⚡ CREATE THREAD MODAL */}
            <Modal 
                show={showModal} 
                onHide={() => setShowModal(false)} 
                centered
                contentClassName="bg-dark text-white border border-info shadow-lg"
            >
                <Modal.Header closeButton closeVariant="white" className="border-secondary bg-black bg-opacity-50">
                    <Modal.Title className="text-info terminal-font fw-bold fs-6">
                        CREATE_NEW_THREAD
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleCreateThread}>
                    <Modal.Body className="py-3">
                        <Form.Group className="mb-3">
                            <Form.Label className="hud-label">THREAD CATEGORY TAG</Form.Label>
                            <Form.Select 
                                className="md-input-field" 
                                value={newTag} 
                                onChange={(e) => setNewTag(e.target.value)}
                            >
                                <option value="GENERAL">GENERAL</option>
                                <option value="NEWS">NEWS & ANNOUNCEMENTS</option>
                                <option value="MEMES">MEMES & MEDIA</option>
                                <option value="RULINGS">GAME RULINGS</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="hud-label">TITLE</Form.Label>
                            <Form.Control 
                                required
                                type="text"
                                placeholder="Enter a descriptive title..."
                                className="md-input-field"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                            />
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label className="hud-label">CONTENT</Form.Label>
                            <Form.Control 
                                required
                                as="textarea"
                                rows={5}
                                placeholder="Write your post here..."
                                className="md-input-field"
                                value={newContent}
                                onChange={(e) => setNewContent(e.target.value)}
                            />
                        </Form.Group>
                    </Modal.Body>

                    <Modal.Footer className="border-secondary bg-black bg-opacity-50">
                        <Button 
                            type="submit" 
                            className="md-btn-primary px-4"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Spinner animation="border" size="sm" /> : "PUBLISH THREAD"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}

// Fallback Mock Data for UI previews
function getMockThreads() {
    return [
        {
            id: "1",
            title: "What are your hot takes on the upcoming Master Duel Banlist?",
            content: "With the new format approaching, do you think Snake-Eye will finally get hit directly or will splashable tech cards take the hit?",
            author: "KaibaCorpDev",
            tag: "GENERAL",
            upvotes: 42,
            commentCount: 18,
            createdAt: "2026-08-01T14:22:00Z"
        },
        {
            id: "2",
            title: "Yu-Gi-Oh! World Championship 2026 Dates Announced!",
            content: "Official tournament stream schedule and meta deck breakdown is now live on Konami's main portal.",
            author: "YGO_Reporter",
            tag: "NEWS",
            upvotes: 89,
            commentCount: 34,
            createdAt: "2026-08-03T09:15:00Z"
        },
        {
            id: "3",
            title: "Does Nibiru activate if field has 5 special summons during same chain?",
            content: "Need clarification on a weird ruling I encountered in my local tournament match yesterday.",
            author: "RookieDuelist",
            tag: "RULINGS",
            upvotes: 12,
            commentCount: 7,
            createdAt: "2026-08-04T18:40:00Z"
        }
    ];
}