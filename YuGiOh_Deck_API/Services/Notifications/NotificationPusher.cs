using Microsoft.AspNetCore.SignalR;
using YuGiOhDeckApi.Hubs;
using YuGiOhDeckApi.Models;

namespace YuGiOhDeckApi.Notifications
{
    // "Show this notification to this user right now, if they happen to be online."
    // The notification is ALREADY saved by the time this is called, so pushing is a bonus:
    // a user who is offline simply sees it in the bell the next time they open the site.
    public interface INotificationPusher
    {
        Task PushAsync(string userId, Notification notification, CancellationToken cancellationToken = default);
    }

    public sealed class SignalRNotificationPusher : INotificationPusher
    {
        // The browser listens for this event name (Step 6 on the frontend). Keep the two in sync.
        public const string EventName = "ReceiveNotification";

        private readonly IHubContext<NotificationHub> _hub;
        public SignalRNotificationPusher(IHubContext<NotificationHub> hub) => _hub = hub;

        public Task PushAsync(string userId, Notification notification, CancellationToken cancellationToken = default) =>
            _hub.Clients
                .Group(NotificationHub.GroupFor(userId))   // only this user's own connections are in this group
                .SendAsync(EventName, new
                {
                    // Same shape as one item from GET /api/Notifications, so the bell can treat both the same way.
                    id = notification.Id,
                    type = notification.Type,
                    title = notification.Title,
                    message = notification.Message,
                    link = notification.Link,
                    createdAt = notification.CreatedAt,
                    read = false
                }, cancellationToken);
    }
}