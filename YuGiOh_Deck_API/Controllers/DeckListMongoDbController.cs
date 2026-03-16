using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using YuGiOhDeckApi.Data;
using YuGiOhDeckApi.Models;
using YuGiOhDeckApi.Repositories;

namespace YuGiOhDeckApi.Controllers
{
    [Route("api/mongodb/[controller]")]
    [ApiController]
    public class DeckListMongoDbController : ControllerBase
    {
        // This is where that variable lives!
        private readonly IMongoDbService _mongoDbService;

        // Change 'MongoDbService' to 'IMongoDbService' here
        public DeckListMongoDbController(IMongoDbService mongoDbService)
        {
            _mongoDbService = mongoDbService;
        }

        // 1. Added a generic Get back so nameof(Get) works in the Post method
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DeckList>>> Get()
        {
            var decks = await _mongoDbService.GetAsync();
            return Ok(decks);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<HydratedDeckResponse>> GetById(string id)
        {
            var hydratedDeck = await _mongoDbService.GetHydratedDeckAsync(id);
            if (hydratedDeck == null)
            {
                return NotFound(new { message = "RECORD_NOT_FOUND_IN_COSMOS" });
            }
            return Ok(hydratedDeck);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] DeckList newDeck)
        {
            Console.WriteLine($"UPLINK_RECEIVED: {newDeck.Title}");
            await _mongoDbService.CreateAsync(newDeck);
            // This now points to the Get() method above
            return CreatedAtAction(nameof(Get), new { id = newDeck.Id }, newDeck);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> Update([FromBody] DeckList deckList, string id)
        {
            await _mongoDbService.UpdateByIdAsync(deckList, id);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteById(string id)
        {
            await _mongoDbService.DeleteByIdAsync(id);
            return NoContent();
        }

        // 2. Renamed this to avoid the "Ambiguous" redline error
        [HttpDelete("title/{title}")]
        public async Task<ActionResult> DeleteByTitle(string title)
        {
            await _mongoDbService.DeleteByTitleAsync(title);
            return NoContent();
        }

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<List<DeckList>>> GetByUserId(string userId)
        {
            var decks = await _mongoDbService.GetByUserIdAsync(userId);
            return Ok(decks ?? new List<DeckList>());
        }

        // 3. User-specific delete
        [HttpDelete("{deckId}/user/{userId}")]
        public async Task<ActionResult> DeleteUserDeck(string deckId, string userId)
        {
            var success = await _mongoDbService.DeleteUserDeckAsync(deckId, userId);
            if (!success)
            {
                return NotFound(new { message = "DECK_NOT_FOUND_OR_OWNER_MISMATCH" });
            }
            return NoContent();
        }
    }
}