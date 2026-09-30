import React from 'react';

/**
 * A single short message shown over the page (saved, removed, errors) with an optional action such as Undo.
 * The wrapper is always in the page so screen readers announce each new message.
 */
export default function DeckNotice({ notice, onDismiss }) {
    return (
        <div className="db-notice-region" role="status" aria-live="polite" aria-atomic="true">
            {notice && (
                <div key={notice.id} className={`db-notice db-notice--${notice.tone}`} role={notice.tone === 'error' ? 'alert' : undefined}>
                    <span className="db-notice__text">{notice.message}</span>
                    {notice.action && (notice.action.href ? (
                        <a className="db-notice__action" href={notice.action.href}>{notice.action.label}</a>
                    ) : (
                        <button
                            type="button"
                            className="db-notice__action"
                            onClick={() => { notice.action.onClick(); onDismiss(); }}
                        >
                            {notice.action.label}
                        </button>
                    ))}
                    <button type="button" className="db-notice__close" aria-label="Dismiss message" onClick={onDismiss}>×</button>
                </div>
            )}
        </div>
    );
}
