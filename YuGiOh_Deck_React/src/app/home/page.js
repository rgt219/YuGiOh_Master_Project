// app/page.js
import Home from '@/app/home/Home';

export const metadata = {
  title: 'ErreGeTe YGO | Advanced Yu-Gi-Oh! Deck Builder & Meta Archive',
  description: 'Construct custom Yu-Gi-Oh! decks, analyze real-time tournament meta archives, test your luck in the pack simulator, and search the complete card database.',
  keywords: ['Yu-Gi-Oh!', 'Deck Builder', 'Meta Decks', 'Pack Simulator', 'Card Database', 'ErreGeTe YGO'],
};

export default function Page() {
  return <Home />;
}