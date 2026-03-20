using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using YuGiOhDeckApi.Models;

namespace YuGiOh_Deck_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnalyticsController : ControllerBase
    {
        // CHANGE: Use CardStat instead of BsonDocument
        private readonly IMongoCollection<CardStat> _statsCollection;

        public AnalyticsController(IMongoCollection<CardStat> statsCollection)
        {
            _statsCollection = statsCollection;
        }

        [HttpGet("top-cards")]
        public async Task<IActionResult> GetTopCards(int limit = 10)
        {
            // Now you don't need "new BsonDocument()" or manual mapping
            var topCards = await _statsCollection.Find(_ => true)
                .SortByDescending(c => c.TotalUsage)
                .Limit(limit)
                .ToListAsync();

            return Ok(topCards);
        }

        [HttpGet("rising-tech")]
        public async Task<IActionResult> GetRisingTech()
        {
            // 1. Define "Recent" (e.g., last 24 hours)
            var twentyFourHoursAgo = DateTime.UtcNow.AddDays(-1);

            // 2. Query for cards updated recently, sorted by usage
            // We filter by LastUpdated to see what people are playing RIGHT NOW
            var risingCards = await _statsCollection
                .Find(c => c.LastUpdated >= twentyFourHoursAgo)
                .SortByDescending(c => c.TotalUsage)
                .Limit(5)
                .ToListAsync();

            return Ok(risingCards);
        }
    }
}