namespace MarketTelemetry.Service.Events
{
    // The message the market worker publishes when a tracked card gets cheaper.
    // This is the ONLY thing the market service and the Deck API share: a JSON message, not code or tables.
    // Keep it small, keep it stable, and add fields rather than renaming them (old messages may still be in the queue).
    public sealed record PriceDropEvent(
        string EventId,
        int ProductId,
        string CardName,
        string SetName,
        string Rarity,
        decimal OldPrice,
        decimal NewPrice,
        DateTime ObservedAt)
    {
        // Which Event Hub (Kafka topic) these messages go to.
        public const string Topic = "price-drops";

        // Lets a consumer tell message kinds apart if more topics are merged later.
        public string Type { get; init; } = "PriceDrop";

        // Bump this when the shape changes in a way old readers can't handle.
        public int SchemaVersion { get; init; } = 1;

        // The same card seen dropping on the same day always gets the same id. If the worker restarts and publishes it
        // twice, or Event Hubs delivers it twice, the Deck API sees the same EventId and saves only one notification.
        public static string BuildEventId(int productId, DateTime observedAt) =>
            $"price-drop:{productId}:{observedAt:yyyy-MM-dd}";
    }
}