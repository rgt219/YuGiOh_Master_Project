'use client'; 

import React from 'react';
import { Form, Button, Modal, Badge, Spinner } from 'react-bootstrap';
import Link from 'next/link';
import { useCompetitiveDiscussion } from '@/hooks/useCompetitiveDiscussion';

export default function CompetitiveDiscussion() {
    const {
        isLoading, searchTerm, setSearchTerm, selectedTag, setSelectedTag,
        mediaUrlInput, setMediaUrlInput, showModal, setShowModal, newTitle, setNewTitle,
        newContent, setNewContent, newTag, setNewTag, isSubmitting,
        setSelectedFile, isUploading, handleCreateThread, handleOpenCreateModal,
        handleUpvote, filteredThreads
    } = useCompetitiveDiscussion();

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
                className="rounded overflow-hidden border border-danger border-opacity-50 shadow-sm position-relative flex-shrink-0"
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

    const renderTagBadge = (tag) => {
        const t = (tag || "META").toUpperCase();
        if (t === "META") return <Badge bg="danger" className="cascadia-font shadow-sm px-2 py-1">META BREAKDOWN</Badge>;
        if (t === "TOURNAMENT") return <Badge bg="warning" className="text-dark cascadia-font shadow-sm px-2 py-1">TOURNAMENT REPORT</Badge>;
        if (t === "DECK TECH") return <Badge bg="info" className="text-dark cascadia-font shadow-sm px-2 py-1">DECK TECH</Badge>;
        if (t === "SIDE DECK") return <Badge bg="primary" className="cascadia-font shadow-sm px-2 py-1">SIDE DECKING</Badge>;
        if (t === "RULINGS") return <Badge bg="secondary" className="cascadia-font shadow-sm px-2 py-1">RULINGS</Badge>;
        return <Badge bg="dark" className="border border-danger text-danger cascadia-font shadow-sm px-2 py-1">{t}</Badge>;
    };

    return (
        <div className="md-theme-bg min-vh-100 text-white" style={{ paddingTop: '95px', paddingBottom: '60px', backgroundColor: '#0a0d14', fontFamily: "'Cascadia Mono', monospace" }}>
            
            <style>{`
                .cascadia-font { font-family: 'Cascadia Mono', monospace !important; }
                .hud-label { letter-spacing: 1px; font-size: 0.8rem; color: #ff4d4d; font-weight: bold; }
                
                .md-input-field { 
                    background-color: rgba(0, 0, 0, 0.6); 
                    color: #fff; 
                    border: 1px solid #1e2638; 
                    font-family: 'Cascadia Mono', monospace;
                }
                .md-input-field:focus { 
                    background-color: rgba(0, 0, 0, 0.8); 
                    color: #fff; 
                    border-color: #ff4d4d; 
                    box-shadow: 0 0 12px rgba(255, 77, 77, 0.4); 
                }
                
                .btn-comp-outline { 
                    background: transparent; 
                    border: 1px solid #ff4d4d; 
                    color: #ff4d4d; 
                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); 
                    box-shadow: 0 0 10px rgba(255, 77, 77, 0.2); 
                }
                .btn-comp-outline:hover { 
                    background: #ff4d4d; 
                    color: #0a0d14 !important; 
                    box-shadow: 0 0 20px rgba(255, 77, 77, 0.6); 
                    transform: translateY(-2px); 
                }

                .cyber-header-comp {
                    background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(40, 10, 15, 0.95) 100%);
                    border-bottom: 2px solid #ff4d4d !important;
                    box-shadow: 0 10px 30px rgba(255, 77, 77, 0.15);
                }
                .glow-text-comp { text-shadow: 0 0 12px rgba(255, 77, 77, 0.6); }

                .thread-card {
                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                    border-left: 3px solid rgba(255, 77, 77, 0.2) !important;
                    background: rgba(15, 23, 42, 0.85);
                }
                .thread-card:hover {
                    transform: translateX(10px);
                    background: rgba(255, 77, 77, 0.05);
                    border-left: 4px solid #ff4d4d !important;
                    border-color: rgba(255, 77, 77, 0.4) !important;
                    box-shadow: 0 8px 25px rgba(255, 77, 77, 0.2) !important;
                }
                .hover-text-danger { transition: color 0.2s ease; }
                .hover-text-danger:hover { color: #ff4d4d !important; text-shadow: 0 0 8px rgba(255, 77, 77, 0.4); }
            `}</style>

            <div className="container" style={{ maxWidth: '1100px' }}>
                
                <div className="p-4 rounded-3 border border-secondary border-opacity-25 shadow-lg mb-4 position-relative overflow-hidden cyber-header-comp">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                        <div>
                            <h2 className="fw-bold text-white m-0 cascadia-font glow-text-comp" style={{ letterSpacing: '1px' }}>
                                COMPETITIVE_DISCUSSION
                            </h2>
                            <p className="text-white-50 small mb-0 mt-2 cascadia-font">
                                High-tier metagame breakdowns, YCS & Regional tournament reports, side deck tech, and ruling discussions.
                            </p>
                        </div>

                        <Button 
                            className="btn-comp-outline fw-bold px-4 py-2 align-self-start align-self-md-center cascadia-font"
                            onClick={handleOpenCreateModal}
                        >
                            CREATE THREAD
                        </Button>
                    </div>
                </div>

                <div className="row g-3 mb-4 align-items-center">
                    <div className="col-md-5">
                        <Form.Control 
                            type="text"
                            placeholder="🔍 Search meta threads, duelists..."
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
                                className={`cascadia-font ${selectedTag === tag ? "text-dark fw-bold shadow" : "text-white-50"}`}
                                onClick={() => setSelectedTag(tag)}
                            >
                                {tag}
                            </Button>
                        ))}
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="danger" />
                        <p className="text-danger cascadia-font mt-3 small fw-bold">LOADING_COMPETITIVE_THREADS...</p>
                    </div>
                ) : filteredThreads.length === 0 ? (
                    <div className="text-center py-5 rounded-3 bg-dark border border-secondary border-opacity-25">
                        <p className="text-white-50 cascadia-font mb-0">NO COMPETITIVE THREADS FOUND MATCHING QUERY</p>
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-3">
                        {filteredThreads.map((thread) => (
                            <div 
                                key={thread.id} 
                                className="p-3 rounded-3 border border-secondary border-opacity-25 shadow-sm thread-card"
                                style={{ backdropFilter: 'blur(6px)' }}
                            >
                                <div className="row align-items-center g-2">
                                    <div className="col-auto text-center pe-0">
                                        <button 
                                            onClick={(e) => handleUpvote(thread.id, e)}
                                            className="btn btn-sm btn-outline-danger border-0 d-flex flex-column align-items-center px-2 py-1"
                                            title="Upvote thread"
                                        >
                                            <span style={{ fontSize: '1.2rem', lineHeight: '1' }}>▲</span>
                                            <span className="fw-bold cascadia-font small mt-1">{thread.upvotes}</span>
                                        </button>
                                    </div>

                                    <div className="col ms-2">
                                        <div className="d-flex align-items-center gap-2 mb-1">
                                            {renderTagBadge(thread.tag)}
                                            <span className="text-danger small cascadia-font">@{thread.author}</span>
                                            <span className="text-white-50 small cascadia-font" style={{ fontSize: '0.75rem' }}>
                                                • {new Date(thread.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <Link 
                                            href={`/forum/thread/${thread.id}`}
                                            className="text-white fw-bold text-decoration-none fs-5 d-block hover-text-danger mb-1 text-truncate cascadia-font"
                                            style={{ maxWidth: '600px' }}
                                        >
                                            {thread.title}
                                        </Link>

                                        <p className="text-white-50 small mb-0 text-truncate cascadia-font" style={{ maxWidth: '600px' }}>
                                            {thread.content}
                                        </p>
                                    </div>

                                    {thread.mediaUrls && thread.mediaUrls.length > 0 && (
                                        <div className="col-auto d-none d-sm-block ms-auto pe-2">
                                            <Link href={`/forum/thread/${thread.id}`}>
                                                <ThreadThumbnail mediaUrls={thread.mediaUrls} />
                                            </Link>
                                        </div>
                                    )}

                                    <div className="col-auto text-end d-none d-md-block ps-0">
                                        <Link 
                                            href={`/forum/thread/${thread.id}`} 
                                            className="btn btn-sm btn-outline-secondary text-white-50 border-0 cascadia-font"
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

            <Modal 
                show={showModal} 
                onHide={() => setShowModal(false)} 
                centered
                contentClassName="bg-dark text-white border border-danger shadow-lg cascadia-font"
            >
                <Modal.Header closeButton closeVariant="white" className="border-secondary bg-black bg-opacity-50">
                    <Modal.Title className="text-danger cascadia-font fw-bold fs-6">
                        CREATE_COMPETITIVE_THREAD
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleCreateThread}>
                    <Modal.Body className="py-3">
                        <Form.Group className="mb-3">
                            <Form.Label className="hud-label">COMPETITIVE TAG</Form.Label>
                            <Form.Select className="md-input-field" value={newTag} onChange={(e) => setNewTag(e.target.value)}>
                                <option value="META">META BREAKDOWN</option>
                                <option value="TOURNAMENT">TOURNAMENT REPORT</option>
                                <option value="DECK TECH">DECK TECH & GUIDE</option>
                                <option value="SIDE DECK">SIDE DECKING</option>
                                <option value="RULINGS">JUDGE RULINGS</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="hud-label">THREAD TITLE</Form.Label>
                            <Form.Control required type="text" placeholder="e.g. Top 8 YCS Breakdown" className="md-input-field" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label className="hud-label">CONTENT & ANALYSIS</Form.Label>
                            <Form.Control required as="textarea" rows={5} placeholder="Detail your strategy..." className="md-input-field" value={newContent} onChange={(e) => setNewContent(e.target.value)} />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="hud-label">UPLOAD DECK SHEET / PHOTO</Form.Label>
                            <Form.Control type="file" accept="image/*,video/*" className="md-input-field" onChange={(e) => setSelectedFile(e.target.files[0])} />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Control type="url" placeholder="Or paste YouTube/Imgur link" className="md-input-field" value={mediaUrlInput} onChange={(e) => setMediaUrlInput(e.target.value)} />
                        </Form.Group>
                    </Modal.Body>

                    <Modal.Footer className="border-secondary bg-black bg-opacity-50">
                        <Button type="submit" className="btn-comp-outline px-4 fw-bold cascadia-font" disabled={isSubmitting}>
                            {isSubmitting ? <Spinner animation="border" size="sm" /> : "PUBLISH ANALYSIS"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}