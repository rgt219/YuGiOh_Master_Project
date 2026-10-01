using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;
using YuGiOhDeckApi.Controllers;
using YuGiOhDeckApi.Models;
using YuGiOhDeckApi.Repositories;

public class CollectionControllerTests
{
    private static CollectionController Build(Mock<IMongoDbService> db, string userId = "user-1")
    {
        var identity = new ClaimsIdentity(new[] { new Claim("userId", userId) }, "TestAuth");
        return new CollectionController(db.Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
            }
        };
    }

    [Fact]
    public async Task GetMine_ReadsTheTokenUsersCollection()
    {
        var db = new Mock<IMongoDbService>();
        db.Setup(d => d.GetCollectionAsync("user-1"))
          .ReturnsAsync(new List<CollectionEntry> { new() { UserId = "user-1", CardId = 123, Quantity = 2 } });

        var result = await Build(db).GetMine();

        Assert.IsType<OkObjectResult>(result);
        db.Verify(d => d.GetCollectionAsync("user-1"), Times.Once);
    }

    [Fact]
    public async Task SetQuantity_SavesForTheTokenUser()
    {
        var db = new Mock<IMongoDbService>();

        var result = await Build(db, "user-9").SetQuantity(46986414, new SetQuantityRequest { Quantity = 3 });

        Assert.IsType<OkObjectResult>(result);
        db.Verify(d => d.SetCollectionQuantityAsync("user-9", 46986414, 3), Times.Once);
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(100)]
    public async Task SetQuantity_RejectsOutOfRangeQuantities(int quantity)
    {
        var db = new Mock<IMongoDbService>();

        var result = await Build(db).SetQuantity(123, new SetQuantityRequest { Quantity = quantity });

        Assert.IsType<BadRequestObjectResult>(result);
        db.Verify(d => d.SetCollectionQuantityAsync(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task SetQuantity_RejectsInvalidCardId()
    {
        var db = new Mock<IMongoDbService>();

        var result = await Build(db).SetQuantity(0, new SetQuantityRequest { Quantity = 1 });

        Assert.IsType<BadRequestObjectResult>(result);
    }
}