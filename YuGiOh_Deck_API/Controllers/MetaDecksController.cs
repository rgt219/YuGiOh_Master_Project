using Microsoft.AspNetCore.Mvc;
using YuGiOhDeckApi.Data;
using YuGiOhDeckApi.Models;

namespace YuGiOhDeckApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MetaDecksController : ControllerBase
    {
        private readonly MongoDbService _mongoDbService;

        public MetaDecksController(MongoDbService mongoDbService)
        {
            _mongoDbService = mongoDbService;
        }

        [HttpGet]
        public async Task<ActionResult<List<MetaDeck>>> GetMetaDecks()
        {
            var metaDecks = await _mongoDbService.GetMetaDecksAsync();
            return Ok(metaDecks);
        }
        [HttpGet("{id}")]
        public async Task<ActionResult<MetaDeck>> GetMetaDeckById(string id)
        {
            var metaDecks = await _mongoDbService.GetMetaDecksAsync();

            // Perform case-insensitive match against Id
            var deck = metaDecks.FirstOrDefault(d =>
                !string.IsNullOrEmpty(d.Id) && d.Id.Equals(id, StringComparison.OrdinalIgnoreCase)
            );

            if (deck == null)
            {
                return NotFound(new { message = $"Meta deck with ID '{id}' not found." });
            }

            return Ok(deck);
        }
    }
}