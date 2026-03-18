using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using YuGiOhDeckApi.Data;
using YuGiOhDeckApi.Models;
using YuGiOhDeckApi.Repositories;
using YuGiOh_Analytics_Consumer.Service;

namespace YuGiOhDeckApi.Controllers
{
    [Route("api/mongodb/[controller]")]
    [ApiController]
    public class DeckListMongoDbController : ControllerBase
    {
        // This is where that variable lives!
        private readonly IMongoDbService _mongoDbService;
        private readonly IKafkaProducerService _kafkaProducerService;

        // Change 'MongoDbService' to 'IMongoDbService' here
        public DeckListMongoDbController(IMongoDbService mongoDbService, IKafkaProducerService kafkaProducerService)
        {
            _mongoDbService = mongoDbService;
            _kafkaProducerService = kafkaProducerService;
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
            // 1. Trace the entry
            Console.WriteLine($"[API_TRACE] Received request for deck: {newDeck.Title}");

            try
            {
                // 2. Save to Mongo
                await _mongoDbService.CreateAsync(newDeck);
                Console.WriteLine($"[API_TRACE] Saved {newDeck.Title} to Cosmos DB.");

                // 3. Attempt Kafka Publish
                Console.WriteLine($"[API_TRACE] Attempting to publish to Kafka topic: {newDeck.Title}");
                await _kafkaProducerService.PublishDeckUpdate(newDeck.Title, "CREATED");

                // 4. Success Marker
                Console.WriteLine($"[API_TRACE] SUCCESS: Message for {newDeck.Title} acknowledged by Event Hubs.");
            }
            catch (Exception ex)
            {
                // 5. Error Marker
                Console.WriteLine($"[API_TRACE] CRITICAL_ERROR: {ex.Message}");
                if (ex.InnerException != null)
                    Console.WriteLine($"[API_TRACE] INNER_ERROR: {ex.InnerException.Message}");
            }

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