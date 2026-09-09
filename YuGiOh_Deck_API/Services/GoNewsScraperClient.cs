using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using YuGiOhDeckApi.Models;

namespace YuGiOhDeckApi.Services
{
    public class GoNewsScraperClient : INewsScraperService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<GoNewsScraperClient> _logger;

        public GoNewsScraperClient(HttpClient httpClient, ILogger<GoNewsScraperClient> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<List<NewsArticle>> ScrapeNewsAsync()
        {
            int maxRetries = 3;
            int delaySeconds = 3;
            var jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            for (int attempt = 1; attempt <= maxRetries; attempt++)
            {
                try
                {
                    _logger.LogInformation("Attempt {Attempt}: Sending news scrape request to Go worker at {BaseAddress}api/scrape-news", attempt, _httpClient.BaseAddress);

                    var response = await _httpClient.PostAsync("api/scrape-news", null);

                    if (response.IsSuccessStatusCode)
                    {
                        var result = await response.Content.ReadFromJsonAsync<NewsScrapeResultDto>(jsonOptions);
                        return result?.Articles ?? new List<NewsArticle>();
                    }

                    _logger.LogWarning("Go worker returned status {Status} on attempt {Attempt}", response.StatusCode, attempt);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("Connection to Go worker failed on attempt {Attempt}: {Message}", attempt, ex.Message);
                }

                if (attempt < maxRetries) await Task.Delay(TimeSpan.FromSeconds(delaySeconds));
            }

            _logger.LogError("All {MaxRetries} attempts to fetch news failed.", maxRetries);
            return new List<NewsArticle>();
        }

        private class NewsScrapeResultDto
        {
            [JsonPropertyName("count")]
            public int Count { get; set; }

            [JsonPropertyName("articles")]
            public List<NewsArticle> Articles { get; set; } = new();
        }
    }
}