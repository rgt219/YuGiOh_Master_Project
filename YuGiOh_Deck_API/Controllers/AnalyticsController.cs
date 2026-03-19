using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using MongoDB.Bson;

namespace YuGiOh_Deck_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnalyticsController : ControllerBase
    {
        private readonly IMongoCollection<BsonDocument> _statsCollection;

        public AnalyticsController(IMongoCollection<BsonDocument> statsCollection)
        {
            _statsCollection = statsCollection;
        }

        [HttpGet("top-cards")]
        public async Task<IActionResult> GetTopCards(int limit = 10)
        {
            // 1. Sort by TotalUsage descending
            var topCards = await _statsCollection.Find(new BsonDocument())
                .Sort(Builders<BsonDocument>.Sort.Descending("TotalUsage"))
                .Limit(limit)
                .ToListAsync();

            // 2. Map to a clean object, matching the Worker's field names
            var result = topCards.Select(doc => new {
                // Use doc["_id"] since the worker saves the Card ID as the primary key
                cardId = doc["_id"].AsString,

                // Ensure we handle the case where CardName might be missing
                cardName = doc.Contains("CardName") ? doc["CardName"].AsString : "Unknown Card",

                usageCount = doc["TotalUsage"].AsInt32,

                // Change LastUpdated to LastSeen to match the Worker
                lastSeen = doc["LastSeen"].ToUniversalTime()
            });

            return Ok(result);
        }

    }
}