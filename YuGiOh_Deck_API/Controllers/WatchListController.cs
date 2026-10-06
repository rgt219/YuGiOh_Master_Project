using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YuGiOhDeckApi.Models;
using YuGiOhDeckApi.Repositories;

namespace YuGiOhDeckApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class WatchListController : ControllerBase
    {
        public const int MaxWatches = 100;

        private readonly IMongoDbService _mongoDbService;
        private readonly ILogger<PriceWatch> _logger;
        private string? CurrentUserId => User.FindFirst("userId")?.Value;

        public WatchListController(IMongoDbService mongoDbService)
        {
            _mongoDbService = mongoDbService;
        }

        [HttpGet]

        public async Task<IActionResult> GetMine()
        {
            var watches = await _mongoDbService.GetWatchesAsync(CurrentUserId!);

            return Ok(watches.Select(w => new
            {
                productId = w.ProductId,
                cardName = w.CardName,
                setName = w.SetName,
                rarity = w.Rarity,
                createdAt = w.CreatedAt
            }));
        }

        [HttpPut("{productId:int}")]
        public async Task<IActionResult> Track(int productId, [FromBody] TrackCardRequest request)
        {
            if (productId <= 0) return BadRequest(new { message = "Invalid Product Id..." });

            if (string.IsNullOrWhiteSpace(request.CardName) || request.CardName.Length > 200 || request.SetName?.Length > 200 || request.Rarity.Length > 200)
            {
                return BadRequest(new { message = "Invalid card details..." });
            }

            var userId = CurrentUserId!;

            var current = await _mongoDbService.GetWatchesAsync(userId);

            if (current.All(w => w.ProductId != productId) && current.Count >= MaxWatches)
            {
                return BadRequest(new { message = $"You can track up to {MaxWatches} cards..." });
            }

            await _mongoDbService.AddWatchAsync(userId, productId, request.CardName.Trim(), (request.SetName ?? "").Trim(), (request.Rarity ?? "").Trim());

            return Ok(new { productId, tracked = true });
        }

        [HttpDelete("{productId:int}")]
        public async Task<IActionResult> Untrack(int productId)
        {
            await _mongoDbService.RemoveWatchAsync(CurrentUserId!, productId);
            return Ok(new { productId, tracked = false });
        }
    }

}