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
        public async Task<IActionResult> Save([FromBody] DeckList newDeck)
        {
            Console.WriteLine($"[API_TRACE] Received request for deck: {newDeck.Title}");

            try
            {
                // 1. Save deck to DecksDB as usual (DeckList.cs untouched!)
                await _mongoDbService.CreateAsync(newDeck);

                // 2. 🚀 Resolve username dynamically from UsersDB using newDeck.UserId
                string resolvedUsername = await _mongoDbService.GetUsernameByUserIdAsync(newDeck.UserId);

                // 3. 🚀 Construct Kafka payload containing the fetched username
                var activityPayload = new UserActivityDto
                {
                    Id = newDeck.Id,
                    Title = string.IsNullOrWhiteSpace(newDeck.Title) ? "Unnamed Deck" : newDeck.Title,
                    UserId = newDeck.UserId,
                    UserName = resolvedUsername, // 👈 Fetched directly from UsersDB!
                    Action = "published"
                };

                // 4. Send full payload with username to Kafka
                await _kafkaProducerService.PublishDeckUpdate(activityPayload);

                Console.WriteLine($"[API_TRACE] SUCCESS: Deck published by user '{resolvedUsername}' sent to Kafka.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[API_TRACE] CRITICAL_ERROR: {ex.Message}");
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

        [HttpPost("validate/{id}")]
        public async Task<IActionResult> ValidateDeckForCombo(string id, [FromBody] List<RequiredCardDto> requiredCards)
        {
            // 1. Fetch the hydrated deck from your Cosmos DB service
            var hydratedDeck = await _mongoDbService.GetHydratedDeckAsync(id);
            if (hydratedDeck == null)
            {
                return NotFound(new { message = "RECORD_NOT_FOUND_IN_COSMOS" });
            }

            // 2. Safe-extract your lists (null-coalescing to empty lists to avoid null reference exceptions)
            var mainDeck = hydratedDeck.MainDeck ?? new List<CardData>();
            var extraDeck = hydratedDeck.ExtraDeck ?? new List<CardData>();
            var sideDeck = hydratedDeck.SideDeck ?? new List<CardData>();

            // 3. Flatten them into a single unified card pool
            var allCards = mainDeck.Concat(extraDeck).Concat(sideDeck);

            // 4. Group by your Card ID
            var deckInventory = allCards
                .GroupBy(c => c.Id.ToString()) // <-- NOTE: If c.Id redlines, change to c.CardId or your model's ID property
                .ToDictionary(g => g.Key, g => g.Count());

            var missingCards = new List<string>();

            // 5. Compare inventory counts against combo requirements
            foreach (var reqCard in requiredCards)
            {
                if (!deckInventory.TryGetValue(reqCard.Id, out int count) || count < reqCard.RequiredQty)
                {
                    missingCards.Add(reqCard.Name);
                }
            }

            return Ok(new
            {
                canPlay = !missingCards.Any(),
                missingCards = missingCards
            });
        }

        public class RequiredCardDto
        {
            public string Id { get; set; }
            public string Name { get; set; }
            public int RequiredQty { get; set; }
        }

    }
}