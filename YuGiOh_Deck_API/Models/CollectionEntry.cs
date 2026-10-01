using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace YuGiOhDeckApi.Models
{
    // One row per (user, card): "this user owns N copies of this card".
    [BsonIgnoreExtraElements]
    public class CollectionEntry
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("userId")]
        public string UserId { get; set; } = string.Empty;

        [BsonElement("cardId")]
        public int CardId { get; set; }

        [BsonElement("quantity")]
        public int Quantity { get; set; }

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; }
    }

    public class SetQuantityRequest
    {
        public int Quantity { get; set; }
    }
}