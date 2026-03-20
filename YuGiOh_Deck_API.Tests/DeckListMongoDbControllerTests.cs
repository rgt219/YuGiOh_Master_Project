using Microsoft.AspNetCore.Mvc;
using Moq; // A popular library for "faking" dependencies
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
        // ARRANGE - Mock the Interface, not the Class
        var mockService = new Mock<IMongoDbService>();

        // ACT
        var mockKafka = new Mock<IKafkaProducerService>(); // Added

        // ACT
        var controller = new DeckListMongoDbController(mockService.Object, mockKafka.Object); // Added 2nd arg

        // ASSERT
        Assert.NotNull(controller);
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_WhenDeckDoesNotExist()
    {
        // ARRANGE
        var mockService = new Mock<IMongoDbService>();
        var mockKafka = new Mock<IKafkaProducerService>(); // Added

        mockService.Setup(s => s.GetHydratedDeckAsync(It.IsAny<string>()))
                   .ReturnsAsync((HydratedDeckResponse)null!);

        var controller = new DeckListMongoDbController(mockService.Object, mockKafka.Object); // Added 2nd arg

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

        // ACT
        await controller.Post(newDeck);

        // ASSERT - Verify that PublishDeckUpdate was called exactly once with the correct title
        mockKafka.Verify(k => k.PublishDeckUpdate(It.Is<DeckList>(d => d.Title == "Exodia Deck")), Times.Once);
    }
}