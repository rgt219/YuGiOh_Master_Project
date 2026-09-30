import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    addCardToDeck,
    removeCardFromDeck,
    updateDeckName,
    importYdkDeck,
    clearDeck,
} from '@/store/deckSlice';
import { API_URLS } from '@/config';
import { fetchCardsByIds, toDeckCard } from '@/lib/cardData';
import { canAddCard, getCardId, getCardName } from '@/lib/deckRules';
import { parseYdk, buildYdk } from '@/lib/ydk';

const newInstanceId = (cardId) => `${cardId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
const newDeckId = () =>
    typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

/**
 * All deck-builder behaviour in one place: adding, removing, importing, exporting, saving,
 * plus the small "notice" messages that replace alert() and confirm().
 */
export function useDeckBuilder() {
    const mainDeck = useSelector((state) => state.deck.mainDeck || []);
    const extraDeck = useSelector((state) => state.deck.extraDeck || []);
    const sideDeck = useSelector((state) => state.deck.sideDeck || []);
    const deckName = useSelector((state) => state.deck.deckName || '');
    const dispatch = useDispatch();

    const [showAiModal, setShowAiModal] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [inspectedCard, setInspectedCard] = useState(null);
    const [pinnedCard, setPinnedCard] = useState(null);
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [notice, setNotice] = useState(null);

    const fileInputRef = useRef(null);
    const noticeTimer = useRef(null);
    const savedDeckId = useRef(null);

    // ---- Notices (replace alert / confirm) -------------------------------------------------
    const dismissNotice = useCallback(() => {
        clearTimeout(noticeTimer.current);
        setNotice(null);
    }, []);

    const showNotice = useCallback((message, { tone = 'info', action = null, duration = 5000 } = {}) => {
        clearTimeout(noticeTimer.current);
        setNotice({ id: Date.now(), message, tone, action });
        noticeTimer.current = setTimeout(() => setNotice(null), duration);
    }, []);

    useEffect(() => () => clearTimeout(noticeTimer.current), []);

    // ---- Session ---------------------------------------------------------------------------
    useEffect(() => {
        try {
            const storedUser = sessionStorage.getItem('user');
            const storedToken = sessionStorage.getItem('token');
            if (storedUser) setUser(JSON.parse(storedUser));
            if (storedToken) setToken(storedToken);
        } catch (err) {
            console.error('Could not read the saved session:', err);
        }
    }, []);

    // ---- Unsaved-changes tracking ----------------------------------------------------------
    const signature = useMemo(
        () => [deckName, ...mainDeck.map(getCardId), '|', ...extraDeck.map(getCardId), '|', ...sideDeck.map(getCardId)].join(','),
        [deckName, mainDeck, extraDeck, sideDeck]
    );
    const [savedSignature, setSavedSignature] = useState(signature);
    const hasCards = mainDeck.length + extraDeck.length + sideDeck.length > 0;
    const isDirty = hasCards && signature !== savedSignature;

    useEffect(() => {
        if (!isDirty) return undefined;
        const warn = (event) => {
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [isDirty]);

    // ---- Inspector -------------------------------------------------------------------------
    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key === 'Escape') setPinnedCard(null);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    /** Hover / focus preview. Ignored while a card is pinned. */
    const handlePreviewCard = useCallback((card) => {
        if (!pinnedCard) setInspectedCard(card);
    }, [pinnedCard]);

    const handlePinCard = useCallback((card) => {
        if (!card) return;
        if (pinnedCard && getCardId(pinnedCard) === getCardId(card)) {
            setPinnedCard(null);
        } else {
            setPinnedCard(card);
            setInspectedCard(card);
        }
    }, [pinnedCard]);

    // ---- Adding and removing ---------------------------------------------------------------
    const handleAddCard = useCallback((card, isSideDeck = false) => {
        const check = canAddCard({ card, isSideDeck, main: mainDeck, extra: extraDeck, side: sideDeck });
        if (!check.ok) {
            showNotice(check.reason, { tone: 'warning' });
            return false;
        }
        dispatch(addCardToDeck({
            card: { ...toDeckCard(card), instanceId: newInstanceId(getCardId(card)) },
            isSideDeck,
        }));
        return true;
    }, [dispatch, mainDeck, extraDeck, sideDeck, showNotice]);

    const handleDeleteCard = useCallback((cardId, instanceId) => {
        const all = [
            ...mainDeck.map((c) => ({ c, section: 'main' })),
            ...extraDeck.map((c) => ({ c, section: 'extra' })),
            ...sideDeck.map((c) => ({ c, section: 'side' })),
        ];
        const target = instanceId
            ? all.find(({ c }) => c.instanceId === instanceId)
            : [...all].reverse().find(({ c }) => getCardId(c) === String(cardId));
        if (!target) return;

        dispatch(removeCardFromDeck(target.c.instanceId ?? cardId));
        showNotice(`Removed ${getCardName(target.c)}.`, {
            action: {
                label: 'Undo',
                onClick: () => dispatch(addCardToDeck({ card: target.c, isSideDeck: target.section === 'side' })),
            },
        });
    }, [dispatch, mainDeck, extraDeck, sideDeck, showNotice]);

    const handleClearDeck = useCallback(() => {
        if (!hasCards && !deckName) return;
        const snapshot = { main: mainDeck, extra: extraDeck, side: sideDeck, name: deckName };
        dispatch(clearDeck());
        setPinnedCard(null);
        setInspectedCard(null);
        savedDeckId.current = null;
        showNotice('Deck cleared.', {
            duration: 10000,
            action: { label: 'Undo', onClick: () => dispatch(importYdkDeck(snapshot)) },
        });
    }, [dispatch, hasCards, deckName, mainDeck, extraDeck, sideDeck, showNotice]);

    // ---- Import / export -------------------------------------------------------------------
    const handleImportYDK = useCallback((event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        const reader = new FileReader();

        reader.onload = async (e) => {
            const { main, extra, side } = parseYdk(e.target.result);
            const uniqueIds = [...new Set([...main, ...extra, ...side])];

            if (uniqueIds.length === 0) {
                showNotice('No card IDs were found in that .ydk file.', { tone: 'error' });
                setIsImporting(false);
                return;
            }

            try {
                const byId = await fetchCardsByIds(uniqueIds);
                const toCards = (ids) =>
                    ids.map((id, index) => ({
                        ...(byId[id] || { id, name: `Card #${id}` }),
                        instanceId: `${id}-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
                    }));

                const snapshot = { main: mainDeck, extra: extraDeck, side: sideDeck, name: deckName };
                dispatch(importYdkDeck({
                    main: toCards(main),
                    extra: toCards(extra),
                    side: toCards(side),
                    name: file.name.replace(/\.ydk$/i, '').replace(/_/g, ' ').toUpperCase(),
                }));
                savedDeckId.current = null;

                const missing = uniqueIds.filter((id) => !byId[id]).length;
                showNotice(
                    `Imported ${main.length} main, ${extra.length} extra, ${side.length} side.` +
                        (missing ? ` ${missing} card(s) could not be looked up.` : ''),
                    {
                        tone: missing ? 'warning' : 'info',
                        duration: 10000,
                        action: hasCards ? { label: 'Undo', onClick: () => dispatch(importYdkDeck(snapshot)) } : null,
                    }
                );
            } catch (err) {
                console.error('Failed to hydrate YDK cards:', err);
                showNotice('Could not fetch card details for that file. Try again in a moment.', { tone: 'error' });
            } finally {
                setIsImporting(false);
            }
        };

        reader.readAsText(file);
        event.target.value = null; // lets the same file be chosen again
    }, [dispatch, hasCards, mainDeck, extraDeck, sideDeck, deckName, showNotice]);

    const handleExportYDK = useCallback(() => {
        if (!hasCards) {
            showNotice('Add some cards before exporting.', { tone: 'warning' });
            return;
        }
        const content = buildYdk({
            main: mainDeck.map(getCardId),
            extra: extraDeck.map(getCardId),
            side: sideDeck.map(getCardId),
        });

        const url = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `${(deckName || 'custom_deck').replace(/\s+/g, '_')}.ydk`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [hasCards, mainDeck, extraDeck, sideDeck, deckName, showNotice]);

    // ---- Save ------------------------------------------------------------------------------
    const handleSave = useCallback(async () => {
        if (!user?.id) {
            showNotice('Log in to save your deck.', { tone: 'warning', action: { label: 'Log in', href: '/login' } });
            return;
        }
        if (!hasCards) {
            showNotice('Add some cards before saving.', { tone: 'warning' });
            return;
        }
        if (isSaving) return;

        // First save creates the deck (POST). Later saves of the same deck update it (PUT) instead of duplicating it.
        const isUpdate = Boolean(savedDeckId.current);
        const id = savedDeckId.current || newDeckId();
        const payload = {
            id,
            title: deckName || 'NEW_DECKLIST',
            userId: String(user.id),
            userName: user.userName || 'Duelist',
            mainDeck: mainDeck.map(getCardId),
            extraDeck: extraDeck.map(getCardId),
            sideDeck: sideDeck.map(getCardId),
        };

        setIsSaving(true);
        try {
            const response = await fetch(isUpdate ? `${API_URLS.DECK}/${id}` : API_URLS.DECK, {
                method: isUpdate ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error(`Server answered ${response.status}`);

            savedDeckId.current = id;
            setSavedSignature(signature);
            showNotice(isUpdate ? 'Deck updated.' : 'Deck saved to your account.');
        } catch (err) {
            console.error('SAVE_ERROR:', err);
            showNotice('Your deck could not be saved. Check your connection and try again.', { tone: 'error' });
        } finally {
            setIsSaving(false);
        }
    }, [user, token, hasCards, isSaving, deckName, mainDeck, extraDeck, sideDeck, signature, showNotice]);

    const handleRenameDeck = useCallback((name) => dispatch(updateDeckName(name)), [dispatch]);

    return {
        mainDeck, extraDeck, sideDeck, deckName, dispatch,
        showAiModal, setShowAiModal,
        isImporting, isSaving, isDirty, hasSavedDeck: Boolean(savedDeckId.current) && !isDirty,
        activeCard: pinnedCard || inspectedCard, pinnedCard, setPinnedCard, handlePreviewCard, handlePinCard,
        fileInputRef, user,
        notice, dismissNotice,
        handleAddCard, handleDeleteCard, handleClearDeck,
        handleImportYDK, handleExportYDK, handleSave, handleRenameDeck,
    };
}
