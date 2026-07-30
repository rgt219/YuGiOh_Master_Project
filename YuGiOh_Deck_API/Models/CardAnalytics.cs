using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Text.Json.Serialization;

namespace YuGiOhDeckApi.Models
{
    public class CardAnalytics
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("cardId")]
        [JsonPropertyName("cardId")]
        public string CardId { get; set; } = string.Empty;

        [BsonElement("format")]
        [JsonPropertyName("format")]
        public string Format { get; set; } = string.Empty;

        [BsonElement("deckCount")]
        [JsonPropertyName("deckCount")]
        public int DeckCount { get; set; }

        [BsonElement("totalDecksInFormat")]
        [JsonPropertyName("totalDecksInFormat")]
        public int TotalDecksInFormat { get; set; }

        [BsonElement("inclusionRate")]
        [JsonPropertyName("inclusionRate")]
        public double InclusionRate { get; set; }

        [BsonElement("totalCopies")]
        [JsonPropertyName("totalCopies")]
        public int TotalCopies { get; set; }

        [BsonElement("avgCopies")]
        [JsonPropertyName("avgCopies")]
        public double AvgCopies { get; set; }

        [BsonElement("lastUpdated")]
        [JsonPropertyName("lastUpdated")]
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }
}