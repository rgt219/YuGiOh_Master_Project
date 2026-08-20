export const CARDS_PER_PAGE = 30; 

export const AZURE_BLOB_CONTAINER_URL = "https://ygocardstore-images-gpctdecsa6a6ctfc.z01.azurefd.net/card-images";

export const ATTRIBUTES = ['ALL', 'DARK', 'LIGHT', 'EARTH', 'WATER', 'FIRE', 'WIND', 'DIVINE'];
export const MAIN_CARD_TYPES = ['ALL', 'NORMAL', 'EFFECT', 'SPELL', 'TRAP']; 
export const MONSTER_ABILITIES = ['ALL', 'FLIP', 'TUNER', 'GEMINI', 'SPIRIT', 'UNION'];
export const MONSTER_EXTRA_TYPES = ['ALL', 'FUSION', 'LINK', 'PENDULUM', 'SYNCHRO', 'XYZ'];

export const MONSTER_RACES = [
    'ALL MONSTER TYPES',
    'Aqua', 'Beast', 'Beast-Warrior', 'Cyberse', 'Dinosaur', 'Divine-Beast', 
    'Dragon', 'Fairy', 'Fiend', 'Fish', 'Illusion', 'Insect', 'Machine', 
    'Psychic', 'Pyro', 'Reptile', 'Rock', 'Sea Serpent', 'Spellcaster', 
    'Thunder', 'Warrior', 'Winged Beast', 'Wyrm', 'Zombie'
];

export const SPELL_TYPES = ['ALL SPELL TYPES', 'Normal', 'Field', 'Equip', 'Quick-Play', 'Continuous', 'Ritual'];
export const TRAP_TYPES = ['ALL TRAP TYPES', 'Normal', 'Continuous', 'Counter'];

export const ALL_RACES_TYPES = [
    'ALL RACES / TYPES',
    ...Array.from(new Set([
        ...MONSTER_RACES.slice(1), 
        ...SPELL_TYPES.slice(1), 
        ...TRAP_TYPES.slice(1)
    ])).sort()
];

export const RARITIES = ['ALL', 'Common', 'Rare', 'Super Rare', 'Ultra Rare', 'Secret Rare', 'Ultimate Rare', 'Ghost Rare', 'Starlight Rare', 'Quarter Century Secret Rare', 'Gold Rare', 'Collector\'s Rare', 'Platinum Secret Rare'];
export const LEVELS = ['ALL', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];
export const LINKS = ['ALL', '1', '2', '3', '4', '5', '6'];
export const SCALES = ['ALL', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];