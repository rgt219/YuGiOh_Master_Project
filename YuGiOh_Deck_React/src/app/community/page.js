import CommunityDecks from '@/app/community/CommunityDecks';

export const metadata = {
  title: 'Public Community Deck Archive | ErreGeTeYGO',
  description: 'Explore, search, and analyze public Yu-Gi-Oh! decklists published by duelists across TCG, Master Duel, and OCG formats.',
  openGraph: {
    title: 'Public Community Deck Archive | ErreGeTeYGO',
    description: 'Browse public Yu-Gi-Oh! decklists created by the community.',
  },
};

export default function CommunityPage() {
  return <CommunityDecks />;
}