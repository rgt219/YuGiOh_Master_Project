using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YuGiOhDeckApi.Models;
using YuGiOhDeckApi.Repositories;

namespace YuGiOhDeckApi.Controllers
{
    [ApiController]
    [Route("api/cards")]
    [AllowAnonymous]
    public class CardCompanionsController : ControllerBase
    {
        public const int MaxCardIdLength = 10;
        private readonly IMongoDbService _mongoDbService;

        public CardCompanionsController(IMongoDbService mongoDbService)
        {
            _mongoDbService = mongoDbService;
        }

        [HttpGet("{cardId}/companions")]
        [ResponseCache(Duration = 3600)]
        public async Task<IActionResult> GetCompanions(string cardId)
        {
            if (!IsValidCardId(cardId))
            {
                return BadRequest(new { message = "Card ID must be a number..." });
            }
            var companions = await _mongoDbService.GetCardCompanionsAsync(cardId);
            return Ok(companions ?? new CardCompanions
            {
                CardId = cardId
            });
        }

        private static bool IsValidCardId(string cardId)
        {
            return !string.IsNullOrEmpty(cardId)
            && cardId.Length <= MaxCardIdLength                                       
            && cardId.All(c => c >= '0' && c <= '9');
        }
    }
}