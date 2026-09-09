using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using YuGiOhDeckApi.Models;
using YuGiOhDeckApi.Repositories;

namespace YuGiOhDeckApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NewsController : ControllerBase
    {
        private readonly IMongoDbService _mongoDbService;
        private readonly ILogger<NewsController> _logger;
        private readonly IDistributedCache _cache;

        public NewsController(IMongoDbService mongoDbService, ILogger<NewsController> logger, IDistributedCache cache)
        {
            _mongoDbService = mongoDbService;
            _logger = logger;
            _cache = cache;
        }

        [HttpGet]
        public async Task<ActionResult<List<NewsArticle>>> GetLatestNews([FromQuery] int limit = 20)
        {
            string cacheKey = $"latest_news_{limit}";

            try
            {
                // 1. Attempt to check Redis first
                var cachedData = await _cache.GetStringAsync(cacheKey);

                if (!string.IsNullOrEmpty(cachedData))
                {
                    _logger.LogInformation("Returning news articles from Redis cache.");
                    var cachedArticles = JsonSerializer.Deserialize<List<NewsArticle>>(cachedData);
                    return Ok(cachedArticles);
                }
            }
            catch (Exception redisEx)
            {
                // 🚀 THE FIX: Catch the Redis timeout and log a warning instead of crashing
                _logger.LogWarning("Redis cache is unreachable. Falling back to MongoDB. Error: {Message}", redisEx.Message);
            }

            try
            {
                // 2. Cache Miss or Redis Offline: Fetch from MongoDB
                _logger.LogInformation("Fetching latest news articles from MongoDB.");
                var articles = await _mongoDbService.GetLatestNewsAsync(limit);

                // 3. Attempt to store in Redis for the next user
                try
                {
                    var cacheOptions = new DistributedCacheEntryOptions
                    {
                        AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30)
                    };
                    await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(articles), cacheOptions);
                }
                catch (Exception)
                {
                    // Ignore caching errors if Redis is down
                }

                return Ok(articles);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving news articles from MongoDB.");
                return StatusCode(500, new { message = "An error occurred while fetching news.", error = ex.Message });
            }
        }
    }
}