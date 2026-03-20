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
            var today = DateTime.UtcNow.ToString("yyyy-MM-dd");

            // We look for cards used at least once today, 
            // then sort by today's volume specifically.
            var rising = await _statsCollection.Aggregate()
                .Match(c => c.DailyUsage.ContainsKey(today))
                .Project(c => new
                {
                    CardId = c.CardId,
                    TodayUsage = c.DailyUsage[today],
                    TotalUsage = c.TotalUsage
                })
                .SortByDescending(x => x.TodayUsage)
                .Limit(5)
                .ToListAsync();

            return Ok(rising);
        }
    }
}