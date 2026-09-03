import CardTelemetry from '@/app/market-listings/[setName]/[cardName]/CardTelemetry';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const cardName = decodeURIComponent(resolvedParams.cardName);
  return {
    title: `${cardName} Market Price History | ErreGeTe YGO`,
    description: `View historical market telemetry, low prices, and trends for ${cardName}.`,
  };
}

export default async function Page({ params }) {
  const resolvedParams = await params;
  return <CardTelemetry setName={resolvedParams.setName} cardName={resolvedParams.cardName} />;
}