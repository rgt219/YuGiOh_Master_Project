using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
using YuGiOhDeckApi.Models;

namespace YuGiOhDeckApi.Notifications
{
    public class MongoNotificationStore : INotificationStore
    {
        private readonly IMongoCollection<Notification> _notifications;

        public MongoNotificationStore(IOptions<MongoDBSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionURI);
            var database = client.GetDatabase(settings.Value.DatabaseName);
            _notifications = database.GetCollection<Notification>("Notifications");

            try
            {
                // The last line of defence against duplicate alerts: the same event can only be saved once per user.
                var perEvent = Builders<Notification>.IndexKeys.Ascending(n => n.UserId).Ascending(n => n.EventId);
                _notifications.Indexes.CreateOne(new CreateIndexModel<Notification>(perEvent, new CreateIndexOptions { Unique = true }));

                // Speeds up "my newest notifications".
                var newestFirst = Builders<Notification>.IndexKeys.Ascending(n => n.UserId).Descending(n => n.CreatedAt);
                _notifications.Indexes.CreateOne(new CreateIndexModel<Notification>(newestFirst));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[INDEX_CREATION_WARNING]: {ex.Message}");
            }
        }

        public async Task<bool> AddIfNewAsync(Notification notification)
        {
            if (notification.CreatedAt == default) notification.CreatedAt = DateTime.UtcNow;
            notification.Id = null; // let MongoDB create the id

            try
            {
                await _notifications.InsertOneAsync(notification);
                return true;
            }
            catch (MongoWriteException ex) when (ex.WriteError.Category == ServerErrorCategory.DuplicateKey || ex.WriteError.Code == 11000)
            {
                // The unique index says we already saved this event for this user. Not an error: that's the point.
                return false;
            }
        }

        public async Task<List<Notification>> GetRecentAsync(string userId, int limit) =>
            await _notifications.Find(n => n.UserId == userId)
                                .SortByDescending(n => n.CreatedAt)
                                .Limit(limit)
                                .ToListAsync();

        public async Task<long> CountUnreadAsync(string userId) =>
            await _notifications.CountDocumentsAsync(n => n.UserId == userId && n.ReadAt == null);

        public async Task<bool> MarkReadAsync(string userId, string notificationId)
        {
            // A made-up id such as "abc" can't match anything, and would throw if we passed it to the driver.
            if (!ObjectId.TryParse(notificationId, out _)) return false;

            var now = DateTime.UtcNow;
            var result = await _notifications.UpdateOneAsync(
                n => n.Id == notificationId && n.UserId == userId && n.ReadAt == null,
                Builders<Notification>.Update.Set(n => n.ReadAt, now));
            if (result.ModifiedCount > 0) return true;

            // Nothing changed: either it was already read (still a success) or it isn't this user's.
            return await _notifications.CountDocumentsAsync(n => n.Id == notificationId && n.UserId == userId) > 0;
        }

        public async Task<long> MarkAllReadAsync(string userId)
        {
            var result = await _notifications.UpdateManyAsync(
                n => n.UserId == userId && n.ReadAt == null,
                Builders<Notification>.Update.Set(n => n.ReadAt, DateTime.UtcNow));
            return result.ModifiedCount;
        }
    }
}