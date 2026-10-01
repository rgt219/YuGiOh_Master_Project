import CardCreator from './CardCreator';
import 'bootstrap/dist/css/bootstrap.min.css';

export const metadata = {
  title: 'Card Creator | ErreGeTe YGO',
  description: 'Design and export custom Yu-Gi-Oh! cards',
};

export default function CardCreatorPage() {
  return (
    <div style={{ backgroundColor: '#06080c', minHeight: '100vh', padding: '100px 20px 60px', fontFamily: "'Cascadia Mono', monospace" }}>
      <div className="container-xl">
        
        {/* Terminal Header */}
        <div className="mb-4 border-bottom border-info border-opacity-25 pb-4">
          <h2 className="text-info fw-bold mb-0 cascadia-font" style={{ letterSpacing: '1px', textShadow: '0 0 12px rgba(0, 210, 255, 0.4)' }}>
            CARD CREATOR
          </h2>
          <p className="text-white-50 mt-2 mb-0">Generate, customize, and export holographic card assets.</p>
        </div>

        {/* The Interactive Client Component */}
        <CardCreator />
        
      </div>
    </div>
  );
}