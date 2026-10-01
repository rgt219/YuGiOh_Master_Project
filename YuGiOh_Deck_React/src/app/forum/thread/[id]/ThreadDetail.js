'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Modal, Button } from 'react-bootstrap';
import {
    FiArrowLeft, FiChevronUp, FiChevronDown, FiChevronLeft, FiChevronRight, FiMessageSquare,
    FiLink, FiLock, FiUploadCloud, FiX, FiSend, FiFilm, FiPlay, FiMaximize2, FiExternalLink, FiImage,
} from 'react-icons/fi';

import { API_URLS } from '@/config';
import MediaRenderer from '@/components/MediaRenderer'; // still used for the main thread media
import { CommentModal, getMediaInfo } from '@/components/thread/CommentModal';
import '@/mdstyles.css';
import styles from './thread.module.css';

/* ------------------------------------------------------------------ */
/* Small helpers (pure, so they are easy to test and reuse)            */
/* ------------------------------------------------------------------ */

const RELATIVE = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const UNITS = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
];

/** "2 months ago". Returns '' for a missing or invalid date. */
function timeAgo(value) {
    const time = new Date(value).getTime();
    if (Number.isNaN(time)) return '';
    const seconds = Math.round((time - Date.now()) / 1000);
    for (const [unit, size] of UNITS) {
        if (Math.abs(seconds) >= size) return RELATIVE.format(Math.round(seconds / size), unit);
    }
    return 'just now';
}

const fullDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
};

/** Same name always gives the same colour (0-359). */
function hueFor(name = '') {
    let hash = 0;
    for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    return hash % 360;
}





/* ------------------------------------------------------------------ */
/* Presentational components (defined OUTSIDE the page component so    */
/* they keep their state between renders)                              */
/* ------------------------------------------------------------------ */

function Avatar({ name, size = 36 }) {
    return (
        <span
            className={styles.avatar}
            style={{ '--hue': hueFor(name), '--size': `${size}px` }}
            aria-hidden="true"
        >
            {(name || '?').charAt(0)}
        </span>
    );
}

const MAX_TILES = 4;

/** One clickable preview. Images keep their natural shape when alone; in a group they become square crops. */
function MediaTile({ url, variant, extra, onOpen }) {
    const info = getMediaInfo(url);
    const [failed, setFailed] = useState(false);
    const isPlayable = info.kind !== 'image';

    let content;
    if (failed) {
        content = <span className={styles.tileFallback}><FiImage size={22} aria-hidden="true" /><span>Unavailable</span></span>;
    } else if (info.kind === 'video') {
        content = <video className={styles.tileMedia} src={`${info.src}#t=0.1`} muted playsInline preload="metadata" onError={() => setFailed(true)} />;
    } else {
        content = <img className={styles.tileMedia} src={info.thumb} alt="" loading="lazy" onError={() => setFailed(true)} />;
    }

    return (
        <button
            type="button"
            className={`${styles.tile} ${styles[variant]}`}
            onClick={onOpen}
            aria-label={isPlayable ? 'Play attachment' : 'View attachment'}
        >
            {content}
            {isPlayable && !failed && <span className={styles.playBadge}><FiPlay size={18} aria-hidden="true" /></span>}
            {extra > 0 ? (
                <span className={styles.more}>+{extra}</span>
            ) : (
                <span className={styles.expandBadge}><FiMaximize2 size={13} aria-hidden="true" /></span>
            )}
        </button>
    );
}

