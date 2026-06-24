export const blueEyesCombo = {
    title: "Blue-Eyes Ultimate Sequence: Magia, Sifr, and the Cosmic Horizon",
    handRequired: ["Sage with Eyes of Blue", "Any 1 Discard Cost Card", "Primite Lordly Lode (Optional)"],
    steps: [
        { 
            id: 1, 
            instruction: "Normal Summon Sage with Eyes of Blue.", 
            cardId: "71039907", // Sage with Eyes of Blue
            zone: "MMZ_1", 
            aiCommentary: "The ultimate standard classic normal summon. Sage starts the entire cascade into the modern Light tuner toolbox." 
        },
        { 
            id: 2, 
            instruction: "Activate Sage with Eyes of Blue's on-summon effect; add Maiden of White from your Deck to your hand.", 
            cardId: "71039907", 
            zone: "HAND", 
            aiCommentary: "Searching the core modern line extender. Maiden of White acts as our primary enabler for legacy backrow setup." 
        },
        { 
            id: 3, 
            instruction: "Activate Maiden of White's effect in your hand: Send her to the GY as cost to set True Light face-up directly into your Spell & Trap Zone.", 
            cardId: "MAIDEN_OF_WHITE_ID", 
            zone: "STZ_1", 
            aiCommentary: "Bypassing standard activation rules to put a live True Light on the board without paying an on-field tax." 
        },
        { 
            id: 4, 
            instruction: "Link Summon Spirit with Eyes of Blue using Sage with Eyes of Blue on your field.", 
            cardId: "SPIRIT_WITH_EYES_OF_BLUE_ID", 
            zone: "EMZ_1",
            removesZones: ["MMZ_1"], 
            aiCommentary: "Converting our used Sage into a powerful Link-1 directional arrow to fetch our field spell values." 
        },
        { 
            id: 5, 
            instruction: "Activate Spirit with Eyes of Blue's on-summon effect; add Mausoleum of White from your Deck to your hand.", 
            cardId: "SPIRIT_WITH_EYES_OF_BLUE_ID", 
            zone: "HAND", 
            aiCommentary: "Adding the Field Spell to unlock our crucial second Normal Summon for the turn." 
        },
        { 
            id: 6, 
            instruction: "Activate True Light's effect to set Wishes for Eyes of Blue face-down directly from your Deck into your Spell & Trap Zone.", 
            cardId: "84041044", // True Light
            zone: "STZ_2", 
            aiCommentary: "Using your eternal backrow generator to tutor out the high-value utility trap." 
        },
        { 
            id: 7, 
            instruction: "Activate Wishes for Eyes of Blue: Discard any 1 card from your hand as cost to add Ultimate Fusion and Kaibaman the Legend from your Deck to your hand.", 
            cardId: "WISHES_FOR_EYES_OF_BLUE_ID", 
            zone: "HAND", 
            aiCommentary: "Pitching your worst hand resource to dual-tutor the absolute heavy hitters of the extra-deck fusion engine." 
        },
        { 
            id: 8, 
            instruction: "Activate the Field Spell: Mausoleum of White.", 
            cardId: "01435851", // Mausoleum of White
            zone: "FSZ", 
            aiCommentary: "Drapping the arena. This grants us an extra normal summon gear for any Level 1 Light Tuner or structural Kaiba piece." 
        },
        { 
            id: 9, 
            instruction: "Utilize your extra Normal Summon via Mausoleum to summon Kaibaman the Legend.", 
            cardId: "KAIBAMAN_THE_LEGEND_ID", 
            zone: "MMZ_1", 
            aiCommentary: "Dropping the legendary play-maker to execute high-impact field deployment." 
        },
        { 
            id: 10, 
            instruction: "Activate Kaibaman the Legend's on-summon effect: Reveal 3 copies of Blue-Eyes White Dragon across your hand/deck/field/GY to Special Summon 1 Blue-Eyes White Dragon from your hand or Deck in Defense Position.", 
            cardId: "KAIBAMAN_THE_LEGEND_ID", 
            zone: "MMZ_2", 
            aiCommentary: "Showing the absolute dominance of the original vanilla engine to deploy the classic engine centerpiece." 
        },
        { 
            id: 11, 
            instruction: "Activate Wishes for Eyes of Blue in your GY: Banish it as cost, then target the Blue-Eyes White Dragon on your field to equip Blue-Eyes Ultimate Dragon to it directly from your Extra Deck.", 
            cardId: "WISHES_FOR_EYES_OF_BLUE_ID", 
            zone: "STZ_3", 
            aiCommentary: "Incredibly slick tech sequencing here. Cheating a 4500 ATK fusion powerhouse straight onto the board as an equipment asset." 
        },
        { 
            id: 12, 
            instruction: "Synchro Summon Blue-Eyes Spirit Dragon using Kaibaman the Legend and Blue-Eyes White Dragon as material. (The equipped Blue-Eyes Ultimate Dragon is sent directly to the GY).", 
            cardId: "59822133", // Blue-Eyes Spirit Dragon
            zone: "MMZ_3",
            removesZones: ["MMZ_1", "MMZ_2", "STZ_3"], 
            aiCommentary: "Brilliant resource dumping. This puts Spirit Dragon on the board while naturally shifting your Ultimate Dragon to the GY for ultimate Fusion fuel later." 
        },
        { 
            id: 13, 
            instruction: "Activate your Link-1 Spirit with Eyes of Blue's effect: Tribute itself as cost to Special Summon Blue-Eyes White Dragon back from your GY.", 
            cardId: "SPIRIT_WITH_EYES_OF_BLUE_ID", 
            zone: "MMZ_1",
            removesZones: ["EMZ_1"], 
            aiCommentary: "Trading off the structural link unit to recycle your high-value dragon body immediately." 
        },
        { 
            id: 14, 
            instruction: "Stack the Graveyard Chains: Chain Link 1 Kaibaman the Legend to banish itself for effect, Chain Link 2 Maiden of White to chain-block.", 
            cardId: "KAIBAMAN_THE_LEGEND_ID", 
            zone: "NONE", 
            aiCommentary: "Protecting your backend resource generation against hostile hand-traps through calculated trigger stacking." 
        },
        { 
            id: 15, 
            instruction: "Resolve CL2 (Maiden of White Effect): Special Summon Maiden of White directly from your GY to the field.", 
            cardId: "MAIDEN_OF_WHITE_ID", 
            zone: "MMZ_2", 
            aiCommentary: "Maiden hits the field once more, primed for high-level tuning or target absorption logic." 
        },
        { 
            id: 16, 
            instruction: "Resolve CL1 (Kaibaman the Legend Effect): Add Blue-Eyes Chaos MAX Dragon from your Deck to your hand.", 
            cardId: "KAIBAMAN_THE_LEGEND_ID", 
            zone: "HAND", 
            aiCommentary: "Searching the definitive ritual centerpiece directly to your hand to set up the ultimate fusion profile." 
        },
        { 
            id: 17, 
            instruction: "Activate Ultimate Fusion: Fusion Summon Dragon Master Magia from your Extra Deck by shuffling both Blue-Eyes Ultimate Dragon and Blue-Eyes Chaos MAX Dragon from your GY back into the Deck.", 
            cardId: "06226462", // Dragon Master Magia
            zone: "MMZ_4", 
            aiCommentary: "The apex predator arrives! Dragon Master Magia hits the field with multiple omni-negates fueled entirely by the resources we just cycled." 
        },
        { 
            id: 18, 
            instruction: "Activate Mausoleum of White's field effect: Target Maiden of White to send 1 Blue-Eyes White Dragon from your Deck straight to the GY.", 
            cardId: "01435851", 
            zone: "NONE", 
            aiCommentary: "Deliberately targeting your own asset to trigger her highly reactive self-defense logic." 
        },
        { 
            id: 19, 
            instruction: "Trigger Maiden of White's response effect: Special Summon Sage with Eyes of Blue from your GY to your field in Defense Position.", 
            cardId: "MAIDEN_OF_WHITE_ID", 
            zone: "MMZ_5", 
            aiCommentary: "Free field generation. Sage re-enters the field to serve as our final Level 1 Tuner key piece." 
        },
        { 
            id: 20, 
            instruction: "Synchro Summon a second copy of Blue-Eyes Spirit Dragon using the Blue-Eyes White Dragon on your field and Maiden of White.", 
            cardId: "59822133", 
            zone: "MMZ_2",
            removesZones: ["MMZ_1", "MMZ_2"], 
            aiCommentary: "Establishing dual-control vectors. We now command two separate Spirit Dragon disruption frameworks simultaneously." 
        },
        { 
            id: 21, 
            instruction: "Activate the quick-tag effects of BOTH Blue-Eyes Spirit Dragons: Tribute them both to Special Summon Blue-Eyes Ultimate Spirit Dragon and Crimson Dragon from your Extra Deck in Defense Position.", 
            cardId: "BLUE_EYES_ULTIMATE_SPIRIT_DRAGON_ID", 
            zone: "MMZ_1",
            extraSummons: [
                { cardId: "77693555", zone: "MMZ_2" } // Crimson Dragon
            ],
            removesZones: ["MMZ_3"], 
            aiCommentary: "A massive tactical shift. Dropping the brand new Ultimate Spirit structural wall alongside the flexible Crimson tuning line." 
        },
        { 
            id: 22, 
            instruction: "Activate Crimson Dragon's on-summon effect: Add Synchro Rumble from your Deck to your hand.", 
            cardId: "77693555", 
            zone: "HAND", 
            aiCommentary: "Grabbing Synchro Rumble to secure immediate low-level recursion or destruction shields." 
        },
        { 
            id: 23, 
            instruction: "Activate Crimson Dragon's active effect: Target Blue-Eyes Ultimate Spirit Dragon as cost; return Crimson Dragon to the Extra Deck to Special Summon Stardust Sifr Divine Dragon.", 
            cardId: "77693555", 
            zone: "MMZ_2", 
            aiCommentary: "Masterclass execution! Tagging out for Stardust Sifr creates an absolute blanket of card-destruction immunity, entirely nullifying the self-destruct drawback of our cheated Spirit Dragon assets during the End Phase." 
        },
        { 
            id: 24, 
            instruction: "If you hold Primite Lordly Lode in hand: Activate it now to add Primite Dragon Ether Beryl from your Deck to your hand.", 
            cardId: "PRIMITE_LORDLY_LODE_ID", 
            zone: "STZ_3", 
            aiCommentary: "Extending the floor ceiling into the high-utility Primite structural engine." 
        },
        { 
            id: 25, 
            instruction: "Activate Primite Lordly Lode's secondary property: Declare 'Blue-Eyes White Dragon' to Special Summon it from your GY in Defense Position.", 
            cardId: "PRIMITE_LORDLY_LODE_ID", 
            zone: "MMZ_1", 
            aiCommentary: "Manifesting the iconic engine master body back onto the pitch for one final synchro play." 
        },
        { 
            id: 26, 
            instruction: "Synchro Summon a third Blue-Eyes Spirit Dragon using your remaining Sage with Eyes of Blue and the freshly summoned Blue-Eyes White Dragon. Pass Turn.", 
            cardId: "59822133", 
            zone: "MMZ_3",
            removesZones: ["MMZ_1", "MMZ_5"], 
            aiCommentary: "The loop is complete. This updates our board with an active Spirit Dragon, setting up another devastating Crimson Dragon pivot into Cosmic Blazar Dragon on the opponent's turn. Truly unstoppable board architecture." 
        }
    ]
};