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

        [HttpGet("meta-health")]
        public async Task<IActionResult> GetMetaHealth()
        {
            // Get the top 10 cards to see how dominated the top end is
            var topCards = await _statsCollection.Find(_ => true)
                .SortByDescending(c => c.TotalUsage)
                .Limit(10)
                .ToListAsync();

            if (!topCards.Any()) return Ok(new { score = 100, status = "Diverse" });

            double topOneUsage = topCards.First().TotalUsage;
            double totalTopTenUsage = topCards.Sum(c => c.TotalUsage);

            // If the #1 card makes up > 40% of the top 10's volume, the meta is "Stale"
            double concentration = (topOneUsage / totalTopTenUsage) * 100;

            // Reverse it so 100 = Healthy, 0 = Tier 0 Apocalypse
            double healthScore = Math.Clamp(100 - (concentration * 1.5), 0, 100);

            string status = healthScore switch
            {
                > 75 => "Diverse",
                > 40 => "Competitive",
                _ => "Tier 0 Warning"
            };

            return Ok(new { score = (int)healthScore, status });
        }
    }
}