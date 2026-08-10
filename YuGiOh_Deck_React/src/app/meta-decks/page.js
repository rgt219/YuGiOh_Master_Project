import MetaDecks from '@/components/MetaDecks';

export const metadata = {
  title: 'Tournament Meta Archive | ErreGeTeYGO',
  description: 'Real-time competitive Yu-Gi-Oh! metagame profiles, tournament placements, and decklists across TCG, OCG, Master Duel, and Genesys formats.',
  openGraph: {
    title: 'Tournament Meta Archive | ErreGeTeYGO',
    description: 'Explore top tier tournament decks and metagame trends.',
  },
};

export default function MetaDecksPage() {
  return <MetaDecks />;
}