using MongoDB.Driver;
using YuGiOh_Forum_API.Models;

namespace YuGiOh_Forum_API.Services
{
    public class ForumDbService
    {
        private readonly IMongoCollection<ForumThread> _threads;

        public ForumDbService(IConfiguration config)
        {
            var connString = config["MongoDB:ConnectionString"]
                          ?? config["MongoDB__ConnectionString"]
                          ?? throw new InvalidOperationException("MongoDB connection string missing.");

            var client = new MongoClient(connString);
            var database = client.GetDatabase("YuGiOhForums");
            _threads = database.GetCollection<ForumThread>("ForumThreads");
        }

        public async Task<List<ForumThread>> GetThreadsByCategoryAsync(string category) =>
            await _threads.Find(t => t.Category == category.ToLower())
                          .SortByDescending(t => t.CreatedAt)
                          .Limit(50)
                          .ToListAsync();

        public async Task<ForumThread?> GetThreadByIdAsync(string id) =>
            await _threads.Find(t => t.Id == id).FirstOrDefaultAsync();

        public async Task CreateThreadAsync(ForumThread thread) =>
            await _threads.InsertOneAsync(thread);

        public async Task UpvoteThreadAsync(string id)
        {
            var update = Builders<ForumThread>.Update.Inc(t => t.Upvotes, 1);
            await _threads.UpdateOneAsync(t => t.Id == id, update);
        }

        public async Task AddCommentAsync(string threadId, ForumComment comment)
        {
            var update = Builders<ForumThread>.Update
                .Push(t => t.Comments, comment)
                .Inc(t => t.CommentCount, 1);

            await _threads.UpdateOneAsync(t => t.Id == threadId, update);
        }

        public async Task VoteThreadAsync(string threadId, string username, string voteType)
        {
            var thread = await GetThreadByIdAsync(threadId);
            if (thread == null) return;

            bool hasUpvoted = thread.UpvotedBy.Contains(username);
            bool hasDownvoted = thread.DownvotedBy.Contains(username);

            var updateBuilder = Builders<ForumThread>.Update;
            var updates = new List<UpdateDefinition<ForumThread>>();

            if (voteType == "up")
            {
                if (hasUpvoted)
                {
                    // Toggle OFF upvote
                    updates.Add(updateBuilder.Pull(t => t.UpvotedBy, username));
                    updates.Add(updateBuilder.Inc(t => t.Upvotes, -1));
                }
                else
                {
                    // Add upvote
                    updates.Add(updateBuilder.AddToSet(t => t.UpvotedBy, username));
                    updates.Add(updateBuilder.Inc(t => t.Upvotes, 1));

                    // If user previously downvoted, remove from downvoted list
                    if (hasDownvoted)
                    {
                        updates.Add(updateBuilder.Pull(t => t.DownvotedBy, username));
                    }
                }
            }
            else if (voteType == "down")
            {
                if (hasDownvoted)
                {
                    // Toggle OFF downvote
                    updates.Add(updateBuilder.Pull(t => t.DownvotedBy, username));
                }
                else
                {
                    // Add downvote
                    updates.Add(updateBuilder.AddToSet(t => t.DownvotedBy, username));

                    // If user previously upvoted, remove upvote and decrease count
                    if (hasUpvoted)
                    {
                        updates.Add(updateBuilder.Pull(t => t.UpvotedBy, username));
                        updates.Add(updateBuilder.Inc(t => t.Upvotes, -1));
                    }
                }
            }

            if (updates.Count > 0)
            {
                await _threads.UpdateOneAsync(t => t.Id == threadId, updateBuilder.Combine(updates));
            }
        }
    }
}