export const whiteForestCenturIonMain = {
    title: "White Forest / Centur-Ion: The Blazar-Dragoon Line",
    steps: [
        { id: 1, instruction: "Normal Summon Astellar.", cardId: "25592142", zone: "MMZ_1", aiCommentary: "Standard opener. Testing the waters for hand traps." },
        
        { id: 2, instruction: "Astellar Eff: Send Tales to GY. SS Silvy from Deck.", cardId: "98385955", zone: "MMZ_2", removesZones: ["GY"], aiCommentary: "Tales hits the GY as cost to bring out our second tuner." },
        
        { id: 3, instruction: "CL1 Silvy add Aphes, CL2 Tales sets itself.", cardId: "99289828", zone: "STZ_1", aiCommentary: "Chain blocking ensures the search for Aphes resolves." },
        
        { id: 4, instruction: "Synchro Summon Rciela.", cardId: "77313225", zone: "EMZ_L", removesZones: ["MMZ_1", "MMZ_2"], aiCommentary: "Astellar and Silvy move to GY as Synchro Material." },
        
        { id: 5, instruction: "Rciela Eff: Send Aphes to GY, add Elzette.", cardId: "61980241", zone: "HAND", aiCommentary: "Trading the Azamina spell for the Elzette extender." },
        { 
            id: 6, 
            instruction: "Aphes sets itself. Astellar SS from GY.", 
            cardId: "25592142", // Astellar
            zone: "MMZ_1", 
            extraSummons: [
                { cardId: "39491690", zone: "STZ_3" } // Aphes (using Elzette's ID as placeholder for Aphes)
            ],
            removesZones: ["STZ_1"], // Clears whatever was in STZ_1 before placing Aphes
            aiCommentary: "By chain-linking their graveyard effects, we resolve both simultaneously." 
        },
        { id: 7, instruction: "Activate Tales: Add Rucia.", cardId: "24779554", zone: "HAND", removesZones: ["STZ_1"], aiCommentary: "Tales moves to GY to search our Level 4 extender." },
        
        { id: 8, instruction: "Synchro Summon Diabell using Rciela and Astellar.", cardId: "14307929", zone: "MMZ_3", removesZones: ["EMZ_L", "MMZ_1"], aiCommentary: "The Queen arrives. We clear the EMZ to make room for future plays." },
        
        { id: 9, instruction: "Diabell Eff: Add Tales back to hand.", cardId: "99289828", zone: "HAND", aiCommentary: "Recycling resources for the Elzette cost." },
        
        { id: 10, instruction: "Elzette Eff: Send Tales to SS itself. Search Astellar.", cardId: "61980241", zone: "MMZ_1", aiCommentary: "Elzette occupies MZ1. We grab Astellar for Centur-Ion discard fodder." },
        
        { id: 11, instruction: "SS Rucia from hand.", cardId: "24779554", zone: "MMZ_2", aiCommentary: "Rucia joins the field at MZ2." },
        
        { id: 12, instruction: "Synchro Summon Auxila using Diabell and Rucia.", cardId: "71858682", zone: "EMZ_R", removesZones: ["MMZ_3", "MMZ_1"], aiCommentary: "Auxila lands in the Right EMZ. Diabell and Rucia move to GY." },
        
        { id: 13, instruction: "Auxila Eff: Add Stand Up Centur-Ion!", cardId: "41371602", zone: "HAND", aiCommentary: "Searching the Field Spell bridge." },
        
        { id: 14, instruction: "Activate Stand Up Centur-Ion!", cardId: "41371602", zone: "FSZ", aiCommentary: "The engine is now fully online." },
        
        { id: 15, instruction: "Stand Up: Discard Astellar, place Trudea in S/T.", cardId: "42493140", zone: "STZ_5", aiCommentary: "Setting up Trudea in the 5th S/T zone." },
        
        { id: 16, instruction: "Trudea Eff: SS itself from S/T.", cardId: "42493140", zone: "MMZ_2", removesZones: ["STZ_5"], aiCommentary: "Trudea jumps to MZ2." },
        
        { 
            id: 17, 
            instruction: "Trudea Eff: Set itself and Primera.", 
            cardId: "15005145", 
            zone: "STZ_4", 
            extraSummons: [
                { cardId: "42493140", zone: "STZ_5" } // Aphes (using Elzette's ID as placeholder for Aphes)
            ],
            removesZones: ["MMZ_2"], 
            aiCommentary: "Trudea returns to S/T (Zone 5 implicit), Primera sets in S/T Zone 4." 
        },
        
        { id: 18, instruction: "Primera Eff: SS itself from S/T.", cardId: "15005145", zone: "MMZ_4", removesZones: ["STZ_4"], aiCommentary: "Primera arrives at MZ4." },
        
        { id: 19, instruction: "Primera Eff: Search Wake Up!", cardId: "92907248", zone: "HAND", aiCommentary: "Adding the token generator." },
        
        { id: 20, instruction: "Synchro Muddy Mudragon using Primera and Elzette.", cardId: "84040113", zone: "MMZ_4", removesZones: ["MMZ_4", "MMZ_1"], aiCommentary: "Primera and Elzette used. Mudragon lands at MZ4." },
        
        { id: 21, instruction: "Wake Up: Summon Level 8 Token.", cardId: "92907248", zone: "MMZ_5", aiCommentary: "Token takes up MZ5." },
        
        { id: 22, instruction: "Banish Wake Up: Send Phalanx to GY.", cardId: "40155014", zone: "GY", aiCommentary: "Wake Up moves to Banish, Phalanx hits the GY stack." },
        
        { id: 23, instruction: "Muddy Mudragon Eff: Fusion Summon Dragoon.", cardId: "37818794", zone: "EMZ_L", removesZones: ["MMZ_4"], aiCommentary: "Using Mudragon to cheat out Dragoon in the Left EMZ." },
        
        { id: 24, instruction: "Banish Phalanx: SS Auxila from GY.", cardId: "71858682", zone: "MMZ_3", removesZones: ["EMZ_R", "GY"], aiCommentary: "Auxila moves from EMZ to MZ3. Phalanx is banished." },
        
        { id: 25, instruction: "Rucia Eff: Return Rciela to Extra Deck, SS Rucia.", cardId: "24779554", zone: "MMZ_2", aiCommentary: "Rucia recurs itself from GY to MZ2." },
        
        { id: 26, instruction: "Synchro Crimson Dragon using Rucia and Token.", cardId: "63436931", zone: "MMZ_2", removesZones: ["MMZ_2", "MMZ_5"], aiCommentary: "Rucia and the Token move to GY. Crimson Dragon lands at MZ2." },
        
        { id: 27, instruction: "Crimson Dragon Eff: Search Synchro Rumble.", cardId: "88901994", zone: "HAND", aiCommentary: "Follow-up resource management." },
        
        { id: 28, instruction: "Crimson Dragon Eff: Cheating out Cosmic Blazar.", cardId: "21123811", zone: "MMZ_2", removesZones: ["MMZ_2"], aiCommentary: "Crimson tags out for our ultimate Level 12 boss at MZ2." },
        
        { id: 29, instruction: "Auxila End Phase Eff: Set Primera in S/T.", cardId: "15005145", zone: "STZ_1", aiCommentary: "Final setup: Primera returns to backrow for next turn's recursion." }
    ]
};