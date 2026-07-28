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

        public AdminController(
            IMetaDeckScraperService scraperService,
            MongoDbService mongoDbService) // Inject MongoDbService instead
        {
            _scraperService = scraperService;
            _mongoDbService = mongoDbService;
        }

        [HttpPost("scrape-meta-decks")]
        public async Task<IActionResult> ScrapeMetaDecks()
        {
            var scrapedDecks = await _scraperService.ScrapeTcgMetaDecksAsync();

            foreach (var deck in scrapedDecks)
            {
                await _mongoDbService.SaveMetaDeckAsync(deck);
            }

            return Ok(new { Count = scrapedDecks.Count, Decks = scrapedDecks });
        }
    }
}