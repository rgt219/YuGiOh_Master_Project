using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MarketTelemetry.Service.Models
{
    [BsonIgnoreExtraElements]
    public class SetCatalog
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        [BsonIgnoreIfDefault]
        public string? Id { get; set; }

        [BsonElement("groupId")]
        public int GroupId { get; set; }

        [BsonElement("setName")]
        public string SetName { get; set; } = string.Empty;

        [BsonElement("abbreviation")]
        public string? Abbreviation { get; set; }

        [BsonElement("imageUrl")]
        public string ImageUrl { get; set; } = string.Empty;
    }
}