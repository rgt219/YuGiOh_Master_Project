using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Collections.Generic;
using System;

namespace YuGiOhDeckApi.Models
{
    public class DeckPlaylist
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public required string Id { get; set; }

        [BsonElement("userId")]
        public required string UserId { get; set; }

        [BsonElement("title")]
        public required string Title { get; set; }

        [BsonElement("description")]
        public string? Description { get; set; }

        [BsonElement("deckIds")]
        public List<string> DeckIds { get; set; } = new List<string>();

        [BsonElement("isPublic")]
        public bool IsPublic { get; set; } = false;

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("coverCardId")]
        public string? CoverCardId { get; set; }

    }
}
