using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MarketTelemetry.Service.Models
{
    [BsonIgnoreExtraElements]
    public class MarketSnapshot
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        [BsonIgnoreIfDefault]
        public string? Id { get; set; }

        [BsonElement("productId")]
        public int ProductId { get; set; }

        [BsonElement("cardName")]
        public string CardName { get; set; } = string.Empty;

        [BsonElement("setName")]
        public string SetName { get; set; } = string.Empty;

        [BsonElement("rarity")]
        public string Rarity { get; set; } = string.Empty;

        [BsonElement("lowPrice")]
        public decimal? LowPrice { get; set; }

        [BsonElement("marketPrice")]
        public decimal? MarketPrice { get; set; }

        [BsonElement("listedMedian")]
        public decimal? ListedMedian { get; set; }

        [BsonElement("highPrice")]
        public decimal? HighPrice { get; set; }

        [BsonElement("timestamp")]
        public DateTime Timestamp { get; set; }
    }
}