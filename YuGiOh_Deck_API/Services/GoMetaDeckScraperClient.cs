using System.Net.Http.Json;
using System.Text.Json.Serialization;
using YuGiOhDeckApi.Models;

namespace YuGiOhDeckApi.Services
{
    public class GoMetaDeckScraperClient : IMetaDeckScraperService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<GoMetaDeckScraperClient> _logger;

        public GoMetaDeckScraperClient(HttpClient httpClient, ILogger<GoMetaDeckScraperClient> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<List<MetaDeck>> ScrapeMetaDecksAsync()
        {
            int maxRetries = 5;
            int delaySeconds = 3;

            for (int attempt = 1; attempt <= maxRetries; attempt++)
            {
                try
                {
                    _logger.LogInformation("Attempt {Attempt}: Sending scrape request to Go worker at {BaseAddress}api/scrape-meta-decks", attempt, _httpClient.BaseAddress);

                    var response = await _httpClient.PostAsync("api/scrape-meta-decks", null);

                    if (response.IsSuccessStatusCode)
                    {
                        var result = await response.Content.ReadFromJsonAsync<ScrapeResultDto>();
                        return result?.Decks ?? new List<MetaDeck>();
                    }

                    var errorBody = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("Go worker returned status {Status} on attempt {Attempt}: {Body}", response.StatusCode, attempt, errorBody);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("Connection to Go worker failed on attempt {Attempt}: {Message}. Retrying in {Delay}s...", attempt, ex.Message, delaySeconds);
                }

                if (attempt < maxRetries)
                {
                    await Task.Delay(TimeSpan.FromSeconds(delaySeconds));
                    delaySeconds *= 2;
                }
            }

            _logger.LogError("All {MaxRetries} attempts to reach the Go worker failed.", maxRetries);
            return new List<MetaDeck>();
        }

        private class ScrapeResultDto
        {
            [JsonPropertyName("count")]
            public int Count { get; set; }

            [JsonPropertyName("decks")]
            public List<MetaDeck> Decks { get; set; } = new();
        }
    }
}