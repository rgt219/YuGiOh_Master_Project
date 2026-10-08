using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;


namespace YuGiOhDeckApi.Models
{
    [BsonIgnoreExtraElements]
    public class DeckNote
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        // "{userId}:{deckId}". A UNIQUE index on this one field enforces "one note per user per deck".
        [BsonElement("key")]
        public string Key { get; set; } = string.Empty;

        public static string BuildKey(string userId, string deckId) => $"{userId}:{deckId}";

        [BsonElement("userId")]
        public string UserId { get; set; } = string.Empty;

        [BsonElement("deckId")]
        public string DeckId { get; set; } = string.Empty;

        [BsonElement("notes")]
        public string Notes { get; set; } = string.Empty;

        [BsonElement("tags")]
        public List<string> Tags { get; set; } = new();

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; }
    }

    public class SaveDeckNoteRequest
    {
        public string? Notes { get; set; }
        public List<string>? Tags { get; set; }
    }
}