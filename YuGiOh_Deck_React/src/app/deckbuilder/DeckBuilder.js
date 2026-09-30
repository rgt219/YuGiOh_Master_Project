'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Container } from 'react-bootstrap';
import { importYdkDeck } from '@/store/deckSlice';
import AiCardSuggester from '@/components/AiCardSuggester';
import DeckHeader from '@/components/DeckHeader';
import CardInspector from '@/components/CardInspector';
import DeckNotice from '@/components/DeckNotice';
import { useDeckBuilder } from '@/hooks/useDeckBuilder';
import { useCssVarHeight } from '@/hooks/useCssVarHeight';
import { useCardSize } from '@/hooks/useCardSize';
import { buildCopyMap, getCardId } from '@/lib/deckRules';
import CardApi from './CardApi';
import CustomDeck from './CustomDeck';
import '@/mdstyles.css';
import './deckbuilder.css';

/**
 * Layout
 *   wide screens : card search on the left, your deck on the right, both always visible
 *   phones       : a Search / Deck switch, so only one panel is shown at a time
 *   everywhere   : the card bar is pinned to the bottom of the screen
 */
export default function DeckBuilder() {
    const builder = useDeckBuilder();
    const {
        mainDeck, extraDeck, sideDeck, deckName, dispatch,
        showAiModal, setShowAiModal, notice, dismissNotice,
        activeCard, pinnedCard, handlePreviewCard, handlePinCard, setPinnedCard,
        handleAddCard, handleDeleteCard,
    } = builder;

    const [view, setView] = useState('search'); // only matters below the "lg" breakpoint
    const [cardSize, setCardSize] = useCardSize('md');

    // Cascadia Mono everywhere on this page, including dialogs and menus that render outside it.
    useEffect(() => {
        document.body.classList.add('db-mono');
        return () => document.body.classList.remove('db-mono');
    }, []);

    const toolbarRef = useRef(null);
    const dockRef = useRef(null);
    useCssVarHeight('.cyber-navbar', '--db-nav-h');
    useCssVarHeight(toolbarRef, '--db-toolbar-h');
    useCssVarHeight(dockRef, '--db-dock-h');

    const allCards = useMemo(() => [...mainDeck, ...extraDeck, ...sideDeck], [mainDeck, extraDeck, sideDeck]);
    const copyMap = useMemo(() => buildCopyMap(allCards), [allCards]);
    const activeCopies = activeCard ? copyMap.get(getCardId(activeCard)) || 0 : 0;

    const paneClass = (name) => `db-pane ${view === name ? 'd-flex' : 'd-none'} d-lg-flex`;

    return (
        <div className={`db-page db-size-${cardSize} md-theme-bg`}>
            <a className="db-skip-link" href="#db-deck">Skip to your deck</a>

            <input type="file" accept=".ydk" ref={builder.fileInputRef} className="d-none" tabIndex={-1} aria-hidden="true" onChange={builder.handleImportYDK} />

            <DeckHeader
                toolbarRef={toolbarRef}
                deckName={deckName}
                onRename={builder.handleRenameDeck}
                isImporting={builder.isImporting}
                isSaving={builder.isSaving}
                isDirty={builder.isDirty}
                hasSavedDeck={builder.hasSavedDeck}
                onSave={builder.handleSave}
                onOpenAi={() => setShowAiModal(true)}
                onImport={() => builder.fileInputRef.current?.click()}
                onExport={builder.handleExportYDK}
                onClear={builder.handleClearDeck}
                cardSize={cardSize}
                onCardSize={setCardSize}
            />

            <Container fluid className="db-workbench">
                <div className="db-view-switch d-lg-none" role="group" aria-label="Show">
                    <button type="button" className="terminal-font" aria-pressed={view === 'search'} onClick={() => setView('search')}>
                        Card search
                    </button>
                    <button type="button" className="terminal-font" aria-pressed={view === 'deck'} onClick={() => setView('deck')}>
                        Deck · {mainDeck.length} / {extraDeck.length} / {sideDeck.length}
                    </button>
                </div>

                <div className="db-grid">
                    <section className={paneClass('search')} aria-labelledby="db-search-title">
                        <CardApi
                            cardList={allCards}
                            onAddCard={handleAddCard}
                            onPreviewCard={handlePreviewCard}
                            onPinCard={handlePinCard}
                        />
                    </section>

                    <section id="db-deck" className={paneClass('deck')} aria-labelledby="db-deck-title">
                        <CustomDeck
                            mainDeck={mainDeck}
                            extraDeck={extraDeck}
                            sideDeck={sideDeck}
                            pinnedCard={pinnedCard}
                            onDeleteCard={handleDeleteCard}
                            onPreviewCard={handlePreviewCard}
                            onPinCard={handlePinCard}
                        />
                    </section>
                </div>
            </Container>

            <CardInspector
                dockRef={dockRef}
                card={activeCard}
                isPinned={Boolean(pinnedCard)}
                copies={activeCopies}
                onAdd={handleAddCard}
                onRemove={handleDeleteCard}
                onTogglePin={handlePinCard}
                onUnpin={() => setPinnedCard(null)}
            />

            <DeckNotice notice={notice} onDismiss={dismissNotice} />

            <AiCardSuggester
                show={showAiModal}
                onHide={() => setShowAiModal(false)}
                mainDeck={mainDeck}
                extraDeck={extraDeck}
                sideDeck={sideDeck}
                onAddCard={handleAddCard}
                onAutoBuildDeck={({ main, extra, name }) => {
                    dispatch(importYdkDeck({ main, extra, name }));
                    setShowAiModal(false);
                }}
            />
        </div>
    );
}
