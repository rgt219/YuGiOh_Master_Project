using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace YuGiOhDeckApi.Models
{
    [BsonIgnoreExtraElements]
    public class NewsArticle
    {
        [BsonId]
        [BsonRepresentation(BsonType.String)]
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty; // We will map the URL to this ID

        [BsonElement("title")]
        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [BsonElement("source")]
        [JsonPropertyName("source")]
        public string Source { get; set; } = string.Empty; // e.g., "YGOrganization"

        [BsonElement("author")]
        [JsonPropertyName("author")]
        public string Author { get; set; } = string.Empty;

        [BsonElement("description")]
        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [BsonElement("url")]
        [JsonPropertyName("url")]
        public string Url { get; set; } = string.Empty;

        [BsonElement("imageUrl")]
        [JsonPropertyName("imageUrl")]
        public string ImageUrl { get; set; } = string.Empty;

        [BsonElement("publishedDate")]
        [JsonPropertyName("publishedDate")]
        public DateTime PublishedDate { get; set; }

        [BsonElement("categories")]
        [JsonPropertyName("categories")]
        public List<string> Categories { get; set; } = new();
    }
}