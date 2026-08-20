import DeckProfileDetails from "./DeckProfileDetails";

// ⚡ Required for static export: matches dynamic folder [deckid]
const FALLBACK_DECK_IDS = [{ deckid: '1' }, { deckid: '2' }, { deckid: 'deck-1' }];

export async function generateStaticParams() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || 'https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api';

  try {
    const res = await fetch(`${baseUrl}/mongodb/DeckListMongoDb`, { next: { revalidate: 60 } });
    if (!res.ok) return FALLBACK_DECK_IDS;

    const decks = await res.json();
    
    if (!Array.isArray(decks) || decks.length === 0) {
      return FALLBACK_DECK_IDS;
    }

    // ⚡ Key must exactly match [deckid] from your folder path
    const params = decks
      .map((deck) => {
        const rawId = deck?.id || deck?._id || deck?.deckId;
        return rawId ? { deckid: String(rawId) } : null;
      })
      .filter(Boolean);

    return params.length > 0 ? params : FALLBACK_DECK_IDS;
  } catch (error) {
    console.warn("Deck profile static generation fallback triggered:", error);
    return FALLBACK_DECK_IDS;
  }
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const { deckid } = resolvedParams;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || 'https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api/mongodb/DeckListMongoDb';

  try {
    const res = await fetch(`${baseUrl}/${deckid}`, { cache: 'no-store' });
    if (!res.ok) return { title: 'Deck Profile Details | ErreGeTeYGO' };
    
    const deck = await res.json();
    const title = deck?.title || deck?.Title || 'Custom Yu-Gi-Oh! Deck';

    return {
      title: `${title} | Deck Profile Details | ErreGeTeYGO`,
      description: `Detailed card composition ratios, AI combo playbooks, and live pricing index for ${title}.`,
      openGraph: {
        title: `${title} | ErreGeTeYGO Deck Archive`,
        description: `Check out card stats and breakdown for ${title}.`,
      },
    };
  } catch {
    return { title: 'Deck Profile Details | ErreGeTeYGO' };
  }
}

export default async function DeckProfileDetailsPage() {
  return <DeckProfileDetails />;
}