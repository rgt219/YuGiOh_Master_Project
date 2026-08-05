using System.Net.Http.Json;
using YuGiOhDeckApi.Models;

namespace YuGiOhDeckApi.Services
{
    public class GoMetaDeckScraperClient : IMetaDeckScraperService
    {
        private readonly HttpClient _httpClient;

        public GoMetaDeckScraperClient(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<List<MetaDeck>> ScrapeMetaDecksAsync()
        {
            var response = await _httpClient.PostAsync("api/v1/scrape-meta-decks", null);
            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadFromJsonAsync<ScrapeResultDto>();
            return result?.Decks ?? new List<MetaDeck>();
        }

        private class ScrapeResultDto
        {
            public int Count { get; set; }
            public List<MetaDeck> Decks { get; set; } = new();
        }
    }
}