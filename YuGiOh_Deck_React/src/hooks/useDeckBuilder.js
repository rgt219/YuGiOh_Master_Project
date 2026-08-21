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
    const mainDeck = useSelector((state) => state.deck.mainDeck || []); //[cite: 14]
    const extraDeck = useSelector((state) => state.deck.extraDeck || []); //[cite: 14]
    const sideDeck = useSelector((state) => state.deck.sideDeck || []); // 1. Added sideDeck state
    const deckName = useSelector((state) => state.deck.deckName || ''); //[cite: 14]
    const dispatch = useDispatch(); //[cite: 14]

    const [showSaveModal, setShowSaveModal] = useState(false); //[cite: 14]
    const [showAiModal, setShowAiModal] = useState(false); //[cite: 14]
    const [isImporting, setIsImporting] = useState(false); //[cite: 14]
    
    // Inspector States
    const [inspectedCard, setInspectedCard] = useState(null); //[cite: 14]
    const [pinnedCard, setPinnedCard] = useState(null); //[cite: 14]

    const fileInputRef = useRef(null); //[cite: 14]

    const [user, setUser] = useState(null); //[cite: 14]
    const [token, setToken] = useState(null); //[cite: 14]

    useEffect(() => {
        if (typeof window !== 'undefined') { //[cite: 14]
            const storedUser = sessionStorage.getItem("user"); //[cite: 14]
            const storedToken = sessionStorage.getItem("token"); //[cite: 14]
            if (storedUser) {
                try { setUser(JSON.parse(storedUser)); } catch (err) { console.error(err); } //[cite: 14]
            }
            if (storedToken) setToken(storedToken); //[cite: 14]
        }
    }, []); //[cite: 14]

    useEffect(() => {
        const handleKeyDown = (e) => { //[cite: 14]
            if (e.key === 'Escape') setPinnedCard(null); //[cite: 14]
        };
        window.addEventListener('keydown', handleKeyDown); //[cite: 14]
        return () => window.removeEventListener('keydown', handleKeyDown); //[cite: 14]
    }, []); //[cite: 14]

    useEffect(() => {
        deckList.mainDeck = mainDeck; //[cite: 14]
        deckList.extraDeck = extraDeck; //[cite: 14]
        deckList.sideDeck = sideDeck; // 2. Keep side deck synced
    }, [mainDeck, extraDeck, sideDeck]); //[cite: 14]

    const handlePinCard = (card) => {
        if (!card) return; //[cite: 14]
        const cardId = card.id || card.Id; //[cite: 14]
        const pinnedId = pinnedCard?.id || pinnedCard?.Id; //[cite: 14]

        if (pinnedId === cardId) {
            setPinnedCard(null); //[cite: 14]
        } else {
            setPinnedCard(card); //[cite: 14]
            setInspectedCard(card); //[cite: 14]
        }
    };

    const handleImportYDK = async (event) => {
        const file = event.target.files[0]; //[cite: 14]
        if (!file) return; //[cite: 14]

        setIsImporting(true); //[cite: 14]
        const reader = new FileReader(); //[cite: 14]
        
        reader.onload = async (e) => {
            const content = e.target.result; //[cite: 14]
            const lines = content.split(/\r?\n/); //[cite: 14]
            const mainIds = []; //[cite: 14]
            const extraIds = []; //[cite: 14]
            const sideIds = []; // 3. Array for Side Deck YDK imports
            let currentSection = 'main'; //[cite: 14]

            lines.forEach((line) => {
                const trimmed = line.trim(); //[cite: 14]
                if (trimmed === '#main') currentSection = 'main'; //[cite: 14]
                else if (trimmed === '#extra') currentSection = 'extra'; //[cite: 14]
                else if (trimmed === '!side') currentSection = 'side'; //[cite: 14]
                else if (trimmed.startsWith('#') || trimmed.startsWith('!') || !trimmed) return; // 4. Don't skip side section anymore
                else if (/^\d+$/.test(trimmed)) { //[cite: 14]
                    if (currentSection === 'main') mainIds.push(trimmed); //[cite: 14]
                    else if (currentSection === 'extra') extraIds.push(trimmed); //[cite: 14]
                    else if (currentSection === 'side') sideIds.push(trimmed); // 5. Push to sideIds
                }
            });

            const allUniqueIds = [...new Set([...mainIds, ...extraIds, ...sideIds])]; // 6. Fetch side IDs too
            if (allUniqueIds.length === 0) { //[cite: 14]
                alert('No valid card IDs found in YDK file.'); //[cite: 14]
                setIsImporting(false); //[cite: 14]
                return; //[cite: 14]
            }

            try {
                const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${allUniqueIds.join(',')}`); //[cite: 14]
                const data = await res.json(); //[cite: 14]
                
                const cardMap = {}; //[cite: 14]
                if (data?.data) { //[cite: 14]
                    data.data.forEach((card) => {
                        const extraFrames = ['fusion', 'synchro', 'xyz', 'link', 'fusion_pendulum', 'synchro_pendulum', 'xyz_pendulum']; //[cite: 14]
                        const isExtraDeck = extraFrames.includes(card.frameType?.toLowerCase()); //[cite: 14]
                        
                        cardMap[card.id.toString()] = {
                            ...card, //[cite: 14]
                            isExtraDeck, //[cite: 14]
                            image: `https://ygocardstore-images-gpctdecsa6a6ctfc.z01.azurefd.net/card-images/${card.id}.jpg`, //[cite: 14]
                            fallbackImage: card.card_images?.[0]?.image_url_small || `https://images.ygoprodeck.com/images/cards_small/${card.id}.jpg` //[cite: 14]
                        };
                    });
                }

                const mapCards = (ids) => ids.map((id, index) => ({
                    ...(cardMap[id] || { id, name: `Card #${id}` }), //[cite: 14]
                    instanceId: `${id}-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}` //[cite: 14]
                }));

                dispatch(importYdkDeck({ 
                    main: mapCards(mainIds), //[cite: 14]
                    extra: mapCards(extraIds), //[cite: 14]
                    side: mapCards(sideIds), // 7. Map side deck
                    name: file.name.replace('.ydk', '').replace(/_/g, ' ').toUpperCase() //[cite: 14]
                }));
            } catch (err) {
                console.error("Failed to hydrate YDK cards:", err); //[cite: 14]
                alert("Imported YDK file, but could not fetch full card details from server."); //[cite: 14]
            } finally {
                setIsImporting(false); //[cite: 14]
            }
        };

        reader.readAsText(file); //[cite: 14]
        if (event.target) event.target.value = null; //[cite: 14]
    };

    const handleExportYDK = () => {
        if (mainDeck.length === 0 && extraDeck.length === 0 && sideDeck.length === 0) { // 8. Include side deck in check
            alert("DECK_IS_EMPTY: Add cards before exporting."); //[cite: 14]
            return; //[cite: 14]
        }

        let ydkContent = "#created by ErreGeTe YGO\n#main\n"; //[cite: 14]
        mainDeck.forEach(card => { if (card.id || card.Id) ydkContent += `${card.id || card.Id}\n`; }); //[cite: 14]
        ydkContent += "#extra\n"; //[cite: 14]
        extraDeck.forEach(card => { if (card.id || card.Id) ydkContent += `${card.id || card.Id}\n`; }); //[cite: 14]
        ydkContent += "!side\n"; //[cite: 14]
        sideDeck.forEach(card => { if (card.id || card.Id) ydkContent += `${card.id || card.Id}\n`; }); // 9. Add side deck to YDK text

        const blob = new Blob([ydkContent], { type: "text/plain" }); //[cite: 14]
        const url = URL.createObjectURL(blob); //[cite: 14]
        const link = document.createElement("a"); //[cite: 14]
        link.href = url; //[cite: 14]
        link.download = `${(deckName || 'custom_deck').replace(/\s+/g, '_')}.ydk`; //[cite: 14]
        document.body.appendChild(link); //[cite: 14]
        link.click(); //[cite: 14]
        document.body.removeChild(link); //[cite: 14]
        URL.revokeObjectURL(url); //[cite: 14]
    };

    const handleClearDeck = () => {
        if (mainDeck.length === 0 && extraDeck.length === 0 && sideDeck.length === 0 && !deckName) return; // 10. Added side deck check
        if (window.confirm("SYSTEM_WARNING: Are you sure you want to clear all cards and the deck name?")) { //[cite: 14]
            dispatch(clearDeck()); //[cite: 14]
        }
    };

    // 11. Add isSideDeck parameter
    const handleAddCard = (card, isSideDeck = false) => { 
        if (!card) return; //[cite: 14]
        const cardId = String(card.id || card.Id); //[cite: 14]
        
        // 12. Check all 3 decks to enforce the 3-copy limit globally
        const existingCopies = [...mainDeck, ...extraDeck, ...sideDeck].filter(c => String(c.id || c.Id) === cardId).length; 

        if (existingCopies >= 3) { //[cite: 14]
            alert(`DECK_RULE_VIOLATION: Maximum 3 copies of "${card.name || 'this card'}" allowed.`); //[cite: 14]
            return; //[cite: 14]
        }

        // 13. Dispatch object correctly formatted for the updated deckSlice
        dispatch(addCardToDeck({
            card: {
                ...card, //[cite: 14]
                instanceId: `${cardId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}` //[cite: 14]
            },
            isSideDeck
        }));
    };

    const handleDeleteCard = (cardId, instanceId) => {
        if (instanceId) { //[cite: 14]
            dispatch(removeCardFromDeck(instanceId)); //[cite: 14]
        } else if (cardId) { //[cite: 14]
            const cardIdStr = String(cardId); //[cite: 14]
            
            // 14. Include sideDeck in the deletion lookup array
            const targetCard = [...mainDeck, ...extraDeck, ...sideDeck].slice().reverse().find(c => String(c.id || c.Id) === cardIdStr);
            if (targetCard?.instanceId) dispatch(removeCardFromDeck(targetCard.instanceId)); //[cite: 14]
        }
    };

    const handleSave = async () => {
        if (!user?.id) return; //[cite: 14]
        const payload = {
            id: String(Math.floor(Math.random() * 1000000) + 1), //[cite: 14]
            title: deckName || "NEW_DECKLIST", //[cite: 14]
            userId: String(user.id), //[cite: 14]
            userName: user.userName || "Duelist", //[cite: 14]
            mainDeck: mainDeck.map(card => String(card.id || card.Id)), //[cite: 14]
            extraDeck: extraDeck.map(card => String(card.id || card.Id)), //[cite: 14]
            sideDeck: sideDeck.map(card => String(card.id || card.Id)) // 15. Export side deck actual cards
        };

        try {
            const response = await fetch("https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api/mongodb/DeckListMongoDb", { //[cite: 14]
                method: 'POST', //[cite: 14]
                headers: { 'Content-Type': 'application/json' }, //[cite: 14]
                body: JSON.stringify(payload), //[cite: 14]
            });
            if (response.ok) setShowSaveModal(true); //[cite: 14]
        } catch (err) {
            console.error("SAVE_ERROR:", err); //[cite: 14]
        }
    };

    return {
        mainDeck, extraDeck, sideDeck, deckName, dispatch, // 16. Return side deck to the component
        showSaveModal, setShowSaveModal, showAiModal, setShowAiModal, //[cite: 14]
        isImporting, inspectedCard, setInspectedCard, pinnedCard, setPinnedCard, //[cite: 14]
        fileInputRef, user, handlePinCard, handleImportYDK, handleExportYDK, //[cite: 14]
        handleClearDeck, handleAddCard, handleDeleteCard, handleSave //[cite: 14]
    };
}