export const exampleCombo = {
    title: "White Forest/Centur-Ion Starter: Astellar 1-Card Combo",
    handRequired: ["Astellar of the White Forest", "Any Spell/Trap"],
    steps: [
        {
            id: 1,
            instruction: "Normal Summon Astellar of the White Forest.",
            actionType: "NORMAL_SUMMON",
            cardId: "25592142",
            zone: "MMZ_2", // Main Monster Zone 2
            aiCommentary: "We start with Astellar to bait out early hand traps before committing to our Synchro plays."
        },
        {
            id: 2,
            instruction: "Activate Astellar effect: Send 1 Spell/Trap to GY to Special Summon Silvy of the White Forest.",
            actionType: "EFFECT_ACTIVATE",
            cost: "Spell/Trap Card",
            target: "Silvy of the White Forest",
            zone: "MMZ_3",
            aiCommentary: "Silvy is our primary tuner fetch. Sending a Spell/Trap here sets up our recursion for the End Phase."
        },
        {
            id: 3,
            instruction: "Activate Effect of Silvy of the White Forest to search 'Tales of the White Forest' if not already in hand.",
            actionType: "EFFECT_ACTIVATE",
            cardId: "98385955",
            zone: "", // Main Monster Zone 2
            aiCommentary: "We use Silvy's effect to search Tales because Tales is our primary White Forest Monster searcher. It also sets itself from the graveyard when sent to the graveyard by a monster effect."
        },
        {
            id: 4,
            instruction: "Synchro Summon Rciela, Sinister Soul of the White Forest",
            actionType: "SPECIAL_SUMMON",
            cardId: "77313225",
            zone: "EMZ_1", // Main Monster Zone 2
            aiCommentary: "Rciela furthers our Synchro Summon climb."
        },
        {
            id: 5,
            instruction: "Activate Rciela effect: Send Tales of the White Forest from your hand to the graveyard to search Elzette of the White Forest.",
            actionType: "NORMAL_SUMMON",
            cardId: "astellar-id",
            cost: "Spell/Trap Card",
            target: "Elzette of the White Forest", 
            zone: "MMZ_2", // Main Monster Zone 2
            aiCommentary: "Rciela sends Tales for cost to search for Elzette, our next extender."
        },
        {
            id: 6,
            instruction: "Activate Astellar effect and Tales effect in graveyard",
            actionType: "SPECIAL_SUMMON",
            cardId: "25592142",
            zone: "MMZ_4", // Main Monster Zone 2
            aiCommentary: "Activate these at the same time so that Astellar special summons and Tales sets itself face down on the field."
        },
        {
            id: 7,
            instruction: "Activate Elzette effect: Send one spell/trap from the hand or field to the graveyard to special summon itself.",
            actionType: "SPECIAL_SUMMON",
            cardId: "61980241",
            zone: "MMZ_5", // Main Monster Zone 2
            aiCommentary: "We can extend further by using Elzette's effect in hand to special summon itself, and search for Rucia of the White Forest for further extension."
        },
        {
            id: 8,
            instruction: "Synchro Summon Diabell, Queen of the White Forest.",
            actionType: "SPECIAL_SUMMON",
            cardId: "14307929",
            zone: "EMZ_1", // Main Monster Zone 2
            aiCommentary: "Diabell is a very strong card, getting a spell/trap back to our hand from the graveyard on summon (Tales of the White Forest in this case)."
        },
    ]
};