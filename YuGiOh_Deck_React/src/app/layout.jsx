import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css';
import '../styles.css';
import '../mdstyles.css';

import Providers from './providers/Providers';
import NavbarYGO from '../components/NavbarYGO';
import CyberFlickerCanvas from '../components/CyberFlickerCanvas';

export const metadata = {
  title: 'ErreGeTeYGO | Yu-Gi-Oh! Deck Builder Studio & Metagame Hub',
  description: 'Yu-Gi-Oh! deck builder, live format regulation telemetry, and community discussion hub.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="md-theme-bg text-white">
        <CyberFlickerCanvas />
        {/* ⚡ All pages (including /deckbuilder) MUST be inside <Providers> */}
        <Providers>
          <NavbarYGO />
          <main>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}