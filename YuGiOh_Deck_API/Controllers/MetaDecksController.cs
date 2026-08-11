using Microsoft.AspNetCore.Mvc;
using YuGiOhDeckApi.Data;
using YuGiOhDeckApi.Models;
using YuGiOhDeckApi.Repositories;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace YuGiOhDeckApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MetaDecksController : ControllerBase
    {
        private readonly IMongoDbService _mongoDbService;
        private readonly ILogger<MetaDecksController> _logger;
        private readonly IDistributedCache _cache; // ⚡ Injecting Redis

        public MetaDecksController(IMongoDbService mongoDbService, ILogger<MetaDecksController> logger, IDistributedCache cache)
        {
            _mongoDbService = mongoDbService;
            _logger = logger;
            _cache = cache;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MetaDeck>> GetMetaDeckById(string id)
        {
            try
            {
                _logger.LogInformation("Fetching meta deck profile for ID: {Id}", id);

                var deck = await _mongoDbService.GetMetaDeckByIdAsync(id);

                if (deck == null)
                {
                    return NotFound(new { message = $"Meta deck with ID '{id}' was not found." });
                }

                return Ok(deck);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception thrown while fetching meta deck ID: {Id}", id);
                return StatusCode(500, new { message = "An internal error occurred.", error = ex.Message });
            }
        }

        [HttpGet]
        public async Task<ActionResult<List<MetaDeck>>> GetMetaDecks([FromQuery] string? format = null)
        {
            try
            {
                string cacheKey = string.IsNullOrEmpty(format) ? "meta_decks_v2_all" : $"meta_decks_v2_{format.ToLower()}";

                var cachedData = await _cache.GetStringAsync(cacheKey);

                if (!string.IsNullOrEmpty(cachedData))
                {
                    _logger.LogInformation("Returning {Format} meta decks from Redis.", format ?? "all");
                    var cachedDecks = JsonSerializer.Deserialize<List<MetaDeck>>(cachedData);
                    return Ok(cachedDecks);
                }

                _logger.LogInformation("Fetching {Format} meta decks from MongoDB.", format ?? "all");

                var metaDecks = await _mongoDbService.GetMetaDecksAsync(format);

                var cacheOptions = new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1)
                };

                await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(metaDecks), cacheOptions);

                return Ok(metaDecks);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving meta decks for format: {Format}", format);
                return StatusCode(500, new { message = "An error occurred while fetching meta decks.", error = ex.Message });
            }
        }
    }
}