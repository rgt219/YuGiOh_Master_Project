import React, { useState, useEffect, useRef, FiX, Avatar,formatSize} from 'react';

import {
    FiLink, FiUploadCloud, FiFilm, FiSend
} from 'react-icons/fi';

import { Spinner, Modal } from 'react-bootstrap';
import styles from '../../app/forum/thread/[id]/thread.module.css';

const YOUTUBE_RE = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
const VIDEO_RE = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;

const getThumbnailSrc = (url) => getMediaInfo(url).thumb || url;

/** What kind of attachment is this URL, and what should we show for it? One place decides, everything else just reads. */
export function getMediaInfo(url) {
    const yt = url.match(YOUTUBE_RE);
    if (yt && yt[2].length === 11) {
        return { kind: 'youtube', src: url, thumb: `https://img.youtube.com/vi/${yt[2]}/hqdefault.jpg`, embed: `https://www.youtube.com/embed/${yt[2]}` };
    }
    if (VIDEO_RE.test(url)) return { kind: 'video', src: url, thumb: null };
    return { kind: 'image', src: url, thumb: url };
}

export function CommentModal({ show, onHide, username, threadAuthor, threadTitle, busy, uploading, onSubmit }) {
    const [text, setText] = useState('');
    const [file, setFile] = useState(null);
    const [link, setLink] = useState('');
    const [dragging, setDragging] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const textRef = useRef(null);
    const fileInputRef = useRef(null);

    // Preview for a chosen image. The temporary URL is released when the file changes or the window closes.
    useEffect(() => {
        if (!file || !file.type?.startsWith('image/')) {
            setPreviewUrl(null);
            return undefined;
        }
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const trimmedLink = link.trim();
    const linkThumb = trimmedLink ? getThumbnailSrc(trimmedLink) : null;
    const isYoutube = !!linkThumb && linkThumb !== trimmedLink;
    const canPost = !busy && (text.trim() || file || trimmedLink);

    const pickFile = (picked) => {
        if (!picked || !/^(image|video)\//.test(picked.type)) return;
        setFile(picked);
        setLink(''); // a comment carries either an upload or a link, not both
    };

    const submit = async (e) => {
        e?.preventDefault();
        if (!canPost) return;
        const ok = await onSubmit({ text, file, link });
        if (ok) { setText(''); setFile(null); setLink(''); }
    };

    const onDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        pickFile(e.dataTransfer.files?.[0]);
    };

    return (
        <Modal
            show={show}
            onHide={() => { if (!busy) onHide(); }}
            centered
            aria-labelledby="comment-modal-title"
            contentClassName={styles.modalContent}
            backdropClassName={styles.backdrop}
            onEntered={() => textRef.current?.focus()}
        >
            <form onSubmit={submit}>
                <div className={styles.mHead}>
                    <div className="overflow-hidden">
                        <h2 id="comment-modal-title" className={styles.mTitle}>New comment</h2>
                        <p className={styles.mSub}>Replying to <strong>@{threadAuthor}</strong> in &ldquo;{threadTitle}&rdquo;</p>
                    </div>
                    <button type="button" className={styles.iconBtn} onClick={() => { if (!busy) onHide(); }} aria-label="Close">
                        <FiX size={18} aria-hidden="true" />
                    </button>
                </div>

                <div className={styles.mBody}>
                    <div className={styles.asRow}>
                        <Avatar name={username} size={28} />
                        <span>Posting as <strong>@{username}</strong></span>
                    </div>

                    <textarea
                        ref={textRef}
                        rows={5}
                        className={styles.field}
                        placeholder="What are your thoughts?"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') submit(e); }}
                        aria-label="Comment text"
                    />
                    <div className={styles.count}>{text.length} characters</div>

                    <div className={styles.label}>ATTACHMENT <span>(optional)</span></div>

                    {file ? (
                        <div className={styles.fileRow}>
                            {previewUrl ? (
                                <img src={previewUrl} alt="" className={styles.filePreview} />
                            ) : (
                                <span className={`${styles.filePreview} ${styles.fileIcon}`}><FiFilm size={22} aria-hidden="true" /></span>
                            )}
                            <span className={styles.fileInfo}>
                                <span className={styles.fileName}>{file.name}</span>
                                <span className={styles.fileMeta}>{formatSize(file.size)}</span>
                            </span>
                            <button type="button" className={styles.iconBtn} onClick={() => setFile(null)} aria-label="Remove file">
                                <FiX size={16} aria-hidden="true" />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            className={`${styles.drop} ${dragging ? styles.dropOn : ''}`}
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={onDrop}
                        >
                            <FiUploadCloud size={22} aria-hidden="true" />
                            <span><strong>Drop a photo or video here</strong>, or click to browse</span>
                        </button>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        className="d-none"
                        onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ''; }}
                    />

                    {!file && (
                        <>
                            <div className={styles.or}><span>OR</span></div>
                            <label className={styles.linkField}>
                                <FiLink size={16} aria-hidden="true" />
                                <input
                                    type="url"
                                    placeholder="Paste a YouTube or image link"
                                    value={link}
                                    onChange={(e) => setLink(e.target.value)}
                                    aria-label="YouTube or image link"
                                />
                            </label>
                            {isYoutube && (
                                <div className={styles.linkPreview}>
                                    <img src={linkThumb} alt="" />
                                    <span>YouTube video attached</span>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className={styles.mFoot}>
                    <span className={styles.hint}>Ctrl + Enter to post</span>
                    <span className={styles.spacer} />
                    <button type="button" className={styles.ghost} onClick={onHide} disabled={busy}>Cancel</button>
                    <button type="submit" className={styles.primary} disabled={!canPost}>
                        {busy ? (
                            <><Spinner animation="border" size="sm" aria-hidden="true" /> {uploading ? 'Uploading…' : 'Posting…'}</>
                        ) : (
                            <><FiSend size={15} aria-hidden="true" /> Post comment</>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
}