using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;
using YuGiOhDeckApi.Controllers;
using YuGiOhDeckApi.Models;
using YuGiOhDeckApi.Repositories;
using Microsoft.Extensions.Logging.Abstractions;

public class WatchListControllerTests
{
    private static WatchListController Build(Mock<IMongoDbService> db, string userId = "user-1")
    {
        var identity = new ClaimsIdentity(new[] { new Claim("userId", userId) }, "TestAuth");
        return new WatchListController(db.Object, NullLogger<PriceWatch>.Instance)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
            }
        };
    }

    private static TrackCardRequest Card(string name = "Ash Blossom & Joyous Spring") =>
        new() { CardName = name, SetName = "Maximum Crisis", Rarity = "Ultra Rare" };

    [Fact]
    public async Task GetMine_ReadsTheTokenUsersWatchlist()
    {
        var db = new Mock<IMongoDbService>();
        db.Setup(d => d.GetWatchesAsync("user-1")).ReturnsAsync(new List<PriceWatch>());

        var result = await Build(db).GetMine();

        Assert.IsType<OkObjectResult>(result);
        db.Verify(d => d.GetWatchesAsync("user-1"), Times.Once);
    }

    [Fact]
    public async Task Track_SavesForTheTokenUser()
    {
        var db = new Mock<IMongoDbService>();
        db.Setup(d => d.GetWatchesAsync("user-9")).ReturnsAsync(new List<PriceWatch>());

        var result = await Build(db, "user-9").Track(123456, Card());

        Assert.IsType<OkObjectResult>(result);
        db.Verify(d => d.AddWatchAsync("user-9", 123456, "Ash Blossom & Joyous Spring", "Maximum Crisis", "Ultra Rare"), Times.Once);
    }

    [Theory]
    [InlineData(0, "Card")]
    [InlineData(-5, "Card")]
    [InlineData(123, "")]
    [InlineData(123, "   ")]
    public async Task Track_RejectsInvalidInput(int productId, string cardName)
    {
        var db = new Mock<IMongoDbService>();

        var result = await Build(db).Track(productId, Card(cardName));

        Assert.IsType<BadRequestObjectResult>(result);
        db.Verify(d => d.AddWatchAsync(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task Track_RejectsANewCardOnceTheCapIsReached()
    {
        var full = Enumerable.Range(1, WatchListController.MaxWatches)
                             .Select(i => new PriceWatch { UserId = "user-1", ProductId = i }).ToList();
        var db = new Mock<IMongoDbService>();
        db.Setup(d => d.GetWatchesAsync("user-1")).ReturnsAsync(full);

        var result = await Build(db).Track(999999, Card());

        Assert.IsType<BadRequestObjectResult>(result);
        db.Verify(d => d.AddWatchAsync(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task Track_AllowsRetrackingACardWhenTheListIsFull()
    {
        var full = Enumerable.Range(1, WatchListController.MaxWatches)
                             .Select(i => new PriceWatch { UserId = "user-1", ProductId = i }).ToList();
        var db = new Mock<IMongoDbService>();
        db.Setup(d => d.GetWatchesAsync("user-1")).ReturnsAsync(full);

        var result = await Build(db).Track(5, Card());

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Untrack_RemovesForTheTokenUserOnly()
    {
        var db = new Mock<IMongoDbService>();

        var result = await Build(db, "user-3").Untrack(777);

        Assert.IsType<OkObjectResult>(result);
        db.Verify(d => d.RemoveWatchAsync("user-3", 777), Times.Once);
    }
}