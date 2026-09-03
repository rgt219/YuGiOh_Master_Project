import SetCards from '@/app/market-listings/[setName]/SetCards';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const setName = decodeURIComponent(resolvedParams.setName);
  return {
    title: `${setName} Card Prices | ErreGeTe YGO`,
    description: `Explore live market telemetry and card prices for ${setName}.`,
  };
}

export default async function Page({ params }) {
  const resolvedParams = await params;
  return <SetCards setName={resolvedParams.setName} />;
}