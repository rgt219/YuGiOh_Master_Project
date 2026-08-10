'use client'; // 👈 Required for state, client uploads, and interactive filters

import React, { useState, useEffect } from 'react';
import { Form, Button, Modal, Badge, Spinner } from 'react-bootstrap';
import Link from 'next/link';
import { API_URLS } from '../config';

export default function CompetitiveDiscussion() {
    const [threads, setThreads] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTag, setSelectedTag] = useState("ALL");
    const [mediaUrlInput, setMediaUrlInput] = useState("");

    // Modal state for creating new competitive thread
    const [showModal, setShowModal] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");
    const [newTag, setNewTag] = useState("META");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // Fetch Competitive Discussion Threads on mount
    useEffect(() => {
        fetchThreads();
    }, []);

    // Compact media thumbnail component for the thread list
    function ThreadThumbnail({ mediaUrls }) {
        if (!mediaUrls || mediaUrls.length === 0) return null;
        const firstUrl = mediaUrls[0];

        const getYouTubeId = (url) => {
            const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
            return (match && match[2].length === 11) ? match[2] : null;
        };

        const ytId = getYouTubeId(firstUrl);
        const isVideo = ytId || firstUrl.match(/\.(mp4|webm|ogg)$/i);
        const thumbSrc = ytId 
            ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` 
            : firstUrl;

        return (
            <div 
                className="rounded overflow-hidden border border-danger border-opacity-30 shadow-sm position-relative flex-shrink-0"
                style={{ width: '90px', height: '60px', backgroundColor: '#0f172a' }}
            >
                {isVideo && (
                    <div 
                        className="position-absolute top-50 start-50 translate-middle text-danger bg-dark bg-opacity-75 rounded-circle d-flex align-items-center justify-content-center" 
                        style={{ width: '22px', height: '22px', fontSize: '10px', zIndex: 2 }}
                    >
                        ▶
                    </div>
                )}
                <img 
                    src={thumbSrc} 
                    alt="Media preview" 
                    className="w-100 h-100" 
                    style={{ objectFit: 'cover' }}
                    onError={(e) => { e.target.parentElement.style.display = 'none'; }} 
                />
            </div>
        );
    }

    const fetchThreads = async () => {
        setIsLoading(true);
        try {
            const baseUrl = API_URLS?.FORUMS || API_URLS?.DECK || '';
            const response = await fetch(`${baseUrl}/api/forums/threads?category=competitive`);
            if (response.ok) {
                const data = await response.json();
                setThreads(data);
            } else {
                setThreads(getMockCompetitiveThreads());
            }
        } catch (error) {
            console.warn("API Offline, loading fallback mock competitive threads:", error);
            setThreads(getMockCompetitiveThreads());
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateThread = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const token = sessionStorage.getItem("token");
        const user = JSON.parse(sessionStorage.getItem("user") || "{}");
        let uploadedMediaUrls = [];

        const baseUrl = API_URLS?.FORUMS || API_URLS?.DECK || '';

        // 1. Upload local file to Azure Blob via C# endpoint
        if (selectedFile) {
            setIsUploading(true);
            const formData = new FormData();
            formData.append("file", selectedFile);

            try {
                const uploadRes = await fetch(`${baseUrl}/api/forums/upload`, {
                    method: "POST",
                    body: formData
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    uploadedMediaUrls.push(uploadData.url);
                } else {
                    alert("⚠️ Failed to upload media to Azure Blob Storage.");
                    setIsSubmitting(false);
                    setIsUploading(false);
                    return;
                }
            } catch (uploadErr) {
                console.error("Blob Upload error:", uploadErr);
                alert("⚠️ Error uploading media file.");
                setIsSubmitting(false);
                setIsUploading(false);
                return;
            } finally {
                setIsUploading(false);
            }
        } else if (mediaUrlInput.trim()) {
            uploadedMediaUrls.push(mediaUrlInput.trim());
        }

        // 2. Payload with category="competitive"
        const threadPayload = {
            category: "competitive",
            tag: newTag,
            title: newTitle,
            content: newContent,
            author: user.userName || "CompetitiveDuelist",
            mediaUrls: uploadedMediaUrls,
            createdAt: new Date().toISOString()
        };

        // 3. Post to C# Forum API
        try {
            const response = await fetch(`${baseUrl}/api/forums/threads`, {
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
            }
        } catch (err) {
            console.error("Failed to publish competitive thread:", err);
        } finally {
            setIsSubmitting(false);
            setShowModal(false);
            setNewTitle("");
            setNewContent("");
            setMediaUrlInput("");
            setSelectedFile(null);
        }
    };

    const getLoggedInUser = () => {
        if (typeof window === 'undefined') return null;
        const user = sessionStorage.getItem("user");
        return user ? JSON.parse(user) : null;
    };

    const handleOpenCreateModal = () => {
        const user = getLoggedInUser();
        if (!user || !user.userName) {
            alert("⚠️ ACCESS DENIED: You must be logged in to create a thread!");
            return;
        }
        setShowModal(true);
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

    const renderTagBadge = (tag) => {
        const t = (tag || "META").toUpperCase();
        if (t === "META") return <Badge bg="danger" className="terminal-font shadow-sm px-2 py-1">META BREAKDOWN</Badge>;
        if (t === "TOURNAMENT") return <Badge bg="warning" className="text-dark terminal-font shadow-sm px-2 py-1">TOURNAMENT REPORT</Badge>;
        if (t === "DECK TECH") return <Badge bg="info" className="text-dark terminal-font shadow-sm px-2 py-1">DECK TECH</Badge>;
        if (t === "SIDE DECK") return <Badge bg="primary" className="terminal-font shadow-sm px-2 py-1">SIDE DECKING</Badge>;
        if (t === "RULINGS") return <Badge bg="secondary" className="terminal-font shadow-sm px-2 py-1">RULINGS</Badge>;
        return <Badge bg="dark" className="border border-info text-info terminal-font shadow-sm px-2 py-1">{t}</Badge>;
    };

    return (
        <div className="md-theme-bg min-vh-100 text-white" style={{ paddingTop: '95px', paddingBottom: '60px', backgroundColor: '#0a0d14' }}>
            <style>{`
                .terminal-font { font-family: 'Courier New', Courier, monospace; }
                .hud-label { letter-spacing: 1px; font-size: 0.75rem; color: #ff4d4d; }
                .md-input-field { background-color: rgba(0, 0, 0, 0.6); color: #fff; border: 1px solid #1e2638; }
                .md-input-field:focus { background-color: rgba(0, 0, 0, 0.8); color: #fff; border-color: #ff4d4d; box-shadow: 0 0 10px rgba(255, 77, 77, 0.3); }
                .btn-comp-outline { background: transparent; border: 1px solid #ff4d4d; color: #ff4d4d; transition: all 0.2s; }
                .btn-comp-outline:hover { background: #ff4d4d; color: #0a0d14; box-shadow: 0 0 15px rgba(255, 77, 77, 0.4); }
                .hover-text-danger:hover { color: #ff4d4d !important; }
                .hover-border-danger:hover { border-color: rgba(255, 77, 77, 0.5) !important; }
            `}</style>

            <div className="container" style={{ maxWidth: '1100px' }}>
                
                {/* COMPETITIVE FORUM HEADER PANEL */}
                <div className="p-4 rounded-3 bg-dark border border-danger border-opacity-30 shadow-lg mb-4 position-relative overflow-hidden" style={{ background: 'rgba(15, 23, 42, 0.9)' }}>
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                        <div>
                            <h2 className="fw-bold text-white m-0" style={{ letterSpacing: '0.5px' }}>
                                Competitive Discussion
                            </h2>
                            <p className="text-white-50 small mb-0 mt-1">
                                High-tier metagame breakdowns, YCS & Regional tournament reports, side deck tech, and ruling discussions.
                            </p>
                        </div>

                        <Button 
                            className="btn-comp-outline fw-bold px-4 py-2 align-self-start align-self-md-center terminal-font"
                            onClick={handleOpenCreateModal}
                        >
                            CREATE THREAD
                        </Button>
                    </div>
                </div>

                {/* FILTER & SEARCH BAR */}
                <div className="row g-3 mb-4 align-items-center">
                    <div className="col-md-5">
                        <Form.Control 
                            type="text"
                            placeholder="🔍 Search meta threads, duelists, or tournaments..."
                            className="md-input-field"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="col-md-7 d-flex gap-2 flex-wrap justify-content-md-end">
                        {["ALL", "META", "TOURNAMENT", "DECK TECH", "SIDE DECK", "RULINGS"].map((tag) => (
                            <Button
                                key={tag}
                                size="sm"
                                variant={selectedTag === tag ? "danger" : "outline-secondary"}
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
                        <Spinner animation="border" variant="danger" />
                        <p className="text-danger terminal-font mt-2 small">LOADING_COMPETITIVE_THREADS...</p>
                    </div>
                ) : filteredThreads.length === 0 ? (
                    <div className="text-center py-5 rounded-3 bg-dark border border-secondary border-opacity-25">
                        <p className="text-white-50 terminal-font mb-0">NO COMPETITIVE THREADS FOUND MATCHING QUERY</p>
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-3">
                        {filteredThreads.map((thread) => (
                            <div 
                                key={thread.id} 
                                className="p-3 rounded-3 bg-dark border border-danger border-opacity-20 shadow-sm hover-border-danger transition-all"
                                style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(6px)' }}
                            >
                                <div className="row align-items-center g-2">
                                    
                                    {/* 1. UPVOTE COLUMN */}
                                    <div className="col-auto text-center pe-0">
                                        <button 
                                            onClick={(e) => handleUpvote(thread.id, e)}
                                            className="btn btn-sm btn-outline-danger border-0 d-flex flex-column align-items-center px-2 py-1"
                                            title="Upvote thread"
                                        >
                                            <span style={{ fontSize: '1.1rem', lineHeight: '1' }}>▲</span>
                                            <span className="fw-bold terminal-font small mt-1">{thread.upvotes}</span>
                                        </button>
                                    </div>

                                    {/* 2. THREAD DETAILS */}
                                    <div className="col ms-2">
                                        <div className="d-flex align-items-center gap-2 mb-1">
                                            {renderTagBadge(thread.tag)}
                                            <span className="text-info small terminal-font">@{thread.author}</span>
                                            <span className="text-white-50 small" style={{ fontSize: '0.75rem' }}>
                                                • {new Date(thread.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <Link 
                                            href={`/forum/thread/${thread.id}`} // ⚡ Updated to 'href'
                                            className="text-white fw-bold text-decoration-none fs-5 d-block hover-text-danger mb-1 text-truncate"
                                            style={{ maxWidth: '600px' }}
                                        >
                                            {thread.title}
                                        </Link>

                                        <p className="text-white-50 small mb-0 text-truncate" style={{ maxWidth: '600px' }}>
                                            {thread.content}
                                        </p>
                                    </div>

                                    {/* 3. COMPACT RIGHT-ALIGNED MEDIA THUMBNAIL */}
                                    {thread.mediaUrls && thread.mediaUrls.length > 0 && (
                                        <div className="col-auto d-none d-sm-block ms-auto pe-2">
                                            <Link href={`/forum/thread/${thread.id}`}>
                                                <ThreadThumbnail mediaUrls={thread.mediaUrls} />
                                            </Link>
                                        </div>
                                    )}

                                    {/* 4. COMMENTS COUNT METRIC */}
                                    <div className="col-auto text-end d-none d-md-block ps-0">
                                        <Link 
                                            href={`/forum/thread/${thread.id}`} 
                                            className="btn btn-sm btn-outline-secondary text-white-50 border-0 terminal-font"
                                        >
                                            💬 {thread.commentCount || 0}
                                        </Link>
                                    </div>

                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* CREATE COMPETITIVE THREAD MODAL */}
            <Modal 
                show={showModal} 
                onHide={() => setShowModal(false)} 
                centered
                contentClassName="bg-dark text-white border border-danger shadow-lg"
            >
                <Modal.Header closeButton closeVariant="white" className="border-secondary bg-black bg-opacity-50">
                    <Modal.Title className="text-danger terminal-font fw-bold fs-6">
                        CREATE_COMPETITIVE_THREAD
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleCreateThread}>
                    <Modal.Body className="py-3">
                        <Form.Group className="mb-3">
                            <Form.Label className="hud-label">COMPETITIVE TAG</Form.Label>
                            <Form.Select 
                                className="md-input-field" 
                                value={newTag} 
                                onChange={(e) => setNewTag(e.target.value)}
                            >
                                <option value="META">META BREAKDOWN</option>
                                <option value="TOURNAMENT">TOURNAMENT REPORT (YCS/REGIONAL)</option>
                                <option value="DECK TECH">DECK TECH & IN-DEPTH GUIDE</option>
                                <option value="SIDE DECK">SIDE DECKING & TECH CARDS</option>
                                <option value="RULINGS">JUDGE & ADVANCED RULINGS</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="hud-label">THREAD TITLE</Form.Label>
                            <Form.Control 
                                required
                                type="text"
                                placeholder="e.g. Top 8 YCS Breakdown: Side Decking against Tenpai Dragon"
                                className="md-input-field"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                            />
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label className="hud-label">CONTENT & ANALYSIS</Form.Label>
                            <Form.Control 
                                required
                                as="textarea"
                                rows={5}
                                placeholder="Detail your matchup strategy, tournament record, or deck list choices..."
                                className="md-input-field"
                                value={newContent}
                                onChange={(e) => setNewContent(e.target.value)}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="hud-label">UPLOAD DECK SHEET / MATCH PHOTO (MAX 20MB)</Form.Label>
                            <Form.Control 
                                type="file"
                                accept="image/*,video/*"
                                className="md-input-field"
                                onChange={(e) => setSelectedFile(e.target.files[0])}
                            />
                            <Form.Text className="text-white-50 small">
                                Or paste a link to YouTube, Imgur, or a deck list image below:
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Control 
                                type="url"
                                placeholder="https://i.imgur.com/decklist.png or YouTube VOD link"
                                className="md-input-field"
                                value={mediaUrlInput}
                                onChange={(e) => setMediaUrlInput(e.target.value)}
                                disabled={!!selectedFile}
                            />
                        </Form.Group>
                    </Modal.Body>

                    <Modal.Footer className="border-secondary bg-black bg-opacity-50">
                        <Button 
                            type="submit" 
                            className="btn-comp-outline px-4 fw-bold terminal-font"
                            disabled={isSubmitting || isUploading}
                        >
                            {(isSubmitting || isUploading) ? <Spinner animation="border" size="sm" /> : "PUBLISH ANALYSIS"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}

function getMockCompetitiveThreads() {
    return [
        {
            id: "comp-1",
            title: "Top 8 YCS Deck Report: Pure Snake-Eye Matchup Breakdown & Side Deck Guide",
            content: "Detailed walkthrough of 11 tournament rounds, going first vs going second patterns, and key Handtrap priorities.",
            author: "ProYGO_Prodigy",
            tag: "TOURNAMENT",
            upvotes: 114,
            commentCount: 42,
            createdAt: "2026-08-05T12:00:00Z"
        },
        {
            id: "comp-2",
            title: "Is Ghost Mourner underrated in the current tier 1 format?",
            content: "Comparing Ghost Mourner & Moonlit Chill against Effect Veiler for main deck utility against turn 0 combos.",
            author: "MetaAnalyst",
            tag: "SIDE DECK",
            upvotes: 67,
            commentCount: 23,
            createdAt: "2026-08-06T15:30:00Z"
        },
        {
            id: "comp-3",
            title: "Advanced Chain Links: Resolving Trigger Effects on Summon during Opponent Turn",
            content: "A judge guide explaining Priority, Turn Player optional triggers vs Non-Turn Player mandatory triggers.",
            author: "HeadJudgeAlex",
            tag: "RULINGS",
            upvotes: 95,
            commentCount: 19,
            createdAt: "2026-08-07T08:15:00Z"
        }
    ];
}