using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YuGiOhDeckApi.Notifications;

namespace YuGiOhDeckApi.Controllers
{
    // The notification bell's data. Like the collection and the watch list, every route works on the
    // token's user only, so there is no userId in the URL for anyone to change.
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        public const int DefaultLimit = 20;
        public const int MaxLimit = 50;

        private readonly INotificationStore _store;
        public NotificationsController(INotificationStore store) => _store = store;

        private string? CurrentUserId => User.FindFirst("userId")?.Value;

        // One request gives the bell everything it needs: the number on the badge and the list in the dropdown.
        [HttpGet]
        public async Task<IActionResult> GetMine([FromQuery] int limit = DefaultLimit)
        {
            var take = Math.Clamp(limit, 1, MaxLimit);

            var items = await _store.GetRecentAsync(CurrentUserId!, take);
            var unread = await _store.CountUnreadAsync(CurrentUserId!);

            return Ok(new
            {
                unread,
                items = items.Select(n => new
                {
                    id = n.Id,
                    type = n.Type,
                    title = n.Title,
                    message = n.Message,
                    link = n.Link,
                    createdAt = n.CreatedAt,
                    read = n.ReadAt != null
                })
            });
        }

        [HttpPost("{id}/read")]
        public async Task<IActionResult> MarkRead(string id)
        {
            var found = await _store.MarkReadAsync(CurrentUserId!, id);
            return found ? Ok(new { id, read = true }) : NotFound(new { message = "Notification not found." });
        }

        [HttpPost("read-all")]
        public async Task<IActionResult> MarkAllRead()
        {
            var changed = await _store.MarkAllReadAsync(CurrentUserId!);
            return Ok(new { marked = changed });
        }
    }
}