import MetaDeckProfile from '@/components/MetaDeckProfile';

// ⚡ Dynamic SEO & Open Graph Meta Tags Generator
export async function generateMetadata({ params }) {
  const { id } = await params;
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