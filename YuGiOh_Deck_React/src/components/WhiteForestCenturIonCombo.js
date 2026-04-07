export const whiteForestCenturIonMain = {
    title: "White Forest / Centur-Ion: The Blazar-Dragoon Line",
    handRequired: ["Astellar of the White Forest", "Tales of the White Forest"],
    steps: [
        { id: 1, instruction: "Normal Summon Astellar.", cardId: "25592142", zone: "MMZ_2", aiCommentary: "Our primary starter. Testing for hand traps before committing." },
        
        { id: 2, instruction: "Astellar Eff: Send 'Tales' to GY. SS Silvy from Deck.", cardId: "98385955", zone: "MMZ_3", aiCommentary: "Using Tales as cost triggers its recursion later this turn." },
        
        { id: 3, instruction: "CL1 Silvy (Add Aphes), CL2 Tales (Set itself).", cardId: "99289828", zone: "STZ_1", aiCommentary: "Chain blocking with Tales ensures Silvy's search resolves." },
        
        { id: 4, instruction: "Synchro Summon Rciela, Sinister Soul.", cardId: "77313225", zone: "EMZ_1", removesZones: ["MMZ_2", "MMZ_3"], aiCommentary: "Level 6 Tuner. This bridge allows us to access Elzette." },
        
        { id: 5, instruction: "Rciela Eff: Send Aphes to GY. Add Elzette to hand.", cardId: "61980241", zone: "HAND", aiCommentary: "Trading the Azamina spell for our key extender." },
        
        { id: 6, instruction: "CL1 Aphes (Set itself), CL2 Astellar (SS from GY).", cardId: "25592142", zone: "MMZ_2", aiCommentary: "Astellar returns to the field for more Synchro material." },
        
        { id: 7, instruction: "Activate Tales: Add Rucia to hand.", cardId: "24779554", zone: "HAND", aiCommentary: "Tales provides a free Level 4 body since we have White Forest monsters." },
        
        { id: 8, instruction: "Synchro Summon Diabell, Queen of the White Forest.", cardId: "14307929", zone: "MMZ_3", removesZones: ["EMZ_1", "MMZ_2"], aiCommentary: "Level 8 Boss. She will help recycle Tales for Elzette's cost." },
        
        { id: 9, instruction: "Diabell Eff: Add Tales back to hand.", cardId: "99289828", zone: "HAND", aiCommentary: "Keeping the hand size healthy for our next play." },
        
        { id: 10, instruction: "Elzette Eff: Send Tales to SS itself. Search Astellar.", cardId: "61980241", zone: "MMZ_4", aiCommentary: "Elzette lands on MMZ_4. We search Astellar specifically as discard fodder for Centur-Ion." },
        
        { id: 11, instruction: "SS Rucia from hand.", cardId: "24779554", zone: "MMZ_1", aiCommentary: "A free Level 4 Tuner to pair with our Level 8 Diabell." },
        
        { id: 12, instruction: "Synchro Summon Centur-Ion Auxila.", cardId: "71858682", zone: "EMZ_1", removesZones: ["MMZ_3", "MMZ_1"], aiCommentary: "Using Diabell and Rucia. This leaves Elzette on MMZ_4 for later." },
        
        { id: 13, instruction: "Auxila Eff: Add Stand Up Centur-Ion!", cardId: "41371602", zone: "HAND", aiCommentary: "Transitioning fully into the Centur-Ion engine." },
        
        { id: 14, instruction: "Activate Stand Up Centur-Ion!", cardId: "41371602", zone: "FSZ", aiCommentary: "The field spell is our engine's heartbeat." },
        
        { id: 15, instruction: "Stand Up Eff: Discard Astellar, place Trudea in S/T.", cardId: "42493140", zone: "STZ_2", aiCommentary: "Discarding the Astellar we searched earlier." },
        
        { id: 16, instruction: "Trudea Eff: SS itself from S/T zone.", cardId: "42493140", zone: "MMZ_5", removesZones: ["STZ_2"], aiCommentary: "Trudea comes out to set up the next line." },
        
        { id: 17, instruction: "Trudea Eff: Set itself and Primera from Deck.", cardId: "15005145", zone: "STZ_3", removesZones: ["MMZ_5"], aiCommentary: "Trudea moves back to S/T to summon Primera." },
        
        { id: 18, instruction: "Primera Eff: SS itself from S/T zone.", cardId: "15005145", zone: "MMZ_2", removesZones: ["STZ_3"], aiCommentary: "Our Level 4 Tuner arrives on MMZ_2." },
        
        { id: 19, instruction: "Primera Eff: Search Wake Up Centur-Ion!", cardId: "92907248", zone: "HAND", aiCommentary: "This spell will give us the high-level non-tuner token." },
        
        { id: 20, instruction: "Synchro Summon Muddy Mudragon.", cardId: "84040113", zone: "MMZ_3", removesZones: ["MMZ_2", "MMZ_4"], aiCommentary: "Using Primera (Tuner) and Elzette (Non-Tuner) who was waiting on MMZ_4." },
        
        { id: 21, instruction: "Wake Up Eff: Summon Level 8 Token.", cardId: "92907248", zone: "MMZ_4", aiCommentary: "This token is the material for our Crimson Dragon play." },
        
        { id: 22, instruction: "Banish Wake Up: Send Phalanx to GY.", cardId: "40155014", zone: "GY", aiCommentary: "Setting up recursion for our Level 12 Synchro." },
        
        { id: 23, instruction: "Muddy Mudragon Eff: Fusion Summon Red-Eyes Dark Dragoon.", cardId: "37818794", zone: "MMZ_3", removesZones: ["MMZ_3"], aiCommentary: "Muddy Mudragon substitutes for the Dragon material. Dragoon arrives!" },
        
        { id: 24, instruction: "Banish Phalanx: SS Auxila from GY.", cardId: "71858682", zone: "MMZ_5", removesZones: ["EMZ_1"], aiCommentary: "Moving Auxila from EMZ to MMZ_5 to clear space for Crimson Dragon." },
        
        { id: 25, instruction: "Synchro Summon Crimson Dragon.", cardId: "63436931", zone: "MMZ_1", removesZones: ["MMZ_5", "MMZ_4"], aiCommentary: "Using Auxila and the Level 8 Token for the Level 12 climb." },
        
        { id: 26, instruction: "Crimson Dragon Eff: Add Synchro Rumble.", cardId: "88901994", zone: "HAND", aiCommentary: "Resource management for follow-up turns." },
        
        { id: 27, instruction: "Crimson Dragon Eff: Target Auxila (GY) / Cheating out Blazar.", cardId: "21123811", zone: "MMZ_1", removesZones: ["MMZ_1"], aiCommentary: "Crimson Dragon tags out to bring our ultimate boss, Cosmic Blazar Dragon." },
        
        { id: 28, instruction: "Go to End Phase.", cardId: "NONE", zone: "NONE", aiCommentary: "Board Check: Blazar (MMZ_1), Dragoon (MMZ_3)." },
        
        { id: 29, instruction: "Auxila End Phase Eff: Set Trudea in S/T.", cardId: "42493140", zone: "STZ_2", aiCommentary: "Setting up Trudea for the opponent's turn. Ultimate efficiency." }
    ]
};