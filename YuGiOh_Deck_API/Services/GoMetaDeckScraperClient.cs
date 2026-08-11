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
            try
            {
                _logger.LogInformation("Sending scrape request to Go worker at {BaseAddress}api/scrape-meta-decks", _httpClient.BaseAddress);

                var response = await _httpClient.PostAsync("api/scrape-meta-decks", null);

                if (!response.IsSuccessStatusCode)
                {
                    var errorBody = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Go worker failed with status {Status}: {Body}", response.StatusCode, errorBody);
                    return new List<MetaDeck>();
                }

                var result = await response.Content.ReadFromJsonAsync<ScrapeResultDto>();
                return result?.Decks ?? new List<MetaDeck>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception thrown while communicating with Go worker scraper.");
                return new List<MetaDeck>();
            }
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