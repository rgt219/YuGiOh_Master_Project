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

        public AnalyticsController(IConfiguration config)
        {
            // Connect to the same Cosmos DB your Consumer is writing to
            var client = new MongoClient(config["CosmosDb:ConnectionString"]);
            var database = client.GetDatabase("YuGiOhAnalytics");
            _statsCollection = database.GetCollection<BsonDocument>("DeckStats");
        }

        [HttpGet("top-cards")]
        public async Task<IActionResult> GetTopCards(int limit = 10)
        {
            // Sort by TotalUsage descending and take the top X
            var topCards = await _statsCollection.Find(new BsonDocument())
                .Sort(Builders<BsonDocument>.Sort.Descending("TotalUsage"))
                .Limit(limit)
                .ToListAsync();

            // Convert Bson to a clean list for React
            var result = topCards.Select(doc => new {
                cardName = doc["CardName"].AsString,
                usageCount = doc["TotalUsage"].AsInt32,
                lastUpdated = doc["LastUpdated"].ToUniversalTime()
            });

            return Ok(result);
        }
    }
}