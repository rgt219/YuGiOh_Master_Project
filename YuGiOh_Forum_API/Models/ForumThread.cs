using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace YuGiOh_Forum_API.Models
{
    public class ForumThread
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        public string Category { get; set; } = "general"; // "general" or "competitive"
        public string Tag { get; set; } = "GENERAL";
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;

        public int Upvotes { get; set; } = 1;
        public int CommentCount { get; set; } = 0;
        public double HotScore { get; set; } = 0.0; // Computed by Go worker

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<ForumComment> Comments { get; set; } = new();
    }

    public class ForumComment
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Author { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}