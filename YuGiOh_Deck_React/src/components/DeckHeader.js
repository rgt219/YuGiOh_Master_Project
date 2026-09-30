import React from 'react';
import { Button, Dropdown, Form, Spinner } from 'react-bootstrap';

/** The deck builder's toolbar: name, save, and a Tools menu for everything else. */
export default function DeckHeader({
    toolbarRef, deckName, onRename, isImporting, isSaving, isDirty, hasSavedDeck,
    onSave, onOpenAi, onImport, onExport, onClear,
}) {
    const status = isSaving ? 'Saving…' : isDirty ? 'Unsaved changes' : hasSavedDeck ? 'All changes saved' : '';

    return (
        <section className="db-toolbar" ref={toolbarRef} aria-label="Deck toolbar">
            <h1 className="db-toolbar__title terminal-font">Deck Builder</h1>

            <div className="db-toolbar__name">
                <Form.Label htmlFor="db-deck-name" className="visually-hidden">Deck name</Form.Label>
                <Form.Control
                    id="db-deck-name"
                    className="db-input terminal-font"
                    placeholder={isImporting ? 'Importing…' : 'Name your deck'}
                    value={deckName}
                    maxLength={60}
                    disabled={isImporting}
                    autoComplete="off"
                    onChange={(e) => onRename(e.target.value)}
                />
            </div>

            <span className={`db-toolbar__status ${isDirty ? 'is-dirty' : ''}`} role="status" aria-live="polite">{status}</span>

            <div className="db-toolbar__actions">
                <Button
                    variant="info"
                    className="terminal-font fw-bold text-dark px-3"
                    onClick={onSave}
                    disabled={isSaving || isImporting}
                >
                    {isSaving ? <><Spinner size="sm" animation="border" role="status" aria-hidden="true" /> Saving…</> : 'Save deck'}
                </Button>

                <Dropdown align="end">
                    <Dropdown.Toggle variant="outline-info" className="terminal-font fw-bold" id="db-tools-menu">
                        Tools
                    </Dropdown.Toggle>
                    <Dropdown.Menu variant="dark" className="terminal-font">
                        <Dropdown.Item onClick={onOpenAi}>AI assistant (beta)</Dropdown.Item>
                        <Dropdown.Item onClick={onImport} disabled={isImporting}>Import .ydk file</Dropdown.Item>
                        <Dropdown.Item onClick={onExport}>Export .ydk file</Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item onClick={onClear} className="text-danger">Clear deck</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </section>
    );
}
