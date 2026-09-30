'use client';

import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Container } from 'react-bootstrap';
import { FORMATS, useMetaDecks } from '@/hooks/useMetaDecks';
import MetaDeckCard from '@/components/MetaDeckCard';
import '@/mdstyles.css';
import '@/components/metadecks.css';

const slug = (name) => name.toLowerCase().replace(/\s+/g, '-');
const SKELETONS = Array.from({ length: 6 }, (_, i) => i);

const scrollToTop = () => {
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' });
};

/**
 * The archive page. It only decides WHAT to show; the hook (useMetaDecks) does the loading, searching and
 * paging, and MetaDeckCard draws each tile.
 */
export default function MetaDecks({ mdSound }) {
    const {
        format, setFormat, search, setSearch,
        decks, totalCount, matchCount, page, setPage, totalPages,
        loading, error, refetch, prefetchFormat,
    } = useMetaDecks();

    const searching = search.trim().length > 0;

    let status = '';
    if (loading) status = `Loading ${format} decks...`;
    else if (!error) status = searching ? `${matchCount} of ${totalCount} ${format} decks match "${search.trim()}"` : `${totalCount} ${format} decks`;

    return (
        <div className="md-theme-bg min-vh-100 py-5 mt-5 mdc-page">
            <Container>
                <header className="mdc-hero">
                    <h1 className="mdc-title">TOURNAMENT META ARCHIVE</h1>
                    <p className="mdc-subtitle">Real-time competitive metagame profiles &amp; decklists</p>
                </header>

                <div className="mdc-toolbar">
                    <div className="mdc-tabs" role="group" aria-label="Game format">
                        {FORMATS.map((name) => (
                            <button
                                key={name}
                                type="button"
                                className={`mdc-tab mdc-tab--${slug(name)}`}
                                aria-pressed={format === name}
                                onMouseEnter={() => { mdSound?.playHover?.(); prefetchFormat(name); }}
                                onFocus={() => prefetchFormat(name)}
                                onClick={() => { mdSound?.playClick?.(); setFormat(name); }}
                            >
                                {name}
                            </button>
                        ))}
                    </div>

                    <div className="mdc-search">
                        <label htmlFor="mdc-search" className="visually-hidden">Search decks by archetype, pilot or placement</label>
                        <input
                            id="mdc-search"
                            type="search"
                            className="mdc-search__input"
                            placeholder="Search archetype, pilot or placement..."
                            autoComplete="off"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {searching && (
                            <button type="button" className="mdc-search__clear" aria-label="Clear search" onClick={() => setSearch('')}>✕</button>
                        )}
                    </div>
                </div>

                <p className="mdc-status" role="status" aria-live="polite">{status}</p>

                {loading ? (
                    <div className="mdc-grid" aria-hidden="true">
                        {SKELETONS.map((i) => <div key={i} className="mdc-skeleton" />)}
                    </div>
                ) : error ? (
                    <div className="mdc-state mdc-state--error">
                        <h2>CONNECTION FAILURE</h2>
                        <p>{error}</p>
                        <Button variant="outline-danger" className="fw-bold" onClick={() => refetch()}>RETRY CONNECTION</Button>
                    </div>
                ) : totalCount === 0 ? (
                    <div className="mdc-state"><h2>NO DECKS ARCHIVED FOR {format} YET</h2></div>
                ) : matchCount === 0 ? (
                    <div className="mdc-state">
                        <h2>NO DECKS MATCHED &quot;{search.trim().toUpperCase()}&quot;</h2>
                        <Button variant="outline-info" onClick={() => setSearch('')}>CLEAR SEARCH</Button>
                    </div>
                ) : (
                    <>
                        <div className="mdc-grid">
                            {decks.map((deck) => <MetaDeckCard key={deck.id || deck.archetype} deck={deck} mdSound={mdSound} />)}
                        </div>

                        {totalPages > 1 && (
                            <nav className="mdc-pager" aria-label="Pages">
                                <Button variant="outline-info" className="fw-bold px-4" disabled={page === 1}
                                    onClick={() => { mdSound?.playClick?.(); setPage(page - 1); scrollToTop(); }}>
                                    ◄ PREV
                                </Button>
                                <span className="mdc-pager__label">PAGE {page} OF {totalPages}</span>
                                <Button variant="outline-info" className="fw-bold px-4" disabled={page === totalPages}
                                    onClick={() => { mdSound?.playClick?.(); setPage(page + 1); scrollToTop(); }}>
                                    NEXT ►
                                </Button>
                            </nav>
                        )}
                    </>
                )}
            </Container>
        </div>
    );
}
