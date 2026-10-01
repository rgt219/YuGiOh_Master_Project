using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Threading.Tasks;
using Xunit;
using YuGiOh_Analytics_Consumer.Service;
using YuGiOhDeckApi.Controllers;
using YuGiOhDeckApi.Data;
using YuGiOhDeckApi.Models;
using YuGiOhDeckApi.Repositories;

public class DeckControllerTests
{
    // Builds a controller whose HttpContext carries a logged-in user (claim "userId"),
    // like a validated JWT would. Without this, controller.User is empty.
    private static DeckListMongoDbController BuildController(
        Mock<IMongoDbService> service, Mock<IKafkaProducerService> kafka, string userId = "user-1")
    {
        var identity = new ClaimsIdentity(new[] { new Claim("userId", userId) }, "TestAuth");
        return new DeckListMongoDbController(service.Object, kafka.Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
            }
        };
    }

    [Fact]
    public void Controller_Should_Initialize_Successfully()
    {
        // ARRANGE
        var mockService = new Mock<IMongoDbService>();
        var mockKafka = new Mock<IKafkaProducerService>();

        // ACT
        var controller = new DeckListMongoDbController(mockService.Object, mockKafka.Object);

        // ASSERT
        Assert.NotNull(controller);
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_WhenDeckDoesNotExist()
    {
        // ARRANGE
        var mockService = new Mock<IMongoDbService>();
        var mockKafka = new Mock<IKafkaProducerService>();

        mockService.Setup(s => s.GetHydratedDeckAsync(It.IsAny<string>()))
                   .ReturnsAsync((HydratedDeckResponse)null!);

        var controller = BuildController(mockService, mockKafka);

        // ACT
        var result = await controller.GetById("fake-id-123");

        // ASSERT
        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task Post_Should_Call_Kafka_Producer()
    {
        // ARRANGE
        var mockService = new Mock<IMongoDbService>();
        var mockKafka = new Mock<IKafkaProducerService>();
        var controller = BuildController(mockService, mockKafka, "user-1");
        var newDeck = new DeckList { Title = "Exodia Deck", UserId = "someone-else" };

        // ACT - Calls the Save action on the controller
        var result = await controller.Save(newDeck);

        // ASSERT - Verify that PublishDeckUpdate was called with an object matching the deck
        mockKafka.Verify(k => k.PublishDeckUpdate(It.IsAny<object>()), Times.Once);
        Assert.IsType<CreatedAtActionResult>(result);
    }

    [Fact]
    public async Task Save_Ignores_Client_UserId_And_Uses_Token_User()
    {
        var mockService = new Mock<IMongoDbService>();
        var mockKafka = new Mock<IKafkaProducerService>();
        var controller = BuildController(mockService, mockKafka, "user-1");
        var newDeck = new DeckList { Title = "Spoofed", UserId = "someone-else" };

        await controller.Save(newDeck);

        mockService.Verify(s => s.CreateAsync(It.Is<DeckList>(d => d.UserId == "user-1")), Times.Once);
    }

    [Fact]
    public async Task GetByUserId_Returns_Forbid_For_Another_Users_Id()
    {
        var controller = BuildController(new Mock<IMongoDbService>(), new Mock<IKafkaProducerService>(), "user-1");

        var result = await controller.GetByUserId("user-2");

        Assert.IsType<ForbidResult>(result.Result);
    }

    [Fact]
    public async Task DeleteById_Returns_NotFound_When_Caller_Is_Not_Owner()
    {
        var mockService = new Mock<IMongoDbService>();
        mockService.Setup(s => s.DeleteUserDeckAsync("deck-9", "user-1")).ReturnsAsync(false);
        var controller = BuildController(mockService, new Mock<IKafkaProducerService>(), "user-1");

        var result = await controller.DeleteById("deck-9");

        Assert.IsType<NotFoundObjectResult>(result);
        mockService.Verify(s => s.DeleteByIdAsync(It.IsAny<string>()), Times.Never);
    }
}