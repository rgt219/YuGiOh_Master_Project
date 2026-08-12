using Microsoft.AspNetCore.Mvc;
using YuGiOhDeckApi.Services;

[ApiController]
[Route("api/masterduel")]
public class MasterDuelController : ControllerBase
{
    private readonly IMasterDuelBanListService _cardService;

    public MasterDuelController(IMasterDuelBanListService cardService)
    {
        _cardService = cardService;
    }

    [HttpGet("cards")]
    public async Task<IActionResult> GetAllMasterDuelCards()
    {
        var cards = await _cardService.GetAllCardsAsync();

        if (cards == null || cards.Count == 0)
        {
            return StatusCode(503, new { message = "Master Duel database is not yet populated." });
        }

        return Ok(new
        {
            format = "Master Duel Complete Database",
            updatedAt = DateTime.UtcNow,
            count = cards.Count,
            cards = cards
        });
    }

    [HttpPost("sync")]
    public async Task<IActionResult> SyncMasterDuelDatabase()
    {
        var success = await _cardService.TriggerScrapeAndSaveAsync();

        if (!success)
        {
            return StatusCode(500, new { message = "Database sync failed. Check Go Worker logs." });
        }

        return Ok(new { message = "Master Duel full card database successfully synced and saved to MongoDB." });
    }
}