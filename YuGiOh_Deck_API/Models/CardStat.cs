using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace YuGiOhDeckApi.Models
{
    [BsonIgnoreExtraElements]
    public class CardStat
    {
        [BsonId]
        [BsonRepresentation(BsonType.String)] // Maps C# CardId <-> Mongo "_id"
        public string CardId { get; set; } = string.Empty;

        [BsonElement("CardName")]
        public string? CardName { get; set; }

        [BsonElement("TotalUsage")]
        // 🚀 Safely converts both legacy string "1500" and integer 1500 into C# int
        [BsonRepresentation(BsonType.Int32, AllowOverflow = true, AllowTruncation = true)]
        public int TotalUsage { get; set; }

        [BsonElement("LastSeen")]
        public DateTime LastSeen { get; set; }

        [BsonElement("LastUpdated")]
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

        [BsonElement("DailyUsage")]
        public Dictionary<string, int> DailyUsage { get; set; } = new Dictionary<string, int>();
    }
}