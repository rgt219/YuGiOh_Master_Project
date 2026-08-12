using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace YuGiOhDeckApi.Models
{
    public class MasterDuelBanListResponse
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("format")]
        public string Format { get; set; } = string.Empty;

        [BsonElement("source")]
        public string Source { get; set; } = string.Empty;

        [BsonElement("updateAt")]
        public DateTime UpdatedAt { get; set; }

        [BsonElement("count")]
        public int Count { get; set; }

        [BsonElement("cards")]
        public List<MasterDuelBanListEntry> Cards { get; set; } = new();
    }

    public class MasterDuelBanListEntry
    {

        [BsonElement("name")]
        public string Name { get; set; } = string.Empty;

        [BsonElement("status")]
        public string Status { get; set; } = string.Empty;
    }

}
