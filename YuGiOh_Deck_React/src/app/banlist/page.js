import BanList from '@/app/banlist/BanList';

// ⚡ SEO Metadata
export const metadata = {
  title: 'Official Yu-Gi-Oh! Forbidden & Limited Ban List | ErreGeTeYGO',
  description: 'Check live Yu-Gi-Oh! TCG, OCG, and Master Duel regulation ban lists, card status, vendor prices, and Genesys points.',
  openGraph: {
    title: 'Yu-Gi-Oh! Forbidden & Limited Ban List | ErreGeTeYGO',
    description: 'Real-time TCG, OCG, and Master Duel ban list updates.',
  },
};

export default function BanListPage() {
  return <BanList />;
}