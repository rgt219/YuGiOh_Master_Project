using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using YuGiOh_Analytics_Consumer;
using YuGiOhDeckApi.Data;
using YuGiOhDeckApi.Models;

namespace YuGiOhDeckApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnalyticsController : ControllerBase
    {
        private readonly MongoDbService _mongoDbService;
        private readonly ILogger<AnalyticsController> _logger;

        public AnalyticsController(MongoDbService mongoDbService, ILogger<AnalyticsController> logger)
        {
            _mongoDbService = mongoDbService;
            _logger = logger;
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
            // 1. Check in-memory Kafka bridge buffer
            var recent = KafkaToSignalRBridge.GetRecentActivities();

            if (recent.Any())
            {
                return Ok(recent.Take(limit));
            }

            // 2. Fallback: Query 5 most recent public decks from MongoDB
            var recentDecks = await _mongoDbService.GetRecentDecksAsync(limit); // Or query DeckListMongoDb sorted by _id desc

            var fallbackActivities = recentDecks.Select(d => new UserActivityDto
            {
                UserName = !string.IsNullOrWhiteSpace(d.UserId) ? d.UserId : "Anonymous",
                Title = !string.IsNullOrWhiteSpace(d.Title) ? d.Title : "Unnamed Deck",
                Action = "published"
            }).ToList();

            return Ok(fallbackActivities);
        }


    }
}