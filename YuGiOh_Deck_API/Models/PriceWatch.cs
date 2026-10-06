using System.Text.Json.Serialization;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace YuGiOhDeckApi.Models
{
    [BsonIgnoreExtraElements]
    public class PriceWatch
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("userId")]
        public string UserId { get; set; } = string.Empty;

        [BsonElement("productId")]
        public int ProductId { get; set; }

        [BsonElement("cardName")]
        public string CardName { get; set; } = string.Empty;

        [BsonElement("setName")]
        public string SetName { get; set; } = string.Empty;

        [BsonElement("rarity")]
        public string Rarity { get; set; } = string.Empty;

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; }
    }

    public class TrackCardRequest
    {
        public string CardName { get; set; } = string.Empty;
        public string SetName { get; set; } = string.Empty;
        public string Rarity { get; set; } = string.Empty;
    }
}
