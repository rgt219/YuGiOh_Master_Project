export const whiteForestAzaminaCombo = {
    title: "White Forest Azamina: The Dark Dragoon Divergence",
    handRequired: ["Elzette of the White Forest", "Tales of the White Forest"],
    steps: [
        { 
            id: 1, 
            instruction: "Activate Elzette in hand; send Tales of the White Forest to GY to Special Summon Elzette, then search for Silvy of the White Forest.", 
            cardId: "61980241", // Elzette
            zone: "MMZ_1", 
            aiCommentary: "Standard starter play. Sending a themed Spell/Trap maximizes our graveyard value right away." 
        },
        { 
            id: 2, 
            instruction: "Activate Tales of the White Forest effect in GY; set it to the field face-down.", 
            cardId: "101204051", // Tales of the White Forest
            zone: "STZ_1", 
            aiCommentary: "Free recursion resource. This sets up fodder to be sent to the GY later for White Forest costs." 
        },
        { 
            id: 3, 
            instruction: "Normal Summon Silvy of the White Forest from hand.", 
            cardId: "101204003", // Silvy
            zone: "MMZ_2", 
            aiCommentary: "Bringing out our secondary Tuner to establish our Synchro climbing engine." 
        },
        { 
            id: 4, 
            instruction: "Activate effect of Silvy; search Azamina Aphes.", 
            cardId: "101204003", // Silvy
            zone: "HAND", 
            aiCommentary: "Grabbing the crucial bridge piece into the Azamina package." 
        },
        { 
            id: 5, 
            instruction: "Synchro Summon Rciela, Sinister Soul of the White Forest using Silvy and Elzette.", 
            cardId: "75003700", // Rciela
            zone: "EMZ_1", 
            removesZones: ["MMZ_1", "MMZ_2"],
            aiCommentary: "Our Level 6 Synchro centerpiece. This triggers our primary graveyard setup logic." 
        },
        { 
            id: 6, 
            instruction: "Activate effect of Rciela; send Azamina Aphes from hand to the GY, then add Elzette, Azamina of the White Forest to hand.", 
            cardId: "75003700", // Rciela
            zone: "HAND", 
            aiCommentary: "Pitching Aphes fulfills its own graveyard activation requirement while retrieving our next extender." 
        },
        { 
            id: 7, 
            instruction: "Activate Azamina Aphes effect in GY; set it to the field face-down.", 
            cardId: "10045474", // Azamina Aphes
            zone: "STZ_2", 
            aiCommentary: "Aphes revives itself to the field to serve as further activation cost ammunition." 
        },
        { 
            id: 8, 
            instruction: "Activate Elzette, Azamina of the White Forest effect in hand, selecting itself; Special Summon to the field.", 
            cardId: "101204052", // Elzette, Azamina
            zone: "MMZ_1", 
            aiCommentary: "Specials herself out easily without draining your normal summon resources." 
        },
        { 
            id: 9, 
            instruction: "Synchro Summon Diabell, Queen of the White Forest using Rciela and Elzette Azamina.", 
            cardId: "101204055", // Diabell, Queen
            zone: "EMZ_1",
            removesZones: ["MMZ_1"], 
            aiCommentary: "Climbing into our ultimate Level 8 Synchro boss monster." 
        },
        { 
            id: 10, 
            instruction: "CL1: Elzette Azamina to search WANTED: Seeker of Sinful Spoils. CL2: Diabell Queen effect to add a Spell/Trap from GY to hand (if applicable).", 
            cardId: "101204055", // Diabell, Queen
            zone: "HAND", 
            aiCommentary: "Chain blocking here safely guarantees our high-value WANTED search resolves." 
        },
        { 
            id: 11, 
            instruction: "Activate WANTED: Seeker of Sinful Spoils; search Diabellstar the Black Witch.", 
            cardId: "WANTED_ID", // WANTED
            zone: "HAND", 
            aiCommentary: "Transitioning smoothly into the Sinful Spoils engine engine." 
        },
        { 
            id: 12, 
            instruction: "Send 1 card from your hand or field to the GY; Special Summon Diabellstar the Black Witch.", 
            cardId: "02728841", // Diabellstar
            zone: "MMZ_1", 
            aiCommentary: "Clear any used or face-down Spell/Trap card on your board to bring out the Witch." 
        },
        { 
            id: 13, 
            instruction: "Activate Diabellstar effect on summon; set Deception of the Sinful Spoils directly from Deck.", 
            cardId: "02728841", // Diabellstar
            zone: "STZ_3", 
            aiCommentary: "Grabbing the vital continuous spell necessary for the upcoming Spellcaster combos." 
        },
        { 
            id: 14, 
            instruction: "Banish Diabellstar from field; Special Summon Dark Magician of Destruction from your hand/deck.", 
            cardId: "DM_DESTRUCTION_ID", // Dark Magician of Destruction
            zone: "MMZ_1", 
            aiCommentary: "Trading our Witch for an absolute powerhouse engine requirement." 
        },
        { 
            id: 15, 
            instruction: "Activate effect of Dark Magician of Destruction; search for Gaze of Timaeus.", 
            cardId: "DM_DESTRUCTION_ID", 
            zone: "HAND", 
            aiCommentary: "Searching the core quick-play fusion spell that secures our final disruption payload." 
        },
        { 
            id: 16, 
            instruction: "Activate Deception of the Sinful Spoils; tribute Dark Magician of Destruction to search for Hallowed Azamina.", 
            cardId: "DECEPTION_ID", 
            zone: "HAND",
            removesZones: ["MMZ_1"], 
            aiCommentary: "Sacrificing the Magician to set up our next tier of Azamina Fusion plays." 
        },
        { 
            id: 17, 
            instruction: "Activate Hallowed Azamina; reveal Azamina Mu Rcielago and send Deception to the GY to Special Summon Mu Rcielago.", 
            cardId: "MU_RCIELAGO_ID", // Mu Rcielago
            zone: "MMZ_1", 
            removesZones: ["STZ_3"],
            aiCommentary: "Trading the continuous spell value directly for a high-utility Fusion monster body." 
        },
        { 
            id: 18, 
            instruction: "Activate effect of Mu Rcielago; search for Sinful Spoils of the White Forest.", 
            cardId: "MU_RCIELAGO_ID", 
            zone: "HAND", 
            aiCommentary: "Grabbing another hybrid engine piece to bridge the archetypes together." 
        },
        { 
            id: 19, 
            instruction: "Activate Hallowed Azamina effect in GY; target Elzette Azamina, return her to the Deck, and add Hallowed Azamina back to hand.", 
            cardId: "HALLOWED_AZAMINA_ID", 
            zone: "HAND", 
            aiCommentary: "Standard recursion looping to ensure your hand economy stays entirely optimal." 
        },
        { 
            id: 20, 
            instruction: "Activate Hallowed Azamina, chain Sinful Spoils of the White Forest: Fusion Summon Saint Azamina using Diabell and Mu Rcielago, then reveal Azamina Ilia Silvia, send Sinful Spoils to GY, and Special Summon Ilia Silvia.", 
            cardId: "ILIA_SILVIA_ID", // Ilia Silvia
            zone: "MMZ_1", 
            extraSummons: [
                { cardId: "SAINT_AZAMINA_ID", zone: "MMZ_2" } // Saint Azamina
            ],
            removesZones: ["EMZ_1"],
            aiCommentary: "A double-fusion execution that updates our board presence with two massive entities simultaneously." 
        },
        { 
            id: 21, 
            instruction: "Activate Saint Azamina effect; Special Summon Azamina Moa Regina from the Extra Deck.", 
            cardId: "MOA_REGINA_ID", // Moa Regina
            zone: "MMZ_3", 
            aiCommentary: "Summoning Regina creates a dynamic graveyard revival engine for our fiends." 
        },
        { 
            id: 22, 
            instruction: "Activate Azamina Moa Regina; target Mu Rcielago in the GY and Special Summon it.", 
            cardId: "MU_RCIELAGO_ID", 
            zone: "MMZ_4", 
            aiCommentary: "Reviving Mu Rcielago to optimize our physical presence on the battlefield for synchro plays." 
        },
        { 
            id: 23, 
            instruction: "Activate Silvy effect in GY; target Diabell, return her to the Extra Deck, and Special Summon Silvy.", 
            cardId: "101204003", // Silvy
            zone: "MMZ_5", 
            aiCommentary: "Recycling your primary extra deck boss while generating field presence from the graveyard." 
        },
        { 
            id: 24, 
            instruction: "Synchro Summon Chaos Angel using Silvy and Mu Rcielago.", 
            cardId: "CHAOS_ANGEL_ID", // Chaos Angel
            zone: "MMZ_4", 
            removesZones: ["MMZ_5"],
            aiCommentary: "Bringing out a battle-immune, banishing engine threat utilizing Light and Dark attributes perfectly." 
        },
        { 
            id: 25, 
            instruction: "Set Gaze of Timaeus and any other remaining Spells/Traps from your hand face-down.", 
            cardId: "GAZE_TIMAEUS_ID", 
            zone: "STZ_4", 
            aiCommentary: "Arming the dynamic interaction trick that will activate during the opponent's turn." 
        },
        { 
            id: 26, 
            instruction: "Activate WANTED effect in GY; target Sinful Spoils of the White Forest in GY, return it to the deck, then Draw 1 card.", 
            cardId: "WANTED_ID", 
            zone: "HAND", 
            aiCommentary: "Replenishing your hand resources completely free of cost before passing priority." 
        },
        { 
            id: 27, 
            instruction: "Pass turn to your opponent.", 
            cardId: "NONE", 
            zone: "NONE", 
            aiCommentary: "Turn transitioned cleanly. We wait for an optimal window to drop our final payload." 
        },
        { 
            id: 28, 
            instruction: "During opponent's turn: Activate Gaze of Timaeus; target Magician of Destruction in GY, return it to the Extra Deck, and Special Summon Red-Eyes Dark Dragoon.", 
            cardId: "DRAGOON_ID", // Red-Eyes Dark Dragoon
            zone: "MMZ_5", 
            aiCommentary: "The final trap snaps shut. Bringing out a nearly unkillable, omni-negating Dragoon completely out of nowhere." 
        }
    ]
};