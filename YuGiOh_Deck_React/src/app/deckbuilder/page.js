import DeckBuilder from '@/app/deckbuilder/DeckBuilder';

// ⚡ SEO Metadata
export const metadata = {
  title: 'Yu-Gi-Oh! Deck Builder Studio | ErreGeTeYGO',
  description: 'Interactive Yu-Gi-Oh! deck building suite. Search cards, import/export YDK files, analyze extra deck ratios, and get AI card suggestions.',
  openGraph: {
    title: 'Yu-Gi-Oh! Deck Builder Studio | ErreGeTeYGO',
    description: 'Build, test, and save Yu-Gi-Oh! decks with AI card suggestions and instant YDK import/export.',
  },
};

export default function DeckBuilderPage() {
  return <DeckBuilder />;
}