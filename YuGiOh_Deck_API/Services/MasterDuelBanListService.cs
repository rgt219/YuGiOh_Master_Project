using System.Net.Http.Json;
using YuGiOhDeckApi.Models;

namespace YuGiOhDeckApi.Services
{
    public interface IMasterDuelBanListService
    {
        Task<MasterDuelBanListResponse?> GetMasterDuelBanListAsync();
    }

    public class MasterDuelBanListService : IMasterDuelBanListService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<MasterDuelBanListService> _logger;

        public MasterDuelBanListService(HttpClient httpClient, ILogger<MasterDuelBanListService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;

            var scraperUrl = Environment.GetEnvironmentVariable("GO_SCRAPER_URL") ?? "http://go-worker:8080/";
            _httpClient.BaseAddress = new Uri(scraperUrl);
        }

        public async Task<MasterDuelBanListResponse?> GetMasterDuelBanListAsync()
        {
            try
            {
                var response = await _httpClient.GetFromJsonAsync<MasterDuelBanListResponse>("internal/banlist/masterduel");
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to communicate with local Go Master Duel Scraper sidecar service.");
                return null;
            }
        }
    }
}