using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace YuGiOhDeckApi.Models
{
    // One row per (user, product): "this user wants to hear when this card's price drops".
    // ProductId is the TCGPlayer product id the market pages use. Every printing and rarity of a card has its own,
    // so a user tracks one specific printing (e.g. the Prismatic Secret Rare), not "the card" in general.
    [BsonIgnoreExtraElements]
    public class PriceWatch
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        // "{userId}:{productId}", e.g. "340582:703787". A UNIQUE index on this one field is what stops a user tracking
        // the same card twice. (A unique index over two fields, userId + productId, is not reliable on Cosmos DB's
        // Mongo API: it also ends up enforcing "one row per userId", which would limit each user to one tracked card.)
        [BsonElement("key")]
        public string Key { get; set; } = string.Empty;

        public static string BuildKey(string userId, int productId) => $"{userId}:{productId}";

        [BsonElement("userId")]
        public string UserId { get; set; } = string.Empty;

        [BsonElement("productId")]
        public int ProductId { get; set; }

        // Copied in when the card is tracked, so a notification can name the card without another lookup.
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