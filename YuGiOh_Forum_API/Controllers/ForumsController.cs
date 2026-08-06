using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
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
        private readonly IConfiguration _config;

        public ForumsController(ForumDbService dbService, IConfiguration config)
        {
            _dbService = dbService;
            _config = config;
        }

        /// <summary>
        /// GET: api/forums/threads?category=general
        /// Fetches threads filtered by category (defaults to general)
        /// </summary>
        [HttpGet("threads")]
        public async Task<IActionResult> GetThreads([FromQuery] string category = "general")
        {
            var threads = await _dbService.GetThreadsByCategoryAsync(category);
            return Ok(threads);
        }

        /// <summary>
        /// GET: api/forums/threads/{id}
        /// Fetches a specific thread with comments and media by ID
        /// </summary>
        [HttpGet("threads/{id}")]
        public async Task<IActionResult> GetThreadById(string id)
        {
            var thread = await _dbService.GetThreadByIdAsync(id);
            if (thread == null)
                return NotFound(new { message = "THREAD_NOT_FOUND" });

            return Ok(thread);
        }

        /// <summary>
        /// POST: api/forums/threads
        /// Creates a new forum thread
        /// </summary>
        [HttpPost("threads")]
        public async Task<IActionResult> CreateThread([FromBody] ForumThread thread)
        {
            if (string.IsNullOrWhiteSpace(thread.Title) || string.IsNullOrWhiteSpace(thread.Content))
                return BadRequest(new { message = "TITLE_AND_CONTENT_REQUIRED" });

            thread.CreatedAt = DateTime.UtcNow;
            await _dbService.CreateThreadAsync(thread);

            return StatusCode(201, thread);
        }

        /// <summary>
        /// POST: api/forums/threads/{id}/vote
        /// Registers or toggles an upvote or downvote for a specific user
        /// </summary>
        [HttpPost("threads/{id}/vote")]
        public async Task<IActionResult> Vote(string id, [FromBody] VoteRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Username))
                return Unauthorized(new { message = "MUST_BE_LOGGED_IN" });

            await _dbService.VoteThreadAsync(id, request.Username, request.VoteType);
            return Ok(new { message = "VOTE_REGISTERED" });
        }

        /// <summary>
        /// POST: api/forums/threads/{id}/comments
        /// Adds a comment (with optional media URLs) to a thread
        /// </summary>
        [HttpPost("threads/{id}/comments")]
        public async Task<IActionResult> AddComment(string id, [FromBody] ForumComment comment)
        {
            if (string.IsNullOrWhiteSpace(comment.Text) && (comment.MediaUrls == null || comment.MediaUrls.Count == 0))
                return BadRequest(new { message = "COMMENT_TEXT_OR_MEDIA_REQUIRED" });

            comment.CreatedAt = DateTime.UtcNow;
            await _dbService.AddCommentAsync(id, comment);

            return Ok(new { message = "COMMENT_ADDED" });
        }

        /// <summary>
        /// POST: api/forums/upload
        /// Uploads an image or video file directly to Azure Blob Storage
        /// </summary>
        [HttpPost("upload")]
        public async Task<IActionResult> UploadMedia(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "NO_FILE_PROVIDED" });

            // Max 20MB file size limit
            if (file.Length > 20 * 1024 * 1024)
                return BadRequest(new { message = "FILE_TOO_LARGE_MAX_20MB" });

            // Fallback key lookup for Azure environment variables
            var connectionString = _config["AzureBlobStorage:ConnectionString"]
                                  ?? _config["AzureBlobStorage__ConnectionString"];

            if (string.IsNullOrEmpty(connectionString))
                return StatusCode(500, new { message = "BLOB_STORAGE_NOT_CONFIGURED" });

            try
            {
                var blobServiceClient = new BlobServiceClient(connectionString);
                var containerClient = blobServiceClient.GetBlobContainerClient("forum-media");

                // Ensure container exists with public blob access
                await containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob);

                // Create unique filename using GUID
                var extension = Path.GetExtension(file.FileName);
                var fileName = $"{Guid.NewGuid()}{extension}";
                var blobClient = containerClient.GetBlobClient(fileName);

                using (var stream = file.OpenReadStream())
                {
                    await blobClient.UploadAsync(stream, new BlobHttpHeaders { ContentType = file.ContentType });
                }

                // Return permanent HTTPS Blob URL
                return Ok(new { url = blobClient.Uri.ToString() });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "BLOB_UPLOAD_FAILED", error = ex.Message });
            }
        }
    }
}