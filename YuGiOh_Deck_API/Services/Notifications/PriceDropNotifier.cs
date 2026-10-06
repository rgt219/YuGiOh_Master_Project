using System.Globalization;
using YuGiOhDeckApi.Models;
using YuGiOhDeckApi.Repositories;

namespace YuGiOhDeckApi.Notifications
{
    // The heart of Step 5. Given one price drop, it turns it into one notification per user who tracks that card.
    // It knows nothing about Kafka or SignalR: the message comes in as an object, and the store and pusher are interfaces.
    // That is what makes it easy to test, and it is why the Kafka consumer (File 6) can be so small.
    public class PriceDropNotifier
    {
        private readonly IMongoDbService _db;
        private readonly INotificationStore _store;
        private readonly INotificationPusher _pusher;
        private readonly ILogger<PriceDropNotifier> _logger;

        public PriceDropNotifier(IMongoDbService db, INotificationStore store, INotificationPusher pusher, ILogger<PriceDropNotifier> logger)
        {
            _db = db;
            _store = store;
            _pusher = pusher;
            _logger = logger;
        }

        /// <summary>Returns how many NEW notifications were created (repeats of an already-handled event don't count).</summary>
        public async Task<int> HandleAsync(PriceDropMessage message, CancellationToken cancellationToken = default)
        {
            // Messages come from outside, so check before trusting. A bad one is logged and skipped, never retried forever.
            if (!message.IsValid(out var problem))
            {
                _logger.LogWarning("Skipping invalid price drop message ({Problem}). EventId: {EventId}", problem, message.EventId);
                return 0;
            }

            var userIds = await _db.GetWatcherUserIdsAsync(message.ProductId);
            var created = 0;

            foreach (var userId in userIds.Distinct())
            {
                var notification = Build(userId, message);

                // 1. SAVE first. The unique (userId, eventId) index means a repeat delivery comes back as "false".
                var isNew = await _store.AddIfNewAsync(notification);
                if (!isNew) continue; // already handled (and already pushed) the first time

                created++;

                // 2. THEN push. This is a bonus for users who are online right now. If it fails, the notification
                //    is already saved, so the user simply sees it in the bell later. It must never undo the save.
                try
                {
                    await _pusher.PushAsync(userId, notification, cancellationToken);
                }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    _logger.LogWarning("Live push failed for user {UserId} (notification is saved): {Message}", userId, ex.Message);
                }
            }

            _logger.LogInformation("Price drop {EventId} ({Card}): {Watchers} watchers, {Created} new notifications",
                message.EventId, message.CardName, userIds.Count, created);

            return created;
        }

        private static Notification Build(string userId, PriceDropMessage m)
        {
            var percent = (int)Math.Round((m.OldPrice - m.NewPrice) / m.OldPrice * 100m);

            return new Notification
            {
                UserId = userId,
                Type = Notification.PriceDrop,
                Title = $"Price drop: {m.CardName}",
                Message = $"{Money(m.OldPrice)} -> {Money(m.NewPrice)} (down {percent}%) · {m.Rarity} · {m.SetName}",
                Link = $"/market-listings/{Uri.EscapeDataString(m.SetName)}/{Uri.EscapeDataString(m.CardName)}" +
                       $"?id={m.ProductId}&rarity={Uri.EscapeDataString(m.Rarity)}",
                // The same event always gives the same id, so (userId, eventId) is unique per user per drop.
                EventId = m.EventId,
                CreatedAt = DateTime.UtcNow
            };
        }

        // Invariant culture so the text reads "$12.40" on every server, whatever its regional settings.
        private static string Money(decimal value) => "$" + value.ToString("0.00", CultureInfo.InvariantCulture);
    }
}