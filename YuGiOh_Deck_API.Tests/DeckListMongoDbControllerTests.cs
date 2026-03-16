using Microsoft.AspNetCore.Mvc;
using Moq; // A popular library for "faking" dependencies
using Xunit;
using YuGiOhDeckApi.Controllers;
using YuGiOhDeckApi.Data;
using YuGiOhDeckApi.Repositories;

public class DeckControllerTests
{
    [Fact]
    public void Controller_Should_Initialize_Successfully()
    {
        // ARRANGE - Mock the Interface, not the Class
        var mockService = new Mock<IMongoDbService>();

        // ACT
        var controller = new DeckListMongoDbController(mockService.Object);

        // ASSERT
        Assert.NotNull(controller);
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_WhenDeckDoesNotExist()
    {
        // ARRANGE
        var mockService = new Mock<IMongoDbService>();

        mockService.Setup(s => s.GetHydratedDeckAsync(It.IsAny<string>()))
                   .ReturnsAsync((HydratedDeckResponse)null!);

        var controller = new DeckListMongoDbController(mockService.Object);

        // ACT
        var result = await controller.GetById("fake-id-123");

        // ASSERT
        Assert.IsType<NotFoundObjectResult>(result.Result);
    }
}