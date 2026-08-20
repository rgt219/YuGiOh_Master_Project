using Microsoft.AspNetCore.Mvc;
using YuGiOhDeckApi.Models;
using YuGiOhDeckApi.Services;

namespace YuGiOhDeckApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BanListController : ControllerBase
    {
        private readonly IMasterDuelBanListService _banListService;
        public BanListController(IMasterDuelBanListService banListService)
        {
            _banListService = banListService;
        }

        [HttpGet("masterduel")]
        public async Task<IActionResult> GetMasterDuelBanList()
        {
            // ⚡ Point back to the clean MasterDuelBanList collection
            var data = await _banListService.GetMasterDuelBanListAsync();

            if (data == null || data.Cards == null || data.Cards.Count == 0)
            {
                return StatusCode(503, new { message = "Master Duel ban list is not yet populated." });
            }

            return Ok(data);
        }

        [HttpPost("scrape-masterduel")]
        public async Task<IActionResult> ScrapeMasterDuelBanList()
        {
            var success = await _banListService.TriggerScrapeAndSaveAsync();

            if (!success)
            {
                return StatusCode(500, new { message = "Scrape failed. Check Go Worker logs for Cloudflare blocks or timeouts." });
            }

            return Ok(new { message = "Master Duel ban list successfully scraped and saved to MongoDB." });
        }

        [HttpPost("build")]
        public async Task<IActionResult> BuildMasterDuelBanList()
        {
            // ⚡ Triggers the fast local DB build instead of the Go Scraper
            var success = await _banListService.BuildBanListFromDatabaseAsync();

            if (!success)
            {
                return StatusCode(500, new { message = "Failed to build ban list. Make sure MasterDuelCards is populated." });
            }

            return Ok(new { message = "Master Duel Ban List successfully generated from local database (206 cards)." });
        }
    }
}