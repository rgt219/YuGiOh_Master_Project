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
        private readonly IMongoDbService _mongoDbService;
        private readonly IKafkaProducerService _kafkaProducerService;

        public DeckListMongoDbController(IMongoDbService mongoDbService, IKafkaProducerService kafkaProducerService)
        {
            _mongoDbService = mongoDbService;
            _kafkaProducerService = kafkaProducerService;
        }

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
                await _mongoDbService.CreateAsync(newDeck);

                string resolvedUsername = await _mongoDbService.GetUsernameByUserIdAsync(newDeck.UserId);
                Console.WriteLine($"[TRACE] Input UserId: '{newDeck.UserId}' | Resolved Username: '{resolvedUsername}'");

                var fullPayload = new
                {
                    id = newDeck.Id,
                    title = string.IsNullOrWhiteSpace(newDeck.Title) ? "Unnamed Deck" : newDeck.Title,
                    userId = newDeck.UserId,
                    userName = resolvedUsername, // 👈 Resolved from UsersDB!
                    action = "published",
                    mainDeck = newDeck.MainDeck ?? new List<string>(),
                    extraDeck = newDeck.ExtraDeck ?? new List<string>(),
                    sideDeck = newDeck.SideDeck ?? new List<string>(),
                    timestamp = DateTime.UtcNow
                };

                await _kafkaProducerService.PublishDeckUpdate(fullPayload);

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
            var hydratedDeck = await _mongoDbService.GetHydratedDeckAsync(id);

            if (hydratedDeck == null)
            {
                return NotFound(new { message = "RECORD_NOT_FOUND_IN_COSMOS" });
            }

            var mainDeck = hydratedDeck.MainDeck ?? new List<CardData>();
            var extraDeck = hydratedDeck.ExtraDeck ?? new List<CardData>();
            var sideDeck = hydratedDeck.SideDeck ?? new List<CardData>();

            var allCards = mainDeck.Concat(extraDeck).Concat(sideDeck);

            var deckInventory = allCards
                .GroupBy(c => c.Id.ToString())
                .ToDictionary(g => g.Key, g => g.Count());

            var missingCards = new List<string>();

            foreach (var reqCard in requiredCards)
            {
                if (!deckInventory.TryGetValue(reqCard.Id, out int count) || count < reqCard.RequiredQty)
                {
                    missingCards.Add(reqCard.Name);
                }
            }

            return Ok(new
            {
                canPlay = missingCards.Count == 0,
                missingCards
            });
        }

        public class RequiredCardDto
        {
            public required string Id { get; set; }
            public required string Name { get; set; }
            public int RequiredQty { get; set; }
        }

    }
}