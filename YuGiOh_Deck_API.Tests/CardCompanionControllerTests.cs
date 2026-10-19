using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;
using YuGiOhDeckApi.Controllers;
using YuGiOhDeckApi.Models;
using YuGiOhDeckApi.Repositories;

public class CardCompanionsControllerTests
{
    private static CardCompanionsController Build(Mock<IMongoDbService> db) => new(db.Object);

    [Fact]
    public async Task GetCompanions_WhenRecordExists_ReturnsIt()
    {
        var stored = new CardCompanions
        {
            CardId = "14558127",
            DeckCount = 2215,
            Companions = new List<CompanionEntry>
            {
                new() { CardId = "24224830", Together = 1270, Percent = 57.3, Lift = 1.27 }
            }
        };
        var db = new Mock<IMongoDbService>();
        db.Setup(d => d.GetCardCompanionsAsync("14558127")).ReturnsAsync(stored);      

        var result = await Build(db).GetCompanions("14558127");

        var ok = Assert.IsType<OkObjectResult>(result);
        var body = Assert.IsType<CardCompanions>(ok.Value);
        Assert.Equal(2215, body.DeckCount);                                              
        Assert.Equal("24224830", body.Companions[0].CardId);
    }

    [Fact]
    public async Task GetCompanions_WhenNoRecord_ReturnsEmptyListsNotNotFound()
    {
        var db = new Mock<IMongoDbService>();
        db.Setup(d => d.GetCardCompanionsAsync("12345")).ReturnsAsync((CardCompanions?)null);

        var result = await Build(db).GetCompanions("12345");

        var ok = Assert.IsType<OkObjectResult>(result);                                           
        var body = Assert.IsType<CardCompanions>(ok.Value);
        Assert.Equal("12345", body.CardId);
        Assert.Equal(0, body.DeckCount);
        Assert.Empty(body.Companions);
        Assert.Empty(body.SideCompanions);                                                         
    }

    [Theory]
    [InlineData("abc")]
    [InlineData("12a45")]
    [InlineData("12345678901")]   
    [InlineData("")]
    public async Task GetCompanions_WhenCardIdInvalid_ReturnsBadRequest_AndNeverQueries(string cardId)
    {
        var db = new Mock<IMongoDbService>();

        var result = await Build(db).GetCompanions(cardId);

        Assert.IsType<BadRequestObjectResult>(result);                                                   
        db.Verify(d => d.GetCardCompanionsAsync(It.IsAny<string>()), Times.Never);        
    }
}