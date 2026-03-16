using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;
using YuGiOhDeckApi.Controllers;
using YuGiOhDeckApi.Data;
using YuGiOhDeckApi.Models;
using YuGiOhDeckApi.Repositories;// Assuming this is where HydratedDeckResponse lives

public class DeckHydrationTests
{
    [Fact]
    public async Task GetById_ReturnsFullDeckData_WhenSuccessful()
    {
        // --- 1. ARRANGE ---
        var testId = "deck-001";

        // We create a "Fake" hydrated deck object to return
        var fakeHydratedDeck = new HydratedDeckResponse
        {
            Id = testId,
            Title = "Blue-Eyes Ultimate",
            MainDeck = new List<CardData>
            {
                new CardData { Id = 80280737, Name = "Blue-Eyes White Dragon", Image = "https://cdn.art/be.jpg" }
            }
        };

        var mockService = new Mock<IMongoDbService>();

        // Setup the mock: "When GetHydratedDeckAsync is called with our testId, return our fake object"
        mockService.Setup(s => s.GetHydratedDeckAsync(testId))
                   .ReturnsAsync(fakeHydratedDeck);

        var controller = new DeckListMongoDbController(mockService.Object);

        // --- 2. ACT ---
        var result = await controller.GetById(testId);

        // --- 3. ASSERT ---
        // Verify we got an 'Ok' (200) response
        var okResult = Assert.IsType<OkObjectResult>(result.Result);

        // Cast the value back to our response type
        var returnedDeck = Assert.IsType<HydratedDeckResponse>(okResult.Value);

        // Verify the data is what we expected
        Assert.Equal("Blue-Eyes Ultimate", returnedDeck.Title);
        Assert.Single(returnedDeck.MainDeck); // Ensure there is 1 card
        Assert.Equal("https://cdn.art/be.jpg", returnedDeck.MainDeck[0].Image);
    }
}