using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YuGiOhDeckApi.Models;
using YuGiOhDeckApi.Repositories;

namespace YuGiOhDeckApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DeckNoteController : ControllerBase
    {
        public const int MaxNoteLength = 300;
        public const int MaxTags = 10;
        public const int MaxTagLength = 30;

        private readonly IMongoDbService _mongoDbService;
        private readonly ILogger<DeckNoteController> _logger;
        private string? CurrentUserId => User.FindFirst("userId")?.Value;

        public DeckNoteController(IMongoDbService mongoDbService, ILogger<DeckNoteController> logger)
        {
            _mongoDbService = mongoDbService;
            _logger = logger;
        }

        // GET api/DeckNote/{deckId}  -> my note + tags for one deck (empty defaults if I never wrote one)
        [HttpGet("{deckId}")]
        public async Task<IActionResult> GetOneOfMine(string deckId)
        {
            var deckNote = await _mongoDbService.GetDeckNoteAsync(CurrentUserId!, deckId);
            return Ok(new
            {
                deckId,
                notes = deckNote?.Notes ?? "",
                tags = deckNote?.Tags ?? new List<string>(),
                updatedAt = deckNote?.UpdatedAt
            });
        }

        // GET api/DeckNote  -> all of my notes (for filtering my deck list by tag)
        [HttpGet]
        public async Task<IActionResult> GetMine()
        {
            var deckNotes = await _mongoDbService.GetDeckNotesAsync(CurrentUserId!);
            return Ok(deckNotes.Select(w => new
            {
                deckId = w.DeckId,
                notes = w.Notes,
                tags = w.Tags,
                updatedAt = w.UpdatedAt
            }));
        }

        // PUT api/DeckNote/{deckId}  -> create or replace my note + tags
        // Order: auth (class-level) -> body shape (no DB) -> deck exists -> owner -> save
        [HttpPut("{deckId}")]
        public async Task<IActionResult> SaveDeckNote(string deckId, [FromBody] SaveDeckNoteRequest request)
        {
            var userId = CurrentUserId!;

            var notes = (request.Notes ?? "").Trim();
            if (notes.Length > MaxNoteLength)
                return BadRequest(new { message = $"Notes must not exceed {MaxNoteLength} characters." });

            var tags = CleanTags(request.Tags);
            if (tags.Count > MaxTags)
                return BadRequest(new { message = $"You can use up to {MaxTags} tags." });
            if (tags.Any(t => t.Length > MaxTagLength))
                return BadRequest(new { message = $"Each tag must be {MaxTagLength} characters or fewer." });

            var deck = await _mongoDbService.GetByIdAsync(deckId);
            if (deck == null || deck.UserId != userId)
                return NotFound(new { message = "Deck not found." });

            var saved = await _mongoDbService.SaveDeckNoteAsync(userId, deckId, notes, tags);
            return Ok(new
            {
                deckId = saved.DeckId,
                notes = saved.Notes,
                tags = saved.Tags,
                updatedAt = saved.UpdatedAt
            });
        }

        // DELETE api/DeckNote/{deckId}  -> delete MY note for this deck (idempotent: 204 even if none existed)
        [HttpDelete("{deckId}")]
        public async Task<IActionResult> DeleteDeckNote(string deckId)
        {
            var userId = CurrentUserId!;

            var deck = await _mongoDbService.GetByIdAsync(deckId);
            if (deck == null || deck.UserId != userId)
                return NotFound(new { message = "Deck not found." });

            await _mongoDbService.DeleteDeckNoteAsync(userId, deckId);
            return NoContent();
        }

        // NOTE: DeleteDeckNotesByDeckAsync (DeleteMany) is NOT a route. The deck-delete action calls it as cleanup.

        private static List<string> CleanTags(IEnumerable<string>? tags) =>
            (tags ?? Enumerable.Empty<string>())
                .Select(t => (t ?? "").Trim())
                .Where(t => t.Length > 0)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
    }
}