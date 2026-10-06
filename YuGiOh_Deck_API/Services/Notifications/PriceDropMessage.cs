namespace YuGiOhDeckApi.Notifications
{
    // What the Deck API expects to find inside a message on the "price-drops" event hub.
    // This is the READING side of the contract. The market service has its own PriceDropEvent for the writing side.
    // The two classes share nothing but the JSON field names, which is what keeps the services independent.
    // Extra fields in the JSON are ignored, so the market service can add fields without breaking this one.
    public sealed class PriceDropMessage
    {
        public string EventId { get; set; } = string.Empty;
        public int ProductId { get; set; }
        public string CardName { get; set; } = string.Empty;
        public string SetName { get; set; } = string.Empty;
        public string Rarity { get; set; } = string.Empty;
        public decimal OldPrice { get; set; }
        public decimal NewPrice { get; set; }
        public DateTime ObservedAt { get; set; }
        public string Type { get; set; } = string.Empty;
        public int SchemaVersion { get; set; }

        /// <summary>
        /// A message from outside is not trusted. This is the "is it sane?" check done before anything is saved.
        /// </summary>
        public bool IsValid(out string problem)
        {
            if (string.IsNullOrWhiteSpace(EventId)) { problem = "missing eventId"; return false; }
            if (ProductId <= 0) { problem = "invalid productId"; return false; }
            if (string.IsNullOrWhiteSpace(CardName)) { problem = "missing cardName"; return false; }
            if (OldPrice <= 0 || NewPrice <= 0) { problem = "prices must be positive"; return false; }
            if (NewPrice >= OldPrice) { problem = "not a drop (new price is not lower)"; return false; }

            problem = string.Empty;
            return true;
        }
    }
}