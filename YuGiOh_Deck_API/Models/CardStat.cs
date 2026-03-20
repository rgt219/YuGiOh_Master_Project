using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace YuGiOhDeckApi.Models
{
    public class CardStat
    {
        [BsonId]
        public string CardId { get; set; } = string.Empty;

        [BsonElement("TotalUsage")]
        public int TotalUsage { get; set; }

        [BsonElement("LastSeen")]
        public DateTime LastSeen { get; set; }

        [BsonElement("CardName")]
        public string? CardName { get; set; }

        [BsonElement("LastUpdated")]
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }
}