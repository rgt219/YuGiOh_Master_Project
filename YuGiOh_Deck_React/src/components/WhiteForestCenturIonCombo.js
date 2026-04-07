export const whiteForestCenturIonMain = {
    title: "White Forest / Centur-Ion: The Blazar-Dragoon Line",
    handRequired: ["Astellar of the White Forest", "Tales of the White Forest"],
    steps: [
        { id: 1, instruction: "Normal Summon Astellar.", cardId: "25592142", zone: "MMZ_2", aiCommentary: "The heart of the engine. We start here to test for infinite impermanence." },
        
        { id: 2, instruction: "Astellar Eff: Send 'Tales' to GY. SS Silvy from Deck.", cardId: "98385955", zone: "MMZ_3", aiCommentary: "By sending a themed Spell/Trap, we trigger the recursion loop immediately." },
        
        { id: 3, instruction: "CL1 Silvy (Add Aphes), CL2 Tales (Set itself).", cardId: "99289828", zone: "STZ_1", aiCommentary: "Chain-blocking with Tales protects your search from Ash Blossom." },
        
        { id: 4, instruction: "Synchro Summon Rciela, Sinister Soul.", cardId: "77313225", zone: "EMZ_1", removesZones: ["MMZ_2", "MMZ_3"], aiCommentary: "Rciela is our primary searcher and a Level 6 Tuner." },
        
        { id: 5, instruction: "Rciela Eff: Send Aphes to GY. Add Elzette to hand.", cardId: "61980241", zone: "HAND", aiCommentary: "Trading the Azamina spell for the Elzette extender." },
        
        { id: 6, instruction: "CL1 Aphes (Set itself), CL2 Astellar (SS from GY).", cardId: "25592142", zone: "MMZ_2", aiCommentary: "The White Forest monsters never stay in the graveyard for long." },
        
        { id: 7, instruction: "Activate Tales: Add Rucia to hand.", cardId: "24779554", zone: "HAND", aiCommentary: "Tales provides the final piece for our Synchro climb." },
        
        { id: 8, instruction: "Synchro Summon Diabell, Queen of the White Forest.", cardId: "14307929", zone: "MMZ_3", removesZones: ["EMZ_1", "MMZ_2"], aiCommentary: "Diabell is the boss of the engine, enabling massive recursion." },
        
        { id: 9, instruction: "Diabell Eff: Add Tales back to hand.", cardId: "99289828", zone: "HAND", aiCommentary: "Refilling the hand for Elzette's cost." },
        
        { id: 10, instruction: "Elzette Eff: Send Tales to SS itself. Search Astellar.", cardId: "61980241", zone: "MMZ_4", aiCommentary: "We search the second Astellar solely for Centur-Ion discard fodder." },
        
        { id: 11, instruction: "SS Rucia from hand.", cardId: "24779554", zone: "MMZ_1", aiCommentary: "Since we control a White Forest monster, she's a free Level 4." },
        
        { id: 12, instruction: "Synchro Summon Centur-Ion Auxila.", cardId: "71858682", zone: "EMZ_1", removesZones: ["MMZ_3", "MMZ_4"], aiCommentary: "The bridge into the Centur-Ion engine begins here." },
        
        { id: 13, instruction: "Auxila Eff: Add Stand Up Centur-Ion!", cardId: "41371602", zone: "HAND", aiCommentary: "Searching the Field Spell that makes the deck run." },
        
        { id: 14, instruction: "Activate Stand Up Centur-Ion!", cardId: "41371602", zone: "FSZ", aiCommentary: "The field is set." },
        
        { id: 15, instruction: "Stand Up Eff: Discard Astellar, place Trudea in S/T.", cardId: "42493140", zone: "STZ_2", aiCommentary: "Trading the useless Astellar in hand for the Trudea starter." },
        
        { id: 16, instruction: "Trudea Eff: SS itself from S/T zone.", cardId: "42493140", zone: "MMZ_5", removesZones: ["STZ_2"], aiCommentary: "Transitioning from backrow to monster." },
        
        { id: 17, instruction: "Trudea Eff: Set itself and Primera from Deck.", cardId: "15005145", zone: "STZ_3", removesZones: ["MMZ_5"], aiCommentary: "The signature Centur-Ion setup move. Trudea moves back to S/T." },
        
        { id: 18, instruction: "Primera Eff: SS itself from S/T zone.", cardId: "15005145", zone: "MMZ_2", removesZones: ["STZ_3"], aiCommentary: "Primera is our tuner for the high-level plays." },
        
        { id: 19, instruction: "Primera Eff: Search Wake Up Centur-Ion!", cardId: "92907248", zone: "HAND", aiCommentary: "Getting the token generator for the Synchro 12 play." },
        
        { id: 20, instruction: "Synchro Summon Muddy Mudragon.", cardId: "84040113", zone: "MMZ_3", removesZones: ["MMZ_2", "MMZ_4"], aiCommentary: "Using Primera and Elzette. Mudragon is our Fusion substitute." },
        
        { id: 21, instruction: "Wake Up Eff: Summon Level 8 Token.", cardId: "92907248", zone: "MMZ_4", aiCommentary: "Providing the non-tuner Level 8 body." },
        
        { id: 22, instruction: "Banish Wake Up: Send Phalanx to GY.", cardId: "40155014", zone: "GY", aiCommentary: "Setting up the revival for Auxila." },
        
        { id: 23, instruction: "Muddy Mudragon Eff: Fusion Summon Red-Eyes Dark Dragoon.", cardId: "37818794", zone: "MMZ_3", removesZones: ["MMZ_3"], aiCommentary: "Muddy Mudragon transforms itself into the ultimate omni-negate." },
        
        { id: 24, instruction: "Banish Phalanx: SS Auxila from GY.", cardId: "71858682", zone: "MMZ_5", removesZones: ["EMZ_1"], aiCommentary: "Bringing back Auxila from the GY to a Main Monster Zone." },
        
        { id: 25, instruction: "Synchro Summon Crimson Dragon.", cardId: "63436931", zone: "MMZ_2", removesZones: ["MMZ_1", "MMZ_4"], aiCommentary: "Using Rucia and the Token for the Level 12 climb." },
        
        { id: 26, instruction: "Crimson Dragon Eff: Add Synchro Rumble.", cardId: "88901994", zone: "HAND", aiCommentary: "Follow-up for next turn if things go south." },
        
        { id: 27, instruction: "Crimson Dragon Eff: Target Auxila, SS Cosmic Blazar Dragon.", cardId: "21123811", zone: "MMZ_1", removesZones: ["MMZ_2"], aiCommentary: "Crimson Dragon leaves to cheat out our Level 12 boss." },
        
        { id: 28, instruction: "Go to End Phase.", cardId: "NONE", zone: "NONE", aiCommentary: "The board is stabilized. We have Dragoon, Blazar, and Auxila ready." },
        
        { id: 29, instruction: "Auxila End Phase Eff: Set Primera in S/T.", cardId: "15005145", zone: "STZ_2", aiCommentary: "Ensuring we have a follow-up SS and search during the opponent's turn." }
    ]
};