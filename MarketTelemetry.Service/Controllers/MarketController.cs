using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using MarketTelemetry.Service.Data;

namespace MarketTelemetry.Service.Controllers
{
    [ApiController]
    [Route("api/market")]
    public class MarketController : ControllerBase
    {
        private readonly MarketDbService _dbService;
        private readonly IDistributedCache _cache;

        private static readonly JsonSerializerOptions _jsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        public MarketController(MarketDbService dbService, IDistributedCache cache)
        {
            _dbService = dbService;
            _cache = cache;
        }

        [HttpGet("{productId}/history")]
        public async Task<IActionResult> GetPriceHistory(int productId, [FromQuery] int days = 30)
        {
            string cacheKey = $"market_history_{productId}_{days}d";

            try
            {
                var cachedData = await _cache.GetStringAsync(cacheKey);
                if (!string.IsNullOrEmpty(cachedData))
                {
                    return Content(cachedData, "application/json");
                }
            }
            catch { }

            var history = await _dbService.GetHistoricalPricesAsync(productId, days);
            if (history == null || !history.Any()) return NotFound();

            var json = JsonSerializer.Serialize(history, _jsonOptions);

            try
            {
                await _cache.SetStringAsync(cacheKey, json, new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(12)
                });
            }
            catch { }

            return Ok(history);
        }

        [HttpGet("sets")]
        public async Task<IActionResult> GetSets([FromQuery] int page = 1, [FromQuery] int limit = 30)
        {
            var sets = await _dbService.GetSetsAsync(page, limit);
            return Ok(sets);
        }

        [HttpGet("sets/{setName}/cards")]
        public async Task<IActionResult> GetSetCards(string setName)
        {
            string cacheKey = $"set_cards_{setName}";

            try
            {
                var cachedData = await _cache.GetStringAsync(cacheKey);
                if (!string.IsNullOrEmpty(cachedData))
                {
                    return Content(cachedData, "application/json");
                }
            }
            catch { }

            var cards = await _dbService.GetLatestCardsBySetAsync(setName);
            if (cards == null || !cards.Any())
            {
                return NotFound();
            }

            var json = JsonSerializer.Serialize(cards, _jsonOptions);

            try
            {
                await _cache.SetStringAsync(cacheKey, json, new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(12)
                });
            }
            catch { }

            return Ok(cards);
        }

        [HttpGet("{cardId}/analytics")]
        public async Task<IActionResult> GetCardAnalytics(string cardId, [FromQuery] string format = "TCG")
        {
            var analytics = await _dbService.GetCardAnalyticsByKonamiIdAsync(cardId, format);

            if (analytics == null)
            {
                return Ok(new
                {
                    cardId = cardId,
                    format = format,
                    deckCount = 0,
                    totalDecksInFormat = 0,
                    inclusionRate = 0.0,
                    totalCopies = 0,
                    avgCopies = 0.0
                });
            }

            return Ok(analytics);
        }

        [HttpGet("{cardId}/comprehensive-analytics")]
        public async Task<IActionResult> GetComprehensiveAnalytics(string cardId)
        {
            var comprehensiveData = await _dbService.GetComprehensiveAnalyticsAsync(cardId);
            return Ok(comprehensiveData);
        }
    }
}