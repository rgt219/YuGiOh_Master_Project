using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson;
using System.Text.Json.Serialization;

namespace YuGiOhDeckApi.Models
{
    public class Card
    {
        [BsonElement("id")]
        [JsonPropertyName("id")]
        public string? CardId { get; set; }

        [BsonElement("name")]
        [JsonPropertyName("name")]
        public string? CardName { get; set; }

        [BsonElement("type")]
        [JsonPropertyName("type")]
        public string? Type { get; set; }

        [BsonElement("frameType")]
        [JsonPropertyName("frameType")]
        public string? FrameType { get; set; }

        [BsonElement("desc")]
        [JsonPropertyName("desc")]
        public string? Effect { get; set; }

        [BsonElement("atk")]
        [JsonPropertyName("atk")]
        public int AttackPoints { get; set; }

        [BsonElement("def")]
        [JsonPropertyName("def")]
        public int DefensePoints { get; set; }

        [BsonElement("level")]
        [JsonPropertyName("level")]
        public int Level { get; set; }

        [BsonElement("race")]
        [JsonPropertyName("race")]
        public string? Race { get; set; }

        [BsonElement("attribute")]
        [JsonPropertyName("attribute")]
        public string? Attribute { get; set; }

        [BsonElement("image")]
        [JsonPropertyName("image")]
        public string? Image { get; set; }
    }
}
