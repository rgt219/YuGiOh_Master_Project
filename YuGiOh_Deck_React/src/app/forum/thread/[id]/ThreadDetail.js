'use client'; // 👈 Required for client state, modals, upvoting, & file upload

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Form, Button, Badge, Spinner, Modal } from 'react-bootstrap';
import { API_URLS } from '@/config';
import MediaRenderer from '@/components/MediaRenderer';
import '@/mdstyles.css';

// ⚡ MODAL LIGHTBOX PREVIEW FOR COMMENTS
function CommentMediaPreview({ urls }) {
    const [showMediaModal, setShowMediaModal] = useState(false);

    if (!urls || urls.length === 0) return null;

    const getThumbnailSrc = (url) => {
        const ytIdMatch = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
        if (ytIdMatch && ytIdMatch[2].length === 11) {
            return `https://img.youtube.com/vi/${ytIdMatch[2]}/hqdefault.jpg`;
        }
        return url; 
    };

    const thumbnailSrc = getThumbnailSrc(urls[0]);
    const attachmentCount = urls.length;

    return (
        <div className="comment-media-preview-container mt-2 pt-2 border-top border-secondary border-opacity-10">
            <div 
                className="d-flex align-items-center gap-3 p-2 rounded bg-black bg-opacity-30 border border-info border-opacity-25 hover-glow cursor-pointer"
                onClick={() => setShowMediaModal(true)}
                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                title="Click to expand media"
            >
                <div className="position-relative flex-shrink-0">
                    <img 
                        src={thumbnailSrc} 
                        alt="Attachment thumbnail" 
                        className="rounded border border-info border-opacity-40"
                        style={{ width: '90px', height: '60px', objectFit: 'cover', display: 'block' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <span 
                        className="position-absolute bottom-0 end-0 bg-black bg-opacity-75 text-info px-1 font-monospace"
                        style={{ fontSize: '0.6rem', borderTopLeftRadius: '3px' }}
                    >
                        ENLARGE
                    </span>
                </div>

                <div className="flex-grow-1 overflow-hidden">
                    <span className="text-info small terminal-font d-block fw-bold" style={{ fontSize: '0.75rem' }}>
                        ATTACHMENT LOG ({attachmentCount} File{attachmentCount > 1 ? 's' : ''})
                    </span>
                    <span className="text-info-50 small terminal-font d-block mt-1" style={{ fontSize: '0.65rem', opacity: 0.8 }}>
                        Click to view file(s)
                    </span>
                </div>
            </div>

            <Modal 
                show={showMediaModal} 
                onHide={() => setShowMediaModal(false)} 
                centered 
                size="lg"
                contentClassName="bg-dark text-white border border-info shadow-lg rounded-3"
                style={{ backdropFilter: 'blur(6px)' }}
            >
                <Modal.Header closeButton closeVariant="white" className="border-secondary bg-black bg-opacity-50 py-2">
                    <Modal.Title className="text-info terminal-font fw-bold fs-6">
                        ATTACHMENT // {attachmentCount} FILE{attachmentCount > 1 ? 'S' : ''}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-3 bg-dark text-center">
                    <MediaRenderer urls={urls} />
                </Modal.Body>
            </Modal>
        </div>
    );
}

export default function ThreadDetail() {
    const params = useParams();
    const id = params?.id;

    const [thread, setThread] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [showCommentModal, setShowCommentModal] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const currentUser = typeof window !== 'undefined' ? JSON.parse(sessionStorage.getItem("user") || "{}") : {};
    const username = currentUser.userName;

    useEffect(() => {
        if (id) fetchThreadDetails();
    }, [id]);

    const fetchThreadDetails = async () => {
        setIsLoading(true);
        try {
            const baseUrl = API_URLS?.FORUMS || "";
            const response = await fetch(`${baseUrl}/api/forums/threads/${id}`);
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

    const handleVote = async (voteType) => {
        if (!username) {
            alert("ACCESS DENIED: You must be logged in to vote on threads!");
            return;
        }

        try {
            const baseUrl = API_URLS?.FORUMS || "";
            const response = await fetch(`${baseUrl}/api/forums/threads/${id}/vote`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, voteType })
            });

            if (response.ok) {
                fetchThreadDetails();
            }
        } catch (err) {
            console.error("Failed to vote:", err);
        }
    };

    const handleOpenCommentModal = () => {
        if (!username) {
            alert("ACCESS DENIED: You must be logged in to post a comment!");
            return;
        }
        setShowCommentModal(true);
    };

    const handleAddComment = async (e) => {
        e.preventDefault();

        if (!username) {
            alert("ACCESS DENIED: You must be logged in to post a comment!");
            return;
        }

        if (!newComment.trim() && !selectedFile && !youtubeUrl.trim()) return;

        setIsSubmittingComment(true);
        let uploadedMediaUrls = [];

        if (selectedFile) {
            setIsUploading(true);
            const formData = new FormData();
            formData.append("file", selectedFile);

            try {
                const baseUrl = API_URLS?.FORUMS || "";
                const uploadRes = await fetch(`${baseUrl}/api/forums/upload`, {
                    method: "POST",
                    body: formData
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    uploadedMediaUrls.push(uploadData.url);
                } else {
                    alert("⚠️ Failed to upload media file.");
                    setIsSubmittingComment(false);
                    setIsUploading(false);
                    return;
                }
            } catch (uploadErr) {
                console.error("Upload error:", uploadErr);
                alert("⚠️ Error uploading media file.");
                setIsSubmittingComment(false);
                setIsUploading(false);
                return;
            } finally {
                setIsUploading(false);
            }
        }

        if (youtubeUrl.trim()) {
            uploadedMediaUrls.push(youtubeUrl.trim());
        }

        const commentPayload = {
            author: username,
            text: newComment,
            mediaUrls: uploadedMediaUrls
        };

        try {
            const baseUrl = API_URLS?.FORUMS || "";
            const response = await fetch(`${baseUrl}/api/forums/threads/${id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(commentPayload)
            });

            if (response.ok) {
                setNewComment("");
                setYoutubeUrl("");
                setSelectedFile(null);
                setShowCommentModal(false);
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
                <Link href="/generaldiscussion" className="text-info text-decoration-none terminal-font small mb-3 d-inline-block">
                    ← RETURN TO FORUM
                </Link>

                <div className="p-4 rounded-3 bg-dark border border-info border-opacity-25 shadow-lg mb-4" style={{ background: 'rgba(15, 23, 42, 0.9)' }}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                        <Badge bg="info" className="text-dark terminal-font">{thread.tag || "GENERAL"}</Badge>
                        <span className="text-info small terminal-font">@{thread.author}</span>
                        <span className="text-white-50 small">• {new Date(thread.createdAt).toLocaleString()}</span>
                    </div>

                    <h2 className="fw-bold text-white mb-3">{thread.title}</h2>
                    <p className="text-white-50 fs-6 mb-4" style={{ whiteSpace: 'pre-line' }}>{thread.content}</p>

                    <MediaRenderer urls={thread.mediaUrls} />

                    <div className="d-flex align-items-center justify-content-between pt-3 border-top border-secondary border-opacity-25 mt-3">
                        <div className="d-flex align-items-center gap-2">
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
                        </div>
                    </div>
                </div>

                <div className="d-flex align-items-center justify-content-between mb-3">
                    <h5 className="text-white terminal-font m-0">COMMENTS ({thread.comments?.length || 0})</h5>
                    
                    <Button
                        variant={username ? "info" : "warning"}
                        size="sm"
                        className="text-dark fw-bold terminal-font px-3"
                        onClick={handleOpenCommentModal}
                    >
                        {username ? "ADD COMMENT" : "LOG IN TO COMMENT"}
                    </Button>
                </div>

                <div className="d-flex flex-column gap-3">
                    {(!thread.comments || thread.comments.length === 0) ? (
                        <div className="p-4 rounded-3 bg-dark text-center border border-secondary border-opacity-25">
                            <p className="text-white-50 terminal-font mb-0">NO COMMENTS YET. BE THE FIRST TO REPLY!</p>
                        </div>
                    ) : (
                        thread.comments.map((comment) => (
                            <div 
                                key={comment.id} 
                                className="p-3 rounded-3 bg-dark border border-info border-opacity-10 shadow-sm"
                                style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(6px)' }}
                            >
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="text-info terminal-font small fw-bold">@{comment.author}</span>
                                    <span className="text-white-50 small" style={{ fontSize: '0.75rem' }}>
                                        {new Date(comment.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-white-50 mb-0 small" style={{ whiteSpace: 'pre-line' }}>{comment.text}</p>
                                
                                <CommentMediaPreview urls={comment.mediaUrls} />
                            </div>
                        ))
                    )}
                </div>

            </div>

            <Modal 
                show={showCommentModal} 
                onHide={() => setShowCommentModal(false)} 
                centered
                contentClassName="bg-dark text-white border border-info shadow-lg rounded-3"
                style={{ backdropFilter: 'blur(4px)' }}
            >
                <Modal.Header closeButton closeVariant="white" className="border-secondary bg-black bg-opacity-50">
                    <Modal.Title className="text-info terminal-font fw-bold fs-6">
                        💬 ADD_COMMENT
                    </Modal.Title>
                </Modal.Header>

                <Form onSubmit={handleAddComment}>
                    <Modal.Body className="py-3 bg-dark text-white">
                        <Form.Group className="mb-3">
                            <Form.Control 
                                as="textarea"
                                rows={4}
                                placeholder="What are your thoughts?"
                                className="md-input-field text-white bg-black bg-opacity-50 border-secondary"
                                style={{ color: '#fff', backgroundColor: 'rgba(0,0,0,0.5)', borderColor: '#0dcaf0' }}
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                required={!selectedFile && !youtubeUrl}
                            />
                        </Form.Group>

                        <div className="p-3 rounded bg-black bg-opacity-40 border border-secondary border-opacity-25 mb-3">
                            <div className="d-flex align-items-center justify-content-between mb-2">
                                <Form.Label className="hud-label m-0 text-info small terminal-font">
                                    ATTACH MEDIA
                                </Form.Label>
                                {selectedFile && (
                                    <Button 
                                        variant="link" 
                                        size="sm" 
                                        className="text-danger p-0 text-decoration-none terminal-font small"
                                        onClick={() => setSelectedFile(null)}
                                    >
                                        ✖ Remove File
                                    </Button>
                                )}
                            </div>

                            <div className="d-flex align-items-center gap-2 mb-3">
                                <label 
                                    htmlFor="comment-file-upload" 
                                    className="btn btn-sm btn-outline-info terminal-font fw-bold d-flex align-items-center gap-2 cursor-pointer m-0"
                                >
                                    📎 {selectedFile ? "CHANGE FILE" : "ATTACH PHOTO / VIDEO"}
                                </label>
                                <input 
                                    id="comment-file-upload"
                                    type="file"
                                    accept="image/*,video/*"
                                    className="d-none"
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                />
                                {selectedFile && (
                                    <span className="text-info small terminal-font text-truncate" style={{ maxWidth: '200px' }}>
                                        {selectedFile.name}
                                    </span>
                                )}
                            </div>

                            <Form.Group>
                                <Form.Label className="hud-label text-white-50 small terminal-font mb-1">
                                    YOUTUBE / MEDIA LINK
                                </Form.Label>
                                <Form.Control 
                                    type="url"
                                    placeholder="https://youtube.com/watch?v=... or image URL"
                                    className="md-input-field text-white bg-black bg-opacity-50 border-secondary"
                                    style={{ color: '#fff', backgroundColor: 'rgba(0,0,0,0.5)' }}
                                    value={youtubeUrl}
                                    onChange={(e) => setYoutubeUrl(e.target.value)}
                                    disabled={!!selectedFile}
                                />
                            </Form.Group>
                        </div>

                    </Modal.Body>

                    <Modal.Footer className="border-secondary bg-black bg-opacity-50 d-flex justify-content-between">
                        <Button 
                            variant="outline-secondary" 
                            className="terminal-font text-white-50"
                            onClick={() => setShowCommentModal(false)}
                        >
                            CANCEL
                        </Button>
                        
                        <Button 
                            type="submit" 
                            className="md-btn-primary px-4 fw-bold terminal-font"
                            disabled={isSubmittingComment || isUploading}
                        >
                            {(isSubmittingComment || isUploading) ? <Spinner animation="border" size="sm" /> : "POST COMMENT"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}