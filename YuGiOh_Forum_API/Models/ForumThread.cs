using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace YuGiOh_Forum_API.Models
{
    public class ForumThread
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("category")] // ⚡ Required for Cosmos DB Shard Key matching!
        public string Category { get; set; } = "general";

        [BsonElement("tag")]
        public string Tag { get; set; } = "GENERAL";

        [BsonElement("title")]
        public string Title { get; set; } = string.Empty;

        [BsonElement("content")]
        public string Content { get; set; } = string.Empty;

        [BsonElement("author")]
        public string Author { get; set; } = string.Empty;

        [BsonElement("upvotes")]
        public int Upvotes { get; set; } = 1;

        [BsonElement("upvotedBy")]
        public List<string> UpvotedBy { get; set; } = new();

        [BsonElement("downvotedBy")]
        public List<string> DownvotedBy { get; set; } = new();

        [BsonElement("commentCount")]
        public int CommentCount { get; set; } = 0;

        [BsonElement("hotScore")]
        public double HotScore { get; set; } = 0.0;

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("comments")]
        public List<ForumComment> Comments { get; set; } = new();
    }

    public class ForumComment
    {
        [BsonElement("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [BsonElement("author")]
        public string Author { get; set; } = string.Empty;

        [BsonElement("text")]
        public string Text { get; set; } = string.Empty;

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class VoteRequest
    {
        public string Username { get; set; } = string.Empty;
        public string VoteType { get; set; } = "up"; // "up" or "down"
    }
}