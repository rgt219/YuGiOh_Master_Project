using Microsoft.AspNetCore.Mvc;
using YuGiOhDeckApi.Services;
using YuGiOhDeckApi.Data;

namespace YuGiOhDeckApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly IMetaDeckScraperService _scraperService;
        private readonly MongoDbService _mongoDbService;
        private readonly ILogger<AdminController> _logger;

        public AdminController(
            IMetaDeckScraperService scraperService,
            MongoDbService mongoDbService,
            ILogger<AdminController> logger)
        {
            _scraperService = scraperService;
            _mongoDbService = mongoDbService;
            _logger = logger;
        }

        [HttpPost("scrape-meta-decks")]
        public async Task<IActionResult> ScrapeMetaDecks()
        {
            try
            {
                _logger.LogInformation("Admin trigger: Starting live meta deck scrape.");
                var scrapedDecks = await _scraperService.ScrapeMetaDecksAsync();

                if (scrapedDecks == null || scrapedDecks.Count == 0)
                {
                    return BadRequest(new { message = "Scraper executed successfully but returned 0 decks. Check Go worker console logs." });
                }

                await _mongoDbService.SaveMetaDecksBulkAsync(scrapedDecks);
                await _mongoDbService.RecomputeCardAnalyticsAsync();

                return Ok(new { success = true, count = scrapedDecks.Count, decks = scrapedDecks });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during admin scrape execution.");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("test-scraper-dryrun")]
        public async Task<IActionResult> TestScraperDryRun()
        {
            try
            {
                _logger.LogInformation("Dry-run test invoked: Pinging Go worker...");
                var scrapedDecks = await _scraperService.ScrapeMetaDecksAsync();

                return Ok(new
                {
                    status = scrapedDecks.Count > 0 ? "SUCCESS" : "EMPTY",
                    totalDecksFound = scrapedDecks.Count,
                    sampleDecks = scrapedDecks.Take(3) 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Dry-run scraper communication failed.");
                return StatusCode(500, new { error = ex.Message, hint = "Ensure your Go worker is running locally on port 8080." });
            }
        }
    }
}