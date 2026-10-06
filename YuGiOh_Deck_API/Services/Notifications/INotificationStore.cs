using YuGiOhDeckApi.Models;

namespace YuGiOhDeckApi.Notifications
{
    // Everything the rest of the app is allowed to do with notifications.
    // It is deliberately NOT part of IMongoDbService: the notification code only talks to this small contract,
    // so it can be moved into its own service later without touching the callers.
    public interface INotificationStore
    {
        /// <summary>
        /// Saves a notification unless one with the same (UserId, EventId) already exists.
        /// Returns true if it was new, false if it was a duplicate delivery of an event we already handled.
        /// </summary>
        Task<bool> AddIfNewAsync(Notification notification);

        /// <summary>The user's newest notifications, newest first.</summary>
        Task<List<Notification>> GetRecentAsync(string userId, int limit);

        /// <summary>How many of the user's notifications are still unread (the number on the bell).</summary>
        Task<long> CountUnreadAsync(string userId);

        /// <summary>Marks one notification read. Returns false if it doesn't exist or belongs to someone else.</summary>
        Task<bool> MarkReadAsync(string userId, string notificationId);

        /// <summary>Marks all of the user's unread notifications read. Returns how many changed.</summary>
        Task<long> MarkAllReadAsync(string userId);
    }
}