// Plain data only (no JSX), so the page component stays small and this can be read anywhere.

export const CDN_BASE_URL = process.env.NEXT_PUBLIC_CDN_URL || '';
export const videoUrl = (file) => `${CDN_BASE_URL}/videos/${file}`;

export const HERO_VIDEOS = ['mdgameplay.mp4', 'duelingbook.mp4'].map(videoUrl);
export const HERO_BG_VIDEO = videoUrl('temple.mp4');

// `warm: true` draws the title in yellow instead of cyan. `imgRight` flips the panel on wide screens.
export const PANELS = [
    {
        id: 'deckbuilder', navPath: '/deckbuilder', navLabel: 'DECK BUILDER', navImg: '/images/albaz.jpg', navVideo: 'albaz.mp4',
        bgVideo: 'encounter_short.mp4', bgPoster: 'encounter_poster.png',
        title: 'Deck Builder', warm: false, imgRight: false, cta: 'Open the Deck Builder',
        desc: 'Construct, refine, and validate your custom decks instantly against live OCG and TCG banlists. Seamlessly import your YDK files, analyze card synergies, and optimize your overall strategy with our high-speed integrations.',
        subTitle: 'Are you ready to test your meta breakers?', subDesc: 'Jump in and start crafting your ultimate deck setup now.',
    },
    {
        id: 'metadecks', navPath: '/meta-decks', navLabel: 'META DECKS', navImg: '/images/mirrorjade.jpg', navVideo: 'mirrorjade.mp4',
        bgVideo: 'albion_short.mp4', bgPoster: 'albion_poster.png',
        title: 'Meta Decks', warm: true, imgRight: true, cta: 'Browse meta decks',
        desc: 'Analyze the current tournament tier lists, breakdown championship-winning ratios, and inspect core combo lines. Stay ahead of the shifting meta with precise statistical insights and optimal tech choices.',
        subTitle: 'Ready to master the tier 1 strategies?', subDesc: 'Explore top tournament lists and optimize your competitive matches.',
    },
    {
        id: 'market-listings', navPath: '/market-listings', navLabel: 'MARKET LISTINGS', navImg: '/images/thunderbolt.png', navVideo: 'thunderbolt.mp4',
        bgVideo: 'brigrand_short.mp4', bgPoster: 'brigrand_poster.png',
        title: 'Market Listings', warm: false, imgRight: false, cta: 'See market listings',
        desc: 'Track real-time card prices, market fluctuations, and printing values across major exchanges. Whether you are optimizing a budget build or monitoring the value of your ultimate collection, our live pricing widgets ensure you never overpay for your tech cards.',
        subTitle: 'Want to secure your staples before the next buyout?', subDesc: 'Analyze live pricing trends and build without breaking the bank.',
    },
    {
        id: 'banlist', navPath: '/banlist', navLabel: 'BAN LIST', navImg: '/images/blazing.png', navVideo: 'blazing.mp4',
        bgVideo: 'iris_short.mp4', bgPoster: 'iris_poster.png',
        title: 'Forbidden/Limited List', warm: true, imgRight: true, cta: 'View the ban list',
        desc: 'Keep your builds legal and tournament-ready with real-time updates for forbidden, limited, and semi-limited cards across both TCG and OCG formats. Never get caught off-guard by a format change again.',
        subTitle: 'Check the latest restrictions before you duel?', subDesc: 'Stay fully informed on current banlist fluctuations and adjustments.',
    },
    {
        id: 'forums', navPath: '/generaldiscussion', navLabel: 'FORUMS', navImg: '/images/sanctifire.png', navVideo: 'sanctifire.mp4',
        bgVideo: 'bond_short.mp4', bgPoster: 'bond_poster.png',
        title: 'Duelist Forums', warm: false, imgRight: false, cta: 'Join the forums',
        desc: 'Engage in deep tactical discussions, share innovative deck cores, and connect with other builders. Post your custom replays, exchange side-deck tech ideas, and collaborate on cutting-edge strategies.',
        subTitle: 'Have a brilliant deck strategy to share with everyone?', subDesc: 'Jump into the discussion boards and exchange knowledge with fellow duelists.',
    },
    {
        id: 'community', navPath: '/community', navLabel: 'COMMUNITY', navImg: '/images/bystialLubellion.png', navVideo: 'bystialLubellion.mp4',
        bgVideo: 'nexus_short.mp4', bgPoster: 'nexus_poster.png',
        title: 'Community', warm: true, imgRight: true, cta: 'Visit the community',
        desc: 'Connect with duelists from across the globe in our general forums, or test your skills in dedicated competitive discussions. Share rogue strategies, debate banlist impacts, and find your next tournament crew.',
        subTitle: 'Ready to join the discussion and prove your meta knowledge?', subDesc: 'Dive into the forums and collaborate with top duelists today.',
    },
    {
        id: 'cardsearch', navPath: '/cardsearch', navLabel: 'CARD SEARCH', navImg: '/images/darkdragon.jpg', navVideo: 'darkdragon.mp4',
        bgVideo: 'incredible_short.mp4', bgPoster: 'incredible_poster.png',
        title: 'Card Search', warm: false, imgRight: false, cta: 'Search cards',
        desc: 'Search through thousands of cards instantly using powerful filters for attributes, types, archetypes, and banlist statuses. Find exactly what you need to complete your masterpiece strategy.',
        subTitle: 'Looking for the ultimate tech card?', subDesc: 'Use our high-speed database search to discover hidden synergies.',
    },
    {
        id: 'contact', navPath: '/contact', navLabel: 'CONTACT', navImg: '/images/aluber.png', navVideo: 'aluber.mp4',
        bgVideo: 'shuraig_short.mp4', bgPoster: 'shuraig_poster.png',
        title: 'Contact & Support', warm: true, imgRight: true, cta: 'Contact us',
        desc: 'Have questions about your deck integrations, API syncing, or need technical support with your environment? Whether you are reporting a bug or requesting a new feature, our team is here to ensure your Master Duel logic runs flawlessly.',
        subTitle: 'Encountered a critical error or have a suggestion?', subDesc: 'Reach out and let us help you optimize your experience.',
    },
];
