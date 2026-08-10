import CardSearch from '@/components/CardSearch';

// ⚡ SEO Metadata
export const metadata = {
  title: 'Yu-Gi-Oh! Card Database & Search Engine | ErreGeTeYGO',
  description: 'Search Yu-Gi-Oh! cards by archetype, attribute, level, monster type, live vendor market prices, and tri-format banlist status.',
  openGraph: {
    title: 'Yu-Gi-Oh! Card Database Search | ErreGeTeYGO',
    description: 'Filter cards, check live market prices, and inspect format legalities in real time.',
  },
};

export default function CardSearchPage() {
  return <CardSearch />;
}