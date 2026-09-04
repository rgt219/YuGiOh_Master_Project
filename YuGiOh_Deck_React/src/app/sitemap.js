export default async function sitemap() {
  const baseUrl = 'https://erregeteygo.com';

  // 1. DEFINE STATIC ROUTES
  const staticRoutes = [
    { url: baseUrl, priority: 1.0, changeFrequency: 'weekly' },
    { url: `${baseUrl}/home`, priority: 0.8, changeFrequency: 'weekly' },
    { url: `${baseUrl}/marketwatch`, priority: 0.9, changeFrequency: 'daily' },
    { url: `${baseUrl}/market-listings`, priority: 0.9, changeFrequency: 'daily' },
    { url: `${baseUrl}/meta-decks`, priority: 0.9, changeFrequency: 'daily' },
    { url: `${baseUrl}/cardsearch`, priority: 0.8, changeFrequency: 'weekly' },
    { url: `${baseUrl}/deckbuilder`, priority: 0.8, changeFrequency: 'monthly' },
    { url: `${baseUrl}/banlist`, priority: 0.7, changeFrequency: 'monthly' },
    { url: `${baseUrl}/community`, priority: 0.7, changeFrequency: 'daily' },
    { url: `${baseUrl}/competitivediscussion`, priority: 0.7, changeFrequency: 'daily' },
    { url: `${baseUrl}/generaldiscussion`, priority: 0.7, changeFrequency: 'daily' },
    { url: `${baseUrl}/packsimulator`, priority: 0.6, changeFrequency: 'monthly' },
    { url: `${baseUrl}/about`, priority: 0.5, changeFrequency: 'yearly' },
    { url: `${baseUrl}/contact`, priority: 0.5, changeFrequency: 'yearly' },
  ].map((route) => ({
    url: route.url,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  let dynamicRoutes = [];

  // 2. FETCH DYNAMIC ROUTES (Sets AND Cards)
  try {
    const MARKET_API = process.env.NEXT_PUBLIC_MARKET_API_URL;
    
    // Fetch all sets
    const setsResponse = await fetch(`${MARKET_API}/api/market/sets?page=1&limit=500`);
    
    if (setsResponse.ok) {
      const sets = await setsResponse.json();
      
      // We use a standard for...of loop here instead of Promise.all() to prevent 
      // spamming your Azure Container API with 100+ simultaneous database requests during build time.
      for (const set of sets) {
        const formattedSetName = encodeURIComponent(set.setName); 
        
        // Add the Set Route
        dynamicRoutes.push({
          url: `${baseUrl}/market-listings/${formattedSetName}`,
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: 0.8,
        });

        try {
          // Fetch the cards for this specific set
          // ⚠️ NOTE: Ensure this URL matches your actual C# controller route for GetLatestCardsBySetAsync
          const cardsResponse = await fetch(`${MARKET_API}/api/market/sets/${formattedSetName}/cards`);
          
          if (cardsResponse.ok) {
            const cards = await cardsResponse.json();
            
            for (const card of cards) {
              const formattedCardName = encodeURIComponent(card.cardName);
              
              // Add the individual Card Route
              dynamicRoutes.push({
                url: `${baseUrl}/market-listings/${formattedSetName}/${formattedCardName}`,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 0.6, // Slightly lower priority than the set page itself
              });
            }
          }
        } catch (cardErr) {
          console.warn(`Could not fetch cards for set ${set.setName}:`, cardErr);
        }
      }
    }
  } catch (error) {
    console.error("Failed to generate dynamic sitemap routes:", error);
  }

  // 3. COMBINE AND RETURN
  return [...staticRoutes, ...dynamicRoutes];
}