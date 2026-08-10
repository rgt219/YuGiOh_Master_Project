import MetaDeckProfile from '@/components/MetaDeckProfile';

// ⚡ Strictly return the 'id' key to match the [id] folder segment
const FALLBACK_META_IDS = [{ id: '1' }, { id: '2' }, { id: 'meta-1' }];

export async function generateStaticParams() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || 'https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api';

  try {
    const res = await fetch(`${baseUrl}/metadecks`, { next: { revalidate: 60 } });
    if (!res.ok) return FALLBACK_META_IDS;

    const decks = await res.json();
    
    if (!Array.isArray(decks) || decks.length === 0) {
      return FALLBACK_META_IDS;
    }

    // ⚡ Return objects containing strictly the 'id' key
    const params = decks
      .map((deck) => {
        const rawId = deck?.id || deck?._id || deck?.deckId;
        return rawId ? { id: String(rawId) } : null;
      })
      .filter(Boolean);

    return params.length > 0 ? params : FALLBACK_META_IDS;
  } catch (error) {
    console.warn("Meta-decks static generation fallback triggered:", error);
    return FALLBACK_META_IDS;
  }
}

// ⚡ Dynamic SEO & Open Graph Meta Tags Generator
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || 'https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api';

  try {
    const res = await fetch(`${baseUrl}/metadecks/${id}`, { cache: 'no-store' });
    if (!res.ok) return { title: 'Meta Deck Profile | ErreGeTeYGO' };
    
    const deck = await res.json();
    const archetype = deck?.archetype || deck?.Archetype || 'Tournament Meta Deck';
    const pilot = deck?.pilot || deck?.Pilot || 'Top Duelist';

    return {
      title: `${archetype} Deck Profile | ErreGeTeYGO`,
      description: `View full tournament decklist breakdown, main/extra ratios, card pricing, and inspector stats for ${archetype} piloted by ${pilot}.`,
      openGraph: {
        title: `${archetype} Meta Deck Profile | ErreGeTeYGO`,
        description: `Piloted by ${pilot} | Format: ${deck?.format || 'TCG'}`,
      },
    };
  } catch {
    return { title: 'Meta Deck Profile | ErreGeTeYGO' };
  }
}

export default async function MetaDeckProfilePage() {
  return <MetaDeckProfile />;
}