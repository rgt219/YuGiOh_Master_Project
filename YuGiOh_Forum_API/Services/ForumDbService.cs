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
    }
}