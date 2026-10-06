using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace YuGiOhDeckApi.Hubs
{
    // A private channel per user. Unlike ActivityHub (public, same for everyone), you must be logged in to connect,
    // and the server puts you in a group that only contains YOUR connections. Notifications for you are sent to
    // that group, so nobody else can ever receive them.
    [Authorize]
    public class NotificationHub : Hub
    {
        public static string GroupFor(string userId) => $"user:{userId}";

        public override async Task OnConnectedAsync()
        {
            // The id comes from the verified login token, never from anything the browser sends us.
            var userId = Context.User?.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                Context.Abort();
                return;
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, GroupFor(userId));
            await base.OnConnectedAsync();
            // No cleanup needed: SignalR removes a connection from its groups when it disconnects.
        }
    }
}