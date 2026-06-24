export const kewlTuneCombo = {
    title: "Kewl Tune Combo: The Synchro Hand & Deck Control Line",
    handRequired: ["Kewl Tune Cue"],
    steps: [
        { 
            id: 1, 
            instruction: "Normal Summon Kewl Tune Cue from your hand.", 
            cardId: "KEWL_TUNE_CUE_ID", 
            zone: "MMZ_1", 
            aiCommentary: "Initiating the rhythm. Cue serves as our primary normal summon and low-level tuner playmaker." 
        },
        { 
            id: 2, 
            instruction: "Activate Kewl Tune Cue's on-summon effect; Special Summon Kewl Tune Reco from your hand or Deck in Defense Position.", 
            cardId: "KEWL_TUNE_RECO_ID", 
            zone: "MMZ_2", 
            aiCommentary: "Establishing immediate field presence. Reco hits the stage safely in defense mode to protect your life points." 
        },
        { 
            id: 3, 
            instruction: "Activate Kewl Tune Reco's on-summon effect; add Kewl Tune Rotary from your Deck to your hand.", 
            cardId: "KEWL_TUNE_RECO_ID", 
            zone: "HAND", 
            aiCommentary: "Searching out Rotary, which acts as a hand extender to facilitate an off-field Synchro summon." 
        },
        { 
            id: 4, 
            instruction: "Synchro Summon Kewl Tune Track Maker using Reco on the field and Rotary in your hand as material.", 
            cardId: "TRACK_MAKER_ID", 
            zone: "EMZ_1",
            removesZones: ["MMZ_2"], 
            aiCommentary: "Dropping the beat. Track Maker hits the Extra Monster Zone using Rotary's unique property to tune from the hand." 
        },
        { 
            id: 5, 
            instruction: "Stack the Chain: Chain Link 1 Track Maker, Chain Link 2 Rotary (GY), Chain Link 3 Cue (GY).", 
            cardId: "TRACK_MAKER_ID", 
            zone: "NONE", 
            aiCommentary: "Advanced chain-blocking sequencing. Stacking three triggers completely insulates your core searches from your opponent's negations." 
        },
        { 
            id: 6, 
            instruction: "Resolve CL3 (Cue Effect): Banish one card from the top of your opponent's Deck, and set another at the top or bottom of their Deck.", 
            cardId: "KEWL_TUNE_CUE_ID", 
            zone: "GY", 
            aiCommentary: "Manipulating the top of the opponent's deck early to completely deny them their crucial upcoming draw phase answers." 
        },
        { 
            id: 7, 
            instruction: "Resolve CL2 (Rotary Effect): Look at your opponent's hand, then add Kewl Tune Synchro from your Deck to your hand.", 
            cardId: "KEWL_TUNE_ROTARY_ID", 
            zone: "HAND", 
            aiCommentary: "Gaining perfect information by peeking at their hand, allowing you to plan exactly how to map out your defensive disruptions." 
        },
        { 
            id: 8, 
            instruction: "Resolve CL1 (Track Maker Effect): Add a second copy of Kewl Tune Synchro from your Deck to your hand.", 
            cardId: "TRACK_MAKER_ID", 
            zone: "HAND", 
            aiCommentary: "Double search complete. Your hand is loaded with the archetype's premier reactive traps." 
        },
        { 
            id: 9, 
            instruction: "Set both Kewl Tune Synchro cards face-down in your Spell & Trap Zones, then pass the turn.", 
            cardId: "KEWL_TUNE_SYNCHRO_ID", 
            zone: "STZ_1",
            extraSummons: [
                { cardId: "KEWL_TUNE_SYNCHRO_ID", zone: "STZ_2" }
            ], 
            aiCommentary: "The board is locked, loaded, and completely armored for the opponent's incoming turn phase." 
        },
        { 
            id: 10, 
            instruction: "Opponent's Turn: Time your Kewl Tune Synchro activations to trigger Track Maker (bounce a card), Reco (pop an S/T), Kewl Tune Mix (destroy a monster), or Kewl Tune Clip (banish from Extra Deck).", 
            cardId: "KEWL_TUNE_SYNCHRO_ID", 
            zone: "STZ_1",
            removesZones: ["STZ_1"],
            aiCommentary: "Dynamic toolkit interaction. Based on what you saw in their hand during step 7, choose the exact disruption that cuts off their strategy." 
        }
    ]
};