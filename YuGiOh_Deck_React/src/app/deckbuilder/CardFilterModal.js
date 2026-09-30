import React from 'react';
import { Modal, Form, Row, Col, Button } from 'react-bootstrap';
import {
    ATTRIBUTES, MONSTER_ABILITIES, MONSTER_EXTRA_TYPES,
    RARITIES, LEVELS, LINKS, SCALES,
} from '@/constants/cardSearchConstants';

const SELECT_CLASS = 'bg-black text-info border-secondary terminal-font';

// One labelled dropdown. `controlId` links the label to the select, so screen readers announce it.
function FilterSelect({ id, label, value, onChange, options, disabled = false, format = (v) => v, xs = 6 }) {
    return (
        <Col xs={xs}>
            <Form.Group controlId={`filter-${id}`}>
                <Form.Label className="text-info terminal-font mb-1" style={{ fontSize: '0.75rem' }}>{label}</Form.Label>
                <Form.Select size="sm" className={SELECT_CLASS} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
                    {options.map((option) => <option key={option} value={option}>{format(option)}</option>)}
                </Form.Select>
            </Form.Group>
        </Col>
    );
}

export default function CardFilterModal({ show, onHide, filters, setFilter, raceOptions, archetypes, onReset }) {
    const { mainType, type } = filters;
    const spellOrTrap = mainType === 'SPELL' || mainType === 'TRAP';
    const raceLabel = mainType === 'SPELL' ? 'Spell type' : mainType === 'TRAP' ? 'Trap type' : 'Monster race';

    return (
        <Modal show={show} onHide={onHide} centered contentClassName="master-duel-modal border-info" aria-labelledby="filters-title">
            <Modal.Header closeButton closeVariant="white" className="border-bottom border-info border-opacity-25">
                <Modal.Title id="filters-title" as="h2" className="text-info terminal-font fw-bold fs-6">Advanced search filters</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-3">
                <Form onSubmit={(e) => { e.preventDefault(); onHide(); }}>
                    <Row className="g-2">
                        <FilterSelect id="attribute" label="Attribute" value={filters.attribute} onChange={(v) => setFilter('attribute', v)}
                            options={ATTRIBUTES} disabled={spellOrTrap} />
                        <FilterSelect id="ability" label="Ability" value={filters.ability} onChange={(v) => setFilter('ability', v)}
                            options={MONSTER_ABILITIES} disabled={spellOrTrap || mainType === 'NORMAL'}
                            format={(v) => (v === 'ALL' ? 'ALL ABILITIES' : v)} />
                        <FilterSelect id="type" label="Card type" value={type} onChange={(v) => setFilter('type', v)}
                            options={MONSTER_EXTRA_TYPES} disabled={spellOrTrap}
                            format={(v) => (v === 'ALL' ? 'ALL TYPES' : v)} />
                        <FilterSelect id="race" label={raceLabel} value={filters.race} onChange={(v) => setFilter('race', v)}
                            options={raceOptions} format={(v) => v.toUpperCase()} />
                        <FilterSelect id="archetype" label="Archetype" value={filters.archetype} onChange={(v) => setFilter('archetype', v)}
                            options={archetypes} format={(v) => v.toUpperCase()} />
                        <FilterSelect id="rarity" label="Rarity" value={filters.rarity} onChange={(v) => setFilter('rarity', v)}
                            options={RARITIES} format={(v) => v.toUpperCase()} />
                        <FilterSelect id="level" label="Level / rank" value={filters.level} onChange={(v) => setFilter('level', v)}
                            options={LEVELS} xs={4} disabled={spellOrTrap || type === 'LINK'}
                            format={(v) => (v === 'ALL' ? 'ALL' : `${v}★`)} />
                        <FilterSelect id="link" label="Link rating" value={filters.link} onChange={(v) => setFilter('link', v)}
                            options={LINKS} xs={4} disabled={spellOrTrap || (type !== 'LINK' && type !== 'ALL')}
                            format={(v) => (v === 'ALL' ? 'ALL' : `L-${v}`)} />
                        <FilterSelect id="scale" label="Pendulum scale" value={filters.scale} onChange={(v) => setFilter('scale', v)}
                            options={SCALES} xs={4} disabled={spellOrTrap || (type !== 'PENDULUM' && type !== 'ALL')} />
                    </Row>
                </Form>
            </Modal.Body>
            <Modal.Footer className="border-top border-info border-opacity-25 justify-content-between">
                <Button variant="outline-danger" size="sm" className="terminal-font" onClick={onReset}>Reset all</Button>
                <Button variant="info" size="sm" className="terminal-font fw-bold px-4" onClick={onHide}>Show results</Button>
            </Modal.Footer>
        </Modal>
    );
}
