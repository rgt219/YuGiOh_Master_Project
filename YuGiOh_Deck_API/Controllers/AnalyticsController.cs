using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using MongoDB.Bson;
using YuGiOhDeckApi.Models;

namespace YuGiOh_Deck_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnalyticsController : ControllerBase
    {
        private readonly IMongoCollection<CardStat> _statsCollection;

        public AnalyticsController(IMongoCollection<CardStat> statsCollection)
        {
            _statsCollection = statsCollection;
        }

        [HttpGet("top-cards")]
        public async Task<IActionResult> GetTopCards(int limit = 10)
        {
            // Now you can use the typed collection, which is much cleaner
            var topCards = await _statsCollection
                .Find(_ => true)
                .SortByDescending(c => c.TotalUsage)
                .Limit(limit)
                .ToListAsync();

            return Ok(topCards);
        }

    }
}