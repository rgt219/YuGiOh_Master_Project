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

        var controller = new DeckListMongoDbController(mockService.Object, mockKafka.Object);

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
        var controller = new DeckListMongoDbController(mockService.Object, mockKafka.Object);
        var newDeck = new DeckList { Title = "Exodia Deck" };

        // ACT - Calls the Save action on the controller
        var result = await controller.Save(newDeck);

        // ASSERT - Verify that PublishDeckUpdate was called with an object matching the deck
        mockKafka.Verify(k => k.PublishDeckUpdate(It.IsAny<object>()), Times.Once);
        Assert.IsType<CreatedAtActionResult>(result);
    }
}