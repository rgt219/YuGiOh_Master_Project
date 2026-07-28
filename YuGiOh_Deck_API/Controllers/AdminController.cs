using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using YuGiOhDeckApi.Models;
using YuGiOhDeckApi.Services;

namespace ErreGeTeYgo.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly IMetaDeckScraperService _scraperService;
        private readonly IMongoCollection<MetaDeck> _metaDeckCollection;

        public AdminController(
            IMetaDeckScraperService scraperService,
            IMongoDatabase mongoDatabase) // Injected from MongoDB driver
        {
            _scraperService = scraperService;
            _metaDeckCollection = mongoDatabase.GetCollection<MetaDeck>("MetaDecks");
        }

        [HttpPost("scrape-meta-decks")]
        public async Task<IActionResult> ScrapeMetaDecks()
        {
            var scrapedDecks = await _scraperService.ScrapeTcgMetaDecksAsync();

            if (!scrapedDecks.Any())
            {
                return BadRequest("No meta decks were scraped.");
            }

            foreach (var deck in scrapedDecks)
            {
                // Upsert logic: Replace existing deck by ID, or insert if it doesn't exist
                await _metaDeckCollection.ReplaceOneAsync(
                    filter: d => d.Id == deck.Id,
                    replacement: deck,
                    options: new ReplaceOptions { IsUpsert = true }
                );
            }

            return Ok(new
            {
                Message = $"Successfully scraped and saved {scrapedDecks.Count} meta decks.",
                Decks = scrapedDecks
            });
        }
    }
}