import Home from '@/app/home/Home';

export const metadata = {
  title: 'ErreGeTeYGO | Yu-Gi-Oh! Deck Builder & Metagame Hub',
  description: 'Welcome to ErreGeTeYGO - The ultimate Yu-Gi-Oh! deck building studio, live format regulation telemetry, and community discussion hub.',
  openGraph: {
    title: 'ErreGeTeYGO | Yu-Gi-Oh! Deck Builder & Metagame Hub',
    description: 'Build decks, check live ban lists, and analyze metagame trends.',
    siteName: 'ErreGeTeYGO',
  },
};

export default function HomePage() {
  return <Home />;
}