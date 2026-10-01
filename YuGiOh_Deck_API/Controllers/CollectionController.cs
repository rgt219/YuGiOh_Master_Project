using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YuGiOhDeckApi.Models;
using YuGiOhDeckApi.Repositories;

namespace YuGiOhDeckApi.Controllers
{
    // A logged-in user's card collection. Every route works on the token's user only,
    // so there is no userId in the URL for anyone to change.
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CollectionController : ControllerBase
    {
        private const int MaxQuantity = 99;

        private readonly IMongoDbService _db;
        public CollectionController(IMongoDbService db) => _db = db;

        private string? CurrentUserId => User.FindFirst("userId")?.Value;

        [HttpGet]
        public async Task<IActionResult> GetMine()
        {
            var entries = await _db.GetCollectionAsync(CurrentUserId!);
            return Ok(entries.Select(e => new { cardId = e.CardId, quantity = e.Quantity }));
        }

        [HttpPut("{cardId:int}")]
        public async Task<IActionResult> SetQuantity(int cardId, [FromBody] SetQuantityRequest request)
        {
            if (cardId <= 0) return BadRequest(new { message = "Invalid card id." });
            if (request.Quantity < 0 || request.Quantity > MaxQuantity)
                return BadRequest(new { message = $"Quantity must be between 0 and {MaxQuantity}." });

            await _db.SetCollectionQuantityAsync(CurrentUserId!, cardId, request.Quantity);
            return Ok(new { cardId, quantity = request.Quantity });
        }
    }
}