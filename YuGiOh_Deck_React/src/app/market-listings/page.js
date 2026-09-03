import MarketListings from '@/app/market-listings/MarketListings';

export const metadata = {
  title: 'Market Listings | ErreGeTe YGO',
  description: 'Browse all Yu-Gi-Oh! booster sets and explore real-time market telemetry.',
};

export default function Page() {
  return <MarketListings />;
}