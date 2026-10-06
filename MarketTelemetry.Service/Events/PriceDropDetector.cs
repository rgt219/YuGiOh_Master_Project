using MarketTelemetry.Service.Models;

namespace MarketTelemetry.Service.Events
{
    // Decides whether a change in price is worth telling someone about.
    // It is a plain static function: no database, no network, no clock. Give it two prices, get an answer.
    // That is what makes it trivial to test, and easy to tune later without touching the worker.
    public static class PriceDropDetector
    {
        // A drop must be BOTH at least 5% AND at least 25 cents.
        // Percent alone would alert on a 10-cent common going to 9 cents (10%); the minimum amount alone
        // would ignore a real change on a cheap card. Requiring both removes the noise from either side.
        public const decimal MinDropPercent = 0.05m;
        public const decimal MinDropAmount = 0.25m;

        /// <summary>
        /// Returns a PriceDropEvent when <paramref name="current"/> is meaningfully cheaper than
        /// <paramref name="previous"/>, otherwise null.
        /// </summary>
        public static PriceDropEvent? Detect(MarketSnapshot? previous, MarketSnapshot current, DateTime observedAt)
        {
            // No history yet (first time we have seen this card): nothing to compare against.
            if (previous?.MarketPrice is not decimal oldPrice) return null;

            // TCGplayer reports no price for cards with no listings. That is "missing data", not "free".
            if (current.MarketPrice is not decimal newPrice) return null;
            if (oldPrice <= 0 || newPrice <= 0) return null;

            var drop = oldPrice - newPrice;
            if (drop <= 0) return null;                                  // same price or more expensive
            if (drop < MinDropAmount) return null;                       // too small in dollars
            if (drop / oldPrice < MinDropPercent) return null;           // too small in percent

            return new PriceDropEvent(
                EventId: PriceDropEvent.BuildEventId(current.ProductId, observedAt),
                ProductId: current.ProductId,
                CardName: current.CardName,
                SetName: current.SetName,
                Rarity: current.Rarity,
                OldPrice: oldPrice,
                NewPrice: newPrice,
                ObservedAt: observedAt);
        }
    }
}