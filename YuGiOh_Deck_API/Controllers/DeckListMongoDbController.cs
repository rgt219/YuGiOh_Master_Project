using Microsoft.AspNetCore.Authorization;
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

        // Identity comes from the validated token, never from the URL or body.
        private string? CurrentUserId => User.FindFirst("userId")?.Value;

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

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> Save([FromBody] DeckList newDeck)
        {
            Console.WriteLine($"[API_TRACE] Received request for deck: {newDeck.Title}");
            newDeck.UserId = CurrentUserId!; // owner is always the caller

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

        [Authorize]
        [HttpPut("{id}")]
        public async Task<ActionResult> Update([FromBody] DeckList deckList, string id)
        {
            var mine = await _mongoDbService.GetByUserIdAsync(CurrentUserId!);
            if (!mine.Any(d => d.Id == id))
                return NotFound(new { message = "DECK_NOT_FOUND_OR_OWNER_MISMATCH" });

            deckList.Id = id;
            deckList.UserId = CurrentUserId!;
            await _mongoDbService.UpdateByIdAsync(deckList, id);
            return NoContent();
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteById(string id)
        {
            // Owner-scoped delete: matches on deck id AND the caller's user id.
            var success = await _mongoDbService.DeleteUserDeckAsync(id, CurrentUserId!);
            if (!success)
                return NotFound(new { message = "DECK_NOT_FOUND_OR_OWNER_MISMATCH" });
            return NoContent();
        }

        [Authorize]
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<List<DeckList>>> GetByUserId(string userId)
        {
            if (userId != CurrentUserId) return Forbid();
            var decks = await _mongoDbService.GetByUserIdAsync(userId);
            return Ok(decks ?? new List<DeckList>());
        }

        [Authorize]
        [HttpDelete("{deckId}/user/{userId}")]
        public async Task<ActionResult> DeleteUserDeck(string deckId, string userId)
        {
            if (userId != CurrentUserId) return Forbid();
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