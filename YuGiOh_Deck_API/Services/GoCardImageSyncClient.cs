using System.Net.Http.Json;

namespace YuGiOhDeckApi.Services
{
    public class GoCardImageSyncClient : ICardImageSyncService
    {
        private readonly HttpClient _httpClient;

        public GoCardImageSyncClient(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        // 1. Full missing catalog sync (parameterless)
        public async Task SyncMissingCardImagesAsync()
        {
            var response = await _httpClient.PostAsync("api/v1/sync-card-images", null);
            response.EnsureSuccessStatusCode();
        }

        // 2. Single card sync (WAS MISSING — FIXES REDLINE)
        public async Task SyncSingleCardImageAsync(string cardId)
        {
            var response = await _httpClient.PostAsync($"api/v1/sync-card-images/{cardId}", null);
            response.EnsureSuccessStatusCode();
        }

        // 3. Specific list sync
        public async Task SyncMissingCardImagesAsync(List<string> cardIds)
        {
            var payload = new { cardIds };
            var response = await _httpClient.PostAsJsonAsync("api/v1/sync-card-images", payload);
            response.EnsureSuccessStatusCode();
        }
    }
}