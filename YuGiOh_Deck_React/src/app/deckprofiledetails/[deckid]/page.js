import DeckProfileDetails from '@/components/DeckProfileDetails';

export async function generateMetadata({ params }) {
  const { deckId } = await params;
  const baseUrl = "https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api/mongodb/DeckListMongoDb";

  try {
    const res = await fetch(`${baseUrl}/${deckId}`, { cache: 'no-store' });
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