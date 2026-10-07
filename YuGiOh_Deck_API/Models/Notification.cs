using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace YuGiOhDeckApi.Models
{
    // One row per message shown in a user's notification bell.
    // Today the only Type is "PriceDrop", but the shape is generic on purpose: a ban list change
    // or a meta shift can become another Type later without a new collection or a new endpoint.
    [BsonIgnoreExtraElements]
    public class Notification
    {
        public const string PriceDrop = "PriceDrop";

        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        // Who the message is for. Always filtered by the userId in the login token, never by the request.
        [BsonElement("userId")]
        public string UserId { get; set; } = string.Empty;

        [BsonElement("type")]
        public string Type { get; set; } = string.Empty;

        [BsonElement("title")]
        public string Title { get; set; } = string.Empty;

        [BsonElement("message")]
        public string Message { get; set; } = string.Empty;

        // Where the bell should link to when clicked (e.g. the card's market page). Optional.
        [BsonElement("link")]
        public string? Link { get; set; }

        // Identifies the EVENT that caused this notification (for a price drop: the product plus the day it was seen).
        // The same event delivered twice produces the same EventId, and a unique index on (userId, eventId)
        // turns the second delivery into a no-op. This is what makes the consumer safe to retry.
        [BsonElement("eventId")]
        public string EventId { get; set; } = string.Empty;

        // "{userId}|{eventId}". A UNIQUE index on this single field blocks a second copy of the same alert for a user.
        // Set by the store, never by callers. (Single field on purpose: see PriceWatch.Key.)
        [BsonElement("dedupeKey")]
        public string DedupeKey { get; set; } = string.Empty;

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; }

        // null = unread. A date means the user has seen it.
        [BsonElement("readAt")]
        [BsonIgnoreIfNull]
        public DateTime? ReadAt { get; set; }
    }
}