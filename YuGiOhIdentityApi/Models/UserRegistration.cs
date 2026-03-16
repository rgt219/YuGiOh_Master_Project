using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson;
using System.Text.Json.Serialization;

namespace YuGiOhIdentityApi.Models
{
    public class UserRegistration
    {
        [BsonId]
        [BsonRepresentation(BsonType.Int32)]
        public int? Id { get; set; }

        [BsonElement("userName")]
        [JsonPropertyName("userName")]
        public string? UserName { get; set; }

        [BsonElement("firstName")]
        [JsonPropertyName("firstName")]
        public string? FirstName { get; set; }

        [BsonElement("lastName")]
        [JsonPropertyName("lastName")]
        public string? LastName { get; set; }

        [BsonElement("email")]
        [JsonPropertyName("email")]
        public string? Email { get; set; }

        [BsonElement("password")]
        [JsonPropertyName("password")]
        public string? Password { get; set; }

    }
}
