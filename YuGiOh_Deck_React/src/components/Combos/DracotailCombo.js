export const dracotailMainCombo = {
    title: "Dracotail: The Lukias 1.5 Card Line",
    handRequired: ["Dracotail Lukias", "Any 1 Monster"],
    steps: [
        { 
            id: 1, 
            instruction: "Normal Summon Dracotail Lukias.", 
            cardId: "75003700", // Lukias ID
            zone: "MMZ_1", 
            aiCommentary: "Our primary searcher. On summon, she grabs Faimena." 
        },
        { 
            id: 2, 
            instruction: "Lukias Eff: Search Dracotail Faimena.", 
            cardId: "101204051", // Faimena
            zone: "HAND", 
            aiCommentary: "Faimena is our Fusion spell-on-legs." 
        },
        { 
            id: 3, 
            instruction: "Activate Faimena in hand: Fuse into Arthalion.", 
            cardId: "33760966", // Arthalion
            zone: "EMZ_L", 
            extraSummons: [
                { cardId: "75003700", zone: "GY" } // Aphes (using Elzette's ID as placeholder for Aphes)
            ],
            removesZones: ["MMZ_1"], 
            aiCommentary: "Using Lukias and the random monster in hand as material." 
        },
        { 
            id: 4, 
            instruction: "CL1 Arthalion target Faimena (GY), CL2 Lukias (GY).", 
            cardId: "75003700", 
            aiCommentary: "Chain blocking to ensure our recursion resolves." 
        },
        { 
            id: 5, 
            instruction: "Lukias sets Rahu from Deck. Arthalion adds Faimena to hand.", 
            cardId: "32548318", // Rahu (Continuous Trap)
            zone: "STZ_5", 
            extraSummons: [
                { cardId: "101204051", zone: "HAND" }
            ],
            aiCommentary: "Rahu is our secondary fusion method, while Faimena returns for next turn." 
        },
        { 
            id: 6, 
            instruction: "Activate Rahu: Fusion Summon Gulamel.", 
            cardId: "79755671", // Gulamel
            zone: "MMZ_3", 
            extraSummons: [
                { cardId: "32548318", zone: "GY" }
            ],
            removesZones: ["STZ_5"], 
            aiCommentary: "Using Faimena (hand) and Urgula (deck) as material." 
        },
        { 
            id: 7, 
            instruction: "CL1 Faimena, CL2 Urgula (GY Effects).", 
            cardId: "101204003", // Urgula
            zone: "GY", 
            aiCommentary: "Both materials trigger in the GY to set our disruption traps." 
        },
        { 
            id: 8, 
            instruction: "Set Dracotail Horn and Dracotail Flame from Deck.", 
            cardId: "5431722", // Horn
            zone: "STZ_1", 
            extraSummons: [
                { cardId: "69932023", zone: "STZ_2" } // Flame
            ],
            aiCommentary: "Horn provides a bounce + draw, Flame provides a spell negate + draw." 
        },
        { 
            id: 9, 
            instruction: "Urgula Eff (GY): Add Faimena back to hand.", 
            cardId: "101204051", 
            zone: "HAND", 
            aiCommentary: "Infinite resource looping. We end with 4 total disruptions." 
        },
        { 
            id: 10, 
            instruction: "End Board State.", 
            cardId: "NONE", 
            zone: "NONE", 
            aiCommentary: "Field: Arthalion (EMZ), Gulamel (MZ3), Horn (ST1), Flame (ST2). Hand: Faimena." 
        }
    ]
};