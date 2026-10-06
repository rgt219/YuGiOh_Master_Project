using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;
using YuGiOhDeckApi.Models;
using YuGiOhDeckApi.Notifications;
using YuGiOhDeckApi.Repositories;

public class PriceDropNotifierTests
{
    // Builds the notifier with fake versions of everything it talks to.
    private class Setup
    {
        public Mock<IMongoDbService> Db = new();
        public Mock<INotificationStore> Store = new();
        public Mock<INotificationPusher> Pusher = new();

        public Setup(params string[] watchers)
        {
            Db.Setup(d => d.GetWatcherUserIdsAsync(123456)).ReturnsAsync(watchers.ToList());
            Store.Setup(s => s.AddIfNewAsync(It.IsAny<Notification>())).ReturnsAsync(true);   // "it was new"
        }

        public PriceDropNotifier Notifier() =>
            new(Db.Object, Store.Object, Pusher.Object, NullLogger<PriceDropNotifier>.Instance);
    }

    private static PriceDropMessage Drop() => new()
    {
        EventId = "price-drop:123456:2026-10-06",
        ProductId = 123456,
        CardName = "Ash Blossom & Joyous Spring",
        SetName = "Maximum Crisis",
        Rarity = "Ultra Rare",
        OldPrice = 15.00m,
        NewPrice = 12.40m,
        ObservedAt = new DateTime(2026, 10, 6, 0, 0, 0, DateTimeKind.Utc)
    };

    [Fact]
    public async Task Handle_CreatesAndPushesOneNotificationPerWatcher()
    {
        var t = new Setup("user-1", "user-2");

        var created = await t.Notifier().HandleAsync(Drop());

        Assert.Equal(2, created);
        t.Store.Verify(s => s.AddIfNewAsync(It.Is<Notification>(n => n.UserId == "user-1" && n.EventId == "price-drop:123456:2026-10-06")), Times.Once);
        t.Store.Verify(s => s.AddIfNewAsync(It.Is<Notification>(n => n.UserId == "user-2")), Times.Once);
        t.Pusher.Verify(p => p.PushAsync("user-1", It.IsAny<Notification>(), It.IsAny<CancellationToken>()), Times.Once);
        t.Pusher.Verify(p => p.PushAsync("user-2", It.IsAny<Notification>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WritesTheNotificationTextAndLink()
    {
        var t = new Setup("user-1");
        Notification? saved = null;
        t.Store.Setup(s => s.AddIfNewAsync(It.IsAny<Notification>()))
               .Callback<Notification>(n => saved = n)
               .ReturnsAsync(true);

        await t.Notifier().HandleAsync(Drop());

        Assert.NotNull(saved);
        Assert.Equal(Notification.PriceDrop, saved!.Type);
        Assert.Contains("Ash Blossom & Joyous Spring", saved.Title);
        Assert.Contains("$15.00", saved.Message);
        Assert.Contains("$12.40", saved.Message);
        Assert.Contains("17%", saved.Message);
        Assert.Equal(
            "/market-listings/Maximum%20Crisis/Ash%20Blossom%20%26%20Joyous%20Spring?id=123456&rarity=Ultra%20Rare",
            saved.Link);
    }

    [Fact]
    public async Task Handle_SavesBeforePushing()
    {
        var t = new Setup("user-1");
        var order = new List<string>();
        t.Store.Setup(s => s.AddIfNewAsync(It.IsAny<Notification>()))
               .Callback<Notification>(n => order.Add("save"))
               .ReturnsAsync(true);
        t.Pusher.Setup(p => p.PushAsync(It.IsAny<string>(), It.IsAny<Notification>(), It.IsAny<CancellationToken>()))
                .Callback(() => order.Add("push"))
                .Returns(Task.CompletedTask);

        await t.Notifier().HandleAsync(Drop());

        Assert.Equal(new[] { "save", "push" }, order);
    }

    [Fact]
    public async Task Handle_DoesNotPushARepeatDelivery()
    {
        var t = new Setup("user-1");
        t.Store.Setup(s => s.AddIfNewAsync(It.IsAny<Notification>())).ReturnsAsync(false);   // "already saved this event"

        var created = await t.Notifier().HandleAsync(Drop());

        Assert.Equal(0, created);
        t.Pusher.Verify(p => p.PushAsync(It.IsAny<string>(), It.IsAny<Notification>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_KeepsTheSavedNotification_WhenTheLivePushFails()
    {
        var t = new Setup("user-1", "user-2");
        t.Pusher.Setup(p => p.PushAsync("user-1", It.IsAny<Notification>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(new InvalidOperationException("hub down"));

        var created = await t.Notifier().HandleAsync(Drop());

        Assert.Equal(2, created);                                                  // both were saved
        t.Pusher.Verify(p => p.PushAsync("user-2", It.IsAny<Notification>(), It.IsAny<CancellationToken>()), Times.Once);   // and user-2 still got theirs
    }

    [Fact]
    public async Task Handle_Throws_WhenTheDatabaseFails_SoTheMessageCanBeRetried()
    {
        var t = new Setup("user-1");
        t.Store.Setup(s => s.AddIfNewAsync(It.IsAny<Notification>())).ThrowsAsync(new InvalidOperationException("db down"));

        await Assert.ThrowsAsync<InvalidOperationException>(() => t.Notifier().HandleAsync(Drop()));
    }

    [Fact]
    public async Task Handle_DoesNothing_WhenNobodyIsTrackingTheCard()
    {
        var t = new Setup();   // no watchers

        var created = await t.Notifier().HandleAsync(Drop());

        Assert.Equal(0, created);
        t.Store.Verify(s => s.AddIfNewAsync(It.IsAny<Notification>()), Times.Never);
    }

    [Theory]
    [InlineData("", 123456, 15.0, 12.4)]              // no event id: duplicate protection would not work
    [InlineData("e1", 0, 15.0, 12.4)]                 // not a real product
    [InlineData("e1", 123456, 15.0, 15.0)]            // not actually a drop
    [InlineData("e1", 123456, 12.0, 15.0)]            // price went UP
    [InlineData("e1", 123456, 0.0, 0.0)]              // no prices
    public async Task Handle_SkipsInvalidMessages_WithoutTouchingTheDatabase(string eventId, int productId, double oldPrice, double newPrice)
    {
        var t = new Setup("user-1");
        var message = Drop();
        message.EventId = eventId;
        message.ProductId = productId;
        message.OldPrice = (decimal)oldPrice;
        message.NewPrice = (decimal)newPrice;

        var created = await t.Notifier().HandleAsync(message);

        Assert.Equal(0, created);
        t.Db.Verify(d => d.GetWatcherUserIdsAsync(It.IsAny<int>()), Times.Never);
        t.Store.Verify(s => s.AddIfNewAsync(It.IsAny<Notification>()), Times.Never);
    }
}