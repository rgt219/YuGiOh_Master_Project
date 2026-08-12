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
            var restrictedCards = await _banListService.GetRestrictedMasterDuelCardsAsync();

            if (restrictedCards == null || restrictedCards.Count == 0)
            {
                return StatusCode(503, new { message = "Master Duel ban list is not yet populated." });
            }

            return Ok(new
            {
                format = "Master Duel",
                updatedAt = DateTime.UtcNow,
                count = restrictedCards.Count,
                cards = restrictedCards.Select(c => new
                {
                    name = c.Name,
                    status = c.BanStatus
                }).ToList()
            });
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
    }
}