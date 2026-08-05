using Microsoft.AspNetCore.Mvc;
using YuGiOh_Forum_API.Models;
using YuGiOh_Forum_API.Services;

namespace YuGiOh_Forum_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ForumsController : ControllerBase
    {
        private readonly ForumDbService _dbService;

        public ForumsController(ForumDbService dbService)
        {
            _dbService = dbService;
        }

        [HttpGet("threads")]
        public async Task<IActionResult> GetThreads([FromQuery] string category = "general")
        {
            var threads = await _dbService.GetThreadsByCategoryAsync(category);
            return Ok(threads);
        }

        [HttpGet("threads/{id}")]
        public async Task<IActionResult> GetThreadById(string id)
        {
            var thread = await _dbService.GetThreadByIdAsync(id);
            if (thread == null) return NotFound(new { message = "THREAD_NOT_FOUND" });
            return Ok(thread);
        }

        [HttpPost("threads")]
        public async Task<IActionResult> CreateThread([FromBody] ForumThread thread)
        {
            if (string.IsNullOrWhiteSpace(thread.Title) || string.IsNullOrWhiteSpace(thread.Content))
                return BadRequest(new { message = "TITLE_AND_CONTENT_REQUIRED" });

            thread.CreatedAt = DateTime.UtcNow;
            await _dbService.CreateThreadAsync(thread);
            return CreatedAtAction(nameof(GetThreadById), new { id = thread.Id }, thread);
        }

        [HttpPost("threads/{id}/upvote")]
        public async Task<IActionResult> Upvote(string id)
        {
            await _dbService.UpvoteThreadAsync(id);
            return Ok(new { message = "UPVOTE_REGISTERED" });
        }

        [HttpPost("threads/{id}/comments")]
        public async Task<IActionResult> AddComment(string id, [FromBody] ForumComment comment)
        {
            if (string.IsNullOrWhiteSpace(comment.Text))
                return BadRequest(new { message = "COMMENT_TEXT_REQUIRED" });

            await _dbService.AddCommentAsync(id, comment);
            return Ok(new { message = "COMMENT_ADDED" });
        }
    }
}