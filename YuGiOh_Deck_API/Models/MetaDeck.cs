using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace YuGiOhDeckApi.Models
{
    public class MetaDeck
    {
        [BsonId]
        [BsonRepresentation(BsonType.String)]
        [JsonPropertyName("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [BsonElement("archetype")]
        [JsonPropertyName("archetype")]
        public string Archetype { get; set; } = string.Empty;

        [BsonElement("format")]
        [JsonPropertyName("format")]
        public string Format { get; set; } = string.Empty;

        [BsonElement("tier")]
        [JsonPropertyName("tier")]
        public string Tier { get; set; } = "Tier 1";

        [BsonElement("representationPercentage")]
        [JsonPropertyName("representationPercentage")]
        public double RepresentationPercentage { get; set; }

        [BsonElement("sampleDeck")]
        [JsonPropertyName("sampleDeck")]
        public DeckList SampleDeck { get; set; } = new DeckList();

        [BsonElement("lastUpdated")]
        [JsonPropertyName("lastUpdated")]
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }
}