/** Full-size viewer with previous / next and keyboard arrows. */
function MediaLightbox({ urls, index, onChange, onClose }) {
    const count = urls.length;
    const info = getMediaInfo(urls[index]);
    const go = useCallback((step) => onChange((index + step + count) % count), [index, count, onChange]);

    useEffect(() => {
        if (count < 2) return undefined;
        const onKey = (e) => {
            if (e.key === 'ArrowLeft') go(-1);
            if (e.key === 'ArrowRight') go(1);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [go, count]);

    let body;
    if (info.kind === 'youtube') {
        body = (
            <div className={styles.lightFrame}>
                <iframe src={info.embed} title={`Video ${index + 1}`} allowFullScreen />
            </div>
        );
    } else if (info.kind === 'video') {
        body = <video key={info.src} className={styles.lightMedia} src={info.src} controls playsInline />;
    } else {
        body = <img key={info.src} className={styles.lightMedia} src={info.src} alt={`Attachment ${index + 1}`} />;
    }

    return (
        <Modal
            show
            onHide={onClose}
            centered
            size="lg"
            aria-labelledby="media-modal-title"
            contentClassName={styles.modalContent}
            backdropClassName={styles.backdrop}
        >
            <div className={styles.mHead}>
                <h2 id="media-modal-title" className={styles.mTitle}>
                    Attachment{count > 1 ? ` ${index + 1} of ${count}` : ''}
                </h2>
                <button type="button" className={styles.iconBtn} onClick={onClose} aria-label="Close">
                    <FiX size={18} aria-hidden="true" />
                </button>
            </div>

            <div className={styles.lightBody}>
                {count > 1 && (
                    <button type="button" className={`${styles.navBtn} ${styles.navPrev}`} onClick={() => go(-1)} aria-label="Previous attachment">
                        <FiChevronLeft size={22} aria-hidden="true" />
                    </button>
                )}
                {body}
                {count > 1 && (
                    <button type="button" className={`${styles.navBtn} ${styles.navNext}`} onClick={() => go(1)} aria-label="Next attachment">
                        <FiChevronRight size={22} aria-hidden="true" />
                    </button>
                )}
            </div>

            <div className={styles.mFoot}>
                <span className={styles.hint}>{count > 1 ? 'Use the arrow keys to browse' : 'Press Esc to close'}</span>
                <span className={styles.spacer} />
                <a className={styles.ghost} href={info.src} target="_blank" rel="noopener noreferrer">
                    <FiExternalLink size={14} aria-hidden="true" /> {info.kind === 'youtube' ? 'Watch on YouTube' : 'Open original'}
                </a>
            </div>
        </Modal>
    );
}

function CommentMedia({ urls }) {
    const [openIndex, setOpenIndex] = useState(null);
    if (!urls || urls.length === 0) return null;

    const single = urls.length === 1;
    const singleKind = single ? getMediaInfo(urls[0]).kind : null;
    const shown = urls.slice(0, MAX_TILES);
    const hidden = urls.length - shown.length;

    return (
        <>
            <div className={single ? styles.mediaOne : styles.mediaGrid}>
                {shown.map((url, i) => (
                    <MediaTile
                        key={`${url}-${i}`}
                        url={url}
                        variant={single ? (singleKind === 'image' ? 'tileNatural' : 'tileWide') : 'tileSquare'}
                        extra={i === shown.length - 1 ? hidden : 0}
                        onOpen={() => setOpenIndex(i)}
                    />
                ))}
            </div>
            {openIndex !== null && (
                <MediaLightbox urls={urls} index={openIndex} onChange={setOpenIndex} onClose={() => setOpenIndex(null)} />
            )}
        </>
    );
}

function CommentCard({ comment, isOp, isYou }) {
    return (
        <article className={styles.comment} style={{ '--hue': hueFor(comment.author) }}>
            <Avatar name={comment.author} size={34} />
            <div className={styles.commentMain}>
                <header className={styles.commentHead}>
                    <span className={`${styles.authorName} terminal-font`}>@{comment.author}</span>
                    {isOp && <span className={`${styles.badge} ${styles.op} terminal-font`}>OP</span>}
                    {isYou && <span className={`${styles.badge} ${styles.you} terminal-font`}>YOU</span>}
                    <time className={styles.time} dateTime={comment.createdAt} title={fullDate(comment.createdAt)}>
                        {timeAgo(comment.createdAt)}
                    </time>
                </header>
                {comment.text && <p className={styles.commentText}>{comment.text}</p>}
                <CommentMedia urls={comment.mediaUrls} />
            </div>
        </article>
    );
}

const formatSize = (bytes = 0) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);



function ThreadSkeleton() {
    return (
        <div className={styles.page}>
            <div className="mx-auto" style={{ maxWidth: 820 }} aria-busy="true" aria-label="Loading thread">
                <div className={`${styles.panel} ${styles.thread} placeholder-glow`}>
                    <span className="placeholder col-3 mb-3 d-block" />
                    <span className="placeholder col-9 placeholder-lg mb-3 d-block" />
                    <span className="placeholder col-12 d-block mb-2" />
                    <span className="placeholder col-10 d-block mb-4" />
                    <span className="placeholder col-12 d-block" style={{ height: 220 }} />
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function ThreadDetail() {
    const params = useParams();
    const id = params?.id;

    const [thread, setThread] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    const [username, setUsername] = useState('');
    const [notice, setNotice] = useState(null); // { type: 'ok' | 'error', text }
    const [sortOrder, setSortOrder] = useState('oldest');

    const [showCommentModal, setShowCommentModal] = useState(false);
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const baseUrl = API_URLS?.FORUMS || '';

    // The API now checks the login token, so every write sends it.
    const authHeader = () => {
        try {
            const token = sessionStorage.getItem('token');
            return token ? { Authorization: `Bearer ${token}` } : {};
        } catch {
            return {};
        }
    };

    // Read the logged-in user AFTER mount. Reading sessionStorage during render can
    // make the server HTML and the browser HTML disagree (a "hydration mismatch").
    useEffect(() => {
        try {
            const stored = JSON.parse(sessionStorage.getItem('user') || '{}');
            setUsername(stored.userName || '');
        } catch {
            setUsername('');
        }
    }, []);

    // Toasts clear themselves.
    useEffect(() => {
        if (!notice) return undefined;
        const timer = setTimeout(() => setNotice(null), 3500);
        return () => clearTimeout(timer);
    }, [notice]);

    // `silent` refreshes in the background: the page does NOT flash back to a spinner after a vote or comment.
    const fetchThreadDetails = useCallback(async (silent = false) => {
        if (!id) return;
        if (!silent) setIsLoading(true);
        try {
            const response = await fetch(`${baseUrl}/api/forums/threads/${id}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            setThread(await response.json());
            setLoadError(false);
        } catch (err) {
            console.error('Error fetching thread details:', err);
            if (!silent) setLoadError(true);
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [id, baseUrl]);

    useEffect(() => { fetchThreadDetails(); }, [fetchThreadDetails]);

    const requireLogin = (action) => {
        if (username) return false;
        setNotice({ type: 'error', text: `You must be logged in to ${action}.` });
        return true;
    };

    const handleVote = async (voteType) => {
        if (requireLogin('vote on threads')) return;
        try {
            const response = await fetch(`${baseUrl}/api/forums/threads/${id}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeader() },
                body: JSON.stringify({ voteType }),
            });
            if (response.ok) fetchThreadDetails(true);
            else setNotice({ type: 'error', text: 'Your vote could not be saved.' });
        } catch (err) {
            console.error('Failed to vote:', err);
            setNotice({ type: 'error', text: 'Network problem. Try again.' });
        }
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setNotice({ type: 'ok', text: 'Link copied to clipboard' });
        } catch {
            setNotice({ type: 'error', text: 'Could not copy the link' });
        }
    };

    const jumpToComments = () => {
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        document.getElementById('comments')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    };

    const handleOpenCommentModal = () => {
        if (requireLogin('post a comment')) return;
        setShowCommentModal(true);
    };

    // Called by the modal. Returns true when the comment was saved (the modal then clears its draft).
    const submitComment = async ({ text, file, link }) => {
        if (requireLogin('post a comment')) return false;
        if (!text.trim() && !file && !link.trim()) return false;

        setIsSubmittingComment(true);
        const mediaUrls = [];

        if (file) {
            setIsUploading(true);
            try {
                const formData = new FormData();
                formData.append('file', file);
                const uploadRes = await fetch(`${baseUrl}/api/forums/upload`, { method: 'POST', headers: authHeader(), body: formData });
                if (!uploadRes.ok) throw new Error('upload failed');
                mediaUrls.push((await uploadRes.json()).url);
            } catch (uploadErr) {
                console.error('Upload error:', uploadErr);
                setNotice({ type: 'error', text: 'Failed to upload the media file.' });
                setIsSubmittingComment(false);
                setIsUploading(false);
                return false;
            }
            setIsUploading(false);
        }

        if (link.trim()) mediaUrls.push(link.trim());

        try {
            const response = await fetch(`${baseUrl}/api/forums/threads/${id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeader() },
                body: JSON.stringify({ text: text.trim(), mediaUrls }),
            });
            if (!response.ok) {
                setNotice({ type: 'error', text: 'Your comment could not be posted.' });
                return false;
            }
            setShowCommentModal(false);
            setNotice({ type: 'ok', text: 'Comment posted' });
            fetchThreadDetails(true);
            return true;
        } catch (err) {
            console.error('Error submitting comment:', err);
            setNotice({ type: 'error', text: 'Network problem. Try again.' });
            return false;
        } finally {
            setIsSubmittingComment(false);
        }
    };

    // Derived data. All hooks stay ABOVE the early returns below (rules of hooks).
    const comments = thread?.comments;
    const sortedComments = useMemo(() => {
        const list = [...(comments || [])];
        list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        return sortOrder === 'newest' ? list.reverse() : list;
    }, [comments, sortOrder]);

    const participants = useMemo(() => {
        const names = [thread?.author, ...(comments || []).map((c) => c.author)].filter(Boolean);
        return [...new Set(names)];
    }, [thread?.author, comments]);

    if (isLoading) return <ThreadSkeleton />;

    if (loadError || !thread) {
        return (
            <div className={styles.page}>
                <div className={`${styles.panel} ${styles.state}`}>
                    <h2 className="h4 mb-2">{loadError ? "Couldn't load this thread" : 'Thread not found'}</h2>
                    <p className="text-white-50">{loadError ? 'Something went wrong talking to the server.' : 'It may have been removed.'}</p>
                    <div className="d-flex justify-content-center gap-2">
                        {loadError && <Button variant="info" size="sm" className="fw-bold" onClick={() => fetchThreadDetails()}>TRY AGAIN</Button>}
                        <Button as={Link} href="/generaldiscussion" variant="outline-info" size="sm">BACK TO FORUM</Button>
                    </div>
                </div>
            </div>
        );
    }

    const hasUpvoted = thread.upvotedBy?.includes(username);
    const hasDownvoted = thread.downvotedBy?.includes(username);
    const commentCount = comments?.length || 0;

    return (
        <div className={`${styles.page} md-theme-bg`}>
            <div className={styles.layout}>
                <main>
                    <Link href="/generaldiscussion" className={`${styles.back} terminal-font`}><FiArrowLeft aria-hidden="true" /> RETURN TO FORUM</Link>

                    <article className={`${styles.panel} ${styles.thread}`}>
                        <div className={styles.meta} style={{ '--hue': hueFor(thread.author) }}>
                            <Avatar name={thread.author} size={40} />
                            <div className={styles.metaText}>
                                <span className={`${styles.authorName} terminal-font`}>@{thread.author}</span>
                                <time className={styles.time} dateTime={thread.createdAt} title={fullDate(thread.createdAt)}>
                                    {timeAgo(thread.createdAt)}
                                </time>
                            </div>
                            <span className={`${styles.tag} terminal-font`}>{thread.tag || 'GENERAL'}</span>
                        </div>

                        <h1 className={styles.title}>{thread.title}</h1>
                        {thread.content && <p className={styles.body}>{thread.content}</p>}

                        {thread.mediaUrls?.length > 0 && (
                            <div className={styles.mediaWrap}><MediaRenderer urls={thread.mediaUrls} /></div>
                        )}

                        <div className={styles.actions}>
                            <button
                                type="button"
                                className={`${styles.pill} ${styles.up} ${hasUpvoted ? styles.upOn : ''} terminal-font`}
                                aria-pressed={!!hasUpvoted}
                                onClick={() => handleVote('up')}
                            >
                                <FiChevronUp aria-hidden="true" /> UPVOTE <span>{thread.upvotes ?? 0}</span>
                            </button>
                            <button
                                type="button"
                                className={`${styles.pill} ${styles.down} ${hasDownvoted ? styles.downOn : ''} terminal-font`}
                                aria-pressed={!!hasDownvoted}
                                onClick={() => handleVote('down')}
                            >
                                <FiChevronDown aria-hidden="true" /> DOWNVOTE
                            </button>
                            <span className={styles.spacer} />
                            <button type="button" className={`${styles.pill} terminal-font`} onClick={jumpToComments}>
                                <FiMessageSquare aria-hidden="true" /> {commentCount}
                            </button>
                            <button type="button" className={`${styles.pill} terminal-font`} onClick={handleShare}>
                                <FiLink aria-hidden="true" /> SHARE
                            </button>
                        </div>
                    </article>

                    <div id="comments" className={styles.commentsHead}>
                        <h2 className={`${styles.commentsTitle} terminal-font`}>COMMENTS ({commentCount})</h2>
                        {commentCount > 1 && (
                            <div className={styles.sort} role="group" aria-label="Sort comments">
                                {['oldest', 'newest'].map((order) => (
                                    <button
                                        key={order}
                                        type="button"
                                        aria-pressed={sortOrder === order}
                                        className={`${styles.sortBtn} ${sortOrder === order ? styles.sortOn : ''} terminal-font`}
                                        onClick={() => setSortOrder(order)}
                                    >
                                        {order.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {username ? (
                        <button type="button" className={styles.composer} onClick={handleOpenCommentModal}>
                            <span style={{ '--hue': hueFor(username) }}><Avatar name={username} size={30} /></span>
                            Add to the discussion…
                        </button>
                    ) : (
                        <Link href="/login" className={styles.composer}>
                            <FiLock aria-hidden="true" /> Log in to join the discussion
                        </Link>
                    )}

                    <div className={styles.list}>
                        {sortedComments.length === 0 ? (
                            <div className={`${styles.panel} ${styles.empty} terminal-font`}>NO COMMENTS YET. BE THE FIRST TO REPLY!</div>
                        ) : (
                            sortedComments.map((comment) => (
                                <CommentCard
                                    key={comment.id}
                                    comment={comment}
                                    isOp={comment.author === thread.author}
                                    isYou={!!username && comment.author === username}
                                />
                            ))
                        )}
                    </div>
                </main>

                <aside className={styles.rail} aria-label="Thread details">
                    <div className={`${styles.panel} ${styles.railCard}`}>
                        <h3 className={`${styles.railTitle} terminal-font`}>THREAD INFO</h3>
                        <div className={styles.stat}><span>Upvotes</span><strong>{thread.upvotes ?? 0}</strong></div>
                        <div className={styles.stat}><span>Comments</span><strong>{commentCount}</strong></div>
                        <div className={styles.stat}><span>Participants</span><strong>{participants.length}</strong></div>
                        <div className={styles.stat}><span>Posted</span><strong>{timeAgo(thread.createdAt)}</strong></div>
                        <button type="button" className={`${styles.pill} ${styles.railBtn} terminal-font`} onClick={handleShare}><FiLink aria-hidden="true" /> COPY LINK</button>
                    </div>

                    {participants.length > 0 && (
                        <div className={`${styles.panel} ${styles.railCard}`}>
                            <h3 className={`${styles.railTitle} terminal-font`}>IN THIS THREAD</h3>
                            <div className={styles.people}>
                                {participants.slice(0, 18).map((name) => (
                                    <span key={name} title={`@${name}`} style={{ '--hue': hueFor(name) }}>
                                        <Avatar name={name} size={32} />
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </aside>
            </div>

            {notice && (
                <div role="status" className={`${styles.toast} ${notice.type === 'error' ? styles.toastError : ''} terminal-font`}>
                    {notice.text}
                </div>
            )}

            <CommentModal
                show={showCommentModal}
                onHide={() => setShowCommentModal(false)}
                username={username}
                threadAuthor={thread.author}
                threadTitle={thread.title}
                busy={isSubmittingComment || isUploading}
                uploading={isUploading}
                onSubmit={submitComment}
            />
        </div>
    );
}
