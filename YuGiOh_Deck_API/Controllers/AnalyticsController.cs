using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
using YuGiOhDeckApi.Repositories;
using YuGiOhDeckApi.Data;
using YuGiOhDeckApi.Models;

namespace YuGiOhDeckApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnalyticsController : ControllerBase
    {
        private readonly IMongoDbService _mongoDbService;
        private readonly ILogger<AnalyticsController> _logger;
        private readonly IMongoCollection<BsonDocument> _userActivityDtoCollection;

        public AnalyticsController(IMongoDbService mongoDbService, ILogger<AnalyticsController> logger, IOptions<MongoDBSettings> mongoDBSettings)
        {
            _mongoDbService = mongoDbService;
            _logger = logger;

            MongoClient client = new MongoClient(mongoDBSettings.Value.ConnectionURI);
            IMongoDatabase database = client.GetDatabase("YuGiOhAnalytics");
            _userActivityDtoCollection = database.GetCollection<BsonDocument>("DeckStats");

            try
            {
                var indexKeys = Builders<BsonDocument>.IndexKeys.Descending("timestamp");
                _userActivityDtoCollection.Indexes.CreateOne(new CreateIndexModel<BsonDocument>(indexKeys));
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Index creation note encountered an issue.");
            }
        }

        // GET: api/analytics/trending?format=TCG&limit=18
        [HttpGet("trending")]
        public async Task<ActionResult<List<CardAnalytics>>> GetTrendingCards([FromQuery] string? format = "TCG", [FromQuery] int limit = 18)
        {
            try
            {
                string targetFormat = string.IsNullOrWhiteSpace(format) ? "TCG" : format;
                var trending = await _mongoDbService.GetTrendingCardsAsync(targetFormat, limit);
                return Ok(trending);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving trending card analytics for format: {Format}", format);
                return StatusCode(500, new { message = "Error retrieving analytics data.", error = ex.Message });
            }
        }

        // POST: api/analytics/reaggregate
        [HttpPost("reaggregate")]
        public async Task<IActionResult> ReaggregateAnalytics()
        {
            try
            {
                await _mongoDbService.RecomputeCardAnalyticsAsync();
                return Ok(new { message = "Successfully recomputed card analytics across all formats." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reaggregating card analytics.");
                return StatusCode(500, new { message = "Failed to reaggregate analytics.", error = ex.Message });
            }
        }

        [HttpGet("recent-activity")]
        public async Task<IActionResult> GetRecentActivity([FromQuery] int limit = 5)
        {
            try
            {
                // 🚀 Sort by timestamp descending to fetch the 5 most recent records
                var recentDocs = await _userActivityDtoCollection
                    .Find(FilterDefinition<BsonDocument>.Empty)
                    .Sort(Builders<BsonDocument>.Sort.Descending("timestamp"))
                    .Limit(limit)
                    .ToListAsync();

                var result = new List<object>();

                foreach (var doc in recentDocs)
                {
                    result.Add(new
                    {
                        id = doc.Contains("_id") ? doc["_id"].ToString() : null,
                        username = doc.Contains("userName") ? doc["userName"].AsString : "Duelist",
                        action = doc.Contains("action") ? doc["action"].AsString : "published",
                        title = doc.Contains("title") ? doc["title"].AsString : "New Deck",
                        mainDeck = doc.Contains("mainDeck") ? doc["mainDeck"].AsBsonArray.Select(x => x.AsString).ToList() : new List<string>(),
                        extraDeck = doc.Contains("extraDeck") ? doc["extraDeck"].AsBsonArray.Select(x => x.AsString).ToList() : new List<string>()
                    });
                }

                return Ok(result);
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }


    }
}