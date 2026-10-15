'use client';

import React, { useState } from 'react';
import { Card, Badge, Button, Form } from 'react-bootstrap';
import { useDeckNote, NOTE_LIMITS } from '@/hooks/useDeckNote';

const STATUS_TEXT = {
    dirty: 'Unsaved changes…',
    saving: 'Saving…',
    saved: 'Saved',
    error: 'Could not save.',
};

export default function DeckNotesPanel({ deckId }) {
    const { notes, tags, saveStatus, status, error, setNotes, setTags, flush, retry } = useDeckNote(deckId);
    const [tagInput, setTagInput] = useState('');   // the half-typed tag; not part of the saved data

    const addTag = () => {
        // 1. trim tagInput; ignore if empty
        // 2. ignore if longer than NOTE_LIMITS.tagLength
        // 3. ignore if tags.length >= NOTE_LIMITS.tags
        // 4. ignore if the same tag already exists (compare lowercase)
        // 5. otherwise setTags([...tags, newTag]), then clear tagInput
        const newTag = tagInput.trim();
        if(tagInput.length === 0) return;
        if(tagInput.length > NOTE_LIMITS.tagLength) return;
        if(tags.length >= NOTE_LIMITS.tags) return;
        if(tags.some((t) => t.toLowerCase() === newTag.toLowerCase())) return;

        setTags([...tags, newTag])
        setTagInput('');
    };

    const removeTag = (tag) => { setTags(tags.filter((t) => t !== tag)); };

    if (status === 'signedOut') return null;   // notes need a login

    return (
        <Card text="white" className="border-info shadow-lg p-3 mb-4 md-panel"
            style={{ backgroundColor: 'rgba(8, 12, 20, 0.95)' }}>
            <Card.Header className="bg-transparent border-bottom border-info border-opacity-25 pb-2 mb-3 d-flex justify-content-between align-items-center">
                <h6 className="m-0 text-info terminal-font fw-bold">MY NOTES</h6>
                <span className="small text-white-50">
                    {STATUS_TEXT[saveStatus]}
                    {saveStatus === 'error' && (
                        <Button size="sm" variant="outline-danger" className="ms-2" onClick={retry}>RETRY</Button>
                    )}
                </span>
            </Card.Header>

            {status === 'error' && <p className="text-danger small">{error}</p>}

            <Form.Control
                as="textarea"
                rows={4}
                className="bg-dark text-white border-info"
                placeholder="Private notes about this deck (only you can see them)"
                value={notes}
                maxLength={NOTE_LIMITS.notes}
                disabled={status !== 'ready'}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={flush}
            />
            <div className="text-end small text-white-50 mb-3">{notes.length}/{NOTE_LIMITS.notes}</div>

            <div className="d-flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                    <Badge key={tag} bg="info" className="text-dark d-inline-flex align-items-center gap-1">
                        {tag}
                        <button type="button" className="btn-close btn-close-sm" aria-label={`Remove ${tag}`}
                                onClick={() => removeTag(tag)} />
                    </Badge>
                ))}
            </div>

            <Form.Control
                type="text"
                className="bg-dark text-white border-info"
                placeholder={`Add a tag and press Enter (${tags.length}/${NOTE_LIMITS.tags})`}
                value={tagInput}
                maxLength={NOTE_LIMITS.tagLength}
                disabled={status !== 'ready'}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        addTag();
                    }
                }}
                onBlur={addTag}
            />
        </Card>
    );
}