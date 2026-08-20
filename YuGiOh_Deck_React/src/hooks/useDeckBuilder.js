import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
    addCardToDeck, 
    removeCardFromDeck, 
    updateDeckName, 
    importYdkDeck,
    clearDeck 
} from "@/store/deckSlice";
import { deckList } from "@/app/deckbuilder/CardApi";

export function useDeckBuilder() {
    const mainDeck = useSelector((state) => state.deck.mainDeck || []);
    const extraDeck = useSelector((state) => state.deck.extraDeck || []);
    const deckName = useSelector((state) => state.deck.deckName || '');
    const dispatch = useDispatch();

    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showAiModal, setShowAiModal] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    
    // Inspector States
    const [inspectedCard, setInspectedCard] = useState(null);
    const [pinnedCard, setPinnedCard] = useState(null);

    const fileInputRef = useRef(null);

    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedUser = sessionStorage.getItem("user");
            const storedToken = sessionStorage.getItem("token");
            if (storedUser) {
                try { setUser(JSON.parse(storedUser)); } catch (err) { console.error(err); }
            }
            if (storedToken) setToken(storedToken);
        }
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setPinnedCard(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        deckList.mainDeck = mainDeck;
        deckList.extraDeck = extraDeck;
    }, [mainDeck, extraDeck]);

    const handlePinCard = (card) => {
        if (!card) return;
        const cardId = card.id || card.Id;
        const pinnedId = pinnedCard?.id || pinnedCard?.Id;

        if (pinnedId === cardId) {
            setPinnedCard(null);
        } else {
            setPinnedCard(card);
            setInspectedCard(card);
        }
    };

    const handleImportYDK = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsImporting(true);
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            const content = e.target.result;
            const lines = content.split(/\r?\n/);
            const mainIds = [];
            const extraIds = [];
            let currentSection = 'main';

            lines.forEach((line) => {
                const trimmed = line.trim();
                if (trimmed === '#main') currentSection = 'main';
                else if (trimmed === '#extra') currentSection = 'extra';
                else if (trimmed === '!side') currentSection = 'side';
                else if (trimmed.startsWith('#') || !trimmed || currentSection === 'side') return;
                else if (/^\d+$/.test(trimmed)) {
                    if (currentSection === 'main') mainIds.push(trimmed);
                    else if (currentSection === 'extra') extraIds.push(trimmed);
                }
            });

            const allUniqueIds = [...new Set([...mainIds, ...extraIds])];
            if (allUniqueIds.length === 0) {
                alert('No valid card IDs found in YDK file.');
                setIsImporting(false);
                return;
            }

            try {
                const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${allUniqueIds.join(',')}`);
                const data = await res.json();
                
                const cardMap = {};
                if (data?.data) {
                    data.data.forEach((card) => {
                        const extraFrames = ['fusion', 'synchro', 'xyz', 'link', 'fusion_pendulum', 'synchro_pendulum', 'xyz_pendulum'];
                        const isExtraDeck = extraFrames.includes(card.frameType?.toLowerCase());
                        
                        cardMap[card.id.toString()] = {
                            ...card,
                            isExtraDeck,
                            image: `https://ygocardstore-images-gpctdecsa6a6ctfc.z01.azurefd.net/card-images/${card.id}.jpg`,
                            fallbackImage: card.card_images?.[0]?.image_url_small || `https://images.ygoprodeck.com/images/cards_small/${card.id}.jpg`
                        };
                    });
                }

                const mapCards = (ids) => ids.map((id, index) => ({
                    ...(cardMap[id] || { id, name: `Card #${id}` }),
                    instanceId: `${id}-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`
                }));

                dispatch(importYdkDeck({ 
                    main: mapCards(mainIds), 
                    extra: mapCards(extraIds), 
                    name: file.name.replace('.ydk', '').replace(/_/g, ' ').toUpperCase() 
                }));
            } catch (err) {
                console.error("Failed to hydrate YDK cards:", err);
                alert("Imported YDK file, but could not fetch full card details from server.");
            } finally {
                setIsImporting(false);
            }
        };

        reader.readAsText(file);
        if (event.target) event.target.value = null;
    };

    const handleExportYDK = () => {
        if (mainDeck.length === 0 && extraDeck.length === 0) {
            alert("DECK_IS_EMPTY: Add cards before exporting.");
            return;
        }

        let ydkContent = "#created by ErreGeTe YGO\n#main\n";
        mainDeck.forEach(card => { if (card.id || card.Id) ydkContent += `${card.id || card.Id}\n`; });
        ydkContent += "#extra\n";
        extraDeck.forEach(card => { if (card.id || card.Id) ydkContent += `${card.id || card.Id}\n`; });
        ydkContent += "!side\n";

        const blob = new Blob([ydkContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${(deckName || 'custom_deck').replace(/\s+/g, '_')}.ydk`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleClearDeck = () => {
        if (mainDeck.length === 0 && extraDeck.length === 0 && !deckName) return;
        if (window.confirm("SYSTEM_WARNING: Are you sure you want to clear all cards and the deck name?")) {
            dispatch(clearDeck());
        }
    };

    const handleAddCard = (card) => {
        if (!card) return;
        const cardId = String(card.id || card.Id);
        const existingCopies = [...mainDeck, ...extraDeck].filter(c => String(c.id || c.Id) === cardId).length;

        if (existingCopies >= 3) {
            alert(`DECK_RULE_VIOLATION: Maximum 3 copies of "${card.name || 'this card'}" allowed.`);
            return;
        }

        dispatch(addCardToDeck({
            ...card,
            instanceId: `${cardId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
        }));
    };

    const handleDeleteCard = (cardId, instanceId) => {
        if (instanceId) {
            dispatch(removeCardFromDeck(instanceId));
        } else if (cardId) {
            const cardIdStr = String(cardId);
            const targetCard = [...mainDeck, ...extraDeck].slice().reverse().find(c => String(c.id || c.Id) === cardIdStr);
            if (targetCard?.instanceId) dispatch(removeCardFromDeck(targetCard.instanceId));
        }
    };

    const handleSave = async () => {
        if (!user?.id) return;
        const payload = {
            id: String(Math.floor(Math.random() * 1000000) + 1),
            title: deckName || "NEW_DECKLIST",
            userId: String(user.id),
            userName: user.userName || "Duelist",
            mainDeck: mainDeck.map(card => String(card.id || card.Id)),
            extraDeck: extraDeck.map(card => String(card.id || card.Id)),
            sideDeck: []
        };

        try {
            const response = await fetch("https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api/mongodb/DeckListMongoDb", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (response.ok) setShowSaveModal(true);
        } catch (err) {
            console.error("SAVE_ERROR:", err);
        }
    };

    return {
        mainDeck, extraDeck, deckName, dispatch,
        showSaveModal, setShowSaveModal, showAiModal, setShowAiModal,
        isImporting, inspectedCard, setInspectedCard, pinnedCard, setPinnedCard,
        fileInputRef, user, handlePinCard, handleImportYDK, handleExportYDK,
        handleClearDeck, handleAddCard, handleDeleteCard, handleSave
    };
}