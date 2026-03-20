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
        [HttpGet("meta-health")]
        public async Task<IActionResult> GetMetaHealth()
        {
            var topCards = await _statsCollection.Find(_ => true)
                .SortByDescending(c => c.TotalUsage)
                .Limit(10)
                .ToListAsync();

            if (!topCards.Any()) return Ok(new { score = 100, status = "Diverse", topCard = "None" });

            var leader = topCards.First();
            double topOneUsage = leader.TotalUsage;
            double totalTopTenUsage = topCards.Sum(c => c.TotalUsage);

            double concentration = (topOneUsage / totalTopTenUsage) * 100;
            double healthScore = Math.Clamp(100 - (concentration * 1.5), 0, 100);

            return Ok(new
            {
                score = (int)healthScore,
                status = healthScore > 75 ? "Diverse" : healthScore > 40 ? "Competitive" : "Tier 0 Warning",
                topCard = leader.CardName // Pass the name here
            });
        }
    }
}