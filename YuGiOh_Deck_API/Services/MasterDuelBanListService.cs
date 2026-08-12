using System.Net.Http.Json;
using YuGiOhDeckApi.Models;
using YuGiOhDeckApi.Repositories;

namespace YuGiOhDeckApi.Services
{
    public interface IMasterDuelBanListService
    {
        Task<MasterDuelBanListResponse?> GetMasterDuelBanListAsync();
        Task<bool> TriggerScrapeAndSaveAsync();
    }

    public class MasterDuelBanListService : IMasterDuelBanListService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<MasterDuelBanListService> _logger;
        private readonly IMongoDbService _mongoDbService;

        public MasterDuelBanListService(HttpClient httpClient, ILogger<MasterDuelBanListService> logger, IMongoDbService mongoDbService)
        {
            _httpClient = httpClient;
            _logger = logger;
            _mongoDbService = mongoDbService;

            if (_httpClient.BaseAddress == null)
            {
                var scraperUrl = "http://localhost:8080/";
                _httpClient.BaseAddress = new Uri(scraperUrl);
            }
        }

        public async Task<MasterDuelBanListResponse?> GetMasterDuelBanListAsync()
        {
            return await _mongoDbService.GetLatestMasterDuelBanListAsync();
        }

        public async Task<bool> TriggerScrapeAndSaveAsync()
        {
            try
            {
                _logger.LogInformation("Admin requested Master Duel Banlist scrape...");
                var response = await _httpClient.GetFromJsonAsync<MasterDuelBanListResponse>("internal/banlist/masterduel");

                if (response != null && response.Cards != null && response.Cards.Count > 0)
                {
                    response.Id = null; // Ensure MongoDB generates a new ObjectId
                    response.UpdatedAt = DateTime.UtcNow;
                    await _mongoDbService.SaveMasterDuelBanListAsync(response);
                    _logger.LogInformation("Successfully saved new Master Duel Banlist to MongoDB.");
                    return true;
                }
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to scrape or save Master Duel Banlist.");
                return false;
            }
        }
    }
}