import NewsGrid from './NewsGrid';
import 'bootstrap/dist/css/bootstrap.min.css';

// Fetch the data server-side
async function getNews() {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5276';
    const targetUrl = new URL('/api/news?limit=24', API_URL).toString();
    
    const res = await fetch(targetUrl, {
      next: { revalidate: 1800 }
    });
    
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Failed to fetch news:", error);
    return [];
  }
}

export default async function NewsPage() {
  const articles = await getNews();

  return (
    <div style={{ backgroundColor: '#06080c', minHeight: '100vh', padding: '100px 20px 60px', fontFamily: "'Cascadia Mono', monospace" }}>
      <div className="container-xl">
        
        {/* Header matches MarketListings aesthetic */}
        <div className="mb-5 border-bottom border-info border-opacity-25 pb-4">
          <h2 className="text-info fw-bold mb-0 cascadia-font" style={{ letterSpacing: '1px', textShadow: '0 0 12px rgba(0, 210, 255, 0.4)' }}>
            YU-GI-OH! NEWS HUB
          </h2>
          <p className="text-white-50 mt-2 mb-0">The latest updates, banlists, and articles from across the community.</p>
        </div>

        {/* Client Component Grid */}
        <NewsGrid articles={articles} />
        
      </div>
    </div>
  );
}