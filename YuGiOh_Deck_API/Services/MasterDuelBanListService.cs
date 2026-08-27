using System.Net.Http.Json;
using YuGiOhDeckApi.Models;
using YuGiOhDeckApi.Repositories;

namespace YuGiOhDeckApi.Services
{
    

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
                _logger.LogInformation("Admin requested Master Duel Database sync...");

                var response = await _httpClient.GetFromJsonAsync<MasterDuelDatabaseSyncResponseDto>("internal/banlist/masterduel");

                if (response != null && response.Cards != null && response.Cards.Count > 0)
                {
                    // 1. Save the full database to MasterDuelCards (Used by Card Search)
                    await _mongoDbService.SaveMasterDuelDatabaseAsync(response);

                    // 2. Extract, DEDUPLICATE, and build the Ban List document
                    var restrictedCards = response.Cards
                        .Where(c => !string.IsNullOrWhiteSpace(c.Name) && !string.IsNullOrWhiteSpace(c.BanStatus) && c.BanStatus != "Unlimited")
                        .GroupBy(c => c.Name.Trim()) // ⚡ DEDUPLICATE: Filters out alternate arts so the count is exactly 206
                        .Select(g => g.First())
                        .Select(c => new MasterDuelBanListEntry
                        {
                            Name = c.Name.Trim(),
                            Status = c.BanStatus
                        }).ToList();

                    var banListDoc = new MasterDuelBanListResponse
                    {
                        Format = "Master Duel",
                        Source = "https://www.masterduelmeta.com/forbidden-limited-list",
                        UpdatedAt = DateTime.UtcNow,
                        Count = restrictedCards.Count, // This will now accurately reflect the ~206 unique restricted cards
                        Cards = restrictedCards
                    };

                    // 3. Overwrite the stale document in the MasterDuelBanList collection
                    await _mongoDbService.SaveMasterDuelBanListAsync(banListDoc);

                    _logger.LogInformation($"Successfully synced Database and BanList ({restrictedCards.Count} cards).");
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

        public async Task<bool> BuildBanListFromDatabaseAsync()
        {
            try
            {
                // 1. Fetch restricted cards directly from your perfectly fine MasterDuelCards collection
                var restrictedCards = await _mongoDbService.GetRestrictedMasterDuelCardsAsync();

                if (restrictedCards == null || !restrictedCards.Any()) return false;

                // 2. Deduplicate alternate arts and map to the Ban List format
                var cleanBanList = restrictedCards
                    .GroupBy(c => c.Name.Trim())
                    .Select(g => g.First())
                    .Select(c => new MasterDuelBanListEntry
                    {
                        Name = c.Name.Trim(),
                        Status = c.BanStatus
                    }).ToList();

                // 3. Build the document
                var banListDoc = new MasterDuelBanListResponse
                {
                    Format = "Master Duel",
                    Source = "Local Database Generation",
                    UpdatedAt = DateTime.UtcNow,
                    Count = cleanBanList.Count, // This will be exactly 206!
                    Cards = cleanBanList
                };

                // 4. Overwrite the MasterDuelBanList collection
                await _mongoDbService.SaveMasterDuelBanListAsync(banListDoc);

                _logger.LogInformation($"Successfully built Master Duel Ban List with {cleanBanList.Count} cards.");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to build Master Duel Ban List from DB.");
                return false;
            }
        }
    }
}