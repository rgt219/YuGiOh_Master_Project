'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Dropdown from 'react-bootstrap/Dropdown';
import { useNotifications } from '@/hooks/useNotifications';
import './notifications.css';

const TOAST_MS = 8000;

/** "2026-10-06T12:00:00Z" -> "5m ago". Anything older than a week shows the date. */
export function timeAgo(iso, now = Date.now()) {
    const then = new Date(iso).getTime();
    if (!Number.isFinite(then)) return '';
    const seconds = Math.max(0, Math.round((now - then) / 1000));
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(then).toLocaleDateString();
}

function BellIcon() {
    return (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
    );
}

// One notification, as a link that also marks it read. Without a link it is a plain row.
function Row({ item, onOpen }) {
    const body = (
        <>
            <span className={`nb-dot${item.read ? ' is-read' : ''}`} aria-hidden="true" />
            <span className="nb-row__text">
                <span className="nb-row__title">{item.title}</span>
                <span className="nb-row__message">{item.message}</span>
                <span className="nb-row__time">{timeAgo(item.createdAt)}</span>
            </span>
        </>
    );

    return item.link ? (
        <Link href={item.link} className={`nb-row${item.read ? '' : ' is-unread'}`} onClick={() => onOpen(item)}>
            {body}
        </Link>
    ) : (
        <div className={`nb-row${item.read ? '' : ' is-unread'}`}>{body}</div>
    );
}

// The pop-up that appears when a notification arrives live. It is drawn straight onto <body> (a "portal"),
// because the navbar is position:fixed and would otherwise trap a fixed child inside itself.
function Toast({ latest, onOpen, onDismiss }) {
    useEffect(() => {
        if (!latest) return undefined;
        const timer = setTimeout(onDismiss, TOAST_MS);
        return () => clearTimeout(timer);
    }, [latest, onDismiss]);

    if (!latest) return null;

    return createPortal(
        <div className="nb-toast" role="status" aria-live="polite">
            {latest.link ? (
                <Link href={latest.link} className="nb-toast__body" onClick={() => onOpen(latest)}>
                    <strong>{latest.title}</strong>
                    <span>{latest.message}</span>
                </Link>
            ) : (
                <div className="nb-toast__body">
                    <strong>{latest.title}</strong>
                    <span>{latest.message}</span>
                </div>
            )}
            <button type="button" className="nb-toast__close" aria-label="Dismiss notification" onClick={onDismiss}>×</button>
        </div>,
        document.body
    );
}

/**
 * The bell for the navbar. Pass the logged-in user (or null). It renders nothing when logged out, but still runs
 * its hook, which is what clears the list and closes the live connection at the moment someone logs out.
 */
export default function NotificationBell({ user }) {
    const userKey = user?.id || user?.userId || user?.userName || user?.username || null;
    const { items, unread, latest, status, error, markRead, markAllRead, dismissLatest } = useNotifications(userKey);
    const [open, setOpen] = useState(false);

    if (!userKey) return null;

    const openItem = (item) => {
        markRead(item.id);
        dismissLatest();
        setOpen(false);
    };

    return (
        <>
            <Dropdown show={open} onToggle={setOpen} align="end" autoClose="outside" className="nb">
                <Dropdown.Toggle
                    as="button"
                    type="button"
                    className="nb-toggle"
                    aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
                >
                    <BellIcon />
                    {unread > 0 && <span className="nb-badge">{unread > 99 ? '99+' : unread}</span>}
                </Dropdown.Toggle>

                <Dropdown.Menu className="nb-panel" renderOnMount>
                    <div className="nb-panel__head">
                        <span className="nb-panel__title">NOTIFICATIONS</span>
                        <button type="button" className="nb-link-btn" onClick={markAllRead} disabled={unread === 0}>
                            Mark all read
                        </button>
                    </div>

                    {error && <div className="nb-note nb-note--warn" role="alert">{error}</div>}

                    {/* A plain div list, not <ul>: it does not inherit the navbar's list styling. */}
                    <div className="nb-list" role="list">
                        {items.map((item) => (
                            <div role="listitem" key={item.id}>
                                <Row item={item} onOpen={openItem} />
                            </div>
                        ))}
                    </div>

                    {status === 'loading' && items.length === 0 && <div className="nb-note">Loading...</div>}
                    {status === 'ready' && items.length === 0 && (
                        <div className="nb-note">
                            Nothing yet. Press TRACK PRICE on a card&apos;s market page and you&apos;ll be alerted here when its price drops.
                        </div>
                    )}
                </Dropdown.Menu>
            </Dropdown>

            {!open && <Toast latest={latest} onOpen={openItem} onDismiss={dismissLatest} />}
        </>
    );
}