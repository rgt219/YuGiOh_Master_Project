using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;
using YuGiOhDeckApi.Controllers;
using YuGiOhDeckApi.Models;
using YuGiOhDeckApi.Repositories;

public class DeckNoteControllerTests
{
    // ---------- helpers ----------

    private static DeckNoteController Build(Mock<IMongoDbService> db, string userId = "user-1")
    {
        var identity = new ClaimsIdentity(new[] { new Claim("userId", userId) }, "TestAuth");
        return new DeckNoteController(db.Object, NullLogger<DeckNoteController>.Instance)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
            }
        };
    }

    private static DeckList DeckOwnedBy(string userId, string deckId = "deck-1") =>
        new() { Id = deckId, UserId = userId };

    // The controller returns anonymous objects, so read their properties by name.
    private static T Prop<T>(object? obj, string name) =>
        (T)obj!.GetType().GetProperty(name)!.GetValue(obj)!;

    // ---------- SAVE (PUT) ----------

    [Fact]
    public async Task Save_WhenOwner_SavesAndReturnsOk()
    {
        var db = new Mock<IMongoDbService>();
        db.Setup(d => d.GetByIdAsync("deck-1")).ReturnsAsync(DeckOwnedBy("user-1"));
        db.Setup(d => d.SaveDeckNoteAsync("user-1", "deck-1", "my note", It.IsAny<List<string>>()))
          .ReturnsAsync(new DeckNote
          {
              UserId = "user-1",
              DeckId = "deck-1",
              Notes = "my note",
              Tags = new List<string> { "aggro" },
              UpdatedAt = DateTime.UtcNow
          });

        var result = await Build(db, "user-1").SaveDeckNote("deck-1", new SaveDeckNoteRequest
        {
            Notes = "  my note  ",
            Tags = new List<string> { "aggro" }
        });

        Assert.IsType<OkObjectResult>(result);
        db.Verify(d => d.SaveDeckNoteAsync("user-1", "deck-1", "my note", It.IsAny<List<string>>()), Times.Once);
    }

    [Fact]
    public async Task Save_WhenDeckDoesNotExist_ReturnsNotFound()
    {
        var db = new Mock<IMongoDbService>();
        db.Setup(d => d.GetByIdAsync("deck-1")).ReturnsAsync((DeckList?)null);

        var result = await Build(db, "user-1").SaveDeckNote("deck-1", new SaveDeckNoteRequest
        {
            Notes = "my note",
            Tags = new List<string> { "aggro" }
        });

        Assert.IsType<NotFoundObjectResult>(result);
        db.Verify(d => d.SaveDeckNoteAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<List<string>>()), Times.Never);
    }

    [Fact]
    public async Task Save_WhenDeckBelongsToSomeoneElse_ReturnsNotFound()
    {
        var db = new Mock<IMongoDbService>();
        db.Setup(d => d.GetByIdAsync("deck-1")).ReturnsAsync(DeckOwnedBy("user-1"));

        var result = await Build(db, "user-2").SaveDeckNote("deck-1", new SaveDeckNoteRequest
        {
            Notes = "my note",
            Tags = new List<string> { "aggro" }
        });

        Assert.IsType<NotFoundObjectResult>(result);
        db.Verify(d => d.SaveDeckNoteAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<List<string>>()), Times.Never);
    }

    [Theory]
    [InlineData(DeckNoteController.MaxNoteLength + 1)]
    [InlineData(1000)]
    public async Task Save_WhenNotesTooLong_ReturnsBadRequest(int length)
    {
        var db = new Mock<IMongoDbService>();

        var result = await Build(db).SaveDeckNote("deck-1", new SaveDeckNoteRequest
        {
            Notes = new string('x', length),
            Tags = new List<string>()
        });

        Assert.IsType<BadRequestObjectResult>(result);
        db.Verify(d => d.GetByIdAsync(It.IsAny<string>()), Times.Never);
        db.Verify(d => d.SaveDeckNoteAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<List<string>>()), Times.Never);
    }

    [Fact]
    public async Task Save_WhenTooManyTags_ReturnsBadRequest()
    {
        var tags = Enumerable.Range(1, DeckNoteController.MaxTags + 1).Select(i => $"tag{i}").ToList();
        var db = new Mock<IMongoDbService>();

        var result = await Build(db, "user-1").SaveDeckNote("deck-1", new SaveDeckNoteRequest
        {
            Notes = new string('x', 10),
            Tags = tags
        });

        Assert.IsType<BadRequestObjectResult>(result);
        db.Verify(d => d.GetByIdAsync(It.IsAny<string>()), Times.Never);
        db.Verify(d => d.SaveDeckNoteAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<List<string>>()), Times.Never);
    }

    [Fact]
    public async Task Save_WhenTagTooLong_ReturnsBadRequest()
    {
        var db = new Mock<IMongoDbService>();
        var tags = new List<string> { new string('x', DeckNoteController.MaxTagLength + 1) };

        var result = await Build(db, "user-1").SaveDeckNote("deck-1", new SaveDeckNoteRequest
        {
            Notes = new string('x', 10),
            Tags = tags
        });

        Assert.IsType<BadRequestObjectResult>(result);
        db.Verify(d => d.GetByIdAsync(It.IsAny<string>()), Times.Never);
        db.Verify(d => d.SaveDeckNoteAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<List<string>>()), Times.Never);
    }

    [Fact]
    public async Task Save_CleansTagsBeforeSaving()
    {
        var db = new Mock<IMongoDbService>();
        db.Setup(d => d.GetByIdAsync("deck-1")).ReturnsAsync(DeckOwnedBy("user-1"));
        db.Setup(d => d.SaveDeckNoteAsync("user-1", "deck-1", "my note", It.IsAny<List<string>>()))
          .ReturnsAsync(new DeckNote
          {
              UserId = "user-1",
              DeckId = "deck-1",
              Notes = "my note",
              Tags = new List<string> { "a", "b" },
              UpdatedAt = DateTime.UtcNow
          });

        var result = await Build(db, "user-1").SaveDeckNote("deck-1", new SaveDeckNoteRequest
        {
            Notes = "my note",
            Tags = new List<string> { " a ", "A", "", "b" }   // spaces, duplicate (any case), blank, normal
        });

        Assert.IsType<OkObjectResult>(result);
        db.Verify(d => d.SaveDeckNoteAsync("user-1", "deck-1", "my note",
            It.Is<List<string>>(t => t.SequenceEqual(new[] { "a", "b" }))), Times.Once);
    }

    // Boundary test: values exactly AT each limit must still be accepted (catches > vs >= mistakes).
    [Fact]
    public async Task Save_WhenExactlyAtEveryLimit_ReturnsOk()
    {
        var tags = Enumerable.Range(1, DeckNoteController.MaxTags)
            .Select(i => $"t{i}".PadRight(DeckNoteController.MaxTagLength, 'x'))
            .ToList();

        var db = new Mock<IMongoDbService>();
        db.Setup(d => d.GetByIdAsync("deck-1")).ReturnsAsync(DeckOwnedBy("user-1"));
        db.Setup(d => d.SaveDeckNoteAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<List<string>>()))
          .ReturnsAsync(new DeckNote { UserId = "user-1", DeckId = "deck-1", Notes = "", Tags = tags, UpdatedAt = DateTime.UtcNow });

        var result = await Build(db, "user-1").SaveDeckNote("deck-1", new SaveDeckNoteRequest
        {
            Notes = new string('x', DeckNoteController.MaxNoteLength),
            Tags = tags
        });

        Assert.IsType<OkObjectResult>(result);
        db.Verify(d => d.SaveDeckNoteAsync("user-1", "deck-1", It.IsAny<string>(), It.IsAny<List<string>>()), Times.Once);
    }

    // ---------- GET ----------

    [Fact]
    public async Task GetOneOfMine_WhenNoNoteExists_ReturnsEmptyDefaults()
    {
        var db = new Mock<IMongoDbService>();
        db.Setup(d => d.GetDeckNoteAsync("user-1", "deck-1")).ReturnsAsync((DeckNote?)null);

        var result = await Build(db, "user-1").GetOneOfMine("deck-1");

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal("deck-1", Prop<string>(ok.Value, "deckId"));
        Assert.Equal("", Prop<string>(ok.Value, "notes"));
        Assert.Empty(Prop<List<string>>(ok.Value, "tags"));
    }

    [Fact]
    public async Task GetOneOfMine_ReadsTheNoteOfTheTokenUser()
    {
        var db = new Mock<IMongoDbService>();
        db.Setup(d => d.GetDeckNoteAsync("user-7", "deck-1"))
          .ReturnsAsync(new DeckNote { UserId = "user-7", DeckId = "deck-1", Notes = "mine", Tags = new List<string> { "control" } });

        var result = await Build(db, "user-7").GetOneOfMine("deck-1");

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal("mine", Prop<string>(ok.Value, "notes"));
        db.Verify(d => d.GetDeckNoteAsync("user-7", "deck-1"), Times.Once);   // always scoped to the token user
    }

    // ---------- DELETE ----------

    [Fact]
    public async Task DeleteDeckNote_WhenDeckDoesNotExist_ReturnsNotFound()
    {
        var db = new Mock<IMongoDbService>();
        db.Setup(d => d.GetByIdAsync("deck-1")).ReturnsAsync((DeckList?)null);

        var result = await Build(db, "user-1").DeleteDeckNote("deck-1");

        Assert.IsType<NotFoundObjectResult>(result);
        db.Verify(d => d.DeleteDeckNoteAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task DeleteDeckNote_WhenDeckBelongsToSomeoneElse_ReturnsNotFound()
    {
        var db = new Mock<IMongoDbService>();
        db.Setup(d => d.GetByIdAsync("deck-1")).ReturnsAsync(DeckOwnedBy("someone-else"));

        var result = await Build(db, "user-1").DeleteDeckNote("deck-1");

        Assert.IsType<NotFoundObjectResult>(result);
        db.Verify(d => d.DeleteDeckNoteAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task DeleteDeckNote_WhenOwner_ReturnsNoContent()
    {
        var db = new Mock<IMongoDbService>();
        db.Setup(d => d.GetByIdAsync("deck-1")).ReturnsAsync(DeckOwnedBy("user-1"));

        var result = await Build(db, "user-1").DeleteDeckNote("deck-1");

        Assert.IsType<NoContentResult>(result);
        db.Verify(d => d.DeleteDeckNoteAsync("user-1", "deck-1"), Times.Once);
    }
}