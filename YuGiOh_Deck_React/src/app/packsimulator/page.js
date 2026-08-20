// app/packsimulator/page.js

import React from 'react';
import PackSimulator from '@/components/PackSimulator'; // Adjust this import path based on where you saved the component

export const metadata = {
  title: 'Pack Simulator | ErreGeTe YGO',
  description: 'Experience the thrill of the draw. Simulate opening classic and modern Yu-Gi-Oh! booster packs, pull holographic cards, and test your luck in the ErreGeTe YGO Pack Simulator Terminal.',
  keywords: ['Yu-Gi-Oh!', 'Pack Simulator', 'Booster Packs', 'YGO Simulator', 'ErreGeTe YGO', 'Card Pulls', 'YGOProDeck'],
  openGraph: {
    title: 'Yu-Gi-Oh! Pack Simulator - ErreGeTe YGO',
    description: 'Simulate opening Yu-Gi-Oh! booster packs. Can you pull a Secret Rare?',
    url: 'https://yourwebsite.com/packsimulator', // Replace with your actual production URL
    siteName: 'ErreGeTe YGO',
    type: 'website',
    images: [
      {
        url: 'https://images.ygoprodeck.com/images/cards/back_high.jpg', // You can replace this with a custom banner image later
        width: 800,
        height: 600,
        alt: 'Yu-Gi-Oh! Pack Simulator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yu-Gi-Oh! Pack Simulator | ErreGeTe YGO',
    description: 'Simulate opening Yu-Gi-Oh! booster packs. Can you pull a Secret Rare?',
    images: ['https://images.ygoprodeck.com/images/cards/back_high.jpg'],
  },
};

export default function PackSimulatorPage() {
  return (
    <main>
      <PackSimulator />
    </main>
  );
}