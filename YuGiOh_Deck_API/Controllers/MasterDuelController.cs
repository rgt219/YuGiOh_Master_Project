using Microsoft.AspNetCore.Mvc;
using YuGiOhDeckApi.Services;

namespace YuGiOhDeckApi.Controllers
{
    [ApiController]
    [Route("api/masterduel")]
    public class MasterDuelController : ControllerBase
    {
        private readonly IMasterDuelBanListService _masterDuelService;

        public MasterDuelController(IMasterDuelBanListService masterDuelService)
        {
            _masterDuelService = masterDuelService;
        }

        [HttpGet("cards")]
        public async Task<IActionResult> GetAllMasterDuelCards()
        {
            var cards = await _masterDuelService.GetAllCardsAsync();

            if (cards == null || cards.Count == 0)
            {
                return StatusCode(503, new { message = "Master Duel database is not yet populated." });
            }

            return Ok(new
            {
                format = "Master Duel Complete Database",
                updatedAt = DateTime.UtcNow,
                count = cards.Count,
                cards
            });
        }

        [HttpGet("banlist")]
        public async Task<IActionResult> GetMasterDuelBanList()
        {
            var data = await _masterDuelService.GetMasterDuelBanListAsync();

            if (data == null || data.Cards == null || data.Cards.Count == 0)
            {
                return StatusCode(503, new { message = "Master Duel ban list is not yet populated." });
            }

            return Ok(data);
        }

        [HttpPost("sync")]
        public async Task<IActionResult> SyncMasterDuelDatabase()
        {
            var success = await _masterDuelService.TriggerScrapeAndSaveAsync();

            if (!success)
            {
                return StatusCode(500, new { message = "Sync failed. Check Go Worker logs for Cloudflare blocks or timeouts." });
            }

            return Ok(new { message = "Master Duel data successfully synced and saved to MongoDB." });
        }

        [HttpPost("build-banlist")]
        public async Task<IActionResult> BuildMasterDuelBanList()
        {
            var success = await _masterDuelService.BuildBanListFromDatabaseAsync();

            if (!success)
            {
                return StatusCode(500, new { message = "Failed to build ban list. Make sure MasterDuelCards is populated." });
            }

            return Ok(new { message = "Master Duel Ban List successfully generated from local database (206 cards)." });
        }
    }
}