using System.Net.Http.Json;
using YuGiOhDeckApi.Models;
using YuGiOhDeckApi.Repositories;

namespace YuGiOhDeckApi.Services
{
    public interface IMasterDuelBanListService
    {
        Task<MasterDuelBanListResponse?> GetMasterDuelBanListAsync();
        Task<bool> TriggerScrapeAndSaveAsync();
        Task<List<MasterDuelCardDocument>> GetAllCardsAsync();
        Task<List<MasterDuelCardDocument>> GetRestrictedMasterDuelCardsAsync();
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

        public async Task<List<MasterDuelCardDocument>> GetAllCardsAsync()
        {
            return await _mongoDbService.GetAllMasterDuelCardsAsync();
        }

        public async Task<MasterDuelBanListResponse?> GetMasterDuelBanListAsync()
        {
            return await _mongoDbService.GetLatestMasterDuelBanListAsync();
        }

        public async Task<List<MasterDuelCardDocument>> GetRestrictedMasterDuelCardsAsync()
        {
            return await _mongoDbService.GetRestrictedMasterDuelCardsAsync();
        }

        public async Task<bool> TriggerScrapeAndSaveAsync()
        {
            try
            {
                _logger.LogInformation("Admin requested Master Duel Full Database sync...");

                var response = await _httpClient.GetFromJsonAsync<MasterDuelDatabaseSyncResponseDto>("internal/banlist/masterduel");

                if (response != null && response.Cards != null && response.Cards.Count > 0)
                {
                    await _mongoDbService.SaveMasterDuelDatabaseAsync(response);
                    _logger.LogInformation("Successfully bulk-synced Master Duel Database to MongoDB.");
                    return true;
                }
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to sync Master Duel Database.");
                return false;
            }
        }
    }
}