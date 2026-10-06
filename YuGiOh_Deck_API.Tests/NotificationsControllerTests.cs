using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;
using YuGiOhDeckApi.Controllers;
using YuGiOhDeckApi.Models;
using YuGiOhDeckApi.Notifications;

public class NotificationsControllerTests
{
    private static NotificationsController Build(Mock<INotificationStore> store, string userId = "user-1")
    {
        var identity = new ClaimsIdentity(new[] { new Claim("userId", userId) }, "TestAuth");
        return new NotificationsController(store.Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
            }
        };
    }

    // The controller returns anonymous objects. Turning one into JSON lets a test read its fields.
    private static JsonElement Body(IActionResult result)
    {
        var ok = Assert.IsType<OkObjectResult>(result);
        return JsonDocument.Parse(JsonSerializer.Serialize(ok.Value)).RootElement;
    }

    [Fact]
    public async Task GetMine_ReturnsTheBadgeNumberAndTheListForTheTokenUser()
    {
        var store = new Mock<INotificationStore>();
        store.Setup(s => s.GetRecentAsync("user-7", 20)).ReturnsAsync(new List<Notification>
        {
            new() { Id = "a1", UserId = "user-7", Type = Notification.PriceDrop, Title = "Ash dropped", Message = "$12", ReadAt = null },
            new() { Id = "a2", UserId = "user-7", Type = Notification.PriceDrop, Title = "Maxx C dropped", Message = "$3", ReadAt = DateTime.UtcNow },
        });
        store.Setup(s => s.CountUnreadAsync("user-7")).ReturnsAsync(1);

        var body = Body(await Build(store, "user-7").GetMine());

        Assert.Equal(1, body.GetProperty("unread").GetInt64());
        var items = body.GetProperty("items");
        Assert.Equal(2, items.GetArrayLength());
        Assert.False(items[0].GetProperty("read").GetBoolean());
        Assert.True(items[1].GetProperty("read").GetBoolean());
    }

    [Theory]
    [InlineData(0, 1)]
    [InlineData(-5, 1)]
    [InlineData(20, 20)]
    [InlineData(50, 50)]
    [InlineData(1000000, 50)]
    public async Task GetMine_KeepsTheLimitBetweenOneAndFifty(int asked, int expected)
    {
        var store = new Mock<INotificationStore>();
        store.Setup(s => s.GetRecentAsync(It.IsAny<string>(), It.IsAny<int>())).ReturnsAsync(new List<Notification>());

        await Build(store).GetMine(asked);

        store.Verify(s => s.GetRecentAsync("user-1", expected), Times.Once);
    }

    [Fact]
    public async Task MarkRead_ReturnsOkWhenTheNotificationIsTheirs()
    {
        var store = new Mock<INotificationStore>();
        store.Setup(s => s.MarkReadAsync("user-3", "abc")).ReturnsAsync(true);

        var result = await Build(store, "user-3").MarkRead("abc");

        Assert.IsType<OkObjectResult>(result);
        store.Verify(s => s.MarkReadAsync("user-3", "abc"), Times.Once);
    }

    [Fact]
    public async Task MarkRead_ReturnsNotFoundWhenItDoesNotExistOrBelongsToSomeoneElse()
    {
        var store = new Mock<INotificationStore>();
        store.Setup(s => s.MarkReadAsync(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(false);

        var result = await Build(store).MarkRead("someone-elses-id");

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task MarkAllRead_ReportsHowManyChangedForTheTokenUserOnly()
    {
        var store = new Mock<INotificationStore>();
        store.Setup(s => s.MarkAllReadAsync("user-5")).ReturnsAsync(4);

        var body = Body(await Build(store, "user-5").MarkAllRead());

        Assert.Equal(4, body.GetProperty("marked").GetInt64());
        store.Verify(s => s.MarkAllReadAsync("user-5"), Times.Once);
    }
}